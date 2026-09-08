import re
import time

import requests
from bs4 import BeautifulSoup

from ..models import CafeteriaMenu

BASE_URL = 'https://west2-univ.jp/sp'

# 対象食堂。site_code は対象サイトの t パラメータ（ADR #31）
CAFETERIAS = (
    ('rune', '650118'),
    ('hokubu', '650113'),
    ('chuo', '650111'),
)

# 3食堂に共通する区分だけをコードに対応づける。
# on_bunrui* は食堂ごとに中身が違うため 'other' 扱いにして見出し文言を残す
FIXED_CATEGORY_MAP = {
    'on_a': 'main',
    'on_b': 'side',
    'on_c': 'noodle',
    'on_d': 'rice',
    'on_e': 'dessert',
}
OTHER_CATEGORY = 'other'

# 区分見出しに付く営業時間の注記。ここから後ろは区分名ではない
_HOURS_NOTE = re.compile(r'(平日|土曜|日曜|祝日|\d{1,2}:\d{2})')
# 全角スペースに続く英語併記
_ENGLISH_SUFFIX = re.compile(r'　[\x20-\x7e]+$')

NUTRITION_FIELD_MAP = {
    'エネルギー': 'calories',
    'タンパク質': 'protein',
    'たんぱく質': 'protein',
    '脂質': 'fat',
    '炭水化物': 'carbohydrates',
    '食物繊維': 'dietary_fiber',
    '食塩相当量': 'sodium',
    'カルシウム': 'calcium',
    '鉄': 'iron',
    'ビタミン A': 'vitamin_a',
    'ビタミンA': 'vitamin_a',
    'ビタミン B1': 'vitamin_b1',
    'ビタミンB1': 'vitamin_b1',
    'ビタミン B2': 'vitamin_b2',
    'ビタミンB2': 'vitamin_b2',
    'ビタミン C': 'vitamin_c',
    'ビタミンC': 'vitamin_c',
}

# 相手は大学の外部サイト。連続リクエストで負荷をかけない
CATEGORY_INTERVAL_SEC = 0.5
DETAIL_INTERVAL_SEC = 0.3
REQUEST_TIMEOUT_SEC = 10


def clean_category_label(raw):
    """区分見出しから営業時間の注記と英語併記を落とす。

    「オーダー 平日11:00~14:00 土曜閉店」→「オーダー」、「主菜　Main dish」→「主菜」。
    「昼　北部限定コーナー」のように全体が区分名のものはそのまま残す。
    """
    label = _HOURS_NOTE.split(raw, maxsplit=1)[0]
    label = _ENGLISH_SUFFIX.sub('', label)
    return label.strip()


class CafeteriaScraper:
    """学食サイトから3食堂ぶんのメニューと栄養値を取得する。

    取得結果で全件を入れ替える（差分更新はしない。ADR #16）。
    """

    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'ja,en-US;q=0.9,en;q=0.8',
            'Connection': 'keep-alive',
        })
        # 同じ menu_id の栄養値は食堂をまたいでも同一なので、詳細ページは1回だけ引く
        self._nutrition_cache = {}

    def fetch_and_update_menus(self):
        """3食堂ぶんのメニュー情報を取得してデータベースを更新"""
        try:
            print("=== スクレイピング開始 ===")
            menus = []

            for cafeteria, site_code in CAFETERIAS:
                print(f"\n■ {cafeteria} (t={site_code})")
                menus.extend(self._fetch_cafeteria_menus(cafeteria, site_code))

            print(f"\n=== 合計 {len(menus)}件のメニューを取得 ===")

            # 取得結果をそのまま最終状態とする（差分更新しない）。
            # 0件のときは既存を消さずに維持する
            if menus:
                CafeteriaMenu.objects.all().delete()
                CafeteriaMenu.objects.bulk_create([
                    CafeteriaMenu(**menu) for menu in menus
                ])
                print("データベース更新完了")
            else:
                print("警告: メニューが1件も取得できませんでした")

            return len(menus)

        except Exception as e:
            print(f"エラー発生: {str(e)}")
            raise Exception(f"メニュー取得に失敗しました: {str(e)}")

    def _fetch_cafeteria_menus(self, cafeteria, site_code):
        """1食堂ぶんのメニューを、その食堂が実際に持つ区分だけ取得する"""
        menus = []
        seen_menu_ids = set()

        for toggle_id, label in self._fetch_categories(site_code):
            category = FIXED_CATEGORY_MAP.get(toggle_id, OTHER_CATEGORY)
            print(f"  区分: {toggle_id} ({category} / {label})")

            for menu in self._fetch_category_menus(site_code, toggle_id):
                # 同じメニューが複数の区分に載ることがある。
                # (cafeteria, menu_id) は一意なので、先に見つかった区分を採る
                if menu['menu_id'] in seen_menu_ids:
                    continue
                seen_menu_ids.add(menu['menu_id'])
                menus.append({
                    'cafeteria': cafeteria,
                    'category': category,
                    'category_label': label,
                    **menu,
                })

            time.sleep(CATEGORY_INTERVAL_SEC)

        print(f"  → {len(menus)}件のメニューを取得")
        return menus

    def _fetch_categories(self, site_code):
        """menu.php の見出しから、その食堂が持つ区分を読み取る。

        区分は食堂ごとに違い、サイト側でも入れ替わる。固定表を持たず毎回取得する。
        """
        try:
            response = self.session.get(
                f'{BASE_URL}/menu.php',
                params={'t': site_code},
                timeout=REQUEST_TIMEOUT_SEC,
            )
            response.encoding = 'utf-8'
        except requests.exceptions.RequestException as e:
            print(f"  エラー: 区分一覧の取得に失敗 - {str(e)}")
            return []

        soup = BeautifulSoup(response.text, 'html.parser')
        categories = []
        for heading in soup.find_all('p', class_='toggleTitle'):
            toggle_id = heading.get('id')
            if toggle_id:
                categories.append((toggle_id, clean_category_label(heading.get_text())))
        return categories

    def _fetch_category_menus(self, site_code, toggle_id):
        """特定区分のメニュー一覧を取得"""
        try:
            response = self.session.get(
                f'{BASE_URL}/menu_load.php',
                params={'t': site_code, 'a': toggle_id},
                timeout=REQUEST_TIMEOUT_SEC,
            )
            response.encoding = 'utf-8'
        except requests.exceptions.RequestException as e:
            print(f"    エラー: {toggle_id}の取得に失敗 - {str(e)}")
            return []

        if not response.text or 'Loaded' not in response.text:
            print(f"    警告: {toggle_id}のデータが空です")
            return []

        soup = BeautifulSoup(response.text, 'html.parser')
        ul = soup.find('ul')
        if not ul:
            print(f"    警告: {toggle_id}にulタグが見つかりません")
            return []

        menus = []
        for item in ul.find_all('li'):
            menu_data = self._parse_menu_item(item, site_code)
            if menu_data:
                menus.append(menu_data)
                print(f"      - {menu_data['name']}")
        return menus

    def _parse_menu_item(self, item, site_code):
        """個別メニュー項目をパース"""
        link = item.find('a')
        if not link:
            return None

        detail_url = link.get('href', '')
        if 'c=' not in detail_url:
            return None

        menu_id = detail_url.split('c=')[-1].split('&')[0]
        if not menu_id:
            return None

        h3 = item.find('h3')
        if not h3:
            return None

        # h3 は英語名と価格の span も持つため、最初のテキストノードだけがメニュー名
        name = h3.contents[0].strip() if h3.contents else None
        if not name:
            return None

        return {
            'menu_id': menu_id,
            'name': name,
            **self._fetch_nutrition_detail(site_code, menu_id),
        }

    def _fetch_nutrition_detail(self, site_code, menu_id):
        """詳細ページから栄養素情報を取得"""
        if menu_id in self._nutrition_cache:
            return self._nutrition_cache[menu_id]

        nutrition = self._empty_nutrition()
        try:
            response = self.session.get(
                f'{BASE_URL}/detail.php',
                params={'t': site_code, 'c': menu_id},
                timeout=REQUEST_TIMEOUT_SEC,
            )
            response.encoding = 'utf-8'
            soup = BeautifulSoup(response.text, 'html.parser')

            detail_list = soup.find('ul', class_='detail')
            if detail_list is None:
                print(f"        警告: メニューID {menu_id} の栄養情報が見つかりません")
            else:
                nutrition.update(self._parse_nutrition_list(detail_list))

            # 詳細ページも1件ずつ間隔を空ける
            time.sleep(DETAIL_INTERVAL_SEC)

        except requests.exceptions.RequestException as e:
            print(f"        エラー: メニューID {menu_id} の栄養素取得失敗 - {str(e)}")
            return nutrition

        self._nutrition_cache[menu_id] = nutrition
        return nutrition

    @staticmethod
    def _parse_nutrition_list(detail_list):
        parsed = {}
        for li in detail_list.find_all('li'):
            strong = li.find('strong')
            if not strong:
                continue

            field = NUTRITION_FIELD_MAP.get(strong.text.strip())
            if not field:
                continue

            # 栄養値は class="price" の span に入っている（価格ではない）
            price_span = li.find('span', class_='price')
            if not price_span:
                continue

            number_match = re.search(r'([\d.]+)', price_span.text.strip())
            if not number_match:
                continue
            try:
                parsed[field] = float(number_match.group(1))
            except ValueError:
                continue
        return parsed

    @staticmethod
    def _empty_nutrition():
        return {
            'calories': 0.0,
            'protein': 0.0,
            'fat': 0.0,
            'carbohydrates': 0.0,
            'dietary_fiber': 0.0,
            'sodium': 0.0,
            'calcium': 0.0,
            'iron': 0.0,
            'vitamin_a': 0.0,
            'vitamin_b1': 0.0,
            'vitamin_b2': 0.0,
            'vitamin_c': 0.0,
        }

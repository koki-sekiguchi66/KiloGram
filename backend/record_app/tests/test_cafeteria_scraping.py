"""学食スクレイピングのパース処理のテスト。

HTML は対象サイトの構造をそのまま縮めたもの。ネットワークには出ない
（HTTP 取得部分をモックし、パースと保存だけを検証する）。
"""
from unittest.mock import patch

import pytest

from record_app.business_logic import cafeteria_scraping
from record_app.business_logic.cafeteria_scraping import (
    CafeteriaScraper,
    clean_category_label,
)
from record_app.models import CafeteriaMenu


MENU_PAGE = """
<div class="area">
  <p class="toggleTitle" id="on_a">主菜　Main dish</p>
  <div class="catMenu"></div>
  <p class="toggleTitle" id="on_d">丼・カレー　Rice bowl / Curry</p>
  <div class="catMenu"></div>
  <p class="toggleTitle" id="on_bunrui1">オーダー 平日11:00~14:00 17:30~20:00　土曜閉店</p>
  <div class="catMenu"></div>
</div>
"""

MENU_PAGE_OTHER = """
<div class="area">
  <p class="toggleTitle" id="on_a">主菜　Main dish</p>
  <div class="catMenu"></div>
  <p class="toggleTitle" id="on_bunrui1">昼　北部限定コーナー</p>
  <div class="catMenu"></div>
</div>
"""


def _fragment(*items):
    """menu_load.php が返す断片。冒頭の Loaded マーカーまで含めて模す。"""
    rows = ''.join(
        f'''
        <li>
          <a href="detail.php?t=650118&c={menu_id}">
            <p class="sold "></p>
            <h3>{name}<span>English name</span><span class="price">¥341</span></h3>
          </a>
        </li>'''
        for menu_id, name in items
    )
    return f'<div class="Loaded"></div><ul>{rows}</ul>'


DETAIL_PAGE = """
<div id="main">
  <h1>とり天葱生姜だれ<span>Fried chicken</span></h1>
  <ul class="detail">
    <li><strong>組価(税込)</strong><span class="en">Price</span>
        <span class="price"><strong>341</strong>円</span></li>
    <li><strong>エネルギー</strong><span class="en">Energy</span>
        <span class="price">358 kcal</span></li>
    <li><strong>タンパク質</strong><span class="en">Protein</span>
        <span class="price">17.5 g</span></li>
    <li><strong>脂質</strong><span class="en">Fat</span>
        <span class="price">23.3 g</span></li>
    <li><strong>炭水化物</strong><span class="en">Carbohydrates</span>
        <span class="price">20.3 g</span></li>
    <li><strong>食塩相当量</strong><span class="en">Salt</span>
        <span class="price">1.6 g</span></li>
    <li><strong>カルシウム</strong><span class="en">Calcium</span>
        <span class="price">24 mg</span></li>
    <li><strong>野菜量</strong><span class="en">Veg</span>
        <span class="price">30 g</span></li>
    <li><strong>鉄</strong><span class="en">Iron</span>
        <span class="price">0.5mg</span></li>
    <li><strong>ビタミン A</strong><span class="en">Vitamin A</span>
        <span class="price">68μg</span></li>
    <li><strong>ビタミン B1</strong><span class="en">Vitamin B1</span>
        <span class="price">0.07mg</span></li>
    <li><strong>ビタミン B2</strong><span class="en">Vitamin B2</span>
        <span class="price">-</span></li>
    <li><strong>ビタミン C</strong><span class="en">Vitamin C</span>
        <span class="price">13mg</span></li>
  </ul>
</div>
"""


class FakeResponse:
    def __init__(self, text):
        self.text = text
        self.encoding = 'utf-8'


class FakeSite:
    """t / a / c の組み合わせに応じて HTML を返す、対象サイトの代役。"""

    def __init__(self, pages, fragments, detail=DETAIL_PAGE):
        self.pages = pages
        self.fragments = fragments
        self.detail = detail
        self.detail_calls = []

    def get(self, url, params=None, timeout=None):
        params = params or {}
        if url.endswith('/menu.php'):
            return FakeResponse(self.pages[params['t']])
        if url.endswith('/menu_load.php'):
            key = (params['t'], params['a'])
            return FakeResponse(self.fragments.get(key, ''))
        if url.endswith('/detail.php'):
            self.detail_calls.append(params['c'])
            return FakeResponse(self.detail)
        raise AssertionError(f'想定外のURL: {url}')


def run_scraper(site, cafeterias):
    scraper = CafeteriaScraper()
    with patch.object(scraper, 'session', site), \
            patch.object(cafeteria_scraping.time, 'sleep'), \
            patch.object(cafeteria_scraping, 'CAFETERIAS', cafeterias):
        count = scraper.fetch_and_update_menus()
    return count


class TestCleanCategoryLabel:
    """区分見出しの整形。食堂ごとに書式が違うので、削りすぎないことが要点。"""

    @pytest.mark.parametrize('raw, expected', [
        ('主菜　Main dish', '主菜'),
        ('丼・カレー　Rice bowl / Curry', '丼・カレー'),
        ('オーダー 平日11:00~14:00 17:30~20:00　土曜閉店', 'オーダー'),
        ('ケバブ＆ベジタリアン　平日11:00~13:30　土曜閉店', 'ケバブ＆ベジタリアン'),
        ('パフェ 平日13:30~16:30 土曜閉店', 'パフェ'),
        ('ライス', 'ライス'),
    ])
    def test_注記と英語併記を落とす(self, raw, expected):
        assert clean_category_label(raw) == expected

    @pytest.mark.parametrize('raw', [
        '昼　北部限定コーナー',
        '夜　丼・北部限定コーナー',
        'ライス　サイズ',
        '朝食プレート',
        '温麺',
    ])
    def test_全体が区分名のものは削らない(self, raw):
        assert clean_category_label(raw) == raw


@pytest.mark.django_db
class TestCafeteriaScraper:

    def test_区分と栄養値をパースして保存する(self):
        site = FakeSite(
            pages={'650118': MENU_PAGE},
            fragments={
                ('650118', 'on_a'): _fragment(('611012', 'とり天葱生姜だれ')),
                ('650118', 'on_d'): _fragment(('616104', 'ソース海老カツ丼')),
                ('650118', 'on_bunrui1'): _fragment(('700001', 'ステーキ')),
            },
        )

        assert run_scraper(site, (('rune', '650118'),)) == 3

        menu = CafeteriaMenu.objects.get(menu_id='611012')
        assert menu.cafeteria == 'rune'
        assert menu.name == 'とり天葱生姜だれ'
        assert menu.category == 'main'
        assert menu.category_label == '主菜'
        assert menu.calories == 358.0
        assert menu.protein == 17.5
        assert menu.fat == 23.3
        assert menu.carbohydrates == 20.3
        assert menu.sodium == 1.6
        assert menu.calcium == 24.0
        assert menu.iron == 0.5
        assert menu.vitamin_a == 68.0
        assert menu.vitamin_b1 == 0.07
        assert menu.vitamin_c == 13.0

    def test_価格と対象外の項目を栄養値として拾わない(self):
        """組価も class="price" の span に入っている。混ざると全部おかしくなる。"""
        site = FakeSite(
            pages={'650118': MENU_PAGE},
            fragments={('650118', 'on_a'): _fragment(('611012', 'とり天葱生姜だれ'))},
        )
        run_scraper(site, (('rune', '650118'),))

        menu = CafeteriaMenu.objects.get(menu_id='611012')
        assert 341.0 not in vars(menu).values()
        # 値が「-」の項目、詳細ページに無い項目はいずれも 0.0 のまま
        assert menu.vitamin_b2 == 0.0
        assert menu.dietary_fiber == 0.0

    def test_食堂ごとに違う区分は見出しを残して_other_にする(self):
        site = FakeSite(
            pages={'650118': MENU_PAGE, '650113': MENU_PAGE_OTHER},
            fragments={
                ('650118', 'on_a'): _fragment(('611012', 'とり天葱生姜だれ')),
                ('650118', 'on_d'): _fragment(('616104', 'ソース海老カツ丼')),
                ('650118', 'on_bunrui1'): _fragment(('700001', 'ステーキ')),
                ('650113', 'on_a'): _fragment(('611012', 'とり天葱生姜だれ')),
                ('650113', 'on_bunrui1'): _fragment(('800001', '北部限定丼')),
            },
        )

        run_scraper(site, (('rune', '650118'), ('hokubu', '650113')))

        assert CafeteriaMenu.objects.get(menu_id='700001').category == 'other'
        assert CafeteriaMenu.objects.get(menu_id='700001').category_label == 'オーダー'

        hokubu_only = CafeteriaMenu.objects.get(menu_id='800001')
        assert hokubu_only.category == 'other'
        assert hokubu_only.category_label == '昼　北部限定コーナー'

    def test_同じメニューIDが食堂をまたいでも別々に保存される(self):
        site = FakeSite(
            pages={'650118': MENU_PAGE, '650113': MENU_PAGE_OTHER},
            fragments={
                ('650118', 'on_a'): _fragment(('611012', 'とり天葱生姜だれ')),
                ('650113', 'on_a'): _fragment(('611012', 'とり天葱生姜だれ')),
            },
        )

        assert run_scraper(site, (('rune', '650118'), ('hokubu', '650113'))) == 2
        assert CafeteriaMenu.objects.filter(menu_id='611012').count() == 2
        # 栄養値は食堂によらず同じなので、詳細ページは1回しか引かない
        assert site.detail_calls.count('611012') == 1

    def test_同一食堂で重複するメニューは先に出た区分を採る(self):
        """中央食堂の「ライス」のように、同じ品が複数の区分に載ることがある。"""
        site = FakeSite(
            pages={'650118': MENU_PAGE},
            fragments={
                ('650118', 'on_d'): _fragment(('610001', '（中）ライス')),
                ('650118', 'on_bunrui1'): _fragment(('610001', '（中）ライス')),
            },
        )

        assert run_scraper(site, (('rune', '650118'),)) == 1
        assert CafeteriaMenu.objects.get(menu_id='610001').category == 'rice'

    def test_1件も取得できなければ既存を消さない(self):
        """全件入れ替えのため、取得失敗で全消しになると被害が大きい（ADR #16）。"""
        CafeteriaMenu.objects.create(
            menu_id='KEEP001', name='既存メニュー', category='main',
            calories=500, protein=20, fat=15, carbohydrates=60,
        )
        site = FakeSite(pages={'650118': MENU_PAGE}, fragments={})

        assert run_scraper(site, (('rune', '650118'),)) == 0
        assert CafeteriaMenu.objects.filter(menu_id='KEEP001').exists()

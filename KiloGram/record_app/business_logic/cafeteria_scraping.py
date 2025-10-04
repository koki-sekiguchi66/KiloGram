import requests
from bs4 import BeautifulSoup
from ..models import CafeteriaMenu

class CafeteriaScraper:
    """食堂メニュースクレイピング"""
    
    BASE_URL = 'https://west2-univ.jp/sp/menu.php?t=650118'
    
    #データベースのカテゴリー値のマッピング
    # キー: 生協サイトのHTMLid属性
    # 値: CafeteriaMenuモデルのcategoryフィールド値
    CATEGORY_MAP = {
        'on_a': 'main',
        'on_b': 'side',
        'on_c': 'noodle',
        'on_d': 'rice',
        'on_e': 'dessert',
        'on_bunrui1': 'order',
        'on_bunrui2': 'kebab',
        'on_bunrui3': 'parfait',
        'on_bunrui4': 'night',
    }
    
    def fetch_and_update_menus(self):
        """メニュー情報を取得してデータベースを更新"""
        response = requests.get(self.BASE_URL, timeout=10)
        response.encoding = 'utf-8'
        soup = BeautifulSoup(response.text, 'html.parser')
        
        menus = []
        
        for category_id, category_code in self.CATEGORY_MAP.items():
            category_div = soup.find('div', class_='catMenu', id=lambda x: x and category_id in str(x))
            if not category_div:
                continue
                
            menu_items = category_div.find_all('li')
            
            for item in menu_items:
                menu_data = self._parse_menu_item(item, category_code)
                if menu_data:
                    menus.append(menu_data)
        
        CafeteriaMenu.objects.all().delete()
        CafeteriaMenu.objects.bulk_create([
            CafeteriaMenu(**menu) for menu in menus
        ])
        
        return len(menus)
    
    def _parse_menu_item(self, item, category):
        """個別メニュー項目をパース"""
        link = item.find('a')
        if not link:
            return None
        
        detail_url = link.get('href', '')
        menu_id = detail_url.split('c=')[-1] if 'c=' in detail_url else None
        if not menu_id:
            return None
        
        h3 = item.find('h3')
        if not h3:
            return None
            
        name = h3.contents[0].strip()
        
        nutrition = self._fetch_nutrition_detail(menu_id)
        
        return {
            'menu_id': menu_id,
            'name': name,
            'category': category,
            **nutrition
        }
    
    def _fetch_nutrition_detail(self, menu_id):
        """詳細ページから栄養素情報を取得"""
        detail_url = f'https://west2-univ.jp/sp/detail.php?t=650118&c={menu_id}'
        response = requests.get(detail_url, timeout=10)
        response.encoding = 'utf-8'
        soup = BeautifulSoup(response.text, 'html.parser')
        
        detail_list = soup.find('ul', class_='detail')
        if not detail_list:
            return self._empty_nutrition()
        
        nutrition = {}
        items = detail_list.find_all('li')
        
        for item in items:
            strong = item.find('strong')
            price_span = item.find('span', class_='price')
            
            if not strong or not price_span:
                continue
                
            label = strong.text.strip()
            value_text = price_span.text.strip()
            
            try:
                value = float(''.join(filter(lambda x: x.isdigit() or x == '.', value_text)))
            except ValueError:
                value = 0.0
            
            field_map = {
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
            
            field = field_map.get(label)
            if field:
                nutrition[field] = value
        
        return {**self._empty_nutrition(), **nutrition}
    
    def _empty_nutrition(self):
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
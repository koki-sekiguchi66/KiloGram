from django.test import TestCase
from django.contrib.auth.models import User
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from rest_framework.authtoken.models import Token
from record_app.models import CafeteriaMenu


class CafeteriaMenuTests(APITestCase):
    """食堂メニューの基本テスト"""
    
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='testuser', password='testpass123'
        )
        self.token = Token.objects.create(user=self.user)
        self.client.credentials(
            HTTP_AUTHORIZATION=f'Token {self.token.key}'
        )
        
        CafeteriaMenu.objects.create(
            menu_id='001',
            name='チキンカレー',
            category='rice',
            calories=700,
            protein=25,
            fat=20,
            carbohydrates=100
        )
        CafeteriaMenu.objects.create(
            menu_id='002',
            name='ハンバーグ定食',
            category='main',
            calories=650,
            protein=30,
            fat=25,
            carbohydrates=80
        )
        CafeteriaMenu.objects.create(
            menu_id='003',
            name='ラーメン',
            category='noodle',
            calories=550,
            protein=20,
            fat=15,
            carbohydrates=90
        )
    
    def test_list_all_cafeteria_menus(self):
        """全食堂メニューの取得"""
        response = self.client.get('/api/cafeteria/list/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 3)
    
    def test_filter_cafeteria_menus_by_category(self):
        """カテゴリーによる食堂メニューのフィルタリング"""
        response = self.client.get('/api/cafeteria/list/?category=rice')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['name'], 'チキンカレー')
    
    def test_cafeteria_menu_includes_nutrition(self):
        """食堂メニューに栄養情報が含まれる"""
        response = self.client.get('/api/cafeteria/list/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        menu = response.data[0]
        self.assertIn('calories', menu)
        self.assertIn('protein', menu)
        self.assertIn('fat', menu)
        self.assertIn('carbohydrates', menu)


class CafeteriaMenuDetailTests(APITestCase):
    """
    食堂メニュー詳細テスト
    """
    
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='testuser', password='testpass123'
        )
        self.token = Token.objects.create(user=self.user)
        self.client.credentials(
            HTTP_AUTHORIZATION=f'Token {self.token.key}'
        )
        
        self.menu = CafeteriaMenu.objects.create(
            menu_id='TEST001',
            name='テストチキンカレー',
            category='rice',
            calories=700,
            protein=25,
            fat=20,
            carbohydrates=100,
            dietary_fiber=3,
            sodium=2.5,
            calcium=50,
            iron=1.5,
            vitamin_a=30,
            vitamin_b1=0.1,
            vitamin_b2=0.08,
            vitamin_c=5,
        )
    
    def test_get_cafeteria_menu_by_id(self):
        """リスト取得経由で特定メニューの情報を確認"""
        response = self.client.get('/api/cafeteria/list/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        
        menu_data = response.data[0]
        self.assertEqual(menu_data['name'], 'テストチキンカレー')
        self.assertEqual(menu_data['menu_id'], 'TEST001')
    
    def test_cafeteria_menu_detail_nutrition_values(self):
        """メニューの栄養素値が正確"""
        response = self.client.get('/api/cafeteria/list/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        menu_data = response.data[0]
        self.assertEqual(float(menu_data['calories']), 700)
        self.assertEqual(float(menu_data['protein']), 25)
        self.assertEqual(float(menu_data['fat']), 20)
        self.assertEqual(float(menu_data['carbohydrates']), 100)
        self.assertEqual(float(menu_data['dietary_fiber']), 3)
        self.assertEqual(float(menu_data['calcium']), 50)


class CafeteriaMenuSearchTests(APITestCase):
    """
    食堂メニュー検索テスト
    """
    
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='testuser', password='testpass123'
        )
        self.token = Token.objects.create(user=self.user)
        self.client.credentials(
            HTTP_AUTHORIZATION=f'Token {self.token.key}'
        )
        
        CafeteriaMenu.objects.create(
            menu_id='001', name='チキンカレー', category='rice',
            calories=700, protein=25, fat=20, carbohydrates=100
        )
        CafeteriaMenu.objects.create(
            menu_id='002', name='チキン南蛮', category='main',
            calories=600, protein=28, fat=22, carbohydrates=55
        )
        CafeteriaMenu.objects.create(
            menu_id='003', name='豚肉の生姜焼き', category='main',
            calories=550, protein=30, fat=20, carbohydrates=45
        )
    
    def test_search_cafeteria_menu_by_category(self):
        """カテゴリーによるメニュー検索"""
        response = self.client.get('/api/cafeteria/list/?category=main')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)
        
        names = [m['name'] for m in response.data]
        self.assertIn('チキン南蛮', names)
        self.assertIn('豚肉の生姜焼き', names)
    
    def test_search_no_results(self):
        """存在しないカテゴリーでの検索は0件"""
        response = self.client.get('/api/cafeteria/list/?category=dessert')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 0)
    
    def test_no_filter_returns_all(self):
        """フィルタなしで全件取得"""
        response = self.client.get('/api/cafeteria/list/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 3)


class CafeteriaMenuReadOnlyTests(APITestCase):
    """
    食堂メニューの読み取り専用テスト
    """
    
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='testuser', password='testpass123'
        )
        self.token = Token.objects.create(user=self.user)
        self.client.credentials(
            HTTP_AUTHORIZATION=f'Token {self.token.key}'
        )
        
        self.menu = CafeteriaMenu.objects.create(
            menu_id='001', name='チキンカレー', category='rice',
            calories=700, protein=25, fat=20, carbohydrates=100
        )
    
    def test_cannot_create_cafeteria_menu(self):
        """食堂メニューの作成はできない"""
        data = {
            'menu_id': '999',
            'name': '不正メニュー',
            'category': 'main',
            'calories': 500,
            'protein': 20,
            'fat': 15,
            'carbohydrates': 60,
        }
        response = self.client.post('/api/cafeteria/list/', data)

        self.assertEqual(
            response.status_code, status.HTTP_405_METHOD_NOT_ALLOWED
        )
    
    def test_cannot_update_cafeteria_menu(self):
        """食堂メニューの更新はできない"""
        data = {'name': '変更メニュー'}
        response = self.client.put('/api/cafeteria/list/', data)
        self.assertIn(response.status_code, [
            status.HTTP_405_METHOD_NOT_ALLOWED,
            status.HTTP_403_FORBIDDEN
        ])
    
    def test_cannot_delete_cafeteria_menu(self):
        """食堂メニューの削除はできない"""
        response = self.client.delete('/api/cafeteria/list/')
        self.assertIn(response.status_code, [
            status.HTTP_405_METHOD_NOT_ALLOWED,
            status.HTTP_403_FORBIDDEN
        ])
    
    def test_unauthenticated_access_denied(self):
        """未認証でのアクセスは拒否"""
        client = APIClient()
        response = client.get('/api/cafeteria/list/')
        self.assertEqual(
            response.status_code, status.HTTP_401_UNAUTHORIZED
        )


class CafeteriaMenuCategoryFilterTests(APITestCase):
    """カテゴリーフィルタリングの詳細テスト"""
    
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='testuser', password='testpass123'
        )
        self.token = Token.objects.create(user=self.user)
        self.client.credentials(
            HTTP_AUTHORIZATION=f'Token {self.token.key}'
        )

        for name, category in [
            ('カレー', 'rice'), ('親子丼', 'rice'),
            ('ハンバーグ', 'main'), ('焼き魚', 'main'),
            ('ざるそば', 'noodle'),
        ]:
            CafeteriaMenu.objects.create(
                menu_id=f'T{CafeteriaMenu.objects.count()+1:03d}',
                name=name, category=category,
                calories=500, protein=20, fat=15, carbohydrates=60
            )
    
    def test_filter_rice_category(self):
        """丼・カレーカテゴリーのフィルタ"""
        response = self.client.get('/api/cafeteria/list/?category=rice')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)
    
    def test_filter_main_category(self):
        """主菜カテゴリーのフィルタ"""
        response = self.client.get('/api/cafeteria/list/?category=main')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)
    
    def test_filter_noodle_category(self):
        """麺類カテゴリーのフィルタ"""
        response = self.client.get('/api/cafeteria/list/?category=noodle')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
    
    def test_no_filter_returns_all_menus(self):
        """フィルタなしで全メニュー取得"""
        response = self.client.get('/api/cafeteria/list/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 5)
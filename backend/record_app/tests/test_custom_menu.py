from django.test import TestCase
from django.contrib.auth.models import User
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from rest_framework.authtoken.models import Token
from ..models import CustomMenu, CustomMenuItem
import json


class TestCustomMenuCreation(APITestCase):
    """Myメニュー作成のテスト"""
    
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(username='testuser', password='testpass123')
        self.token = Token.objects.create(user=self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.token.key}')
        self.menu_url = '/api/custom-menus/'
        
    def test_create_custom_menu_with_items(self):
        """アイテム付きMyメニューの作成"""
        data = {
            'name': '朝食セット',
            'description': 'いつもの朝食',
            'items': [
                {
                    'item_type': 'standard',
                    'item_id': 1,
                    'item_name': 'トースト',
                    'amount_grams': 60,
                    'display_order': 1,
                    'calories': 160,
                    'protein': 5.6,
                    'fat': 2.6,
                    'carbohydrates': 28.0,
                },
                {
                    'item_type': 'standard',
                    'item_id': 2,
                    'item_name': '目玉焼き',
                    'amount_grams': 60,
                    'display_order': 2,
                    'calories': 91,
                    'protein': 7.4,
                    'fat': 7.0,
                    'carbohydrates': 0.2,
                }
            ]
        }
        response = self.client.post(
            self.menu_url, 
            data=json.dumps(data), 
            content_type='application/json'
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['name'], '朝食セット')
        self.assertEqual(len(response.data['items']), 2)
        
    def test_create_custom_menu_without_items_fails(self):
        """アイテムなしのMyメニュー作成は失敗する"""
        data = {
            'name': '空メニュー',
            'items': []
        }
        response = self.client.post(
            self.menu_url,
            data=json.dumps(data),
            content_type='application/json'
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_custom_menu_missing_name_fails(self):
        """名前なしのMyメニュー作成は失敗する"""
        data = {
            'items': [
                {
                    'item_type': 'standard',
                    'item_id': 1,
                    'item_name': 'テスト食品',
                    'amount_grams': 100,
                    'display_order': 1,
                    'calories': 100,
                    'protein': 10,
                    'fat': 5,
                    'carbohydrates': 10,
                }
            ]
        }
        response = self.client.post(
            self.menu_url,
            data=json.dumps(data),
            content_type='application/json'
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class TestCustomMenuRetrieval(APITestCase):
    """Myメニュー取得のテスト"""
    
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(username='testuser', password='testpass123')
        self.token = Token.objects.create(user=self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.token.key}')
        self.menu_url = '/api/custom-menus/'
        
        self.menu = CustomMenu.objects.create(
            user=self.user,
            name='朝食セット',
            description='いつもの朝食',
        )
        CustomMenuItem.objects.create(
            custom_menu=self.menu,
            item_type='standard',
            item_id=1,
            item_name='トースト',
            amount_grams=60,
            display_order=1,
            calories=160,
            protein=5.6,
            fat=2.6,
            carbohydrates=28.0,
        )
        CustomMenuItem.objects.create(
            custom_menu=self.menu,
            item_type='standard',
            item_id=2,
            item_name='目玉焼き',
            amount_grams=60,
            display_order=2,
            calories=91,
            protein=7.4,
            fat=7.0,
            carbohydrates=0.2,
        )
        
        self.menu.calculate_totals()
        self.menu.save()
        
    def test_get_custom_menu_list(self):
        """カスタムメニュー一覧の取得"""
        response = self.client.get(self.menu_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        
    def test_get_custom_menu_with_items(self):
        """アイテム付きMyメニューの詳細取得"""
        response = self.client.get(f'{self.menu_url}{self.menu.id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['name'], '朝食セット')
        self.assertEqual(len(response.data['items']), 2)
        self.assertGreater(float(response.data['total_calories']), 0)

    def test_get_custom_menu_totals(self):
        """Myメニューの栄養素合計が正しい"""
        response = self.client.get(f'{self.menu_url}{self.menu.id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        self.assertAlmostEqual(float(response.data['total_calories']), 251, places=0)


class TestCustomMenuUpdate(APITestCase):
    """Myメニュー更新のテスト"""
    
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(username='testuser', password='testpass123')
        self.token = Token.objects.create(user=self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.token.key}')
        self.menu_url = '/api/custom-menus/'
        
        self.menu = CustomMenu.objects.create(
            user=self.user,
            name='テストメニュー',
        )
        CustomMenuItem.objects.create(
            custom_menu=self.menu,
            item_type='standard',
            item_id=1,
            item_name='テスト食品',
            amount_grams=100,
            display_order=1,
            calories=100,
            protein=10,
            fat=5,
            carbohydrates=15,
        )
        self.menu.calculate_totals()
        self.menu.save()
        
    def test_update_custom_menu_name(self):
        """Myメニューの名前更新"""
        data = {
            'name': '更新されたメニュー',
            'items': [
                {
                    'item_type': 'standard',
                    'item_id': 1,
                    'item_name': 'テスト食品',
                    'amount_grams': 100,
                    'display_order': 1,
                    'calories': 100,
                    'protein': 10,
                    'fat': 5,
                    'carbohydrates': 15,
                }
            ]
        }
        response = self.client.put(
            f'{self.menu_url}{self.menu.id}/',
            data=json.dumps(data),
            content_type='application/json'
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['name'], '更新されたメニュー')

    def test_delete_custom_menu(self):
        """Myメニューの削除"""
        response = self.client.delete(f'{self.menu_url}{self.menu.id}/')
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(CustomMenu.objects.count(), 0)


class TestCustomMenuSearch(APITestCase):
    """Myメニュー検索のテスト"""
    
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(username='testuser', password='testpass123')
        self.token = Token.objects.create(user=self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.token.key}')
        self.menu_url = '/api/custom-menus/'
        
        for name in ['朝食セット', '昼食セット', 'ダイエットメニュー']:
            menu = CustomMenu.objects.create(user=self.user, name=name)
            CustomMenuItem.objects.create(
                custom_menu=menu,
                item_type='standard',
                item_id=1,
                item_name='テスト食品',
                amount_grams=100,
                display_order=1,
                calories=100,
                protein=10,
                fat=5,
                carbohydrates=15,
            )
            menu.calculate_totals()
            menu.save()
        
    def test_search_custom_menus(self):
        """名前でMyメニューを検索"""
        response = self.client.get(f'{self.menu_url}search/?q=セット')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)

    def test_search_without_query_fails(self):
        """検索クエリなしはエラー"""
        response = self.client.get(f'{self.menu_url}search/')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class TestCustomMenuIsolation(APITestCase):
    """Myメニューのユーザー間分離テスト"""
    
    def setUp(self):
        self.client = APIClient()
        
        self.user1 = User.objects.create_user(username='user1', password='pass123')
        self.token1 = Token.objects.create(user=self.user1)
        
        self.user2 = User.objects.create_user(username='user2', password='pass123')
        self.token2 = Token.objects.create(user=self.user2)
        
        menu1 = CustomMenu.objects.create(user=self.user1, name='ユーザー1のメニュー')
        CustomMenuItem.objects.create(
            custom_menu=menu1, item_type='standard', item_id=1,
            item_name='食品A', amount_grams=100, display_order=1,
            calories=100, protein=10, fat=5, carbohydrates=15,
        )
        menu1.calculate_totals()
        menu1.save()
        
        menu2 = CustomMenu.objects.create(user=self.user2, name='ユーザー2のメニュー')
        CustomMenuItem.objects.create(
            custom_menu=menu2, item_type='standard', item_id=1,
            item_name='食品B', amount_grams=100, display_order=1,
            calories=200, protein=20, fat=10, carbohydrates=30,
        )
        menu2.calculate_totals()
        menu2.save()
        
    def test_user_can_only_see_own_menus(self):
        """ユーザーは自分のメニューのみ閲覧可能"""
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.token1.key}')
        response = self.client.get('/api/custom-menus/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
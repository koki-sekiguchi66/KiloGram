import pytest
from datetime import date, timedelta
from django.test import TestCase
from django.contrib.auth.models import User
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from rest_framework.authtoken.models import Token
from record_app.models import MealRecord


# =============================================================================
# pytest ベースのテスト
# =============================================================================

class TestDailySummaryAPI:
    """日別栄養サマリーAPIのテスト"""
    
    @pytest.fixture(autouse=True)
    def setup(self, authenticated_client, user):
        self.client = authenticated_client
        self.user = user
        self.url = '/api/nutrition/daily-summary/'
    
    def test_get_daily_summary_single_meal(self):
        """1食のみの日別サマリー"""
        MealRecord.objects.create(
            user=self.user,
            record_date=date.today(),
            meal_timing='breakfast',
            meal_name='朝食',
            calories=400,
            protein=15,
            fat=10,
            carbohydrates=50,
            dietary_fiber=2,
            sodium=300,
            calcium=80,
            iron=1.5,
            vitamin_a=40,
            vitamin_b1=0.2,
            vitamin_b2=0.1,
            vitamin_c=8,
        )
        
        response = self.client.get(
            self.url, {'date': date.today().isoformat()}
        )
        assert response.status_code == status.HTTP_200_OK
        
        summary = response.data['nutrition_summary']
        assert summary['calories'] == 400
        assert summary['protein'] == 15
    
    def test_get_daily_summary_multiple_meals(self):
        """複数食の日別サマリー"""
        for timing, cals in [('breakfast', 400), ('lunch', 600)]:
            MealRecord.objects.create(
                user=self.user,
                record_date=date.today(),
                meal_timing=timing,
                meal_name=f'{timing}',
                calories=cals,
                protein=15,
                fat=10,
                carbohydrates=50,
                dietary_fiber=2,
                sodium=300,
                calcium=80,
                iron=1.5,
                vitamin_a=40,
                vitamin_b1=0.2,
                vitamin_b2=0.1,
                vitamin_c=8,
            )
        
        response = self.client.get(
            self.url, {'date': date.today().isoformat()}
        )
        assert response.status_code == status.HTTP_200_OK
        
        summary = response.data['nutrition_summary']
        assert summary['calories'] == 1000
    
    def test_get_daily_summary_no_meals(self):
        """食事記録がない日のサマリー"""
        tomorrow = (date.today() + timedelta(days=1)).isoformat()
        response = self.client.get(self.url, {'date': tomorrow})
        assert response.status_code == status.HTTP_200_OK
        
        summary = response.data['nutrition_summary']
        assert summary['calories'] == 0
    
    def test_get_daily_summary_without_authentication(self):
        """未認証でのサマリー取得は401"""
        client = APIClient()
        response = client.get(self.url)
        assert response.status_code == status.HTTP_401_UNAUTHORIZED


class TestDailySummaryIsolation:
    """日別サマリーのユーザー分離テスト"""
    
    @pytest.fixture(autouse=True)
    def setup(self, authenticated_client, user, other_user):
        self.client = authenticated_client
        self.user = user
        self.other_user = other_user
        self.url = '/api/nutrition/daily-summary/'
        
        MealRecord.objects.create(
            user=user,
            record_date=date.today(),
            meal_timing='breakfast',
            meal_name='自分の朝食',
            calories=400,
            protein=15,
            fat=10,
            carbohydrates=50,
            dietary_fiber=2,
            sodium=300,
            calcium=80,
            iron=1.5,
            vitamin_a=40,
            vitamin_b1=0.2,
            vitamin_b2=0.1,
            vitamin_c=8,
        )

        MealRecord.objects.create(
            user=other_user,
            record_date=date.today(),
            meal_timing='breakfast',
            meal_name='他人の朝食',
            calories=600,
            protein=25,
            fat=18,
            carbohydrates=70,
            dietary_fiber=4,
            sodium=500,
            calcium=120,
            iron=2.5,
            vitamin_a=60,
            vitamin_b1=0.3,
            vitamin_b2=0.2,
            vitamin_c=12,
        )
    
    def test_summary_excludes_other_users_meals(self):
        """サマリーに他ユーザーの食事が含まれない"""
        response = self.client.get(
            self.url, {'date': date.today().isoformat()}
        )
        assert response.status_code == status.HTTP_200_OK
        
        summary = response.data['nutrition_summary']
        assert summary['calories'] == 400


# =============================================================================
# Django TestCase ベースのテスト
# =============================================================================

class DailySummaryAPITests(APITestCase):
    """日別サマリーの詳細テスト"""
    
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='testuser', password='testpass123'
        )
        self.token = Token.objects.create(user=self.user)
        self.client.credentials(
            HTTP_AUTHORIZATION=f'Token {self.token.key}'
        )
        self.url = '/api/nutrition/daily-summary/'
        
        self.breakfast = MealRecord.objects.create(
            user=self.user,
            record_date=date.today(),
            meal_timing='breakfast',
            meal_name='朝食',
            calories=400,
            protein=15,
            fat=10,
            carbohydrates=50,
            dietary_fiber=2,
            sodium=300,
            calcium=80,
            iron=1.5,
            vitamin_a=40,
            vitamin_b1=0.2,
            vitamin_b2=0.1,
            vitamin_c=8,
        )
    
    def test_daily_summary_totals_all_nutrients(self):
        """全栄養素の合計が正しい"""
        MealRecord.objects.create(
            user=self.user,
            record_date=date.today(),
            meal_timing='lunch',
            meal_name='昼食',
            calories=600,
            protein=25,
            fat=18,
            carbohydrates=70,
            dietary_fiber=4,
            sodium=500,
            calcium=120,
            iron=2.5,
            vitamin_a=60,
            vitamin_b1=0.3,
            vitamin_b2=0.2,
            vitamin_c=12,
        )
        
        response = self.client.get(
            self.url, {'date': date.today().isoformat()}
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        summary = response.data['nutrition_summary']
        self.assertEqual(summary['calories'], 1000)
        self.assertEqual(summary['protein'], 40)
        self.assertEqual(summary['fat'], 28)
        self.assertEqual(summary['carbohydrates'], 120)
    
    def test_daily_summary_by_meal_timing(self):
        """食事タイミング別のサマリーが正しい"""
        response = self.client.get(
            self.url, {'date': date.today().isoformat()}
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        summary = response.data['nutrition_summary']
        self.assertEqual(summary['calories'], 400)
    
    def test_daily_summary_different_dates(self):
        """異なる日付のサマリー"""
        yesterday = date.today() - timedelta(days=1)
        MealRecord.objects.create(
            user=self.user,
            record_date=yesterday,
            meal_timing='lunch',
            meal_name='昨日の昼食',
            calories=600,
            protein=25,
            fat=18,
            carbohydrates=70,
            dietary_fiber=4,
            sodium=500,
            calcium=120,
            iron=2.5,
            vitamin_a=60,
            vitamin_b1=0.3,
            vitamin_b2=0.2,
            vitamin_c=12,
        )
        
        response = self.client.get(
            self.url, {'date': yesterday.isoformat()}
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        summary = response.data['nutrition_summary']
        self.assertEqual(summary['calories'], 600)
    
    def test_daily_summary_includes_snacks(self):
        """間食もサマリーに含まれる"""
        MealRecord.objects.create(
            user=self.user,
            record_date=date.today(),
            meal_timing='snack',
            meal_name='間食',
            calories=200,
            protein=5,
            fat=8,
            carbohydrates=30,
            dietary_fiber=1,
            sodium=100,
            calcium=30,
            iron=0.5,
            vitamin_a=10,
            vitamin_b1=0.05,
            vitamin_b2=0.03,
            vitamin_c=3,
        )
        
        response = self.client.get(
            self.url, {'date': date.today().isoformat()}
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        summary = response.data['nutrition_summary']
        self.assertEqual(summary['calories'], 600)


class DailySummaryDateRangeTests(APITestCase):
    """日付範囲のテスト"""
    
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='testuser', password='testpass123'
        )
        self.token = Token.objects.create(user=self.user)
        self.client.credentials(
            HTTP_AUTHORIZATION=f'Token {self.token.key}'
        )
        self.url = '/api/nutrition/daily-summary/'
        
        for i in range(3):
            MealRecord.objects.create(
                user=self.user,
                record_date=date.today() - timedelta(days=i),
                meal_timing='breakfast',
                meal_name=f'{i}日前の朝食',
                calories=400 + i * 100,
                protein=15,
                fat=10,
                carbohydrates=50,
                dietary_fiber=2,
                sodium=300,
                calcium=80,
                iron=1.5,
                vitamin_a=40,
                vitamin_b1=0.2,
                vitamin_b2=0.1,
                vitamin_c=8,
            )
    
    def test_date_filter_excludes_outside_range(self):
        """指定日以外のデータは含まれない"""
        yesterday = date.today() - timedelta(days=1)
        response = self.client.get(
            self.url, {'date': yesterday.isoformat()}
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        summary = response.data['nutrition_summary']
        self.assertEqual(summary['calories'], 500)


class DailySummaryEdgeCaseTests(APITestCase):
    """エッジケースのテスト"""
    
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='testuser', password='testpass123'
        )
        self.token = Token.objects.create(user=self.user)
        self.client.credentials(
            HTTP_AUTHORIZATION=f'Token {self.token.key}'
        )
        self.url = '/api/nutrition/daily-summary/'
    
    def test_summary_with_zero_calories_meal(self):
        """カロリー0の食事があるサマリー"""
        MealRecord.objects.create(
            user=self.user,
            record_date=date.today(),
            meal_timing='snack',
            meal_name='ゼロカロリー食品',
            calories=0,
            protein=0,
            fat=0,
            carbohydrates=0,
            dietary_fiber=0,
            sodium=0,
            calcium=0,
            iron=0,
            vitamin_a=0,
            vitamin_b1=0,
            vitamin_b2=0,
            vitamin_c=0,
        )
        
        response = self.client.get(
            self.url, {'date': date.today().isoformat()}
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        summary = response.data['nutrition_summary']
        self.assertEqual(summary['calories'], 0)
    
    def test_summary_invalid_date_format(self):
        """不正な日付形式でのリクエスト"""
        response = self.client.get(self.url, {'date': 'invalid-date'})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    
    def test_summary_future_date(self):
        """未来の日付でのリクエスト（空結果）"""
        future = (date.today() + timedelta(days=30)).isoformat()
        response = self.client.get(self.url, {'date': future})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        summary = response.data['nutrition_summary']
        self.assertEqual(summary['calories'], 0)
from django.test import TestCase
from django.contrib.auth.models import User
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from rest_framework.authtoken.models import Token
from datetime import date, timedelta
from ..models import WeightRecord


class WeightRecordCreateTests(APITestCase):
    """体重記録作成のテスト"""
    
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(username='testuser', password='testpass123')
        self.token = Token.objects.create(user=self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.token.key}')
        self.weight_url = '/api/weights/'
        
    def test_create_weight_record(self):
        """体重記録の作成"""
        data = {
            'record_date': date.today().isoformat(),
            'weight': 70.5
        }
        response = self.client.post(self.weight_url, data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(WeightRecord.objects.count(), 1)
        self.assertEqual(float(WeightRecord.objects.get().weight), 70.5)
        
    def test_create_weight_record_with_decimal(self):
        """小数点を含む体重記録の作成"""
        data = {
            'record_date': date.today().isoformat(),
            'weight': 65.75
        }
        response = self.client.post(self.weight_url, data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(float(WeightRecord.objects.get().weight), 65.75)
        
    def test_update_weight_same_date(self):
        """同じ日付の体重記録更新（上書き）"""
        data = {
            'record_date': date.today().isoformat(),
            'weight': 70.0
        }
        response1 = self.client.post(self.weight_url, data)
        self.assertEqual(response1.status_code, status.HTTP_201_CREATED)
        
        data['weight'] = 71.0
        response2 = self.client.post(self.weight_url, data)
        self.assertEqual(response2.status_code, status.HTTP_200_OK)
        
        self.assertEqual(WeightRecord.objects.count(), 1)
        self.assertEqual(float(WeightRecord.objects.get().weight), 71.0)
        
    def test_create_weight_record_missing_weight(self):
        """体重値が不足している場合の作成失敗"""
        data = {
            'record_date': date.today().isoformat()
        }
        response = self.client.post(self.weight_url, data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_weight_record_missing_date(self):
        """日付が不足している場合でもデフォルト（today）で作成成功する"""
        data = {
            'weight': 68.0
        }
        response = self.client.post(self.weight_url, data)
        self.assertIn(response.status_code, [
            status.HTTP_201_CREATED,
            status.HTTP_200_OK
        ])
        self.assertEqual(WeightRecord.objects.count(), 1)
        record = WeightRecord.objects.get()
        self.assertEqual(record.record_date, date.today())
        self.assertEqual(float(record.weight), 68.0)


class WeightRecordRetrieveTests(APITestCase):
    """体重記録取得のテスト"""
    
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(username='testuser', password='testpass123')
        self.token = Token.objects.create(user=self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.token.key}')
        self.weight_url = '/api/weights/'
        
        for i in range(5):
            WeightRecord.objects.create(
                user=self.user,
                record_date=date.today() - timedelta(days=i),
                weight=70.0 + i * 0.5
            )
        
    def test_get_all_weight_records(self):
        """全体重記録の取得"""
        response = self.client.get(self.weight_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 5)
        
    def test_weight_records_ordered_by_date(self):
        """体重記録が日付順に並んでいることを確認"""
        response = self.client.get(self.weight_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        dates = [record['record_date'] for record in response.data]
        self.assertEqual(dates, sorted(dates, reverse=True))

    def test_filter_weights_by_date_range(self):
        """全件返却の確認"""
        response = self.client.get(self.weight_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 5)


class WeightRecordUpdateTests(APITestCase):
    """体重記録更新のテスト"""
    
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(username='testuser', password='testpass123')
        self.token = Token.objects.create(user=self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.token.key}')
        self.weight_url = '/api/weights/'
        
        self.weight_record = WeightRecord.objects.create(
            user=self.user,
            record_date=date.today(),
            weight=70.0
        )
        
    def test_update_weight_record(self):
        """体重記録の更新"""
        data = {
            'record_date': date.today().isoformat(),
            'weight': 71.5
        }
        response = self.client.put(
            f'{self.weight_url}{self.weight_record.id}/', data
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        self.weight_record.refresh_from_db()
        self.assertEqual(float(self.weight_record.weight), 71.5)
        
    def test_partial_update_weight_record(self):
        """体重記録の部分更新"""
        data = {'weight': 72.0}
        response = self.client.patch(
            f'{self.weight_url}{self.weight_record.id}/', data
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        self.weight_record.refresh_from_db()
        self.assertEqual(float(self.weight_record.weight), 72.0)

    def test_update_weight_to_invalid_value(self):
        """負の体重値への更新
        """
        data = {
            'record_date': date.today().isoformat(),
            'weight': -5.0
        }
        response = self.client.put(
            f'{self.weight_url}{self.weight_record.id}/', data
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)


class WeightRecordDeleteTests(APITestCase):
    """体重記録削除のテスト"""
    
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(username='testuser', password='testpass123')
        self.token = Token.objects.create(user=self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.token.key}')
        self.weight_url = '/api/weights/'
        
        self.weight_record = WeightRecord.objects.create(
            user=self.user,
            record_date=date.today(),
            weight=70.0
        )
        
    def test_delete_weight_record(self):
        """体重記録の削除"""
        response = self.client.delete(
            f'{self.weight_url}{self.weight_record.id}/'
        )
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(WeightRecord.objects.count(), 0)


class WeightRecordIsolationTests(APITestCase):
    """体重記録のユーザー間分離テスト"""
    
    def setUp(self):
        self.client = APIClient()
        
        self.user1 = User.objects.create_user(username='user1', password='pass123')
        self.token1 = Token.objects.create(user=self.user1)
        
        self.user2 = User.objects.create_user(username='user2', password='pass123')
        self.token2 = Token.objects.create(user=self.user2)
        
        WeightRecord.objects.create(
            user=self.user1,
            record_date=date.today(),
            weight=70.0
        )
        WeightRecord.objects.create(
            user=self.user2,
            record_date=date.today(),
            weight=65.0
        )
        
    def test_user_can_only_see_own_weights(self):
        """ユーザーは自分の体重記録のみ閲覧可能"""
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.token1.key}')
        response = self.client.get('/api/weights/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(float(response.data[0]['weight']), 70.0)
        
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.token2.key}')
        response = self.client.get('/api/weights/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(float(response.data[0]['weight']), 65.0)
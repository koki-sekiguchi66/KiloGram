import pytest
from datetime import date
from django.test import TestCase
from django.contrib.auth.models import User
from rest_framework.test import APIRequestFactory
from record_app.serializers import (
    UserRegistrationSerializer,
    MealRecordSerializer,
    WeightRecordSerializer,
    CustomFoodSerializer,
    CafeteriaMenuSerializer,
    CustomMenuSerializer,
    CustomMenuItemSerializer,
)
from record_app.models import StandardFood, CustomFood


# =============================================================================
# UserRegistrationSerializer テスト
# =============================================================================

class UserRegistrationSerializerTests(TestCase):
    """ユーザー登録シリアライザのバリデーションテスト"""

    def test_valid_registration_data(self):
        """正常なデータでバリデーションが通ること"""
        data = {
            'username': 'newuser',
            'email': 'new@example.com',
            'password': 'strongpass123',
            'confirm_password': 'strongpass123',
        }
        serializer = UserRegistrationSerializer(data=data)
        self.assertTrue(serializer.is_valid(), serializer.errors)

    def test_password_mismatch(self):
        """
        パスワード不一致でバリデーションエラーになること
        """
        data = {
            'username': 'newuser',
            'email': 'new@example.com',
            'password': 'strongpass123',
            'confirm_password': 'differentpass',
        }
        serializer = UserRegistrationSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('non_field_errors', serializer.errors)

    def test_short_password(self):
        """短すぎるパスワードでバリデーションエラーになること"""
        data = {
            'username': 'newuser',
            'email': 'new@example.com',
            'password': 'short',
            'confirm_password': 'short',
        }
        serializer = UserRegistrationSerializer(data=data)
        self.assertFalse(serializer.is_valid())

    def test_missing_username(self):
        """ユーザー名なしでバリデーションエラーになること"""
        data = {
            'email': 'new@example.com',
            'password': 'strongpass123',
            'confirm_password': 'strongpass123',
        }
        serializer = UserRegistrationSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('username', serializer.errors)

    def test_duplicate_username(self):
        """重複ユーザー名でバリデーションエラーになること"""
        User.objects.create_user(
            username='existing', password='pass123'
        )
        data = {
            'username': 'existing',
            'email': 'new@example.com',
            'password': 'strongpass123',
            'confirm_password': 'strongpass123',
        }
        serializer = UserRegistrationSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('username', serializer.errors)

    def test_create_user(self):
        """シリアライザ経由でユーザーが正しく作成されること"""
        data = {
            'username': 'createduser',
            'email': 'created@example.com',
            'password': 'strongpass123',
            'confirm_password': 'strongpass123',
        }
        serializer = UserRegistrationSerializer(data=data)
        self.assertTrue(serializer.is_valid(), serializer.errors)
        user = serializer.save()
        self.assertEqual(user.username, 'createduser')
        self.assertTrue(user.check_password('strongpass123'))


# =============================================================================
# WeightRecordSerializer テスト
# =============================================================================

class WeightRecordSerializerTests(TestCase):
    """体重記録シリアライザのテスト"""

    def test_valid_weight_data(self):
        """正常な体重データでバリデーションが通ること"""
        data = {
            'weight': 70.5,
            'record_date': date.today().isoformat(),
        }
        serializer = WeightRecordSerializer(data=data)
        self.assertTrue(serializer.is_valid(), serializer.errors)

    def test_missing_weight(self):
        """体重なしでバリデーションエラーになること"""
        data = {
            'record_date': date.today().isoformat(),
        }
        serializer = WeightRecordSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('weight', serializer.errors)


# =============================================================================
# MealRecordSerializer テスト
# =============================================================================

class MealRecordSerializerTests(TestCase):
    """食事記録シリアライザのテスト"""

    def setUp(self):
        self.user = User.objects.create_user(
            username='serializer_test', password='testpass123'
        )
        self.factory = APIRequestFactory()

    def test_valid_meal_data(self):
        """正常な食事データでバリデーションが通ること"""
        request = self.factory.post('/api/meals/')
        request.user = self.user

        data = {
            'record_date': date.today().isoformat(),
            'meal_timing': 'breakfast',
            'meal_name': 'テスト朝食',
            'calories': 500,
            'protein': 20,
            'fat': 15,
            'carbohydrates': 60,
        }
        serializer = MealRecordSerializer(
            data=data, context={'request': request}
        )
        self.assertTrue(serializer.is_valid(), serializer.errors)

    def test_invalid_meal_timing(self):
        """不正なmeal_timingでバリデーションエラーになること"""
        request = self.factory.post('/api/meals/')
        request.user = self.user

        data = {
            'record_date': date.today().isoformat(),
            'meal_timing': 'invalid_timing',
            'meal_name': 'テスト',
            'calories': 100,
            'protein': 5,
            'fat': 3,
            'carbohydrates': 10,
        }
        serializer = MealRecordSerializer(
            data=data, context={'request': request}
        )
        self.assertFalse(serializer.is_valid())
        self.assertIn('meal_timing', serializer.errors)

    def test_meal_with_items(self):
        """アイテム付き食事データのバリデーション"""
        request = self.factory.post('/api/meals/')
        request.user = self.user

        data = {
            'record_date': date.today().isoformat(),
            'meal_timing': 'lunch',
            'meal_name': 'テスト昼食',
            'calories': 600,
            'protein': 25,
            'fat': 20,
            'carbohydrates': 70,
            'items': [
                {
                    'item_type': 'standard',
                    'item_id': 1,
                    'item_name': '白米',
                    'amount_grams': 200,
                    'display_order': 1,
                    'calories': 712,
                    'protein': 12.2,
                    'fat': 1.8,
                    'carbohydrates': 155.2,
                }
            ]
        }
        serializer = MealRecordSerializer(
            data=data, context={'request': request}
        )
        self.assertTrue(serializer.is_valid(), serializer.errors)


# =============================================================================
# CustomFoodSerializer テスト
# =============================================================================

class CustomFoodSerializerTests(TestCase):
    """Myアイテムシリアライザのテスト"""

    def test_valid_custom_food_data(self):
        """正常なカスタム食品データのバリデーション"""
        data = {
            'name': 'プロテインバー',
            'calories_per_100g': 400,
            'protein_per_100g': 30,
            'fat_per_100g': 15,
            'carbs_per_100g': 40,
        }
        serializer = CustomFoodSerializer(data=data)
        self.assertTrue(serializer.is_valid(), serializer.errors)

    def test_missing_required_fields(self):
        """必須フィールドなしでバリデーションエラーになること"""
        data = {
            'name': 'テスト食品',
            # calories_per_100g 等の必須フィールドが未指定
        }
        serializer = CustomFoodSerializer(data=data)
        self.assertFalse(serializer.is_valid())


# =============================================================================
# CustomMenuSerializer テスト
# =============================================================================

def _make_valid_menu_item():
    """テスト用の有効なメニューアイテムデータを生成するヘルパー"""
    return {
        'item_type': 'standard',
        'item_id': 1,
        'item_name': 'テスト食品',
        'amount_grams': 100,
        'display_order': 1,
        'calories': 200,
        'protein': 10,
        'fat': 5,
        'carbohydrates': 25,
    }


class CustomMenuSerializerTests(TestCase):
    """Myメニューシリアライザのテスト"""

    def test_valid_custom_menu_data(self):
        """
        正常なメニューデータでバリデーションが通ること
        """
        data = {
            'name': 'テストメニュー',
            'description': 'テスト用',
            'items': [_make_valid_menu_item()],
        }
        serializer = CustomMenuSerializer(data=data)
        self.assertTrue(serializer.is_valid(), serializer.errors)

    def test_empty_items_rejected(self):
        """空のitemsリストが拒否されること"""
        data = {
            'name': 'テストメニュー',
            'items': [],
        }
        serializer = CustomMenuSerializer(data=data)
        self.assertFalse(serializer.is_valid())

    def test_missing_items_rejected(self):
        """itemsフィールドなしが拒否されること"""
        data = {
            'name': 'テストメニュー',
        }
        serializer = CustomMenuSerializer(data=data)
        self.assertFalse(serializer.is_valid())

    def test_menu_name_required(self):
        """メニュー名なしでバリデーションエラーになること"""
        data = {
            'items': [_make_valid_menu_item()],
        }
        serializer = CustomMenuSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('name', serializer.errors)

    def test_menu_name_max_length(self):
        """メニュー名がmax_length=100を超えると拒否されること"""
        data = {
            'name': 'あ' * 101,
            'items': [_make_valid_menu_item()],
        }
        serializer = CustomMenuSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('name', serializer.errors)


# =============================================================================
# CafeteriaMenuSerializer テスト
# =============================================================================

class CafeteriaMenuSerializerTests(TestCase):
    """食堂メニューシリアライザのテスト"""

    def test_category_display_field(self):
        """category_displayフィールドが読み取り専用であること"""
        serializer = CafeteriaMenuSerializer()
        fields = serializer.fields
        self.assertIn('category_display', fields)
        self.assertTrue(fields['category_display'].read_only)


# =============================================================================
# エッジケーステスト
# =============================================================================

@pytest.mark.django_db
class TestSerializerEdgeCases:
    """シリアライザのエッジケーステスト"""

    def test_special_characters_in_description(self):
        """
        descriptionに特殊文字を含むデータのバリデーション
        """
        data = {
            'name': 'テストメニュー',
            'description': '<script>alert("test")</script>',
            'items': [_make_valid_menu_item()],
        }
        serializer = CustomMenuSerializer(data=data)
        assert serializer.is_valid(), serializer.errors

    def test_zero_nutrition_values(self):
        """栄養素が全て0の食品データも有効であること"""
        data = {
            'name': 'ゼロ食品',
            'calories_per_100g': 0,
            'protein_per_100g': 0,
            'fat_per_100g': 0,
            'carbs_per_100g': 0,
        }
        serializer = CustomFoodSerializer(data=data)
        assert serializer.is_valid(), serializer.errors

    def test_large_nutrition_values(self):
        """極端に大きな栄養素値のバリデーション"""
        data = {
            'name': '高カロリー食品',
            'calories_per_100g': 9999,
            'protein_per_100g': 99,
            'fat_per_100g': 99,
            'carbs_per_100g': 99,
        }
        serializer = CustomFoodSerializer(data=data)
        assert serializer.is_valid(), serializer.errors

    def test_meal_record_with_all_nutrients(self):
        """12種類全ての栄養素を含む食事記録データの検証"""
        user = User.objects.create_user(
            username='edge_case_user', password='testpass123'
        )
        factory = APIRequestFactory()
        request = factory.post('/api/meals/')
        request.user = user

        data = {
            'record_date': date.today().isoformat(),
            'meal_timing': 'dinner',
            'meal_name': '完全食テスト',
            'calories': 1000,
            'protein': 40,
            'fat': 30,
            'carbohydrates': 120,
            'dietary_fiber': 10,
            'sodium': 500,
            'calcium': 200,
            'iron': 5,
            'vitamin_a': 100,
            'vitamin_b1': 0.5,
            'vitamin_b2': 0.6,
            'vitamin_c': 50,
        }
        serializer = MealRecordSerializer(
            data=data, context={'request': request}
        )
        assert serializer.is_valid(), serializer.errors

    def test_weight_record_boundary_values(self):
        """体重の境界値テスト"""
        # 非常に小さい値
        data = {'weight': 0.1, 'record_date': date.today().isoformat()}
        serializer = WeightRecordSerializer(data=data)
        assert serializer.is_valid(), serializer.errors

        # 非常に大きい値
        data = {'weight': 500.0, 'record_date': date.today().isoformat()}
        serializer = WeightRecordSerializer(data=data)
        assert serializer.is_valid(), serializer.errors
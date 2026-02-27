import pytest
from datetime import date, timedelta
from unittest.mock import patch, MagicMock
from django.test import TestCase
from django.contrib.auth.models import User
from record_app.models import (
    MealRecord, WeightRecord, CustomFood, CustomMenu, CustomMenuItem
)
from record_app.business_logic.nutrition_calculator import NutritionCalculatorService
from record_app.services import MealService, WeightService, CustomFoodService


# =============================================================================
# NutritionCalculatorService テスト
# =============================================================================

@pytest.mark.django_db
class TestNutritionCalculatorService:
    """栄養計算サービスの単体テスト"""

    def test_search_foods_basic(self, standard_foods):
        """基本的な食品検索が動作すること"""
        calculator = NutritionCalculatorService()
        results = calculator.search_foods('白米')

        assert len(results) >= 1
        assert any('白米' in r['name'] for r in results)
        first = results[0]
        assert 'id' in first
        assert 'name' in first
        assert 'category' in first
        assert 'type' in first
        assert 'nutrition' in first

    def test_calculate_nutrition_for_amount(self, standard_foods):
        """指定量での栄養素計算が正しいこと"""
        calculator = NutritionCalculatorService()
        food = standard_foods[0]  

        result = calculator.calculate_nutrition_for_amount(
            f'standard_{food.id}', 200  
        )

        assert result['calories'] == pytest.approx(712.0, rel=0.01)
        assert result['protein'] == pytest.approx(12.2, rel=0.01)

    def test_calculate_nutrition_invalid_food_id(self, standard_foods):
        """不正な食品IDでValueErrorが発生すること"""
        calculator = NutritionCalculatorService()

        with pytest.raises(ValueError):
            calculator.calculate_nutrition_for_amount('invalid_999', 100)

    def test_get_food_suggestions(self, standard_foods):
        """食品サジェストが文字列のリストで返ること"""
        calculator = NutritionCalculatorService()
        suggestions = calculator.get_food_suggestions('鶏')

        assert isinstance(suggestions, list)
        assert any('鶏' in s for s in suggestions)

    def test_get_daily_nutrition_summary(self, user, standard_foods):
        """日次栄養サマリーが正しく計算されること"""
        calculator = NutritionCalculatorService()

        MealRecord.objects.create(
            user=user,
            record_date=date.today(),
            meal_timing='breakfast',
            meal_name='朝食',
            calories=400, protein=15, fat=10, carbohydrates=50,
            dietary_fiber=3, sodium=200, calcium=50, iron=1,
            vitamin_a=10, vitamin_b1=0.05, vitamin_b2=0.1, vitamin_c=5,
        )
        MealRecord.objects.create(
            user=user,
            record_date=date.today(),
            meal_timing='lunch',
            meal_name='昼食',
            calories=600, protein=25, fat=20, carbohydrates=70,
            dietary_fiber=5, sodium=300, calcium=80, iron=2,
            vitamin_a=20, vitamin_b1=0.1, vitamin_b2=0.15, vitamin_c=10,
        )

        summary = calculator.get_daily_nutrition_summary(user, date.today())

        assert summary['calories'] == 1000
        assert summary['protein'] == 40
        assert summary['fat'] == 30

    def test_get_daily_nutrition_summary_no_meals(self, user):
        """食事記録がない日のサマリーが全て0であること"""
        calculator = NutritionCalculatorService()
        summary = calculator.get_daily_nutrition_summary(
            user, date.today() - timedelta(days=365)
        )

        assert summary['calories'] == 0
        assert summary['protein'] == 0

    def test_calculate_nutrition_custom_food(self, user, custom_food):
        """カスタム食品の栄養計算が動作すること"""
        calculator = NutritionCalculatorService()
        result = calculator.calculate_nutrition_for_amount(
            f'custom_{custom_food.id}', 50
        )

        assert result['calories'] == pytest.approx(200.0, rel=0.01)
        assert result['protein'] == pytest.approx(15.0, rel=0.01)


# =============================================================================
# WeightService テスト
# =============================================================================

@pytest.mark.django_db
class TestWeightService:
    """体重サービスのテスト"""

    def test_register_weight_create(self, user):
        """新規体重記録が作成されること"""
        record, created = WeightService.register_weight(
            user=user, weight=70.5, record_date=date.today()
        )

        assert created is True
        assert record.weight == 70.5
        assert record.user == user

    def test_register_weight_update(self, user):
        """同日の体重記録が更新されること（update_or_create）"""
        WeightService.register_weight(
            user=user, weight=70.0, record_date=date.today()
        )
        record, created = WeightService.register_weight(
            user=user, weight=71.0, record_date=date.today()
        )

        assert created is False
        assert record.weight == 71.0

    def test_register_weight_different_dates(self, user):
        """異なる日付は別レコードとなること"""
        WeightService.register_weight(
            user=user, weight=70.0, record_date=date.today()
        )
        record2, created = WeightService.register_weight(
            user=user, weight=69.5,
            record_date=date.today() - timedelta(days=1)
        )

        assert created is True
        assert WeightRecord.objects.filter(user=user).count() == 2


# =============================================================================
# MealService テスト
# =============================================================================

@pytest.mark.django_db
class TestMealService:
    """食事サービスのテスト"""

    def test_create_meal_from_menu(self, user, custom_menu_with_items):
        """Myメニューから食事記録が作成されること"""
        data = {
            'record_date': date.today(),
            'meal_timing': 'lunch',
            'multiplier': 1.0,
        }
        meal = MealService.create_meal_from_menu(
            user=user,
            menu=custom_menu_with_items,
            data=data,
        )

        assert meal.user == user
        assert meal.meal_timing == 'lunch'
        assert meal.items.count() == 2

    def test_create_meal_with_multiplier(self, user, custom_menu_with_items):
        """倍率指定で栄養素が正しくスケールされること"""
        menu = custom_menu_with_items
        data = {
            'record_date': date.today(),
            'meal_timing': 'dinner',
            'multiplier': 0.5,
        }
        meal = MealService.create_meal_from_menu(
            user=user, menu=menu, data=data
        )

        assert meal.calories == pytest.approx(
            menu.total_calories * 0.5, rel=0.01
        )

    def test_create_meal_invalid_multiplier(self, user, custom_menu_with_items):
        """不正な倍率でValueErrorが発生すること"""
        data = {
            'record_date': date.today(),
            'meal_timing': 'lunch',
            'multiplier': -1.0,
        }
        with pytest.raises(ValueError):
            MealService.create_meal_from_menu(
                user=user,
                menu=custom_menu_with_items,
                data=data,
            )


# =============================================================================
# MealService トランザクションテスト
# =============================================================================

@pytest.mark.django_db
class TestMealServiceTransaction:
    """食事サービスのトランザクション動作テスト"""

    def test_meal_creation_atomicity(self, user, standard_foods):
        """
        食事記録作成がアトミックであること
        """
        menu = CustomMenu.objects.create(
            user=user, name='トランザクションテスト', description=''
        )
        CustomMenuItem.objects.create(
            custom_menu=menu,
            item_type='standard',
            item_id=standard_foods[0].id,
            item_name='白米',
            amount_grams=100,
            display_order=1,
            calories=356, protein=6.1, fat=0.9, carbohydrates=77.6,
        )
        menu.calculate_totals()
        menu.save()

        data = {
            'record_date': date.today(),
            'meal_timing': 'breakfast',
            'multiplier': 1.0,
        }
        meal = MealService.create_meal_from_menu(user, menu, data)

        assert MealRecord.objects.filter(id=meal.id).exists()
        assert meal.items.count() == 1


# =============================================================================
# CustomFoodService テスト
# =============================================================================

@pytest.mark.django_db
class TestCustomFoodService:
    """Myアイテムサービスのテスト"""

    def test_create_custom_food(self, user):
        """Myアイテムが正しく作成されること"""
        data = {
            'name': 'テスト食品',
            'calories_per_100g': 200,
            'protein_per_100g': 10,
            'fat_per_100g': 5,
            'carbs_per_100g': 25,
        }
        food = CustomFoodService.create_custom_food(user, data)

        assert food.name == 'テスト食品'
        assert food.calories_per_100g == 200
        assert food.user == user
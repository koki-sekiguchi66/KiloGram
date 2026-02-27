import pytest
from datetime import date, timedelta
from django.contrib.auth.models import User
from rest_framework.test import APIClient
from rest_framework.authtoken.models import Token
from record_app.models import (
    MealRecord, MealRecordItem, WeightRecord,
    StandardFood, CustomFood, CafeteriaMenu,
    CustomMenu, CustomMenuItem
)


# =============================================================================
# 認証関連フィクスチャ
# =============================================================================

@pytest.fixture
def user(db):
    """テスト用ユーザーを作成"""
    return User.objects.create_user(
        username='testuser',
        password='testpass123',
        email='test@example.com'
    )


@pytest.fixture
def other_user(db):
    """別のテスト用ユーザー"""
    return User.objects.create_user(
        username='otheruser',
        password='otherpass123',
        email='other@example.com'
    )


@pytest.fixture
def token(user):
    """認証トークンを作成"""
    return Token.objects.create(user=user)


@pytest.fixture
def other_token(other_user):
    """別ユーザーの認証トークン"""
    return Token.objects.create(user=other_user)


@pytest.fixture
def authenticated_client(token):
    """認証済みAPIクライアント"""
    client = APIClient()
    client.credentials(HTTP_AUTHORIZATION=f'Token {token.key}')
    return client


@pytest.fixture
def other_authenticated_client(other_token):
    """別ユーザーの認証済みAPIクライアント"""
    client = APIClient()
    client.credentials(HTTP_AUTHORIZATION=f'Token {other_token.key}')
    return client


@pytest.fixture
def unauthenticated_client():
    """未認証APIクライアント"""
    return APIClient()


# =============================================================================
# 標準食品フィクスチャ
# =============================================================================

@pytest.fixture
def standard_foods(db):
    """
    テスト用の標準食品データ
    """
    foods_data = [
        {
            'food_number': 'TEST001',
            'name': '白米',
            'category': '穀類',
            'calories_per_100g': 356,
            'protein_per_100g': 6.1,
            'fat_per_100g': 0.9,
            'carbs_per_100g': 77.6,
            'fiber_per_100g': 0.5,
            'sodium_per_100g': 1.0,
            'calcium_per_100g': 5.0,
            'iron_per_100g': 0.8,
            'vitamin_a_per_100g': 0,
            'vitamin_b1_per_100g': 0.08,
            'vitamin_b2_per_100g': 0.02,
            'vitamin_c_per_100g': 0,
        },
        {
            'food_number': 'TEST002',
            'name': '鶏むね肉',
            'category': '肉類',
            'calories_per_100g': 108,
            'protein_per_100g': 22.3,
            'fat_per_100g': 1.5,
            'carbs_per_100g': 0,
            'fiber_per_100g': 0,
            'sodium_per_100g': 42.0,
            'calcium_per_100g': 4.0,
            'iron_per_100g': 0.3,
            'vitamin_a_per_100g': 8,
            'vitamin_b1_per_100g': 0.1,
            'vitamin_b2_per_100g': 0.11,
            'vitamin_c_per_100g': 3,
        },
        {
            'food_number': 'TEST003',
            'name': 'ブロッコリー',
            'category': '野菜類',
            'calories_per_100g': 33,
            'protein_per_100g': 4.3,
            'fat_per_100g': 0.5,
            'carbs_per_100g': 5.2,
            'fiber_per_100g': 4.4,
            'sodium_per_100g': 20.0,
            'calcium_per_100g': 38.0,
            'iron_per_100g': 1.0,
            'vitamin_a_per_100g': 67,
            'vitamin_b1_per_100g': 0.14,
            'vitamin_b2_per_100g': 0.2,
            'vitamin_c_per_100g': 120,
        },
    ]
    foods = []
    for data in foods_data:
        foods.append(StandardFood.objects.create(**data))
    return foods


# =============================================================================
# Myアイテムフィクスチャ
# =============================================================================

@pytest.fixture
def custom_food(user):
    """テスト用Myアイテム"""
    return CustomFood.objects.create(
        user=user,
        name='プロテインバー',
        calories_per_100g=400,
        protein_per_100g=30,
        fat_per_100g=15,
        carbs_per_100g=40,
        fiber_per_100g=5,
        sodium_per_100g=200,
        calcium_per_100g=100,
        iron_per_100g=2,
    )


@pytest.fixture
def other_custom_food(other_user):
    """別ユーザーのMyアイテム"""
    return CustomFood.objects.create(
        user=other_user,
        name='他ユーザーの食品',
        calories_per_100g=200,
        protein_per_100g=10,
        fat_per_100g=8,
        carbs_per_100g=25,
    )


# =============================================================================
# 食事記録フィクスチャ
# =============================================================================

@pytest.fixture
def meal_record(user):
    """テスト用食事記録"""
    return MealRecord.objects.create(
        user=user,
        record_date=date.today(),
        meal_timing='breakfast',
        meal_name='テスト朝食',
        calories=500,
        protein=20,
        fat=15,
        carbohydrates=60,
        dietary_fiber=5,
        sodium=300,
        calcium=100,
        iron=2,
        vitamin_a=50,
        vitamin_b1=0.1,
        vitamin_b2=0.2,
        vitamin_c=10,
    )


@pytest.fixture
def meal_record_with_items(user, standard_foods):
    """アイテム付き食事記録"""
    meal = MealRecord.objects.create(
        user=user,
        record_date=date.today(),
        meal_timing='lunch',
        meal_name='テスト昼食',
        calories=600,
        protein=30,
        fat=20,
        carbohydrates=70,
    )
    MealRecordItem.objects.create(
        meal_record=meal,
        item_type='standard',
        item_id=standard_foods[0].id,
        item_name=standard_foods[0].name,
        amount_grams=150,
        display_order=1,
        calories=534,
        protein=9.15,
        fat=1.35,
        carbohydrates=116.4,
    )
    MealRecordItem.objects.create(
        meal_record=meal,
        item_type='standard',
        item_id=standard_foods[1].id,
        item_name=standard_foods[1].name,
        amount_grams=100,
        display_order=2,
        calories=108,
        protein=22.3,
        fat=1.5,
        carbohydrates=0,
    )
    return meal


# =============================================================================
# 体重記録フィクスチャ
# =============================================================================

@pytest.fixture
def weight_records(user):
    """テスト用体重記録（7日分）"""
    records = []
    base_date = date.today()
    for i in range(7):
        records.append(
            WeightRecord.objects.create(
                user=user,
                record_date=base_date - timedelta(days=i),
                weight=70.0 + (i * 0.1)
            )
        )
    return records


# =============================================================================
# 食堂メニューフィクスチャ
# =============================================================================

@pytest.fixture
def cafeteria_menus(db):
    """テスト用食堂メニュー"""
    menus = []
    menus.append(CafeteriaMenu.objects.create(
        name='チキンカツ定食',
        category='main',
        calories=750,
        protein=30,
        fat=25,
        carbohydrates=90,
    ))
    menus.append(CafeteriaMenu.objects.create(
        name='サラダセット',
        category='side',
        calories=150,
        protein=5,
        fat=8,
        carbohydrates=15,
    ))
    menus.append(CafeteriaMenu.objects.create(
        name='カレーライス',
        category='rice',
        calories=680,
        protein=18,
        fat=20,
        carbohydrates=95,
    ))
    return menus


# =============================================================================
# Myメニューフィクスチャ
# =============================================================================

@pytest.fixture
def custom_menu_with_items(user, standard_foods):
    """
    アイテム付きMyメニュー
    """
    menu = CustomMenu.objects.create(
        user=user,
        name='テストメニュー',
        description='テスト用のカスタムメニュー',
    )
    CustomMenuItem.objects.create(
        custom_menu=menu,
        item_type='standard',
        item_id=standard_foods[0].id,
        item_name='白米',
        amount_grams=200,
        display_order=1,
        calories=712,
        protein=12.2,
        fat=1.8,
        carbohydrates=155.2,
        dietary_fiber=1.0,
        sodium=2.0,
    )
    CustomMenuItem.objects.create(
        custom_menu=menu,
        item_type='standard',
        item_id=standard_foods[1].id,
        item_name='鶏むね肉',
        amount_grams=150,
        display_order=2,
        calories=162,
        protein=33.45,
        fat=2.25,
        carbohydrates=0,
        dietary_fiber=0,
        sodium=63.0,
    )
    menu.calculate_totals()
    menu.save()
    return menu


@pytest.fixture
def other_custom_menu(other_user):
    """別ユーザーのMyメニュー"""
    menu = CustomMenu.objects.create(
        user=other_user,
        name='他ユーザーのメニュー',
        description='データ分離テスト用',
    )
    CustomMenuItem.objects.create(
        custom_menu=menu,
        item_type='standard',
        item_id=1,
        item_name='テスト食品',
        amount_grams=100,
        display_order=1,
        calories=200,
        protein=10,
        fat=5,
        carbohydrates=25,
    )
    menu.calculate_totals()
    menu.save()
    return menu
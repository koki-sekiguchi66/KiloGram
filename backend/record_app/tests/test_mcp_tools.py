"""MCP ツールの単体テスト。

方針（設計書 §7）: MCP のトランスポート層を経由せず、ツール関数を直接呼ぶ。
SDK のバージョンアップでテストが壊れないようにするため。

A5〜A7（ユーザー間のデータ分離）が最重要。
"""
from datetime import date, timedelta

import pytest

from mcp_server import tools
from mcp_server.constants import (
    MAX_ITEMS_PER_MEAL,
    MAX_TREND_DAYS,
    SCOPE_MEALS_READ,
    SCOPE_WEIGHT_READ,
)
from mcp_server.errors import NotFoundError, ValidationError
from mcp_server.tools import MealItemInput
from record_app.models import MealRecord, MealRecordItem


pytestmark = pytest.mark.django_db

TODAY = date.today().isoformat()


@pytest.fixture(autouse=True)
def _clear_rate_limit():
    """レート制限はプロセス内に状態を持つため、テストごとに消す。"""
    from mcp_server.rate_limit import reset_rate_limit

    reset_rate_limit()
    yield
    reset_rate_limit()


def item(item_type, item_id, amount_grams=100):
    return MealItemInput(item_type=item_type, item_id=item_id, amount_grams=amount_grams)


# =============================================================================
# U1: 横断検索
# =============================================================================

class TestSearchFoods:

    def test_u1_標準食品とMyアイテムと学食を横断して返す(
        self, user, mcp_auth_context, run_async, standard_foods, custom_food, cafeteria_menus
    ):
        """U1: 3つの供給元がまとめて返る。"""
        CustomFood = type(custom_food)
        CustomFood.objects.create(
            user=user, name='テスト鶏サラダ',
            calories_per_100g=100, protein_per_100g=10, fat_per_100g=2, carbs_per_100g=5,
        )
        from record_app.models import CafeteriaMenu
        CafeteriaMenu.objects.create(
            menu_id='TESTX1', name='テスト鶏カツ', category='main',
            calories=700, protein=28, fat=30, carbohydrates=70,
        )

        with mcp_auth_context(user):
            result = run_async(tools.search_foods, 'テスト鶏')

        returned_types = {food['item_type'] for food in result['foods']}
        assert 'custom' in returned_types
        assert 'cafeteria' in returned_types

    def test_学食の栄養値は1食ぶんであることが明示される(
        self, user, mcp_auth_context, run_async, cafeteria_menus
    ):
        """100g あたりと取り違えると栄養値が壊れるため、基準を必ず添える。"""
        with mcp_auth_context(user):
            result = run_async(tools.search_foods, 'カレーライス')

        cafeteria = [f for f in result['foods'] if f['item_type'] == 'cafeteria']
        assert cafeteria
        assert cafeteria[0]['nutrition_basis'] == 'per_serving'

    def test_a7_他ユーザーのMyアイテムは検索結果に混ざらない(
        self, user, other_custom_food, mcp_auth_context, run_async
    ):
        """A7 相当: Myアイテムはユーザーごとに分離される。"""
        with mcp_auth_context(user):
            result = run_async(tools.search_foods, '他ユーザー')

        assert all(food['item_type'] != 'custom' for food in result['foods'])

    def test_短すぎるキーワードは弾かれる(self, user, mcp_auth_context, run_async):
        with mcp_auth_context(user):
            with pytest.raises(ValidationError):
                run_async(tools.search_foods, 'あ')


# =============================================================================
# U2 / U3: draft_meal
# =============================================================================

class TestDraftMeal:

    def test_u2_下書きはDBに書き込まない(
        self, user, standard_foods, mcp_auth_context, run_async
    ):
        """U2: 件数が変わらないことを確認する。"""
        before_meals = MealRecord.objects.count()
        before_items = MealRecordItem.objects.count()

        with mcp_auth_context(user):
            result = run_async(
                tools.draft_meal, 'テスト下書き', [item('standard', standard_foods[0].id, 150)]
            )

        assert MealRecord.objects.count() == before_meals
        assert MealRecordItem.objects.count() == before_items
        assert result['saved'] is False

    def test_u3_合計栄養素が既存の計算ロジックと一致する(
        self, user, standard_foods, mcp_auth_context, run_async
    ):
        """U3: 100g あたりの値 × 分量 / 100 という既存の按分と一致する。"""
        rice = standard_foods[0]
        amount = 150

        with mcp_auth_context(user):
            result = run_async(tools.draft_meal, 'ごはん', [item('standard', rice.id, amount)])

        expected_calories = round(rice.calories_per_100g * amount / 100, 2)
        assert result['total']['calories'] == expected_calories
        # ADR #17 の落とし穴: carbs_per_100g -> carbohydrates の対応が崩れると 0 になる
        assert result['total']['carbohydrates'] == round(rice.carbs_per_100g * amount / 100, 2)
        assert result['total']['dietary_fiber'] == round(rice.fiber_per_100g * amount / 100, 2)

    def test_学食は分量で変倍されない(
        self, user, cafeteria_menus, mcp_auth_context, run_async
    ):
        """Web UI（toMenuItemPayload）と同じ挙動。1食ぶんの値をそのまま使う。"""
        menu = cafeteria_menus[0]

        with mcp_auth_context(user):
            result = run_async(
                tools.draft_meal, '学食', [item('cafeteria', menu.id, 500)]
            )

        assert result['total']['calories'] == menu.calories

    def test_a5_他ユーザーのMyアイテムは下書きに使えない(
        self, user, other_custom_food, mcp_auth_context, run_async
    ):
        """A5 相当: 他ユーザーの食品IDを指定しても解決できない。"""
        with mcp_auth_context(user):
            with pytest.raises(NotFoundError):
                run_async(
                    tools.draft_meal, '不正', [item('custom', other_custom_food.id)]
                )

    def test_存在しない食品IDはエラーになる(self, user, mcp_auth_context, run_async):
        with mcp_auth_context(user):
            with pytest.raises(NotFoundError):
                run_async(tools.draft_meal, '不正', [item('standard', 999999)])

    def test_明細が空ならエラーになる(self, user, mcp_auth_context, run_async):
        with mcp_auth_context(user):
            with pytest.raises(ValidationError):
                run_async(tools.draft_meal, '空', [])

    @pytest.mark.parametrize('amount', [0, -1])
    def test_分量が0以下ならエラーになる(
        self, user, standard_foods, mcp_auth_context, run_async, amount
    ):
        with mcp_auth_context(user):
            with pytest.raises(ValidationError):
                run_async(
                    tools.draft_meal, '不正', [item('standard', standard_foods[0].id, amount)]
                )

    def test_分量が極端に大きいとエラーになる(
        self, user, standard_foods, mcp_auth_context, run_async
    ):
        with mcp_auth_context(user):
            with pytest.raises(ValidationError):
                run_async(
                    tools.draft_meal, '不正', [item('standard', standard_foods[0].id, 999999)]
                )

    def test_明細が多すぎるとエラーになる(
        self, user, standard_foods, mcp_auth_context, run_async
    ):
        too_many = [item('standard', standard_foods[0].id) for _ in range(MAX_ITEMS_PER_MEAL + 1)]

        with mcp_auth_context(user):
            with pytest.raises(ValidationError):
                run_async(tools.draft_meal, '多すぎ', too_many)


# =============================================================================
# U4: 作成
# =============================================================================

class TestCreateMealRecord:

    def test_u4_明細つきで作成され栄養値がスナップショットになる(
        self, user, standard_foods, mcp_auth_context, run_async
    ):
        """U4: 参照ではなく実数値が保存される（ADR #1）。"""
        rice = standard_foods[0]

        with mcp_auth_context(user):
            result = run_async(
                tools.create_meal_record, TODAY, 'lunch', 'テスト昼食',
                [item('standard', rice.id, 200)],
            )

        meal = MealRecord.objects.get(pk=result['id'])
        assert meal.user_id == user.id
        assert meal.items.count() == 1

        saved_item = meal.items.first()
        assert saved_item.item_name == rice.name
        assert saved_item.calories == round(rice.calories_per_100g * 2, 2)

        # 参照元を書き換えても記録の値が変わらないこと
        rice.calories_per_100g = 9999
        rice.save()
        saved_item.refresh_from_db()
        assert saved_item.calories == round(356 * 2, 2)

    def test_合計が明細から算出される(
        self, user, standard_foods, mcp_auth_context, run_async
    ):
        with mcp_auth_context(user):
            result = run_async(
                tools.create_meal_record, TODAY, 'dinner', '二品',
                [item('standard', standard_foods[0].id, 100),
                 item('standard', standard_foods[1].id, 100)],
            )

        meal = MealRecord.objects.get(pk=result['id'])
        expected = standard_foods[0].calories_per_100g + standard_foods[1].calories_per_100g
        assert meal.calories == pytest.approx(expected, abs=0.01)

    def test_不正な日付はエラーになる(self, user, standard_foods, mcp_auth_context, run_async):
        with mcp_auth_context(user):
            with pytest.raises(ValidationError):
                run_async(
                    tools.create_meal_record, '2026/08/23', 'lunch', 'ダメ',
                    [item('standard', standard_foods[0].id)],
                )

    def test_書き込みの頻度に上限がある(
        self, user, standard_foods, mcp_auth_context, run_async
    ):
        from mcp_server.constants import WRITE_RATE_LIMIT_COUNT
        from mcp_server.errors import RateLimitError

        payload = [item('standard', standard_foods[0].id)]
        with mcp_auth_context(user):
            for _ in range(WRITE_RATE_LIMIT_COUNT):
                run_async(tools.create_meal_record, TODAY, 'snack', '連投', payload)

            with pytest.raises(RateLimitError):
                run_async(tools.create_meal_record, TODAY, 'snack', '連投', payload)


# =============================================================================
# A5 / A6: 他ユーザーの記録
# =============================================================================

class TestUserIsolation:

    def test_a5_他ユーザーの記録は取得できない(
        self, user, other_user, mcp_auth_context, run_async
    ):
        """A5: 404 相当（NotFoundError）。403 だと存在が漏れる。"""
        others_meal = MealRecord.objects.create(
            user=other_user, record_date=date.today(),
            meal_timing='lunch', meal_name='他人の昼食', calories=500,
        )

        with mcp_auth_context(user):
            with pytest.raises(NotFoundError):
                run_async(tools.get_meal_record, others_meal.id)

    def test_a6_他ユーザーの記録は更新できない(
        self, user, other_user, standard_foods, mcp_auth_context, run_async
    ):
        """A6: 更新経由でも他人の記録に触れない。"""
        others_meal = MealRecord.objects.create(
            user=other_user, record_date=date.today(),
            meal_timing='lunch', meal_name='他人の昼食', calories=500,
        )

        with mcp_auth_context(user):
            with pytest.raises(NotFoundError):
                run_async(
                    tools.update_meal_record, others_meal.id, TODAY, 'lunch', '乗っ取り',
                    [item('standard', standard_foods[0].id)],
                )

        others_meal.refresh_from_db()
        assert others_meal.meal_name == '他人の昼食'

    def test_a7_一覧に他ユーザーの記録が混ざらない(
        self, user, other_user, meal_record, mcp_auth_context, run_async
    ):
        """A7: 期間一覧はユーザーで絞られる。"""
        MealRecord.objects.create(
            user=other_user, record_date=date.today(),
            meal_timing='dinner', meal_name='他人の夕食', calories=800,
        )

        with mcp_auth_context(user):
            result = run_async(tools.list_meal_records, TODAY, TODAY)

        assert all(record['meal_name'] != '他人の夕食' for record in result['records'])
        assert result['count'] == 1

    def test_日次サマリーに他ユーザーの記録が混ざらない(
        self, user, other_user, meal_record, mcp_auth_context, run_async
    ):
        MealRecord.objects.create(
            user=other_user, record_date=date.today(),
            meal_timing='dinner', meal_name='他人の夕食', calories=800,
        )

        with mcp_auth_context(user):
            result = run_async(tools.get_daily_nutrition, TODAY)

        assert result['total']['calories'] == meal_record.calories


# =============================================================================
# U5: 期間の上限
# =============================================================================

class TestNutritionTrend:

    def test_u5_上限を超えた期間はエラーになる(self, user, mcp_auth_context, run_async):
        """U5: MAX_TREND_DAYS を超える指定を拒否する。"""
        start = date.today() - timedelta(days=MAX_TREND_DAYS)

        with mcp_auth_context(user):
            with pytest.raises(ValidationError):
                run_async(tools.get_nutrition_trend, start.isoformat(), TODAY)

    def test_上限ちょうどは通る(self, user, mcp_auth_context, run_async):
        start = date.today() - timedelta(days=MAX_TREND_DAYS - 1)

        with mcp_auth_context(user):
            result = run_async(tools.get_nutrition_trend, start.isoformat(), TODAY)

        assert result['start_date'] == start.isoformat()

    def test_開始日が終了日より後ならエラーになる(self, user, mcp_auth_context, run_async):
        tomorrow = (date.today() + timedelta(days=1)).isoformat()

        with mcp_auth_context(user):
            with pytest.raises(ValidationError):
                run_async(tools.get_nutrition_trend, tomorrow, TODAY)

    def test_日別に集計される(self, user, mcp_auth_context, run_async):
        yesterday = date.today() - timedelta(days=1)
        MealRecord.objects.create(
            user=user, record_date=yesterday,
            meal_timing='lunch', meal_name='A', calories=300, protein=10,
        )
        MealRecord.objects.create(
            user=user, record_date=yesterday,
            meal_timing='dinner', meal_name='B', calories=500, protein=20,
        )

        with mcp_auth_context(user):
            result = run_async(tools.get_nutrition_trend, yesterday.isoformat(), TODAY)

        assert result['days_with_records'] == 1
        assert result['daily'][0]['calories'] == 800
        assert result['daily'][0]['protein'] == 30

    def test_体重は専用スコープがあるときだけ含まれる(
        self, user, weight_records, mcp_auth_context, run_async
    ):
        with mcp_auth_context(user, scopes=[SCOPE_MEALS_READ, SCOPE_WEIGHT_READ]):
            with_weight = run_async(tools.get_nutrition_trend, TODAY, TODAY)

        with mcp_auth_context(user, scopes=[SCOPE_MEALS_READ]):
            without_weight = run_async(tools.get_nutrition_trend, TODAY, TODAY)

        assert 'weights' in with_weight
        assert 'weights' not in without_weight


# =============================================================================
# U6: 丸めと単位 / エッジケース
# =============================================================================

class TestFormatting:

    def test_u6_栄養値は小数2桁に丸められる(
        self, user, standard_foods, mcp_auth_context, run_async
    ):
        """U6: 33 kcal/100g を 33g ぶん = 10.89 になる。"""
        broccoli = standard_foods[2]

        with mcp_auth_context(user):
            result = run_async(
                tools.draft_meal, '端数', [item('standard', broccoli.id, 33)]
            )

        assert result['total']['calories'] == 10.89

    def test_記録が1件もない日でも合計0で返る(self, user, mcp_auth_context, run_async):
        with mcp_auth_context(user):
            result = run_async(tools.get_daily_nutrition, '2020-01-01')

        assert result['total']['calories'] == 0
        assert result['meals'] == []

    def test_詳細は12栄養素を含む(
        self, user, meal_record_with_items, mcp_auth_context, run_async
    ):
        from mcp_server.constants import DETAIL_NUTRIENT_KEYS

        with mcp_auth_context(user):
            result = run_async(tools.get_meal_record, meal_record_with_items.id)

        assert set(DETAIL_NUTRIENT_KEYS).issubset(result['total'].keys())
        assert len(result['items']) == 2

    def test_一覧は明細を含まない(
        self, user, meal_record_with_items, mcp_auth_context, run_async
    ):
        """コンテキスト節約のため、一覧では件数だけ返す。"""
        with mcp_auth_context(user):
            result = run_async(tools.list_meal_records, TODAY, TODAY)

        assert 'items' not in result['records'][0]
        assert result['records'][0]['items_count'] == 2

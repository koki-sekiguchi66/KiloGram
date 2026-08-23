"""Myアイテムのユーザー間分離テスト。

`/api/foods/calculate/` は food_id を受け取って栄養素を計算して返す。
`custom_<id>` を指定できるため、id さえ分かれば他ユーザーの
Myアイテムの栄養値を読み出せてしまう状態だった（今回の修正対象）。

栄養値そのものは機微度の高い情報ではないが、
「ViewSet は必ず user で絞る」というユーザー間データ分離の規約
（backend/CLAUDE.md）が、この経路だけ破れていた。
"""
import pytest

from record_app.business_logic.nutrition_calculator import NutritionCalculatorService


pytestmark = pytest.mark.django_db


class TestCalculateNutritionIsolation:
    """business_logic 層でのユーザー分離。"""

    def test_自分のMyアイテムは計算できる(self, user, custom_food):
        calculator = NutritionCalculatorService()

        result = calculator.calculate_nutrition_for_amount(
            user, f'custom_{custom_food.id}', 50
        )

        assert result['calories'] == pytest.approx(200.0, rel=0.01)

    def test_他ユーザーのMyアイテムは計算できない(self, user, other_custom_food):
        """他人の Myアイテム ID を指定しても栄養値を得られない。"""
        calculator = NutritionCalculatorService()

        with pytest.raises(ValueError):
            calculator.calculate_nutrition_for_amount(
                user, f'custom_{other_custom_food.id}', 100
            )

    def test_標準食品は全ユーザー共通なので誰でも計算できる(self, user, standard_foods):
        """標準食品は共有マスタであり、絞り込みの対象ではない。"""
        calculator = NutritionCalculatorService()

        result = calculator.calculate_nutrition_for_amount(
            user, f'standard_{standard_foods[0].id}', 100
        )

        assert result['calories'] == pytest.approx(356.0, rel=0.01)


class TestCalculateNutritionEndpointIsolation:
    """API 経由でのユーザー分離（実際の攻撃経路）。"""

    def test_他ユーザーのMyアイテムの栄養値を取得できない(
        self, authenticated_client, other_custom_food
    ):
        """他人の Myアイテム ID を渡しても 200 で栄養値が返ってはいけない。"""
        response = authenticated_client.post(
            '/api/foods/calculate/',
            {'food_id': f'custom_{other_custom_food.id}', 'amount': 100},
            format='json',
        )

        assert response.status_code == 400
        assert 'calories' not in response.data.get('nutrition', {})

    def test_自分のMyアイテムなら取得できる(self, authenticated_client, custom_food):
        response = authenticated_client.post(
            '/api/foods/calculate/',
            {'food_id': f'custom_{custom_food.id}', 'amount': 100},
            format='json',
        )

        assert response.status_code == 200
        assert response.data['nutrition']['calories'] == pytest.approx(400.0, rel=0.01)

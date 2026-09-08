"""学食メニューのおすすめのテスト。

「目標の残りに近いメニューほど上位」というスコアの性質を固定する。
順位そのものより、**残りに対して過不足の少ないものが選ばれる**ことを検証する。
"""
import pytest
from datetime import date

from record_app.business_logic.cafeteria_advisor import CafeteriaAdvisor
from record_app.models import CafeteriaMenu, NutritionGoal


@pytest.fixture
def menus(db):
    """カロリー帯の異なるメニューを3つ用意する。"""
    def make(menu_id, name, calories, protein, fat, carbs):
        return CafeteriaMenu.objects.create(
            menu_id=menu_id, name=name, category='main',
            calories=calories, protein=protein, fat=fat, carbohydrates=carbs,
        )

    return {
        'light': make('L1', 'サラダ', 100, 5, 3, 10),
        'medium': make('M1', '焼き魚定食', 500, 30, 15, 60),
        'heavy': make('H1', 'カツカレー', 1200, 40, 50, 150),
    }


@pytest.mark.django_db
class TestCafeteriaAdvisor:
    def test_残りが多いときは重いメニューが上位になる(self, user, menus):
        # 目標2000kcal、摂取0 → 残り2000kcal
        NutritionGoal.objects.create(user=user, calories=2000, protein=100, fat=56, carbs=275)

        result = CafeteriaAdvisor().suggest(user, date.today(), limit=3)

        assert result['suggestions'][0]['name'] == 'カツカレー'

    def test_残りが少ないときは軽いメニューが上位になる(self, user, menus, meal_record):
        # meal_record が既にある状態で、目標を低く設定して残りを小さくする
        NutritionGoal.objects.create(user=user, calories=300, protein=15, fat=8, carbs=40)

        result = CafeteriaAdvisor().suggest(user, meal_record.record_date, limit=3)

        assert result['suggestions'][0]['name'] == 'サラダ'

    def test_目標未設定でも既定値で動く(self, user, menus):
        assert not NutritionGoal.objects.filter(user=user).exists()

        result = CafeteriaAdvisor().suggest(user, date.today(), limit=3)

        assert len(result['suggestions']) == 3
        assert result['goal']['calories'] == 2000

    def test_残り栄養素を返す(self, user, menus):
        NutritionGoal.objects.create(user=user, calories=2000, protein=100, fat=56, carbs=275)

        result = CafeteriaAdvisor().suggest(user, date.today(), limit=3)

        # 何も食べていないので残り＝目標
        assert result['remaining']['calories'] == 2000
        assert result['remaining']['protein'] == 100

    def test_limitで件数を絞れる(self, user, menus):
        result = CafeteriaAdvisor().suggest(user, date.today(), limit=2)

        assert len(result['suggestions']) == 2

    def test_メニューが無ければ空を返す(self, user):
        result = CafeteriaAdvisor().suggest(user, date.today(), limit=3)

        assert result['suggestions'] == []

    def test_候補にどの食堂かが付く(self, user, menus):
        """menu_id は食堂をまたぐと重複するため、食堂まで示さないと特定できない。"""
        result = CafeteriaAdvisor().suggest(user, date.today(), limit=1)
        top = result['suggestions'][0]

        assert top['cafeteria'] == 'rune'
        assert top['cafeteria_display'] == 'ルネカフェテリア'

    def test_食堂を指定するとその食堂だけから選ぶ(self, user, menus):
        CafeteriaMenu.objects.create(
            cafeteria='hokubu', menu_id='L1', name='北部のサラダ', category='main',
            calories=100, protein=5, fat=3, carbohydrates=10,
        )

        result = CafeteriaAdvisor().suggest(
            user, date.today(), limit=5, cafeteria='hokubu'
        )

        assert [s['name'] for s in result['suggestions']] == ['北部のサラダ']

    def test_各候補に不足と超過の内訳が付く(self, user, menus):
        NutritionGoal.objects.create(user=user, calories=2000, protein=100, fat=56, carbs=275)

        result = CafeteriaAdvisor().suggest(user, date.today(), limit=1)
        top = result['suggestions'][0]

        assert 'nutrition' in top
        assert 'remaining_after' in top
        # 食べた後の残りが計算されていること
        assert top['remaining_after']['calories'] == 2000 - top['nutrition']['calories']


@pytest.mark.django_db
class TestCafeteriaSuggestionAPI:
    def test_未認証では取得できない(self, unauthenticated_client):
        response = unauthenticated_client.get('/api/cafeteria/suggestions/')

        assert response.status_code == 401

    def test_おすすめを返す(self, authenticated_client, menus):
        response = authenticated_client.get('/api/cafeteria/suggestions/')

        assert response.status_code == 200
        assert len(response.data['suggestions']) == 3
        assert 'remaining' in response.data

    def test_他ユーザーの摂取実績に影響されない(
        self, authenticated_client, other_authenticated_client, menus
    ):
        # 相手が大量に食べていても、自分の残りは目標のまま
        response = authenticated_client.get('/api/cafeteria/suggestions/')

        assert response.data['remaining']['calories'] == 2000

    def test_不正な日付は400になる(self, authenticated_client, menus):
        response = authenticated_client.get('/api/cafeteria/suggestions/?date=not-a-date')

        assert response.status_code == 400

    def test_食堂で絞り込める(self, authenticated_client, menus):
        CafeteriaMenu.objects.create(
            cafeteria='chuo', menu_id='C1', name='中央の定食', category='main',
            calories=600, protein=25, fat=20, carbohydrates=70,
        )

        response = authenticated_client.get('/api/cafeteria/suggestions/?cafeteria=chuo')

        assert response.status_code == 200
        assert [s['name'] for s in response.data['suggestions']] == ['中央の定食']


@pytest.mark.django_db
class TestMCPツールの目標値:
    """T2 が目標と残りを返すこと（ADR #28 で「MCPからも参照できる」と書いた責任）。"""

    def test_日次サマリーに目標と残りが含まれる(self, user):
        from mcp_server.tools import _get_daily_nutrition_sync

        NutritionGoal.objects.create(user=user, calories=1800, protein=90, fat=50, carbs=247)

        result = _get_daily_nutrition_sync(user, date.today())

        assert result['goal']['calories'] == 1800
        # 何も食べていないので残り＝目標
        assert result['remaining']['calories'] == 1800

    def test_目標未設定でも既定値を返す(self, user):
        from mcp_server.tools import _get_daily_nutrition_sync

        result = _get_daily_nutrition_sync(user, date.today())

        assert result['goal']['calories'] == 2000

"""栄養目標値 API のテスト。

目標値は端末を跨いで引き継げる必要があるためサーバーで保持する。
未設定の利用者にも既定値を返すこと（フロントに既定値を持たせない）を固定する。
"""
import pytest

from record_app.models import NutritionGoal

ENDPOINT = '/api/goals/'


@pytest.mark.django_db
class TestNutritionGoalAPI:
    def test_未認証では取得できない(self, unauthenticated_client):
        response = unauthenticated_client.get(ENDPOINT)

        assert response.status_code == 401

    def test_未設定でも既定値が返る(self, authenticated_client, user):
        assert not NutritionGoal.objects.filter(user=user).exists()

        response = authenticated_client.get(ENDPOINT)

        assert response.status_code == 200
        assert response.data == {
            'calories': 2000, 'protein': 100, 'fat': 56, 'carbs': 275,
        }

    def test_取得だけでは行を作らない(self, authenticated_client, user):
        authenticated_client.get(ENDPOINT)

        # 読み取りで書き込みを起こさない（GET は副作用を持たない）
        assert not NutritionGoal.objects.filter(user=user).exists()

    def test_保存すると次回の取得に反映される(self, authenticated_client):
        payload = {'calories': 1800, 'protein': 90, 'fat': 50, 'carbs': 247}

        put = authenticated_client.put(ENDPOINT, payload, format='json')
        assert put.status_code == 200

        get = authenticated_client.get(ENDPOINT)
        assert get.data == payload

    def test_二回目の保存は上書きになる(self, authenticated_client, user):
        authenticated_client.put(
            ENDPOINT, {'calories': 1800, 'protein': 90, 'fat': 50, 'carbs': 247}, format='json'
        )
        authenticated_client.put(
            ENDPOINT, {'calories': 2200, 'protein': 110, 'fat': 61, 'carbs': 303}, format='json'
        )

        assert NutritionGoal.objects.filter(user=user).count() == 1
        assert NutritionGoal.objects.get(user=user).calories == 2200

    def test_他ユーザーの目標値は見えない(self, authenticated_client, other_authenticated_client):
        authenticated_client.put(
            ENDPOINT, {'calories': 1800, 'protein': 90, 'fat': 50, 'carbs': 247}, format='json'
        )

        response = other_authenticated_client.get(ENDPOINT)

        # 他人の設定ではなく、自分の既定値が返る
        assert response.data['calories'] == 2000

    def test_他ユーザーの目標値を書き換えられない(
        self, authenticated_client, other_authenticated_client, user, other_user
    ):
        other_authenticated_client.put(
            ENDPOINT, {'calories': 1500, 'protein': 80, 'fat': 40, 'carbs': 200}, format='json'
        )

        assert not NutritionGoal.objects.filter(user=user).exists()
        assert NutritionGoal.objects.get(user=other_user).calories == 1500

    @pytest.mark.parametrize('field', ['calories', 'protein', 'fat', 'carbs'])
    def test_負の値は拒否する(self, authenticated_client, field):
        payload = {'calories': 2000, 'protein': 100, 'fat': 56, 'carbs': 275}
        payload[field] = -1

        response = authenticated_client.put(ENDPOINT, payload, format='json')

        assert response.status_code == 400
        assert field in response.data

    def test_数値でない値は拒否する(self, authenticated_client):
        payload = {'calories': 'たくさん', 'protein': 100, 'fat': 56, 'carbs': 275}

        response = authenticated_client.put(ENDPOINT, payload, format='json')

        assert response.status_code == 400

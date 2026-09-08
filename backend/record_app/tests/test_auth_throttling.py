"""認証系エンドポイントのレート制限テスト。

総当たりを抑えるのが目的。上限に達したら 429 を返し、
制限は利用者ごとではなく**試行元ごと**にかかること（未認証でも効くこと）を固定する。
"""
import pytest
from django.core.cache import cache


@pytest.fixture(autouse=True)
def _clear_throttle_history():
    """スロットルの履歴はキャッシュに残るためテスト間で消す。"""
    cache.clear()
    yield
    cache.clear()


@pytest.mark.django_db
class Testログインのレート制限:
    def test_短時間に繰り返すと429になる(self, unauthenticated_client, user):
        payload = {'username': user.username, 'password': 'wrong-password'}

        statuses = [
            unauthenticated_client.post('/api/login/', payload).status_code
            for _ in range(12)
        ]

        assert 429 in statuses, f'レート制限がかかっていない: {statuses}'

    def test_制限前は通常のエラーを返す(self, unauthenticated_client, user):
        response = unauthenticated_client.post(
            '/api/login/', {'username': user.username, 'password': 'wrong-password'}
        )

        # 1回目から429ではなく、認証失敗として扱われること
        assert response.status_code == 400


@pytest.mark.django_db
class Test登録のレート制限:
    def test_短時間に繰り返すと429になる(self, unauthenticated_client):
        statuses = []
        for i in range(12):
            response = unauthenticated_client.post('/api/register/', {
                'username': f'user{i}', 'email': f'u{i}@example.com',
                'password': 'test-password-123',
            })
            statuses.append(response.status_code)

        assert 429 in statuses, f'レート制限がかかっていない: {statuses}'


@pytest.mark.django_db
class TestGoogleログインのレート制限:
    def test_短時間に繰り返すと429になる(self, unauthenticated_client):
        statuses = [
            unauthenticated_client.post(
                '/api/auth/google/', {'credential': 'invalid'}
            ).status_code
            for _ in range(12)
        ]

        assert 429 in statuses, f'レート制限がかかっていない: {statuses}'

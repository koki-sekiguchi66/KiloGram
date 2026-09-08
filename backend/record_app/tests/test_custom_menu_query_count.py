"""Myメニュー一覧のクエリ数を固定するテスト。

`items_count` を `obj.items.count()` で求めると、prefetch_related のキャッシュが
使われず行数ぶん COUNT が発行される。件数取得の実装を変えてもクエリ数が
増えないことを、ここで固定する。
"""
import pytest
from django.db import connection
from django.test.utils import CaptureQueriesContext

from record_app.models import CustomMenu, CustomMenuItem


@pytest.fixture
def three_menus_with_items(user, standard_foods):
    """明細を持つMyメニューを3件作る。N+1 は件数が増えて初めて表面化するため。"""
    for i in range(3):
        menu = CustomMenu.objects.create(user=user, name=f'メニュー{i}')
        CustomMenuItem.objects.create(
            custom_menu=menu,
            item_type='standard',
            item_id=standard_foods[0].id,
            item_name='白米',
            amount_grams=200,
            display_order=1,
            calories=712, protein=12.2, fat=1.8, carbohydrates=155.2,
        )
    return CustomMenu.objects.filter(user=user)


@pytest.mark.django_db
class TestMyメニュー一覧のクエリ数:
    def test_件数取得でメニュー数ぶんのクエリが増えない(
        self, authenticated_client, three_menus_with_items
    ):
        with CaptureQueriesContext(connection) as ctx:
            response = authenticated_client.get('/api/custom-menus/')

        assert response.status_code == 200
        assert len(response.data) == 3

        # メニュー本体 + prefetch の items で足りる。
        # 件数を count() で求めるとメニュー数ぶん COUNT が増えてここを超える
        assert len(ctx.captured_queries) <= 4, (
            f'クエリが多すぎる: {len(ctx.captured_queries)}件\n'
            + '\n'.join(q['sql'][:120] for q in ctx.captured_queries)
        )

    def test_items_countが明細数を正しく返す(
        self, authenticated_client, three_menus_with_items
    ):
        response = authenticated_client.get('/api/custom-menus/')

        assert response.status_code == 200
        assert all(menu['items_count'] == 1 for menu in response.data)

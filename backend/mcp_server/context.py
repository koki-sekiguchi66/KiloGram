"""アクセストークンから「誰のリクエストか」を解決する。

ツールは必ずここを通してユーザーを取得し、**以降のクエリを必ずそのユーザーで絞る**。
ここを迂回すると他ユーザーのデータが見えてしまうため、
ツール側で User を直接引かないこと。
"""
import logging

from asgiref.sync import sync_to_async
from mcp.server.auth.middleware.auth_context import get_access_token

from .errors import InsufficientScopeError, MCPToolError

logger = logging.getLogger(__name__)


def _get_user_sync(user_id):
    from django.contrib.auth.models import User

    return User.objects.filter(pk=user_id, is_active=True).first()


async def resolve_user(required_scope):
    """現在のリクエストのユーザーを返す。必要スコープを満たさなければ例外。

    required_scope: このツールの実行に必要なスコープ（constants の SCOPE_*）。

    SDK の RequireAuthMiddleware はエンドポイント全体に対してしか
    スコープを検査できない。ツールごとに要求が違うため、ここで個別に検査する。
    """
    access_token = get_access_token()

    if access_token is None:
        # 認証済みでなければ SDK が 401 を返すので、通常ここには来ない
        raise MCPToolError('認証されていません。コネクタを接続し直してください。')

    if required_scope not in access_token.scopes:
        raise InsufficientScopeError(
            f'この操作には {required_scope} の権限が必要です。'
            'Claude のコネクタ設定から接続し直して、権限を許可してください。'
        )

    user = await sync_to_async(_get_user_sync)(int(access_token.subject))

    if user is None:
        # トークンは有効だがユーザーが削除・無効化されている
        raise MCPToolError('アカウントが利用できません。管理者に連絡してください。')

    return user

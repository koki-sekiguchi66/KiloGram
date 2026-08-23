"""アクセストークンの検証と Django ユーザーの解決。

MCP サーバは django-oauth-toolkit の AccessToken を**直接 DB 参照**する。
イントロスペクションエンドポイントも JWT 検証も使わない。

なぜ HTTP 経由で /api/ を呼ばないか:
    MCP 仕様は「MCP サーバが上流 API を呼ぶ際、クライアントから受け取った
    トークンをそのまま転送してはならない（token passthrough 禁止）」と定める。
    HTTP 経由にすると内部認証の仕組みを自作する必要が生じ、セキュリティ上
    最も繊細な部分を自作することになる。Django を直接 import すれば
    この問題自体が発生しない。
"""
import logging

from asgiref.sync import sync_to_async
from mcp.server.auth.provider import AccessToken as MCPAccessToken

logger = logging.getLogger(__name__)


def _load_access_token(raw_token):
    """生のトークン文字列から django-oauth-toolkit の AccessToken を引く。

    DOT はトークン本体ではなく SHA-256 チェックサム列で検索する
    （RFC 9700 のトークン保護でトークン本体は伏せられうるため）。
    チェックサムの導出方法を写経すると DOT 側の変更に追随できないので、
    DOT 自身がリソースサーバとして使っているのと同じ経路を呼ぶ。
    """
    from oauth2_provider.oauth2_validators import OAuth2Validator

    return OAuth2Validator()._load_access_token(raw_token)


class DjangoAccessTokenVerifier:
    """MCP SDK の TokenVerifier プロトコル実装。

    検証項目（すべて満たさなければ None を返す = SDK が 401 にする）:
      1. トークンが存在する
      2. 有効期限内である
      3. audience（RFC 8707 の resource）が自身であること
      4. Django ユーザーに紐づいていること
    """

    def __init__(self, resource_url):
        """resource_url: このリソースサーバの識別子（settings.MCP_RESOURCE_URL）。"""
        self.resource_url = resource_url

    async def verify_token(self, token):
        """MCP SDK から呼ばれる入口。ORM は同期 API なのでスレッドに逃がす。"""
        return await sync_to_async(self._verify_token_sync)(token)

    def _verify_token_sync(self, token):
        access_token = _load_access_token(token)

        if access_token is None:
            logger.info('MCP: 未知のアクセストークンを拒否した')
            return None

        # is_valid(None) は「期限内であること」の検査。スコープ検査は
        # エンドポイント側（SDK）とツール側で行うためここでは渡さない
        if not access_token.is_valid():
            logger.info('MCP: 期限切れのアクセストークンを拒否した')
            return None

        # RFC 8707: 他リソース向けに発行されたトークンの流用を防ぐ。
        # DOT の既定 validator は URL 前方一致で判定する。
        # なお resource が空のトークンは「制限なし」として通る仕様である
        # （DishBoard で OAuth 保護しているリソースは MCP サーバだけなので受容する）
        if not access_token.allows_audience(self.resource_url):
            logger.info('MCP: audience が一致しないアクセストークンを拒否した')
            return None

        if access_token.user_id is None:
            # client_credentials など、ユーザーの居ないトークン。
            # MCP のツールは必ず「誰の記録か」を必要とするため受け付けない
            logger.info('MCP: ユーザーに紐づかないアクセストークンを拒否した')
            return None

        application = access_token.application
        return MCPAccessToken(
            token=token,
            client_id=application.client_id if application else '',
            scopes=access_token.scope.split() if access_token.scope else [],
            expires_at=int(access_token.expires.timestamp()) if access_token.expires else None,
            resource=self.resource_url,
            # 後段でユーザーを引き直すための識別子。MCP 仕様上 subject は
            # 発行者ごとに一意であればよく、Django のユーザーIDで足りる
            subject=str(access_token.user_id),
        )

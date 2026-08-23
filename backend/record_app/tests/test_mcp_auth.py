"""MCP の認証・認可テスト。

方針（設計書 §7）: MCP のトランスポート層を経由せず、検証器とツールを直接呼ぶ。
SDK のバージョンアップでテストが壊れないようにするため。

「検証器が None を返す」ことは、SDK の RequireAuthMiddleware が 401 と
WWW-Authenticate（resource_metadata 付き）を返すことを意味する。
その変換は SDK の責務であり、ここでは検証しない。
"""
import pytest

from mcp_server.constants import SCOPE_MEALS_READ, SCOPE_MEALS_WRITE, SCOPE_WEIGHT_READ
from mcp_server.context import resolve_user
from mcp_server.errors import InsufficientScopeError

from .conftest import MCP_RESOURCE_URL


pytestmark = pytest.mark.django_db


# =============================================================================
# A1〜A3: トークン検証
# =============================================================================

class TestTokenVerification:
    """アクセストークンの検証。不正なトークンは None を返す。"""

    def test_a1_未知のトークンは拒否される(self, token_verifier, run_async):
        """A1: 存在しないトークンでは認証されない。"""
        assert run_async(token_verifier.verify_token, '存在しないトークン') is None

    def test_a2_期限切れのトークンは拒否される(self, user, make_access_token, token_verifier, run_async):
        """A2: 有効期限を過ぎたトークンは通さない。"""
        expired = make_access_token(user, expires_in_seconds=-1)

        assert run_async(token_verifier.verify_token, expired) is None

    def test_a3_別リソース向けのトークンは拒否される(self, user, make_access_token, token_verifier, run_async):
        """A3: audience が別リソースのトークンを流用できない（RFC 8707）。"""
        other_resource = make_access_token(user, resource=('https://other.example/api',))

        assert run_async(token_verifier.verify_token, other_resource) is None

    def test_有効なトークンはユーザーとスコープを返す(self, user, mcp_token, token_verifier, run_async):
        """正常系: subject にユーザーID、scopes に付与スコープが入る。"""
        verified = run_async(token_verifier.verify_token, mcp_token)

        assert verified is not None
        assert verified.subject == str(user.id)
        assert set(verified.scopes) == {SCOPE_MEALS_READ, SCOPE_MEALS_WRITE, SCOPE_WEIGHT_READ}
        assert verified.resource == MCP_RESOURCE_URL

    def test_ユーザーに紐づかないトークンは拒否される(self, oauth_application, token_verifier, run_async):
        """ツールは必ず「誰の記録か」を必要とするため、ユーザー無しは通さない。"""
        from datetime import timedelta

        from django.utils import timezone
        from oauth2_provider.models import get_access_token_model

        get_access_token_model().objects.create(
            user=None,
            application=oauth_application,
            token='user-less-token',
            scope=SCOPE_MEALS_READ,
            expires=timezone.now() + timedelta(seconds=3600),
            resource=[MCP_RESOURCE_URL],
        )

        assert run_async(token_verifier.verify_token, 'user-less-token') is None


# =============================================================================
# A4: スコープ不足
# =============================================================================

class TestScopeEnforcement:
    """ツール単位のスコープ検査。"""

    def test_a4_読み取り専用トークンでは書き込みが拒否される(self, user, mcp_auth_context, run_async):
        """A4: meals:read だけのトークンで meals:write を要求すると弾かれる。"""
        with mcp_auth_context(user, scopes=[SCOPE_MEALS_READ]):
            with pytest.raises(InsufficientScopeError):
                run_async(resolve_user, SCOPE_MEALS_WRITE)

    def test_必要スコープがあればユーザーを解決できる(self, user, mcp_auth_context, run_async):
        with mcp_auth_context(user, scopes=[SCOPE_MEALS_READ, SCOPE_MEALS_WRITE]):
            resolved = run_async(resolve_user, SCOPE_MEALS_WRITE)

        assert resolved.id == user.id

    def test_体重の閲覧には専用スコープが要る(self, user, mcp_auth_context, run_async):
        with mcp_auth_context(user, scopes=[SCOPE_MEALS_READ]):
            with pytest.raises(InsufficientScopeError):
                run_async(resolve_user, SCOPE_WEIGHT_READ)

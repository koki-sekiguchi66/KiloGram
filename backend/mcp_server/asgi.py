"""uvicorn のエントリポイント。

    uvicorn mcp_server.asgi:application --host 0.0.0.0 --port 8001

Django のセットアップはこのモジュールの import 時に行う。
ほかのモジュールは import 時に django.setup() を呼ばないこと
（テストは pytest-django が用意した Django をそのまま使うため）。
"""
from .django_setup import setup_django

setup_django()

# django.setup() のあとでなければ settings を読めない
from django.conf import settings  # noqa: E402

from .server import build_server  # noqa: E402

_server = build_server(
    resource_url=settings.MCP_RESOURCE_URL,
    issuer_url=settings.OAUTH2_ISSUER_URL,
)

# uvicorn に渡す ASGI アプリケーション。
# streamable_http_path の既定は /mcp なので、nginx から /mcp をそのまま渡せばよい
application = _server.streamable_http_app()

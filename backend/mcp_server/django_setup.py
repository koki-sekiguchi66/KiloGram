"""MCP サーバプロセスから Django を使えるようにする。

**この関数を import 時に呼ばないこと。**
呼び出すのは uvicorn のエントリポイント（asgi.py）だけに限る。
テストは pytest-django が設定済みの Django を用意するため、
ツール関数を直接 import できる必要がある。
"""
import os

import django

# MCP プロセス専用の設定。ログをファイルに書かない点だけが production と異なる
DEFAULT_SETTINGS_MODULE = 'dishboard_project.settings.mcp'


def setup_django():
    """django.setup() を実行する。ASGI アプリの構築前に1回だけ呼ぶ。"""
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', DEFAULT_SETTINGS_MODULE)
    django.setup()

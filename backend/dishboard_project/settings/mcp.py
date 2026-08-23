"""MCP サーバプロセス専用の設定。

backend（Gunicorn）と同じ設定を使いつつ、ログの出力先だけを差し替える。

なぜログだけ分けるか:
    base.py の LOGGING は RotatingFileHandler で logs/django.log に書く。
    backend と mcp は同じイメージ・同じボリュームで動くため、
    2つのプロセスが同一ファイルを同時にローテートすることになり、
    ローテーションのタイミングでログが欠落・破損しうる。
    MCP 側は標準出力のみにして、Docker のログドライバに集約させる。
"""
import os

env = os.environ.get('DJANGO_ENV', 'development')
if env == 'production':
    from .production import *  # noqa: F401,F403
else:
    from .development import *  # noqa: F401,F403

LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '{levelname} {asctime} {module} {message}',
            'style': '{',
        },
    },
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
            'formatter': 'verbose',
        },
    },
    'root': {
        'handlers': ['console'],
        'level': 'INFO',
    },
    'loggers': {
        'django': {
            'handlers': ['console'],
            'level': 'INFO',
            'propagate': False,
        },
        'record_app': {
            'handlers': ['console'],
            'level': 'INFO',
            'propagate': False,
        },
        'mcp_server': {
            'handlers': ['console'],
            'level': 'INFO',
            'propagate': False,
        },
    },
}

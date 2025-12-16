from .base import *
import socket

# 開発環境用設定
DEBUG = True

ALLOWED_HOSTS = ['*']

# データベース設定 (ローカル開発用: フォールバック)
# 環境変数でDB指定があればそれを使用、なければSQLite
POSTGRES_DB = os.environ.get('POSTGRES_DB')
POSTGRES_USER = os.environ.get('POSTGRES_USER')
POSTGRES_PASSWORD = os.environ.get('POSTGRES_PASSWORD')
DB_HOST = os.environ.get('DB_HOST', 'db')
DB_PORT = os.environ.get('DB_PORT', '5432')

if POSTGRES_DB:
    # Docker等のPostgres接続を試みるロジック
    try:
        socket.gethostbyname(DB_HOST)
        host = DB_HOST
    except OSError:
        host = 'localhost'

    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.postgresql',
            'NAME': POSTGRES_DB,
            'USER': POSTGRES_USER or '',
            'PASSWORD': POSTGRES_PASSWORD or '',
            'HOST': host,
            'PORT': DB_PORT,
        }
    }
else:
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': BASE_DIR / 'db.sqlite3',
        }
    }

# CORS設定 (開発時は緩める)
CORS_ALLOW_ALL_ORIGINS = True

# コンソールへのログ出力
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
        },
    },
    'root': {
        'handlers': ['console'],
        'level': 'INFO',
    },
}

# Celery Beat Schedule (開発時はコメントアウトまたは必要に応じて有効化)
from celery.schedules import crontab
CELERY_BEAT_SCHEDULE = {
    'update-cafeteria-menus-weekly': {
        'task': 'record_app.tasks.update_cafeteria_menus_task',
        'schedule': crontab(hour=8, minute=0, day_of_week='monday'),
    },
}
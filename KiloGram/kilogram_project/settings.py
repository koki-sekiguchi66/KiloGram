import os
import socket
from pathlib import Path
import dotenv
import dj_database_url
from celery.schedules import crontab


dotenv.load_dotenv(os.path.join(Path(__file__).resolve().parent.parent.parent, 'KiloGram', '.env'))

BASE_DIR = Path(__file__).resolve().parent.parent


SECRET_KEY = os.getenv('SECRET_KEY')

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = os.getenv('DEBUG', 'False') == 'True'

ALLOWED_HOSTS_str = os.getenv('ALLOWED_HOSTS', '')
ALLOWED_HOSTS = ALLOWED_HOSTS_str.split(',') if ALLOWED_HOSTS_str else []

# Celery
CELERY_BROKER_URL = os.getenv('CELERY_BROKER_URL', 'redis://localhost:6379/0')
CELERY_RESULT_BACKEND = os.getenv('CELERY_RESULT_BACKEND', 'redis://localhost:6379/0')
CELERY_ACCEPT_CONTENT = ['json']
CELERY_TASK_SERIALIZER = 'json'
CELERY_RESULT_SERIALIZER = 'json'
CELERY_TIMEZONE = 'Asia/Tokyo'


CELERY_BEAT_SCHEDULE = {
    'update-cafeteria-menus-weekly': {
        'task': 'record_app.tasks.update_cafeteria_menus_task',
        'schedule': crontab(hour=8, minute=0, day_of_week='monday'),
    },
}


INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'django.contrib.postgres',
    'record_app', #情報記録用
    'rest_framework', #API用
    'rest_framework.authtoken', #ユーザー登録用
    'django_filters', #APIフィルタリング用
    'corsheaders', #CORS設定用
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'kilogram_project.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'kilogram_project.wsgi.application'


# DATABASES 設定（既存の DATABASES をこれに置き換えてください）
POSTGRES_DB = os.environ.get('POSTGRES_DB')
POSTGRES_USER = os.environ.get('POSTGRES_USER')
POSTGRES_PASSWORD = os.environ.get('POSTGRES_PASSWORD')
DB_HOST = os.environ.get('DB_HOST', 'db')
DB_PORT = os.environ.get('DB_PORT', '5432')

def resolve_db_host(preferred_host):
    """
    Docker 開発時は preferred_host='db' を使う想定。
    起動環境で 'db' が解決できなければローカル用ホストにフォールバックする。
    環境変数 DB_HOST_LOCAL があればそれを優先。
    """
    # 明示的なローカル上書きがあればそれを使う
    local_override = os.environ.get('DB_HOST_LOCAL')
    if local_override:
        return local_override

    try:
        # ホスト名が解決できるか確認
        socket.gethostbyname(preferred_host)
        return preferred_host
    except OSError:
        # 解決できなければローカルの Postgres を使う（デフォルト localhost）
        return 'localhost'

# Postgres 情報があれば Postgres を使う（.env にPOSTGRES_*がある場合）
if POSTGRES_DB:
    db_host = resolve_db_host(DB_HOST)
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.postgresql',
            'NAME': POSTGRES_DB,
            'USER': POSTGRES_USER or '',
            'PASSWORD': POSTGRES_PASSWORD or '',
            'HOST': db_host,
            'PORT': DB_PORT,
        }
    }
else:
    # フォールバック：開発時にPostgresが未設定なら SQLite を使う
    BASE_DIR = Path(__file__).resolve().parent.parent
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': BASE_DIR / 'db.sqlite3',
        }
    }


AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
        'OPTIONS': {
            'min_length': 8,
        }
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]


LANGUAGE_CODE = 'ja'

TIME_ZONE = 'Asia/Tokyo'

USE_I18N = True

USE_TZ = True
STATIC_URL = 'static/'


REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework.authentication.TokenAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ]
}

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# CORS設定
CORS_ALLOWED_ORIGINS_str = os.getenv('CORS_ALLOWED_ORIGINS', '')
CORS_ALLOWED_ORIGINS = CORS_ALLOWED_ORIGINS_str.split(',') if CORS_ALLOWED_ORIGINS_str else []

CORS_ALLOW_HEADERS = [
    'Authorization',
    'Content-Type',
]

# CSRF設定
CSRF_TRUSTED_ORIGINS_str = os.getenv('CSRF_TRUSTED_ORIGINS', '')
CSRF_TRUSTED_ORIGINS = CSRF_TRUSTED_ORIGINS_str.split(',') if CSRF_TRUSTED_ORIGINS_str else []

# REST FrameworkでCSRFチェックを無効化
REST_FRAMEWORK['DEFAULT_AUTHENTICATION_CLASSES'] = [
    'rest_framework.authentication.TokenAuthentication',
    'rest_framework.authentication.SessionAuthentication',
]

STATIC_URL = '/static/'
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'

MEDIA_URL = '/media/'
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')

if not DEBUG:
    SECURE_SSL_REDIRECT = False  
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
    SECURE_BROWSER_XSS_FILTER = True
    SECURE_CONTENT_TYPE_NOSNIFF = True
    X_FRAME_OPTIONS = 'DENY'
    SECURE_HSTS_SECONDS = 31536000
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True
    SECURE_HSTS_PRELOAD = True

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

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
        'file': {
            'class': 'logging.handlers.RotatingFileHandler',
            'filename': os.path.join(BASE_DIR, 'logs', 'django.log'),
            'maxBytes': 1024 * 1024 * 10,  # 10MB
            'backupCount': 5,
            'formatter': 'verbose',
        },
    },
    'root': {
        'handlers': ['console', 'file'],
        'level': 'INFO',
    },
    'loggers': {
        'django': {
            'handlers': ['console', 'file'],
            'level': 'INFO',
            'propagate': False,
        },
    },
}

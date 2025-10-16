import os
from pathlib import Path
import dotenv
import dj_database_url
from celery.schedules import crontab

dotenv.load_dotenv()

BASE_DIR = Path(__file__).resolve().parent.parent

#.envに規定
SECRET_KEY = os.getenv('SECRET_KEY')


# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = os.getenv('DEBUG', 'False') == 'True'


ALLOWED_HOSTS_str = os.getenv('ALLOWED_HOST', '')
ALLOWED_HOSTS = ALLOWED_HOSTS_str.split(',') if ALLOWED_HOSTS_str else []



CELERY_BROKER_URL = 'redis://localhost:6379/0'
CELERY_RESULT_BACKEND = 'redis://localhost:6379/0'
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


DATABASE_URL = os.getenv('DATABASE_URL')


DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': os.getenv('DB_NAME'),
        'USER': os.getenv('DB_USER'),
        'PASSWORD': os.getenv('DB_PASSWORD'),
        'HOST': os.getenv('DB_HOST'),
        'PORT': os.getenv('DB_PORT'),
        'CONN_MAX_AGE': 600,  
        'OPTIONS': {
            'connect_timeout': 10,
            'options': '-c statement_timeout=30000'  
        }
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

# 開発環境用のCORS設定（本番環境では削除すること）
if DEBUG:
    CORS_ALLOWED_ORIGINS += [
        'http://localhost:5173',
        'http://127.0.0.1:5173',
    ]

# CSRF設定
CSRF_TRUSTED_ORIGINS_str = os.getenv('CSRF_TRUSTED_ORIGINS', '')
CSRF_TRUSTED_ORIGINS = CSRF_TRUSTED_ORIGINS_str.split(',') if CSRF_TRUSTED_ORIGINS_str else []

# 開発環境用のCSRF設定
if DEBUG:
    CSRF_TRUSTED_ORIGINS += [
        'http://localhost:5173',
        'http://127.0.0.1:5173',
    ]

# REST FrameworkでCSRFチェックを無効化
# Authorizationヘッダーを使用するAPIリクエストではCSRFトークンが不要
REST_FRAMEWORK['DEFAULT_AUTHENTICATION_CLASSES'] = [
    'rest_framework.authentication.TokenAuthentication',
    'rest_framework.authentication.SessionAuthentication',
]
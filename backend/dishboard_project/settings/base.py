import os
from pathlib import Path
from urllib.parse import urlsplit
import dotenv

dotenv.load_dotenv(os.path.join(Path(__file__).resolve().parent.parent.parent, '.env'))

BASE_DIR = Path(__file__).resolve().parent.parent.parent
LOG_DIR = BASE_DIR / 'logs'
# 新規環境でもロギング初期化がテストや管理コマンドより先に失敗しないようにする。
LOG_DIR.mkdir(exist_ok=True)

SECRET_KEY = os.getenv('SECRET_KEY')

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'django.contrib.postgres',
    'record_app',
    'rest_framework',
    'rest_framework.authtoken',
    'django_filters',
    'corsheaders',
    'oauth2_provider',
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

ROOT_URLCONF = 'dishboard_project.urls'

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

WSGI_APPLICATION = 'dishboard_project.wsgi.application'

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

# Static files
STATIC_URL = '/static/'
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'

# Media files
MEDIA_URL = '/media/'
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')

# REST Framework
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework.authentication.TokenAuthentication',
        'rest_framework.authentication.SessionAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ]
}

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# Logging
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
            'filename': LOG_DIR / 'django.log',
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
        'record_app': {
            'handlers': ['console', 'file'],
            'level': 'DEBUG',
            'propagate': False,
        },
    },
}

# Azure AI Vision (OCR)
AZURE_VISION_ENDPOINT = os.getenv('AZURE_VISION_ENDPOINT', '')
AZURE_VISION_KEY = os.getenv('AZURE_VISION_KEY', '')

# Google Identity Services。未設定時はGoogleログインを無効化する。
GOOGLE_CLIENT_ID = os.getenv('GOOGLE_CLIENT_ID', '')

# MCP サーバのリソース識別子（RFC 8707 の audience）。
# Claude に登録する URL と完全一致していなければならない（パス込み）。
MCP_RESOURCE_URL = os.getenv('MCP_RESOURCE_URL', 'http://localhost:8001/mcp')

# 認可サーバの発行者識別子（issuer）。
# 明示しないと DOT は「どの URL でメタデータを引かれたか」から issuer を導出するため、
# ルート直下（https://host）とマウント先（https://host/o）で値が食い違う。
# RFC 9207 の iss 検証は両者の完全一致を要求するので、ここで1つに固定する。
#
# 既定値は MCP リソース URL と同じオリジンだが、環境変数で独立に上書きできる。
# 本番では PWA を配信しているオリジンと**別のサブドメイン**を指定する（ADR #26）。
# 同一オリジンで OAuth のログイン画面（/accounts/ /o/authorize/）を提供すると、
# Android が「インストール済み PWA へのリンク横取り」を発動し、スマホの Claude
# アプリからログイン画面に到達できなくなるため
OAUTH2_ISSUER_URL = os.getenv(
    'OAUTH2_ISSUER_URL',
    urlsplit(MCP_RESOURCE_URL)._replace(path='', query='', fragment='').geturl(),
)

# OAuth 2.1 認可サーバ（django-oauth-toolkit）
# Claude からの MCP 接続のためだけに使う。既存の /api/ は DRF の
# TokenAuthentication のままで、この設定の影響を受けない。
OAUTH2_PROVIDER = {
    # スコープは用途ごとに分ける。同意画面でユーザーが範囲を確認できることが目的
    'SCOPES': {
        'meals:read': '食事記録の閲覧・栄養分析・食品検索',
        'meals:write': '食事記録の新規作成・編集',
        'weight:read': '体重記録の閲覧',
    },
    # 何も要求されなかった場合は読み取りだけ許す（最小権限）
    'DEFAULT_SCOPES': ['meals:read'],

    # Claude は毎回 S256 の PKCE を送る。既定値だが、要件なので明示する
    'PKCE_REQUIRED': True,

    # Claude が接続のたびにクライアントを自動登録する（RFC 7591）。
    # 研究室内の利用者に client_id を配布して回る手間をなくすための選択。
    # 登録が増え続けるため、Application テーブルは定期的に確認すること
    'DCR_ENABLED': True,

    # DOT は既定で DCR にも Django セッションログインを要求する
    # （IsAuthenticatedDCRPermission）。Claude は未ログインの匿名リクエストとして
    # クライアント登録を行うため、既定のままだと登録自体が401で拒否され、
    # ログイン画面にすら到達できない。DCR_ENABLED の意図（匿名の動的登録）を
    # 実現するには、この匿名許可を明示する必要がある
    'DCR_REGISTRATION_PERMISSION_CLASSES': ('oauth2_provider.dcr.AllowAllDCRPermission',),

    # PRM（RFC 9728）が広告する resource。空だとリクエスト URL から導出されるが、
    # nginx 越しでは MCP サーバ自身の URL にならないため明示する
    'OAUTH2_PROTECTED_RESOURCE_IDENTIFIER': MCP_RESOURCE_URL,

    # PRM が指す認可サーバと、AS メタデータ／iss パラメータの issuer を一致させる。
    # Claude は authorization_servers の**先頭要素しか見ない**（フォールバックしない）
    'OAUTH2_PROTECTED_RESOURCE_AUTHORIZATION_SERVERS': [OAUTH2_ISSUER_URL],
    'OIDC_ISS_ENDPOINT': OAUTH2_ISSUER_URL,

    # 公開クライアント（DCR で登録される Claude）向けにリフレッシュトークンを
    # 使い回させない。MCP 認可仕様が OAuth 2.1 から引き継いでいる要件
    'ROTATE_REFRESH_TOKEN': True,
    'REFRESH_TOKEN_REUSE_PROTECTION': True,
}

# OAuth の認可画面は「Django にログイン済みであること」を要求する。
# 既存の SPA はトークン認証でセッションを作らないため、認可フロー専用に
# Django 標準のログイン画面を用意する（django.contrib.auth.urls）。
LOGIN_URL = '/accounts/login/'
LOGIN_REDIRECT_URL = '/accounts/login/'

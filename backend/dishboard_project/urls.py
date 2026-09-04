from django.contrib import admin
from django.urls import path, include

from oauth2_provider.urls import metadata_urlpatterns
from record_app.auth_views import DishBoardLoginView, GoogleSessionLoginView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('record_app.urls')),

    # RFC 8414 / RFC 9728 のディスカバリ文書は、仕様上**オリジンのルート直下**に
    # なければならない（/o/ 配下に置くと Claude が見つけられない）。
    # そのため oauth2_provider の URL を2か所に分けてマウントしている。
    path('', include((metadata_urlpatterns, 'oauth2_provider'), namespace='oauth2_provider_metadata')),

    # 認可・トークン・DCR エンドポイント
    path('o/', include('oauth2_provider.urls', namespace='oauth2_provider')),

    # OAuth の同意画面はログイン済みセッションを要求する。SPA はトークン認証で
    # セッションを作らないため、認可フロー専用のログイン画面をここで用意する
    path('accounts/login/', DishBoardLoginView.as_view(), name='login'),
    path('accounts/google/', GoogleSessionLoginView.as_view(), name='google-session-login'),
    path('accounts/', include('django.contrib.auth.urls')),
]

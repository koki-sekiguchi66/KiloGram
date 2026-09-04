"""ブラウザのOAuth認可フローで使うGoogleセッションログイン。"""
from django.conf import settings
from django.contrib.auth import login
from django.contrib.auth.views import LoginView
from django.core.exceptions import ImproperlyConfigured
from django.shortcuts import redirect
from django.urls import reverse
from django.utils.http import url_has_allowed_host_and_scheme
from django.views import View
from urllib.parse import urlencode

from .google_auth import GoogleLinkRequired, InvalidGoogleToken, resolve_google_user, verify_google_id_token


class DishBoardLoginView(LoginView):
    """従来フォームにGoogle client IDも渡す認可用ログイン画面。"""
    template_name = 'registration/login.html'

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['google_client_id'] = settings.GOOGLE_CLIENT_ID
        return context


class GoogleSessionLoginView(View):
    """検証済みGoogle IDからDjangoセッションを作り、OAuth認可へ戻す。"""
    def post(self, request):
        next_url = request.POST.get('next', '')
        if not url_has_allowed_host_and_scheme(next_url, {request.get_host()}, request.is_secure()):
            next_url = reverse('oauth2_provider:authorize')
        try:
            identity = verify_google_id_token(request.POST.get('credential', ''))
            user = resolve_google_user(identity)
        except GoogleLinkRequired:
            return redirect(f"{reverse('login')}?{urlencode({'google_error': 'link_required', 'next': next_url})}")
        except (InvalidGoogleToken, ImproperlyConfigured):
            return redirect(f"{reverse('login')}?{urlencode({'google_error': 'invalid', 'next': next_url})}")
        login(request, user, backend='django.contrib.auth.backends.ModelBackend')
        return redirect(next_url)

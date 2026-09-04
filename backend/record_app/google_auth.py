"""Google Identity Services の ID トークン検証とユーザー解決。

既存ユーザーのメールアドレスだけを根拠に自動連携しない。明示的な連携操作を
認証済みセッションから行うことで、同名メールによるアカウント奪取を防ぐ。
"""
from dataclasses import dataclass

import requests
from django.conf import settings
from django.core.exceptions import ImproperlyConfigured
from django.contrib.auth.models import User
from django.db import transaction


GOOGLE_TOKEN_INFO_URL = 'https://oauth2.googleapis.com/tokeninfo'
GOOGLE_ISSUERS = {'accounts.google.com', 'https://accounts.google.com'}
TOKEN_INFO_TIMEOUT_SECONDS = 5


class InvalidGoogleToken(ValueError):
    """Google ID トークンを信頼できない場合の例外。"""


class GoogleLinkRequired(ValueError):
    """同じメールの既存ユーザーによる明示的な連携が必要。"""


@dataclass(frozen=True)
class GoogleIdentity:
    subject: str
    email: str
    name: str


def verify_google_id_token(credential: str) -> GoogleIdentity:
    """Google の tokeninfo で署名・期限を検証し、必要なclaimを返す。"""
    client_id = settings.GOOGLE_CLIENT_ID
    if not client_id:
        raise ImproperlyConfigured('GOOGLE_CLIENT_ID が設定されていません')
    if not credential:
        raise InvalidGoogleToken('credential がありません')

    try:
        response = requests.get(
            GOOGLE_TOKEN_INFO_URL,
            params={'id_token': credential},
            timeout=TOKEN_INFO_TIMEOUT_SECONDS,
        )
        response.raise_for_status()
        payload = response.json()
    except (requests.RequestException, ValueError) as exc:
        raise InvalidGoogleToken('Google ID トークンを検証できません') from exc

    if payload.get('aud') != client_id or payload.get('iss') not in GOOGLE_ISSUERS:
        raise InvalidGoogleToken('Google ID トークンの発行先が一致しません')
    if str(payload.get('email_verified', '')).lower() != 'true':
        raise InvalidGoogleToken('確認済みメールアドレスが必要です')
    subject = payload.get('sub')
    email = payload.get('email')
    if not subject or not email:
        raise InvalidGoogleToken('Googleアカウント情報が不足しています')
    return GoogleIdentity(subject=subject, email=email, name=payload.get('name', ''))


def resolve_google_user(identity: GoogleIdentity):
    """連携先ユーザーを返し、初回Googleユーザーだけ安全に新規作成する。"""
    from .models import GoogleAccount

    account = GoogleAccount.objects.select_related('user').filter(subject=identity.subject).first()
    if account:
        if not account.user.is_active:
            raise InvalidGoogleToken('無効なユーザーです')
        return account.user
    if User.objects.filter(email__iexact=identity.email).exists():
        raise GoogleLinkRequired
    with transaction.atomic():
        base = identity.email.split('@', 1)[0][:140] or 'google-user'
        username = base
        suffix = 1
        while User.objects.filter(username=username).exists():
            suffix += 1
            username = f'{base[:140-len(str(suffix))]}-{suffix}'
        user = User.objects.create_user(username=username, email=identity.email)
        user.set_unusable_password()
        user.save(update_fields=['password'])
        GoogleAccount.objects.create(user=user, subject=identity.subject, email=identity.email)
        return user

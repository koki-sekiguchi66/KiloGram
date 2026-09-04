"""Googleログインと既存ユーザー連携のAPIテスト。"""
from unittest.mock import patch

from django.contrib.auth.models import User
from rest_framework.authtoken.models import Token
from rest_framework.test import APITestCase
from django.test import override_settings

from record_app.google_auth import GoogleIdentity, InvalidGoogleToken, verify_google_id_token
from record_app.models import GoogleAccount


IDENTITY = GoogleIdentity(subject='google-sub-1', email='google@example.com', name='Google User')


@override_settings(GOOGLE_CLIENT_ID='client.apps.googleusercontent.com')
class GoogleTokenVerificationTests(APITestCase):
    @patch('record_app.google_auth.requests.get')
    def test_audienceと確認済みメールを検証する(self, get):
        get.return_value.json.return_value = {
            'aud': 'client.apps.googleusercontent.com',
            'iss': 'https://accounts.google.com',
            'email_verified': 'true',
            'sub': 'subject',
            'email': 'user@example.com',
            'name': 'User',
        }
        identity = verify_google_id_token('credential')
        self.assertEqual(identity.subject, 'subject')
        get.return_value.raise_for_status.assert_called_once()

    @patch('record_app.google_auth.requests.get')
    def test_別client向けのtokenを拒否する(self, get):
        get.return_value.json.return_value = {
            'aud': 'attacker.apps.googleusercontent.com',
            'iss': 'https://accounts.google.com',
            'email_verified': 'true',
            'sub': 'subject',
            'email': 'user@example.com',
        }
        with self.assertRaises(InvalidGoogleToken):
            verify_google_id_token('credential')

    @patch('record_app.google_auth.requests.get')
    def test_未確認メールを拒否する(self, get):
        get.return_value.json.return_value = {
            'aud': 'client.apps.googleusercontent.com',
            'iss': 'https://accounts.google.com',
            'email_verified': 'false',
            'sub': 'subject',
            'email': 'user@example.com',
        }
        with self.assertRaises(InvalidGoogleToken):
            verify_google_id_token('credential')


class GoogleAuthenticationTests(APITestCase):
    @patch('record_app.views.verify_google_id_token', return_value=IDENTITY)
    def test_未登録Googleユーザーを作成してログインする(self, verifier):
        response = self.client.post('/api/auth/google/', {'credential': 'valid'})
        self.assertEqual(response.status_code, 200)
        account = GoogleAccount.objects.select_related('user').get(subject=IDENTITY.subject)
        self.assertEqual(account.user.email, IDENTITY.email)
        self.assertFalse(account.user.has_usable_password())
        self.assertEqual(Token.objects.get(user=account.user).key, response.data['token'])
        verifier.assert_called_once_with('valid')

    @patch('record_app.views.verify_google_id_token', return_value=IDENTITY)
    def test_同じGoogleアカウントでは同じユーザーにログインする(self, verifier):
        user = User.objects.create_user('linked', email=IDENTITY.email)
        GoogleAccount.objects.create(user=user, subject=IDENTITY.subject, email=IDENTITY.email)
        response = self.client.post('/api/auth/google/', {'credential': 'valid'})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['user_id'], user.id)

    @patch('record_app.views.verify_google_id_token', return_value=IDENTITY)
    def test_既存メールへ暗黙に連携しない(self, verifier):
        User.objects.create_user('existing', email=IDENTITY.email, password='password123')
        response = self.client.post('/api/auth/google/', {'credential': 'valid'})
        self.assertEqual(response.status_code, 409)
        self.assertTrue(response.data['link_required'])
        self.assertFalse(GoogleAccount.objects.exists())

    @patch('record_app.views.verify_google_id_token', return_value=IDENTITY)
    def test_ログイン済み既存ユーザーへ明示的に連携できる(self, verifier):
        user = User.objects.create_user('existing', email='old@example.com', password='password123')
        token = Token.objects.create(user=user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {token.key}')
        response = self.client.post('/api/auth/google/link/', {'credential': 'valid'})
        self.assertEqual(response.status_code, 200)
        self.assertTrue(GoogleAccount.objects.filter(user=user, subject=IDENTITY.subject).exists())

    @patch('record_app.views.verify_google_id_token', return_value=IDENTITY)
    def test_別ユーザーに連携済みのGoogleアカウントは奪えない(self, verifier):
        owner = User.objects.create_user('owner')
        GoogleAccount.objects.create(user=owner, subject=IDENTITY.subject, email=IDENTITY.email)
        attacker = User.objects.create_user('attacker')
        token = Token.objects.create(user=attacker)
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {token.key}')
        response = self.client.post('/api/auth/google/link/', {'credential': 'valid'})
        self.assertEqual(response.status_code, 409)

    def test_未認証では連携できない(self):
        response = self.client.post('/api/auth/google/link/', {'credential': 'valid'})
        self.assertEqual(response.status_code, 401)

    @patch('record_app.views.verify_google_id_token', return_value=IDENTITY)
    def test_連携解除後もパスワードユーザーは維持される(self, verifier):
        user = User.objects.create_user('existing', password='password123')
        GoogleAccount.objects.create(user=user, subject=IDENTITY.subject, email=IDENTITY.email)
        token = Token.objects.create(user=user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {token.key}')
        response = self.client.delete('/api/auth/google/link/')
        self.assertEqual(response.status_code, 204)
        self.assertFalse(GoogleAccount.objects.filter(user=user).exists())
        self.assertTrue(User.objects.filter(pk=user.pk).exists())

    def test_Googleのみのユーザーは連携解除できない(self):
        user = User.objects.create_user('google-only', email=IDENTITY.email)
        user.set_unusable_password()
        user.save(update_fields=['password'])
        GoogleAccount.objects.create(user=user, subject=IDENTITY.subject, email=IDENTITY.email)
        token = Token.objects.create(user=user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {token.key}')
        response = self.client.delete('/api/auth/google/link/')
        self.assertEqual(response.status_code, 400)
        self.assertTrue(GoogleAccount.objects.filter(user=user).exists())

    @override_settings(GOOGLE_CLIENT_ID='client.apps.googleusercontent.com')
    def test_OAuth認可ログイン画面にもGoogleボタンを表示する(self):
        response = self.client.get('/accounts/login/?next=/o/authorize/')
        self.assertContains(response, 'google-signin')
        self.assertContains(response, 'client.apps.googleusercontent.com')

    @patch('record_app.auth_views.verify_google_id_token', return_value=IDENTITY)
    def test_Google認証からDjangoセッションを作成する(self, verifier):
        user = User.objects.create_user('session-user')
        GoogleAccount.objects.create(user=user, subject=IDENTITY.subject, email=IDENTITY.email)
        response = self.client.post('/accounts/google/', {'credential': 'valid', 'next': '/o/authorize/'})
        self.assertEqual(response.status_code, 302)
        self.assertEqual(response.url, '/o/authorize/')
        self.assertEqual(int(self.client.session['_auth_user_id']), user.id)

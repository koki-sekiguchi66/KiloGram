# Googleログイン・アカウント連携仕様

## 目的

Google Identity Services（GIS）のIDトークンを使い、新規ユーザーはGoogleだけで
DishBoardを開始できるようにする。既存ユーザーは従来のユーザー名・パスワードで
ログインした後、設定画面からGoogleアカウントを明示的に連携できる。

## 設定

Google Cloud Consoleで「ウェブ アプリケーション」のOAuthクライアントを作り、
PWAのオリジンを「承認済みのJavaScript生成元」に登録する。backendには
`GOOGLE_CLIENT_ID`、Viteのビルドには同じ値を`VITE_GOOGLE_CLIENT_ID`として渡す。
値が未設定ならGoogleボタンは表示せず、従来ログインだけを維持する。

## API

### `POST /api/auth/google/`

GISが返す`credential`を受け取る。Googleのtokeninfoで署名・有効期限を検証した
claimについて、audience、issuer、メール確認済み、subject、emailを追加検査する。

- subjectが連携済み: 対応する既存ユーザーのDRFトークンを返す。
- 未連携で同じメールの既存ユーザーがいない: パスワード利用不可のユーザーと
  `GoogleAccount`を作成してDRFトークンを返す。
- 未連携で同じメールの既存ユーザーがいる: **自動連携しない**。409と
  `link_required`を返し、従来ログイン後の明示的な連携を求める。

メール一致だけで既存アカウントへ自動連携しないのは、既存メールの入力ミスや
将来の認証プロバイダー変更をアカウント奪取へつなげないためである。

### `POST /api/auth/google/link/`

DRF Token認証必須。検証済みGoogle subjectをログイン中ユーザーへ連携する。
同じsubjectが別ユーザーに連携済み、または当該ユーザーが別subjectに連携済みなら
409として上書きしない。

### `DELETE /api/auth/google/link/`

連携を解除する。Googleだけで作成されパスワードが利用不能なユーザーは、ログイン
手段を失うため解除できない。

## データモデル

`GoogleAccount`はDjango `User`と一対一で、Googleの不変識別子`subject`をuniqueで
保持する。メールアドレスは表示・監査用であり、ログイン時の識別子には使わない。
プロフィールAPIは連携状態に加え、パスワードを持つユーザーだけが解除可能であることを
`can_unlink_google`で返す。Googleだけで登録したユーザーには解除ボタンを表示しない。

## 既存認証との互換性

`/api/login/`、`/api/register/`、`/api/logout/`と既存DRFトークンは変更しない。
Googleログイン成功後も同じDRF Tokenを返すため、ログイン後の画面・APIクライアント・
MCP認可サーバーの既存ロジックに影響を与えない。

## セキュリティ上の制約

- frontendから送られたメール、名前、subjectを信用せず、credentialだけを受け取る。
- backendでGoogleへ照会し、client IDに対するaudienceを検査する。
- Google subjectをユーザー識別子とし、変更され得るメールを識別子にしない。
- 既存メールへ自動連携しない。
- 別ユーザーに連携済みのsubjectを移動しない。
- IDトークンやcredentialをログへ書かない。

Google tokeninfoへの到達不能時はログインを拒否する（fail closed）。本番ではGoogleの
公開鍵をキャッシュしてローカル検証する方式も将来候補だが、鍵更新処理と依存追加を
伴うため本実装では採用していない。

## 同時に修正した不具合

1. 記録画面の黒板見出しが、過去日でも常に「今日の献立」だった。選択日を渡し、
   今日だけ「今日の献立」、それ以外は「M月D日の献立」と表示するよう修正した。
2. 日付判定に`toISOString()`を使う箇所があり、日本時間の深夜にUTC日付へずれる
   可能性があった。ローカル日付を組み立てる共通関数へ置き換えた。
3. axiosの既定URLが過去のCloudFront URLに固定され、環境変数の設定漏れで別環境へ
   データを送る可能性があった。同一オリジンの`/api/`を既定値にした。
4. OCRの予期しない例外文字列を利用者へそのまま返していた。内部情報を漏らさない
   固定メッセージへ変更した。
5. OCRログへユーザー名と抽出した栄養情報を出していた。健康情報を含み得る詳細ログを
   削除した。
6. 新規環境では`backend/logs/`がなく、pytestや管理コマンドがDjango初期化前に
   失敗していた。設定ロード時にログディレクトリを作るよう修正した。
7. 開発・テスト環境で`.env`がないと`SECRET_KEY`が空になり、APIテストがミドルウェア
   で失敗していた。development設定だけに固定の開発用キーを用意した。
8. ES moduleであるVite設定がCommonJS専用の`__dirname`を使い、ESLintに失敗していた。
   `import.meta.url`から設定ファイルのディレクトリを求めるよう修正した。
9. 開発設定がSQLiteへフォールバックする一方、食品検索がPostgreSQL固有の
   `SIMILARITY`を無条件に呼び、全テストを完走できなかった。本番PostgreSQLでは従来の
   pg_trgm検索を維持し、SQLiteテスト時だけ部分一致へフォールバックするようにした。

## 運用確認

Google Cloud Consoleの生成元は開発・本番を個別に登録する。client IDは秘密ではないが、
backendとfrontendで別の値にならないようにする。Googleログイン、既存連携、解除、従来
ログイン、ClaudeのOAuth認可をリリース前に実機確認する。

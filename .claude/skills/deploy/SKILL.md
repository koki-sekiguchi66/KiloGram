---
name: deploy
description: GCP e2-micro（Always Free）への DishBoard のデプロイ・初期構築手順。/deploy と明示的に指定されたときだけ使う。
disable-model-invocation: true
---

# デプロイ（GCP e2-micro）

**このスキルは副作用が大きい。コマンドを実行する前に、何をどのホストに対して行うかをユーザーに確認すること。**
本番の DB とドメインに触れる操作であり、失敗すると利用者（研究室10〜20名）に影響する。

対象: GCP Compute Engine e2-micro 上の Docker Compose（`docker-compose.production.yml`）。
詳細な背景と検証チェックリストは `docs/deployment.md` にある。

## A. 通常のデプロイ（コード更新の反映）

**着手前に、手元で未 push のコミットが無いか確認する。**
これを飛ばすと VM に古いコードが降り、原因究明で時間を溶かす。

```bash
git log origin/main..HEAD --oneline    # 手元で実行。何も出なければ OK
```

```bash
cd ~/dishboard
git pull
docker compose -f docker-compose.production.yml build
docker compose -f docker-compose.production.yml up -d

# マイグレーションがある場合のみ（★事前に必ずバックアップ → §E）
docker compose -f docker-compose.production.yml run --rm backend python manage.py migrate

# ★ backend / mcp を作り直したら nginx も restart する
docker compose -f docker-compose.production.yml restart nginx

docker compose -f docker-compose.production.yml ps   # db(healthy)/backend/mcp/nginx が Up
docker compose -f docker-compose.production.yml logs --tail=100 backend mcp
```

### 必ず引っかかる4点

| 落とし穴 | 対処 |
|---|---|
| nginx の restart 忘れ → **502** | `upstream` の名前解決は起動時の一度きり。backend/mcp を作り直すと古い IP に繋ぎ続ける |
| `VITE_` 変数を変えたのに反映されない | Vite は**ビルド時に埋め込む**。`build nginx` → `up -d nginx` が必要 |
| `nginx/conf.d/dishboard.conf` が `git pull` で衝突 | ドメイン置換のローカル差分（ADR #25）。`git stash push <file>` → `pull` → `stash pop` |
| `\` の後ろの空白で改行継続が切れる | `docker buildx build requires 1 argument` 等になる。**本番コマンドは1行で書く** |

`docs/` は `.gitignore` 済みなので `git pull` では VM に降りてこない。

## B. 初期構築で必ず踏む2つの罠

### B-1. nginx と Let's Encrypt の「鶏と卵」問題 ★

nginx 設定に 443 の server ブロックがあると、証明書が無い状態では nginx が起動できない。
しかし nginx が起動しないと ACME チャレンジに応答できず、証明書が取得できない。

**回避手順**（設定をボリュームマウントで与えているのでイメージ再ビルドは不要）:

```bash
cd ~/dishboard

# 1. 本来の設定を退避
cp nginx/conf.d/dishboard.conf nginx/conf.d/dishboard.conf.full

# 2. 80番のみ・SSL 参照なしの最小設定に一時差し替え（<sub> は実際のサブドメインに置換）
cat > nginx/conf.d/dishboard.conf <<'EOF'
server {
    listen 80;
    server_name <sub>.duckdns.org;
    location /.well-known/acme-challenge/ { root /var/www/certbot; }
    location / { return 200 "temporary\n"; add_header Content-Type text/plain; }
}
EOF

# 3. nginx を起動して Up を確認
docker compose -f docker-compose.production.yml up -d nginx
docker compose -f docker-compose.production.yml ps

# 4. certbot で証明書を取得（ボリューム名は docker volume ls で確認する）
docker run --rm \
  -v dishboard_certbot_certs:/etc/letsencrypt \
  -v dishboard_certbot_www:/var/www/certbot \
  certbot/certbot certonly --webroot -w /var/www/certbot \
  -d <sub>.duckdns.org --email <your-email> --agree-tos --no-eff-email

# 5. 本来の設定に戻して再起動
mv nginx/conf.d/dishboard.conf.full nginx/conf.d/dishboard.conf
docker compose -f docker-compose.production.yml restart nginx
```

証明書は90日で失効する。cron で `certbot renew`（毎月1日・15日 3:00）を回すこと。

### B-2. GitHub Secrets `GCP_VM_HOST`

**ホスト名のみ**を入れる。`https://` やスラッシュ、ポート表記を含めない。
含めると `dial tcp: address tcp///<domain>: unknown port` で失敗する。

`GCP_SSH_PRIVATE_KEY` は **パスフレーズなし**の CI 専用鍵を使う（`appleboy/ssh-action` は対話入力できない）。

## C. GCP 無料枠を外れない条件 ★1つでも誤ると課金

| 項目 | 必須 |
|---|---|
| マシンタイプ | `e2-micro` のみ |
| リージョン | us-west1 / us-central1 / us-east1 のみ |
| ブートディスク | **標準永続ディスク**・**30GB 以内**（Balanced / SSD は課金） |
| ネットワークサービス階層 | **標準**（デフォルトはプレミアム。必ず変更する） |
| インスタンス数 | 1台のみ |

保険として GCP で **$1 の予算アラート**を設定しておく。
VM 作成画面の「月間予測」は無料枠を差し引く前の定価なので、$7 程度と表示されても正常。

## D. DB の新規構築（初回のみ）

```bash
docker compose -f docker-compose.production.yml build
docker compose -f docker-compose.production.yml up -d db
docker compose -f docker-compose.production.yml run --rm backend python manage.py migrate
docker compose -f docker-compose.production.yml run --rm backend \
  python manage.py load_standard_foods /app/data/standard_foods.csv
docker compose -f docker-compose.production.yml run --rm -it backend python manage.py createsuperuser

# 学食メニューの初回取得（起動時の自動取得は Celery 廃止時に削除済み）
docker compose -f docker-compose.production.yml exec backend python manage.py update_cafeteria_menus
```

pg_trgm が有効か確認する（無効だと食品のあいまい検索が動かない）:

```bash
docker compose -f docker-compose.production.yml exec db \
  psql -U <POSTGRES_USER> -d <POSTGRES_DB> \
  -c "SELECT extname FROM pg_extension WHERE extname='pg_trgm';"
```

## E-0. MCP / Google ログインを有効にする

**PWA と同じオリジンで OAuth 認可を提供してはいけない**（ADR #26）。
Android が PWA へのリンクを OS レベルで横取りし、スマホの Claude アプリから
認可画面に到達できなくなる。認可専用サブドメインを取得し、
IP 更新 cron と証明書を追加してから `nginx/conf.d/dishboard.conf` の
`<auth-sub>.duckdns.org` を置換する（nginx は起動済みなので §B-1 は不要）。

```bash
MCP_RESOURCE_URL=https://<sub>.duckdns.org/mcp        # Claude に登録する URL と完全一致
OAUTH2_ISSUER_URL=https://<auth-sub>.duckdns.org      # PWA と別オリジンにする
GOOGLE_CLIENT_ID=<client-id>.apps.googleusercontent.com
VITE_GOOGLE_CLIENT_ID=<同じ値>

# 認可用サブドメインの足し忘れは 400 / CSRF エラーになる
ALLOWED_HOSTS=<sub>.duckdns.org,<auth-sub>.duckdns.org
CSRF_TRUSTED_ORIGINS=https://<sub>.duckdns.org,https://<auth-sub>.duckdns.org
```

`CORS_ALLOWED_ORIGINS` は SPA の API 呼び出し用なので認可用サブドメインは**不要**。
Google Cloud Console の「承認済み JavaScript 生成元」には
**PWA と認可用サブドメインの両方**を登録する（パス・末尾スラッシュ無し）。

### 疎通確認（Claude に登録する前に）

```bash
curl -s https://<sub>.duckdns.org/.well-known/oauth-protected-resource
curl -s https://<auth-sub>.duckdns.org/.well-known/oauth-authorization-server
```

両方 **JSON** が返り、PRM の `resource` が `MCP_RESOURCE_URL` と**完全一致**すること
（1文字でも違うと接続しない）。HTML が返るなら nginx 設定が効いていない。

### ログから切り分ける（`logs -f nginx`）

| 症状 | 見るべき所 |
|---|---|
| `POST /o/register/` が 401 | DCR のパーミッション設定 |
| `POST /mcp` が 405 | nginx の location が効いていない |
| `POST /mcp` が 421 | FastMCP の許可ホスト設定 |
| `GET /accounts/login/` が出ない | PWA のリンク横取り（別サブドメインで解決済みか確認） |

詳細は `docs/troubleshooting.md` 14〜18。

## E. 運用

```bash
docker stats --no-stream     # メモリ・CPU
free -h                      # RAM とスワップ（2GB のスワップが必須）
df -h                        # ディスク（30GB を超えないこと）

# DB バックアップ（自動化は未実装。VM 外へ退避すること）
docker compose -f docker-compose.production.yml exec -T db \
  pg_dump -U <POSTGRES_USER> -d <POSTGRES_DB> -Fc > ~/dishboard_$(date +%Y%m%d).dump
```

問題が起きたら `docs/troubleshooting.md` を先に見る。

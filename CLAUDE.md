# DishBoard

食事と体重を記録する PWA（Django 5.2 + DRF + React 19 + PostgreSQL 16 + MCP サーバ）。

3つの役割を同時に担う。**迷ったらこの優先順**で判断する。

1. **実用ツール** — 研究室10〜20名が実際に使う。壊すと利用者に影響する
2. **ポートフォリオ** — public 公開。採用担当が読む。**判断の理由が残っていること自体が価値**
3. **学習教材** — 自分が理解できない実装を残さない

## 作業別に読むもの

**このファイルだけで作業を始めない。着手前に該当行を読む。**

| 作業 | 読む |
|---|---|
| backend 全般（層構造・データ設計・クエリ） | `backend/CLAUDE.md` |
| MCP サーバ | `backend/CLAUDE.md` の MCP 層 |
| frontend 全般（features 構成・UI・型） | `frontend/CLAUDE.md` |
| API 追加 | `.claude/skills/add-api-endpoint/SKILL.md` |
| 画面・feature 追加 | `.claude/skills/add-frontend-feature/SKILL.md` |
| テスト | `.claude/skills/write-tests/SKILL.md` |
| ドキュメント・ADR | `.claude/skills/write-docs/SKILL.md` |
| 本番反映（`/deploy` 明示時のみ） | `.claude/skills/deploy/SKILL.md` |
| 「なぜこの設計か」の確認 | `docs-public/decisions.md`（ADR #1〜#27） |
| 全体構成 | `ARCHITECTURE.md` |
| 認証・Google連携・MCP認可 | `docs-public/google-authentication.md` |

`docs/` は Git 管理外の個人メモ（作業ログ・トラブル事例）。**`git add` しない**。

## 絶対的な制約

- **既存アーキテクチャを許可なく変更しない**（リファクタリング依頼時を除く）
- **ライブラリの追加・削除・バージョン変更は事前確認**
- **DB スキーマ変更・新規マイグレーションは事前確認**
- **`@ts-expect-error` / `any` 禁止**。型エラーは正当な修正で解決する
- **仕様外の「ついでの」修正をしない**。変更範囲は最小に保つ
- `.env` / `.env.*` の中身を読まない・書かない・コミットしない
- `docker-compose.production.yml` と `nginx/conf.d/` は本番構成。**触る前に確認を取る**
- マジックナンバーは定数化。コメントは「何を」ではなく**「なぜ」**を書く

## 進め方

- **コードを書く前に対象ファイルの現状を読む**
- 破壊的変更につながる判断は、推測で進めず確認を求める
- テストは通すために緩めない。「仕様変更」か「実装のバグ」かを切り分ける
- 大きな変更は**切り戻せる粒度**でコミットを分ける
- こだわりが**実態**（10〜20名 / 1GB VM / PWA）に見合うかを常に問う

## ドキュメント

**public 公開リポジトリ。** 読者で置き場所を決める。詳細は `write-docs` Skill。

| | 内容 |
|---|---|
| `docs-public/`（追跡） | 仕様・**設計判断とその理由**・API・制約 |
| `docs/`（管理外） | 失敗した操作・詰まった過程・環境固有の値 |

**実ドメイン・VM名・秘密値はどちらにも書かない。** 実装で設計判断をしたら ADR を足す。

## コマンド

```bash
docker compose up -d                    # db + backend + mcp + frontend
docker compose logs -f backend          # mcp は localhost:8001/mcp

# backend テスト（PostgreSQL 必須。SQLite では pg_trgm が動かない）
docker compose up -d db
cd backend && venv/Scripts/python.exe -m pytest -q   # Windows（Linux: python -m pytest -q）

# frontend
cd frontend
npx tsc --noEmit        # ★実質的な品質ゲート（ESLint は .ts/.tsx を見ていない）
npm run test:run && npm run build
```

`backend` コンテナは起動時に `migrate` と `load_standard_foods` を自動実行する。

## 言語

対話・コミットメッセージ・docstring・コメントは**日本語**。識別子は英語。

コミット: `feat(settings): 目標値の編集に対応`
type は `feat` / `fix` / `refactor` / `docs` / `chore` / `test`。**`Co-Authored-By` は付けない**。

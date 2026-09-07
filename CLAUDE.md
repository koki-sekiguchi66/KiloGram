# DishBoard

食事と体重を記録して栄養管理を行う PWA（Django 5.2 + DRF + React 19 + PostgreSQL 16）。

このプロジェクトは3つの役割を同時に担う。判断に迷ったらこの優先順で考える。

1. **実用ツール** — 研究室のメンバー10〜20名が実際に使う。壊すと利用者に影響する
2. **ポートフォリオ** — SIer 就活で「なぜこの設計か」を説明する材料。判断の理由が残っていること自体が価値
3. **学習教材** — 自分が理解できない実装を残さない

## ディレクトリ

- `backend/` — Django / DRF。層構造とデータ設計の規約は `backend/CLAUDE.md`
- `backend/mcp_server/` — Claude から接続する MCP サーバ（別プロセス）。規約は `backend/CLAUDE.md`
- `frontend/` — React + TypeScript + Vite。features 構成と規約は `frontend/CLAUDE.md`
- `nginx/conf.d/` — 本番の同一オリジン配信設定（開発では使わない）
- `.github/workflows/` — 週次の学食スクレイピング（cron → SSH → 管理コマンド）

## コマンド

```bash
# 開発環境（db + backend + mcp + frontend）
docker compose up -d
docker compose logs -f backend
docker compose logs -f mcp        # MCP サーバ（localhost:8001/mcp）

# バックエンドのテスト（PostgreSQL 必須。SQLite では動かない）
docker compose up -d db
cd backend && venv/Scripts/python.exe -m pytest -q     # Windows
# cd backend && python -m pytest -q                     # Linux/macOS

# フロントエンド
cd frontend
npm run test:run        # テスト（watch は npm run test）
npm run lint            # ESLint
npx tsc --noEmit        # 型チェック
npm run build           # ビルド
```

`backend` コンテナは起動時に `migrate` と `load_standard_foods` を自動実行する。

## 絶対的な制約

- リファクタリングの依頼時以外、**既存アーキテクチャを許可なく変更しない**
- **ライブラリのバージョンを勝手に更新しない**（追加・削除も事前確認）
- **DB スキーマ変更・新規マイグレーション追加は必ず事前確認**
- **`@ts-expect-error` / `any` を使わない**。型エラーは正当な修正で解決する
- マジックナンバーは定数化する
- コメントは「何を」ではなく「なぜ」を書く
- **仕様外の「ついでの」リファクタリング・命名統一をしない**。変更範囲は最小に保つ
- `.env` / `.env.*` の中身を読まない・書かない・コミットしない
- `docker-compose.production.yml` と `nginx/conf.d/` は本番構成。触る前に必ず確認を取る

## 作業の進め方

- コードを書く前に、対象ファイルの現状を読む
- 破壊的変更につながりうる判断は、推測で進めず確認を求める
- テストは通すためだけに緩めない。落ちた原因が「仕様変更」か「実装のバグ」かを切り分ける
- 大きな変更は論理的単位でコミットを分ける（切り戻せる粒度に）
- 「動けばよい」で済ませない。ただし、こだわりが**このアプリの実態**（研究室10〜20名 / 1GB VM / PWA）に照らして意味があるかは常に問う

## 言語とコミット

- 対話・コミットメッセージ・docstring・コメントは**日本語**
- コード（識別子）は英語
- コミットは Conventional Commits 風 + 日本語1行要約: `feat(settings): 目標値の編集に対応`
  - type: `feat` / `fix` / `refactor` / `docs` / `chore` / `test`
  - **`Co-Authored-By` は付けない**

## ドキュメント

**このリポジトリは public 公開を前提とする。就活で採用担当者が読む可能性がある。**
書く先を「読者が誰か」で決める。判断に迷ったら `write-docs` Skill を読む。

| 置き場所 | 追跡 | 読者 | 書くもの |
|---|---|---|---|
| `docs-public/` | Git 追跡 | 第三者・将来の保守担当 | 仕様、**設計判断とその理由**、API、制約、今後の候補 |
| `docs/` | **Git 管理外** | 自分だけ | 失敗した操作、詰まった過程、環境固有の値、感想 |

- **設計判断の理由は必ず `docs-public/` に残す。** このリポジトリで最も価値がある情報
- **経験談・トラブルの実況は `docs/`。** リモートには一般化した教訓だけを書く
- **実ドメイン・VM名・アカウント名・秘密値はどちらにも書かない**（`docs/` でも避ける）
- 機能を実装したら、対応する `docs-public/` の記述を同じ変更で更新する

## 参照

- 手順が必要な作業には Skill がある。**着手前に該当するものを読む**
  - 実装: `add-api-endpoint` / `add-frontend-feature` / `write-tests`
  - 記録: `write-docs`（ドキュメント・ADR の書き分け）
  - 本番: `deploy`（`/deploy` と明示したときのみ）
- 設計判断の記録は `docs-public/decisions.md`（ADR #1〜）
- 個人的な作業ログ・トラブル事例は `docs/`（Git 管理外。`git add` しない）

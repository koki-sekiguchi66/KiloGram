# AGENTS.md

**すべての AI エージェント（Codex / Claude Code / その他）の共通入口。**

## 1. 最初に必ず `CLAUDE.md` を読む

**この AGENTS.md は規約の本体ではない。** 規約の唯一の情報源は
リポジトリ直下の **`CLAUDE.md`** である。作業を始める前に必ず読むこと。

```
CLAUDE.md   ← 規約の本体。プロジェクトの性格・絶対的な制約・作業別の読み先
AGENTS.md   ← このファイル。CLAUDE.md へ誘導し、エージェント差を吸収するだけ
```

同じ規約を2箇所に書くと必ず片方が古くなる。
**このファイルに規約を書き足さないこと。** 規約の変更は `CLAUDE.md` に対して行う。

## 2. コンテキストの読み方

`CLAUDE.md` の「作業別に読むもの」の表に従う。**全部を先読みしない。**
着手する作業に対応する行だけを読む。

階層ごとの規約ファイルがある。そのディレクトリを触るなら先に読む。

| ディレクトリ | 規約 |
|---|---|
| `backend/` | `backend/CLAUDE.md`（層構造・データ設計・MCP 層・クエリ） |
| `frontend/` | `frontend/CLAUDE.md`（features 構成・UI・型・落とし穴） |

## 3. 手順書（Skill）の扱い

`.claude/skills/<name>/SKILL.md` は **Claude Code 専用ではなく、ただの Markdown 手順書**である。
Skill 機構を持たないエージェントも、**該当する作業をするなら必ず読むこと。**

| ファイル | いつ読むか |
|---|---|
| `.claude/skills/add-api-endpoint/SKILL.md` | DRF のエンドポイントを追加・変更する |
| `.claude/skills/add-frontend-feature/SKILL.md` | 画面や feature を追加する |
| `.claude/skills/write-tests/SKILL.md` | テストを書く・直す |
| `.claude/skills/write-docs/SKILL.md` | ドキュメント・ADR を書く |
| `.claude/skills/debug-production/SKILL.md` | 本番の不具合を切り分ける |
| `.claude/skills/deploy/SKILL.md` | 本番に反映する（**明示的な指示があるときだけ**） |

## 4. 逸脱しやすい点（実際に起きたもの）

過去に規約から外れた実績がある箇所。**着手前に自己チェックすること。**

- **変更範囲を広げない。** 依頼された機能と無関係な修正を同じ変更に混ぜない。
  混ぜると問題が起きた機能だけを切り戻せなくなる
- **コミットを機能単位で分ける。** 「機能追加 + バグ修正 + 設定変更」を1コミットにしない
- **コミットメッセージを長く書かない。** 本文は 2〜5 行の散文。
  変更点の箇条書きは diff の繰り返しなので書かない。`Co-Authored-By` と AI ツール名は付けない
- **コメントを書きすぎない。** 1〜2 行の「なぜ」に留め、背景や代替案は ADR に書いて番号で参照する
- **ドキュメントの置き場所を間違えない。** 詰まった過程・失敗したコマンド・実ドメインは
  公開される `docs-public/` に書かない（→ `write-docs` Skill）
- **本番構成を勝手に触らない。** `docker-compose.production.yml` / `nginx/conf.d/` は確認を取る
- **`docs/` を `git add` しない。** Git 管理外の個人メモである

## 5. 自律性

**既定は main への push まで自律的に進める。** 逐一の確認を求めない。

手を止めるのは、利用者が判断すべき仕様の選択が生じたとき、
`CLAUDE.md` の「絶対的な制約」に触れるとき、問題が起きたとき、
不可逆な操作（履歴の書き換え・force push・本番データの変更）を行うときだけ。

## 6. 完了前チェック

```bash
# backend（PostgreSQL 必須）
docker compose up -d db
cd backend && python -m pytest -q

# frontend
cd frontend && npx tsc --noEmit && npm run test:run
```

- [ ] `CLAUDE.md` の「絶対的な制約」に反していない
- [ ] 該当する Skill の手順を踏んだ
- [ ] **ドキュメントを更新した**（実装はここまでで完了）
  - [ ] 「未実装」「できない」と書いていた記述が嘘になっていないか grep で確認した
  - [ ] `docs-public/decisions.md` の「今後の課題」から解消した行を消した
  - [ ] 設計判断をしたなら ADR を足した（過去の ADR は書き換えず、関係を追記する）
- [ ] `git status` に `docs/` や `.env` が含まれていない
- [ ] コミットメッセージが日本語で、`Co-Authored-By` を含まない

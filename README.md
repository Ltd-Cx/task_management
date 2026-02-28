# Backlog Clone

プロジェクト管理ツール（Backlog）のクローンアプリケーション。

## 技術スタック

| カテゴリ | 技術 |
|---------|------|
| フレームワーク | Next.js 16.1.6 (App Router) |
| 言語 | TypeScript 5 (strict mode) |
| UI | React 19, shadcn/ui (new-york style), Tailwind CSS 4 |
| ORM | Drizzle ORM + postgres.js |
| データベース | Supabase (PostgreSQL) |
| フォーム | React Hook Form + Zod |
| リッチテキスト | TipTap |
| パッケージマネージャー | pnpm |

## 機能

- プロジェクト管理
- 課題（タスク）管理
  - 課題の追加・編集・削除
  - リッチテキストエディタ（TipTap）による詳細入力
  - 画像アップロード対応
- カンバンボード
- ガントチャート
- カテゴリー管理
- メンバー管理
- カスタムステータス

## プロジェクト構成

```
src/
├── app/           # Next.js App Router（ページ・レイアウト）
├── components/
│   ├── ui/        # shadcn/ui コンポーネント
│   ├── tasks/     # 課題関連コンポーネント
│   ├── gantt/     # ガントチャート
│   └── settings/  # 設定関連
├── db/
│   ├── schema.ts  # Drizzle スキーマ定義
│   ├── index.ts   # DB接続
│   └── seed.ts    # シードスクリプト
├── lib/           # ユーティリティ
├── actions/       # Server Actions
└── types/         # 型定義

supabase/
├── config.toml    # Supabase設定
└── migrations/    # Drizzle生成のマイグレーションSQL
```

## データベーススキーマ

- `projects` - プロジェクト
- `users` - ユーザー
- `tasks` - 課題
- `categories` - カテゴリー
- `project_members` - プロジェクトメンバー
- `task_statuses` - カスタムステータス

## ローカル開発

### 前提条件

- Node.js 20+
- pnpm
- Docker（Supabaseローカル環境用）

### セットアップ

```bash
# 依存関係のインストール
pnpm install

# Supabaseローカル環境の起動
pnpm supabase:start

# データベースのセットアップ
pnpm db:push
pnpm db:seed

# 開発サーバーの起動
pnpm dev
```

### 開発コマンド

```bash
# 開発サーバー起動
pnpm dev                  # http://localhost:3000

# ビルド・リント
pnpm build
pnpm lint

# Supabase ローカル環境
pnpm supabase:start       # Docker必須、Supabase Studio: http://localhost:54323
pnpm supabase:stop
pnpm supabase:status

# データベース（Drizzle ORM）
pnpm db:generate          # スキーマからマイグレーションSQL生成
pnpm db:push              # ローカルDBにスキーマ適用
pnpm db:migrate           # マイグレーション実行
pnpm db:studio            # Drizzle Studio: http://localhost:4983
pnpm db:seed              # ダミーデータ投入
```

## 環境変数

`.env.local`ファイルを作成し、以下の環境変数を設定してください。

```env
# Database
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:54322/postgres

# Supabase
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## デプロイ

### Coolify（Contaboサーバー）

このプロジェクトはContaboサーバー上のCoolifyを使用してデプロイします。

#### 必要な環境変数（Coolify設定）

```env
DATABASE_URL=postgresql://...
NEXT_PUBLIC_SUPABASE_URL=https://...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

#### nixpacks.toml

Coolifyはnixpacksを使用してビルドします。`nixpacks.toml`で設定を定義しています。

```toml
[phases.setup]
nixPkgs = ["nodejs_20"]

[phases.install]
cmds = ["npm install -g pnpm", "pnpm install --frozen-lockfile"]

[phases.build]
cmds = ["pnpm build"]

[start]
cmd = "pnpm start"

[variables]
NODE_ENV = "production"
```

#### デプロイ手順

1. Coolifyでプロジェクトを作成
2. GitHubリポジトリを接続
3. 環境変数を設定
4. デプロイを実行

## ライセンス

Private

psql -h 5.104.82.232 -p 5432 -U postgres -d postgres < supabase_dump.sql
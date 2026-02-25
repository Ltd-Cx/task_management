# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Backlog Clone - プロジェクト管理ツール（Backlog）のクローン。

## Development Commands

```bash
# 開発サーバー起動（事前に pnpm supabase:start が必要）
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

## Technology Stack

- **Framework**: Next.js 16.1.6 (App Router)
- **Language**: TypeScript 5 (strict mode)
- **UI**: React 19.2.3, shadcn/ui (new-york style), Tailwind CSS 4
- **ORM**: Drizzle ORM + postgres.js
- **DB**: Supabase (ローカルDocker PostgreSQL, port 54322)
- **Forms**: React Hook Form + Zod
- **Package Manager**: pnpm

## Architecture

```
src/
├── app/           # Next.js App Router（ページ・レイアウト）
├── components/ui/ # shadcn/ui コンポーネント
├── db/
│   ├── schema.ts  # Drizzle スキーマ定義（5テーブル）
│   ├── index.ts   # DB接続
│   └── seed.ts    # シードスクリプト
├── lib/           # ユーティリティ
├── actions/       # Server Actions
└── types/         # 型定義
supabase/
├── config.toml    # Supabase設定
└── migrations/    # Drizzle生成のマイグレーションSQL
```

- Path alias: `@/*` → `./src/*`
- DB スキーマ: `projects`, `users`, `tasks`, `categories`, `project_members`

## Conventions

- コメント・gitコミットメッセージは日本語

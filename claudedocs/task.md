# 開発環境セットアップ手順

## 前提条件

- Node.js 20以上
- pnpm
- Docker Desktop（起動済み）
- Git

---

## Step 1: Next.js プロジェクト作成

```bash
pnpm create next-app@latest backlog_clone --yes
cd backlog_clone
```

> `--yes` で TypeScript, ESLint, Tailwind CSS, App Router がすべて有効になる

---

## Step 2: Supabase ローカル環境（Docker）

```bash
# Supabase CLI インストール
pnpm add -D supabase

# Supabase 初期化（supabase/ ディレクトリが生成される）
npx supabase init

# ローカルスタック起動（初回はDockerイメージのDLに数分かかる）
npx supabase start
```

起動後に表示される情報をメモする:
```
API URL:     http://localhost:54321
DB URL:      postgresql://postgres:postgres@localhost:54322/postgres
Studio URL:  http://localhost:54323   ← ブラウザでDB管理画面が見れる
anon key:    eyJhbG...
service_role key: eyJhbG...
```

---

## Step 3: Drizzle ORM セットアップ

```bash
# Drizzle ORM + PostgreSQL ドライバ + Drizzle Kit
pnpm add drizzle-orm postgres
pnpm add -D drizzle-kit
```

### drizzle.config.ts（プロジェクトルート）

```typescript
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./supabase/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
```

### src/db/index.ts（DB接続）

```typescript
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const client = postgres(process.env.DATABASE_URL!);
export const db = drizzle(client, { schema });
```

### src/db/schema.ts（スキーマ定義 - 初期スタブ）

```typescript
import { pgTable, pgEnum, uuid, text, serial, date, integer, timestamp } from "drizzle-orm/pg-core";

// Enums
export const userRoleEnum = pgEnum("user_role", ["admin", "member"]);
export const taskStatusEnum = pgEnum("task_status", ["open", "in_progress", "resolved", "closed"]);
export const taskPriorityEnum = pgEnum("task_priority", ["high", "medium", "low"]);

// Projects
export const projects = pgTable("projects", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  key: text("key").unique().notNull(),
  description: text("description"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// Users
export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  displayName: text("display_name").notNull(),
  email: text("email").unique().notNull(),
  role: userRoleEnum("role").notNull().default("member"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// Categories
export const categories = pgTable("categories", {
  id: uuid("id").defaultRandom().primaryKey(),
  projectId: uuid("project_id").references(() => projects.id).notNull(),
  name: text("name").notNull(),
  color: text("color"),
  displayOrder: integer("display_order").notNull().default(0),
});

// Tasks
export const tasks = pgTable("tasks", {
  id: uuid("id").defaultRandom().primaryKey(),
  projectId: uuid("project_id").references(() => projects.id).notNull(),
  keyId: serial("key_id").notNull(),
  summary: text("summary").notNull(),
  description: text("description"),
  status: taskStatusEnum("status").notNull().default("open"),
  priority: taskPriorityEnum("priority").notNull().default("medium"),
  assigneeId: uuid("assignee_id").references(() => users.id),
  categoryId: uuid("category_id").references(() => categories.id),
  parentId: uuid("parent_id"),  // 自己参照は後で .references(() => tasks.id) を追加
  startDate: date("start_date"),
  dueDate: date("due_date"),
  createdBy: uuid("created_by").references(() => users.id).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// Project Members
export const projectMembers = pgTable("project_members", {
  projectId: uuid("project_id").references(() => projects.id).notNull(),
  userId: uuid("user_id").references(() => users.id).notNull(),
  role: userRoleEnum("role").notNull().default("member"),
  joinedAt: timestamp("joined_at", { withTimezone: true }).defaultNow().notNull(),
});
```

---

## Step 4: shadcn/ui セットアップ

```bash
pnpm dlx shadcn@latest init
```

初期化時の選択:
- Style: **Default**
- Base color: **Slate**（お好みで）
- CSS variables: **Yes**

よく使うコンポーネントを先に入れておく:
```bash
pnpm dlx shadcn@latest add button input label select table badge dialog dropdown-menu form card tabs separator
```

---

## Step 5: 環境変数

### .env.local

```env
# Supabase ローカル（supabase start で表示された値を使用）
DATABASE_URL=postgresql://postgres:postgres@localhost:54322/postgres
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=（supabase start で表示された anon key）
```

### .env.local を .gitignore に追加（Next.jsデフォルトで含まれているはず）

```
# .gitignore に以下が含まれていることを確認
.env*.local
```

---

## Step 6: package.json にスクリプト追加

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "db:generate": "drizzle-kit generate",
    "db:migrate": "drizzle-kit migrate",
    "db:push": "drizzle-kit push",
    "db:studio": "drizzle-kit studio",
    "db:seed": "tsx src/db/seed.ts",
    "supabase:start": "supabase start",
    "supabase:stop": "supabase stop",
    "supabase:status": "supabase status"
  }
}
```

---

## Step 7: seedスクリプト（ダミーデータ投入）

```bash
pnpm add -D tsx
```

### src/db/seed.ts

```typescript
import { db } from "./index";
import { users, projects, projectMembers, categories } from "./schema";

async function seed() {
  console.log("🌱 Seeding database...");

  // ダミーユーザー
  const [admin] = await db.insert(users).values({
    displayName: "管理者ユーザー",
    email: "admin@example.com",
    role: "admin",
  }).returning();

  const [member] = await db.insert(users).values({
    displayName: "一般ユーザー",
    email: "member@example.com",
    role: "member",
  }).returning();

  // サンプルプロジェクト
  const [project] = await db.insert(projects).values({
    name: "サンプルプロジェクト",
    key: "SAMPLE",
    description: "開発テスト用のサンプルプロジェクト",
  }).returning();

  // プロジェクトメンバー
  await db.insert(projectMembers).values([
    { projectId: project.id, userId: admin.id, role: "admin" },
    { projectId: project.id, userId: member.id, role: "member" },
  ]);

  // カテゴリー
  await db.insert(categories).values([
    { projectId: project.id, name: "機能追加", color: "#3B82F6", displayOrder: 1 },
    { projectId: project.id, name: "バグ修正", color: "#EF4444", displayOrder: 2 },
    { projectId: project.id, name: "改善", color: "#22C55E", displayOrder: 3 },
  ]);

  console.log("✅ Seed completed!");
  process.exit(0);
}

seed().catch((e) => {
  console.error("❌ Seed failed:", e);
  process.exit(1);
});
```

---

## Step 8: 初回マイグレーション実行

```bash
# マイグレーションファイル生成
pnpm db:generate

# ローカルDBに適用
pnpm db:push

# ダミーデータ投入
pnpm db:seed
```

---

## 開発ワークフロー（日常）

```bash
# 1. Dockerを起動しておく
# 2. Supabaseローカル起動
pnpm supabase:start

# 3. 開発サーバー起動
pnpm dev

# 4. ブラウザで確認
#    アプリ:       http://localhost:3000
#    Supabase Studio: http://localhost:54323
#    Drizzle Studio:  pnpm db:studio → http://localhost:4983
```

---

## ディレクトリ構成（最終形）

```
backlog_clone/
├── .env.local                    # 環境変数（git管理外）
├── drizzle.config.ts             # Drizzle設定
├── next.config.ts
├── package.json
├── supabase/                     # Supabase CLI管理
│   ├── config.toml
│   └── migrations/               # Drizzle生成のマイグレーション
├── src/
│   ├── app/                      # Next.js App Router
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── projects/
│   │   │   └── [id]/
│   │   │       ├── issues/
│   │   │       ├── gantt/
│   │   │       └── settings/
│   │   └── admin/
│   │       └── users/
│   ├── components/
│   │   ├── ui/                   # shadcn/ui
│   │   ├── layout/
│   │   ├── issues/
│   │   └── gantt/
│   ├── db/
│   │   ├── index.ts              # DB接続
│   │   ├── schema.ts             # Drizzleスキーマ
│   │   └── seed.ts               # シードスクリプト
│   ├── lib/
│   │   ├── supabase.ts
│   │   └── utils.ts
│   ├── types/
│   │   └── index.ts
│   └── actions/                  # Server Actions
│       ├── projects.ts
│       ├── tasks.ts
│       ├── categories.ts
│       └── users.ts
└── components.json               # shadcn/ui設定
```
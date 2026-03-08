# ガントチャート実装方針

## 概要

sample_todo_gantt のUIを参考に、本プロジェクト（backlog_clone）向けのガントチャートを実装する。

---

## 1. 要件確認

| 項目 | 決定事項 |
|------|----------|
| **グループ化** | 新規「タスクグループ」テーブルで管理 |
| **タスクバーの色** | グループの色を使用 |
| **左側情報列** | タイトルのみ |
| **進捗率** | 必要（DB変更あり） |
| **実装方式** | Vanilla JS風のReact実装（外部ライブラリ不使用） |

---

## 2. データベース変更

### 2.1 新規テーブル: `task_groups`

```sql
CREATE TABLE task_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#95a5a6',
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_task_groups_project ON task_groups(project_id);
```

### 2.2 `tasks` テーブルへの追加カラム

```sql
ALTER TABLE tasks ADD COLUMN progress INTEGER NOT NULL DEFAULT 0;
ALTER TABLE tasks ADD COLUMN task_group_id UUID REFERENCES task_groups(id) ON DELETE SET NULL;
```

### 2.3 Drizzle スキーマ更新

```typescript
// src/db/schema.ts に追加

export const taskGroups = pgTable("task_groups", {
  id: uuid("id").defaultRandom().primaryKey(),
  projectId: uuid("project_id").references(() => projects.id, { onDelete: "cascade" }).notNull(),
  name: text("name").notNull(),
  color: text("color").notNull().default("#95a5a6"),
  displayOrder: integer("display_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// tasks テーブルに追加
progress: integer("progress").notNull().default(0),
taskGroupId: uuid("task_group_id").references(() => taskGroups.id, { onDelete: "set null" }),
```

---

## 3. コンポーネント構成

```
src/components/gantt/
├── vanilla-gantt/                  # 新規ディレクトリ
│   ├── gantt-chart.tsx            # メインコンポーネント
│   ├── gantt-header.tsx           # タイムラインヘッダー（月・日表示）
│   ├── gantt-task-info.tsx        # 左側タスク情報列
│   ├── gantt-timeline.tsx         # 右側タイムライン
│   ├── gantt-task-bar.tsx         # タスクバー（ドラッグ・リサイズ対応）
│   ├── gantt-group-header.tsx     # グループヘッダー（折りたたみ対応）
│   ├── hooks/
│   │   ├── use-gantt-drag.ts      # ドラッグ&ドロップロジック
│   │   ├── use-gantt-resize.ts    # 両端リサイズロジック
│   │   └── use-gantt-scroll.ts    # スクロール同期
│   ├── utils/
│   │   └── date-utils.ts          # 日付計算ユーティリティ
│   └── types.ts                   # 型定義
├── _backup_v2/                     # 現在の実装をバックアップ
│   ├── gantt-chart.tsx
│   ├── gantt-view.tsx
│   ├── modern-gantt-chart.tsx
│   └── rc-gantt-chart.tsx
└── gantt-view.tsx                  # 更新（vanilla-ganttを使用）
```

---

## 4. 実装詳細

### 4.1 定数

```typescript
const CELL_WIDTH = 25;        // 1日 = 25px
const TASK_ROW_HEIGHT = 55;   // タスク行の高さ
const HEADER_HEIGHT = 85;     // ヘッダーの高さ
const GROUP_HEADER_HEIGHT = 35; // グループヘッダーの高さ
const TASK_INFO_WIDTH = 400;  // 左側列の幅
```

### 4.2 主要機能

| 機能 | 実装方法 |
|------|----------|
| **ドラッグ移動** | `onMouseDown` → `onMouseMove` → `onMouseUp` イベントチェーン |
| **両端リサイズ** | 左右10pxのリサイズハンドル要素 |
| **折りたたみ** | グループごとに `collapsed` 状態を管理 |
| **進捗更新** | クリックでプルダウン表示、API経由で保存 |
| **日付更新** | ドラッグ/リサイズ完了時にAPI経由で保存 |
| **スクロール同期** | 左右ペインの縦スクロールを同期 |

### 4.3 スタイリング

- Tailwind CSS を使用
- sample_todo_gantt のUIを忠実に再現
- ダークモード対応（`dark:` プレフィックス）

---

## 5. API エンドポイント

### 5.1 既存（流用）

- `POST /api/tasks/update-dates` - 開始日・期限日の更新

### 5.2 新規追加

```typescript
// タスクグループ
GET    /api/projects/[projectId]/task-groups     // 一覧取得
POST   /api/projects/[projectId]/task-groups     // 作成
PUT    /api/task-groups/[groupId]                // 更新
DELETE /api/task-groups/[groupId]                // 削除

// 進捗更新
POST   /api/tasks/update-progress                // 進捗率更新
```

---

## 6. 実装フェーズ

### Phase 1: データベース・基盤
1. [ ] `task_groups` テーブル追加
2. [ ] `tasks` テーブルに `progress`, `task_group_id` 追加
3. [ ] Drizzle スキーマ更新
4. [ ] マイグレーション実行
5. [ ] 型定義更新

### Phase 2: コンポーネント実装
1. [ ] 基本レイアウト（左右ペイン）
2. [ ] タイムラインヘッダー（月・日表示）
3. [ ] グリッド描画（今日・土日ハイライト）
4. [ ] タスクバー表示
5. [ ] グループ化・折りたたみ

### Phase 3: インタラクション
1. [ ] ドラッグ移動
2. [ ] 両端リサイズ
3. [ ] タスクバークリック → 詳細モーダル
4. [ ] 進捗率更新UI

### Phase 4: 管理機能
1. [ ] タスクグループ管理モーダル
2. [ ] フィルター・ソート機能
3. [ ] 表示期間選択

---

## 7. sample_todo_gantt との対応

| sample_todo_gantt | 本プロジェクト |
|-------------------|---------------|
| `projects` | `task_groups` |
| `tasks.projectId` | `tasks.taskGroupId` |
| `tasks.progress` | `tasks.progress` (新規) |
| `assignees` | `users` (既存) |
| LocalStorage | PostgreSQL (Drizzle) |

---

## 8. 注意点

1. **SSR対応**: `dynamic(() => import(...), { ssr: false })` でクライアント専用に
2. **パフォーマンス**: 大量タスク時は仮想スクロール検討
3. **タイムゾーン**: 日付はローカルタイムゾーンで処理
4. **アクセシビリティ**: キーボード操作対応は後回し

---

## 9. ファイル移動計画（バックアップ）

### 移動対象
```
src/components/gantt/
├── gantt-chart.tsx        → _backup_v2/
├── gantt-view.tsx         → _backup_v2/
├── modern-gantt-chart.tsx → _backup_v2/
├── rc-gantt-chart.tsx     → _backup_v2/
└── gantt-test.tsx         → _backup_v2/
```

### 保持
```
src/components/gantt/
└── _backup/              # 既存のバックアップはそのまま
```

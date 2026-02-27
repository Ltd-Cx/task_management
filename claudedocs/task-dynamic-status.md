# 動的ステータス機能 実装タスク

## 概要

現在、課題のステータスは4種類（未対応・処理中・処理済み・完了）がハードコードされている。
プロジェクト設定でカスタムステータスを追加できる機能は存在するが、課題のステータス選択には反映されていない。
この機能改修により、プロジェクトごとにカスタムステータスを設定し、課題で使用できるようにする。

---

## 現状の問題点

1. **DBスキーマ**: `taskStatusEnum`がEnumで4種類固定
2. **定数ファイル**: `TASK_STATUS_CONFIG`がハードコード
3. **バリデーション**: Zodスキーマで4種類のEnumを固定指定
4. **カスタムステータステーブル**: 存在するが課題には未連携

---

## 実装タスク

### Phase 1: 基盤整備

#### Task 1.1: デフォルトステータスのシード追加
- [ ] `src/db/seed.ts` を修正
- [ ] プロジェクト作成時に4つのデフォルトステータスを `task_statuses` テーブルに挿入
- [ ] デフォルトステータス: open, in_progress, resolved, closed

```typescript
// seed.ts に追加
await db.insert(taskStatuses).values([
  { projectId: project.id, key: "open", label: "未対応", color: "#a3a3a3", displayOrder: 0 },
  { projectId: project.id, key: "in_progress", label: "処理中", color: "#3b82f6", displayOrder: 1 },
  { projectId: project.id, key: "resolved", label: "処理済み", color: "#f59e0b", displayOrder: 2 },
  { projectId: project.id, key: "closed", label: "完了", color: "#22c55e", displayOrder: 3 },
]);
```

#### Task 1.2: ステータス取得クエリの拡張
- [ ] `src/db/queries/statuses.ts` を修正
- [ ] `getProjectStatusesWithDefaults()` 関数を追加
- [ ] プロジェクトのステータスを取得し、なければデフォルトを返す

---

### Phase 2: 型とユーティリティ

#### Task 2.1: 動的ステータス設定ビルダー
- [ ] `src/lib/status-utils.ts` を新規作成
- [ ] `buildStatusConfig(statuses: TaskStatusConfig[])` 関数を実装
- [ ] 動的にステータス設定オブジェクトを生成

```typescript
// status-utils.ts
export function buildStatusConfig(statuses: TaskStatusConfig[]) {
  return Object.fromEntries(
    statuses.map((s) => [
      s.key,
      {
        label: s.label,
        color: s.color,
        dotClass: `bg-[${s.color}]`,
        // ...他のスタイル
      },
    ])
  );
}
```

#### Task 2.2: 動的Zodバリデーター
- [ ] `src/lib/status-utils.ts` に追加
- [ ] `createStatusValidator(statuses: TaskStatusConfig[])` 関数を実装
- [ ] プロジェクトのステータスキーに基づくZodスキーマを動的生成

```typescript
export function createStatusValidator(statuses: TaskStatusConfig[]) {
  const keys = statuses.map((s) => s.key) as [string, ...string[]];
  return z.enum(keys);
}
```

---

### Phase 3: Server Actions修正

#### Task 3.1: task-actions.ts のバリデーション修正
- [ ] `src/actions/task-actions.ts` を修正
- [ ] `createTask`: 動的バリデーションに変更
- [ ] `updateTask`: 動的バリデーションに変更
- [ ] `updateTaskStatus`: 動的バリデーションに変更

**対象箇所:**
- Line 15: `createTaskSchema` のstatus enum
- Line 26: `updateTaskStatusSchema` のstatus enum
- Line 124: `updateTaskSchema` のstatus enum

---

### Phase 4: クエリ修正

#### Task 4.1: getTasksByStatus の動的化
- [ ] `src/db/queries/tasks.ts` を修正
- [ ] ハードコードされたステータス配列を削除
- [ ] プロジェクトのステータス一覧を使用

```typescript
export async function getTasksByStatus(projectId: string): Promise<TasksByStatus> {
  const [allTasks, statuses] = await Promise.all([
    getTasksWithRelations(projectId),
    getProjectStatuses(projectId),
  ]);

  return Object.fromEntries(
    statuses.map((status) => [
      status.key,
      allTasks.filter((t) => t.status === status.key),
    ])
  );
}
```

---

### Phase 5: UIコンポーネント修正

#### Task 5.1: add-task-dialog.tsx 修正
- [ ] `src/components/tasks/add-task-dialog.tsx` を修正
- [ ] props で `statuses: TaskStatusConfig[]` を受け取る
- [ ] ステータスセレクトを動的に生成
- [ ] Zodスキーマを動的生成

#### Task 5.2: edit-task-dialog.tsx 修正
- [ ] `src/components/tasks/edit-task-dialog.tsx` を修正
- [ ] props で `statuses: TaskStatusConfig[]` を受け取る
- [ ] ステータスセレクトを動的に生成
- [ ] Zodスキーマを動的生成

#### Task 5.3: task-status-badge.tsx 修正
- [ ] `src/components/tasks/task-status-badge.tsx` を修正
- [ ] props で設定を受け取るか、ステータスオブジェクトを直接受け取る
- [ ] `TASK_STATUS_CONFIG` への依存を削除

#### Task 5.4: board-column.tsx 修正
- [ ] `src/components/board/board-column.tsx` を修正
- [ ] props でステータス設定を受け取る
- [ ] `TASK_STATUS_CONFIG` への依存を削除

#### Task 5.5: board-view.tsx 修正
- [ ] `src/components/board/board-view.tsx` を修正
- [ ] `STATUS_ORDER` ハードコードを削除
- [ ] props で `statuses: TaskStatusConfig[]` を受け取る
- [ ] `displayOrder` でソートして使用

---

### Phase 6: ページ修正

#### Task 6.1: tasks/page.tsx 修正
- [ ] `src/app/projects/[projectId]/tasks/page.tsx` を修正
- [ ] ステータス一覧を取得してコンポーネントに渡す

#### Task 6.2: board/page.tsx 修正
- [ ] `src/app/projects/[projectId]/board/page.tsx` を修正
- [ ] ステータス一覧を取得してコンポーネントに渡す

#### Task 6.3: gantt/page.tsx 修正（必要に応じて）
- [ ] ガントチャートでステータス表示がある場合は修正

---

### Phase 7: 設定画面の改善

#### Task 7.1: status-management.tsx 改善
- [ ] `src/components/settings/status-management.tsx` を修正
- [ ] デフォルトステータス（4種）は削除不可にする
- [ ] 表示順のドラッグ＆ドロップ対応（オプション）

---

### Phase 8: 定数ファイルのクリーンアップ

#### Task 8.1: constants.ts 整理
- [ ] `src/lib/constants.ts` を修正
- [ ] `TASK_STATUS_CONFIG` を削除またはフォールバック用に保持
- [ ] 動的設定への移行完了後に削除

---

## 影響ファイル一覧

| ファイル | 修正内容 | 優先度 |
|---------|---------|--------|
| `src/db/seed.ts` | デフォルトステータス追加 | HIGH |
| `src/db/queries/statuses.ts` | クエリ拡張 | HIGH |
| `src/db/queries/tasks.ts` | getTasksByStatus動的化 | HIGH |
| `src/lib/status-utils.ts` | 新規作成 | HIGH |
| `src/actions/task-actions.ts` | バリデーション修正 | HIGH |
| `src/components/tasks/add-task-dialog.tsx` | 動的ステータス対応 | HIGH |
| `src/components/tasks/edit-task-dialog.tsx` | 動的ステータス対応 | HIGH |
| `src/components/board/board-view.tsx` | STATUS_ORDER削除 | HIGH |
| `src/components/board/board-column.tsx` | 動的設定対応 | MEDIUM |
| `src/components/tasks/task-status-badge.tsx` | 動的設定対応 | MEDIUM |
| `src/app/projects/[projectId]/tasks/page.tsx` | ステータス取得追加 | MEDIUM |
| `src/app/projects/[projectId]/board/page.tsx` | ステータス取得追加 | MEDIUM |
| `src/components/settings/status-management.tsx` | デフォルト保護 | LOW |
| `src/lib/constants.ts` | TASK_STATUS_CONFIG整理 | LOW |

---

## 注意事項

1. **後方互換性**: 既存の課題データは `open`, `in_progress`, `resolved`, `closed` を使用している。これらのキーは維持する。
2. **マイグレーション**: DBスキーマの変更は不要（task_statusesテーブルは既存）。シードデータの追加のみ。
3. **パフォーマンス**: ステータス取得は頻繁に行われるため、必要に応じてキャッシュを検討。

---

## テスト項目

- [ ] デフォルトステータスで課題を作成できる
- [ ] カスタムステータスを追加できる
- [ ] カスタムステータスで課題を作成できる
- [ ] ボード画面にカスタムステータスのカラムが表示される
- [ ] ステータス変更が正常に動作する
- [ ] デフォルトステータスは削除できない

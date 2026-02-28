# 追加機能タスク（v2）

## 概要

v1（初期実装）で構築した6画面に対する機能拡張タスク。

---

## Task 1: 課題編集機能の追加

### 背景
現在、課題の新規追加（AddTaskDialog）は実装済みだが、既存の課題を編集する手段がない。

### 要件
- 課題一覧テーブルの行クリック、またはアクションメニューから編集ダイアログを開く
- 編集ダイアログは AddTaskDialog と同等のフィールドを持つ（件名、詳細、状態、優先度、担当者、カテゴリー、開始日、期限日）
- 既存の値がフォームにプリセットされる
- Server Action `updateTask` を実装し、revalidatePath で再描画

### 実装方針
1. `src/actions/task-actions.ts` に `updateTask` Server Action を追加
2. `src/components/tasks/edit-task-dialog.tsx` を新規作成
   - React Hook Form + Zod バリデーション
   - TaskWithRelations を受け取り defaultValues にセット
3. `src/components/tasks/task-table.tsx` に行クリックまたはアクションボタンで編集ダイアログを開くトリガーを追加
4. ボード画面のカードからも編集できるようにする（任意）

### 影響範囲
- `src/actions/task-actions.ts`
- `src/components/tasks/edit-task-dialog.tsx`（新規）
- `src/components/tasks/task-table.tsx`
- `src/types/index.ts`（必要に応じて型追加）

---

## Task 2: ボード画面のドラッグ&ドロップ実装（dnd-kit）

### 背景
ボード画面（カンバン）でカードをドラッグ&ドロップして状態（open → in_progress → resolved → closed）を変更したい。

### 要件
- `@dnd-kit/core` + `@dnd-kit/sortable` を使用
- カードを別の状態カラムにドラッグ&ドロップすると、その課題の status が更新される
- 同一カラム内での並び替えは対象外（status 変更のみ）
- ドロップ時に Server Action `updateTaskStatus` を呼び出す（既存）
- ドラッグ中のビジュアルフィードバック（オーバーレイ、ドロップ先ハイライト）

### 実装方針
1. `pnpm add @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities`
2. `src/components/board/board-view.tsx` を DndContext でラップ
   - onDragEnd で新しい status を判定し、updateTaskStatus を呼ぶ
   - DragOverlay でドラッグ中のカードプレビューを表示
3. `src/components/board/board-column.tsx` を useDroppable に対応
4. `src/components/board/board-card.tsx` を useDraggable に対応
5. Optimistic UI: ドラッグ直後にローカル state を更新し、Server Action 完了後に revalidate

### 影響範囲
- `package.json`（dnd-kit 追加）
- `src/components/board/board-view.tsx`
- `src/components/board/board-column.tsx`
- `src/components/board/board-card.tsx`

---

## Task 3: ガントチャートのドラッグ&ドロップ実装（dnd-kit）

### 背景
ガントチャートのバーをドラッグして課題の開始日・期限日を視覚的に変更したい。

### 要件
- `@dnd-kit/core` を使用（Task 2 で導入済み想定）
- ガントバーの左右ドラッグで開始日・期限日を変更
  - バー全体のドラッグ: 開始日と期限日を同時にスライド（期間は維持）
  - バー右端のリサイズ: 期限日のみ変更
  - バー左端のリサイズ: 開始日のみ変更（任意、優先度低）
- ドロップ時に Server Action で日付を更新
- 日付はタイムラインのグリッド（1日単位）にスナップ

### 実装方針
1. `src/actions/task-actions.ts` に `updateTaskDates` Server Action を追加
2. `src/components/gantt/gantt-bar.tsx` を新規作成（既存の GanttTimeline 内のバー部分を分離）
   - useDraggable でバー全体のドラッグ
   - リサイズハンドル（右端）でdueDate変更
3. `src/components/gantt/gantt-timeline.tsx` を DndContext でラップ
   - onDragEnd でピクセル移動量から日数を計算し、日付を更新
4. ドラッグ中のスナップ処理（modifiers で1日幅にスナップ）
5. Optimistic UI: ドラッグ中にバー位置をリアルタイム更新

### 影響範囲
- `src/actions/task-actions.ts`
- `src/components/gantt/gantt-bar.tsx`（新規）
- `src/components/gantt/gantt-timeline.tsx`
- `src/components/gantt/gantt-view.tsx`

---

## 実装順序

1. **Task 1**（課題編集）→ 他のタスクに依存しない基本機能
2. **Task 2**（ボード dnd-kit）→ dnd-kit ライブラリ導入 + 比較的シンプルなドラッグ
3. **Task 3**（ガントチャート dnd-kit）→ dnd-kit を活用した高度なドラッグ操作

## 共通の技術要件

- TypeScript strict mode 準拠
- Server Actions + revalidatePath パターンを踏襲
- Zod バリデーション使用
- Optimistic UI によるレスポンシブな操作体験
- コメントは日本語

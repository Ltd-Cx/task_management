# 追加機能タスク（v3）

## 概要

v2実装後に判明した改善タスク。ボードのスクロール修正、ステータスカスタマイズ機能、ガントチャートの操作性改善。

---

## Task 1: ボードのカラム単位スクロール

### 問題
ボード画面でカードが増えるとページ全体がスクロールされてしまう。各ステータスカラム内で独立してスクロールさせたい。

### 原因
`board-view.tsx` の外側コンテナに高さ制限がなく、`board-column.tsx` の `ScrollArea` の `flex-1` が親の高さ制約なしでは機能しない。

### 実装方針
1. `board-view.tsx` のコンテナに `h-full overflow-hidden` を適用し、カラム全体がビューポートの残りの高さを使い切るようにする
2. `board-column.tsx` で `ScrollArea` に `max-h` を設定するのではなく、flex レイアウトで自然にカラム高さを制限する
3. `board/page.tsx` の外側 div を `flex-1 overflow-hidden` にして高さの伝搬を保証

### 影響範囲
- `src/app/projects/[projectId]/board/page.tsx` — 外側コンテナの高さ制御
- `src/components/board/board-view.tsx` — `flex h-full` で高さ制約
- `src/components/board/board-column.tsx` — `min-h-0` + `overflow-y-auto` でカラム内スクロール

---

## Task 2: ステータスの種類追加機能

### 背景
現在ステータスは `task_status` PostgreSQL Enum（open, in_progress, resolved, closed）で固定されている。プロジェクト単位でカスタムステータスを追加・管理できるようにしたい。

### 実装方針

#### アプローチ: カスタムステータステーブル

DBの `pgEnum` はALTER TYPEが必要で運用が難しいため、`task_statuses` テーブルをプロジェクト単位で管理する方式にする。

1. **DB スキーマ変更**
   - `task_statuses` テーブルを新規作成
     - `id` (uuid, PK)
     - `projectId` (uuid, FK → projects)
     - `key` (text) — 内部識別子（例: "open", "review"）
     - `label` (text) — 表示名（例: "未対応", "レビュー中"）
     - `color` (text) — ドットカラー（例: "#EF4444"）
     - `displayOrder` (integer) — 表示順
     - `isDefault` (boolean) — 新規タスク作成時のデフォルトか
   - `tasks.status` カラムを `text` に変更し、`task_statuses.key` を参照する方式に
   - マイグレーション: 既存の enum 値（open, in_progress, resolved, closed）を初期データとして `task_statuses` に INSERT

2. **Server Actions**
   - `src/actions/status-actions.ts` を新規作成
     - `createStatus` — 新しいステータスを追加
     - `updateStatus` — ラベル・色・順序を変更
     - `deleteStatus` — 使用中の課題がなければ削除可能
     - `reorderStatuses` — 表示順の一括更新

3. **UI**
   - プロジェクト設定ページにステータス管理セクションを追加
   - ドラッグ&ドロップで並び替え（dnd-kit 使用）
   - ステータス追加ダイアログ（名前 + カラーピッカー）
   - ボード画面は `task_statuses` テーブルの `displayOrder` 順でカラムを動的生成
   - `TASK_STATUS_CONFIG` 定数の代わりにDBから取得した設定を使用

4. **影響が広い変更**
   - `TaskStatus` 型がリテラル union からstring型に変更
   - `TASK_STATUS_CONFIG` は初期値として残し、DB未設定時のフォールバックとする
   - ボード、課題一覧、ガントチャートのステータス参照箇所をすべてDB参照に変更
   - `TasksByStatus` 型を `Record<string, TaskWithRelations[]>` に変更

### 影響範囲
- `src/db/schema.ts` — taskStatuses テーブル追加、tasks.status を text に変更
- `supabase/migrations/` — マイグレーション SQL
- `src/types/index.ts` — TaskStatus 型変更
- `src/actions/status-actions.ts` — 新規
- `src/db/queries/statuses.ts` — 新規
- `src/components/settings/status-management.tsx` — 新規
- `src/components/board/board-view.tsx` — 動的カラム生成
- `src/components/tasks/add-task-dialog.tsx` — ステータス選択をDBから
- `src/components/tasks/edit-task-dialog.tsx` — 同上
- `src/lib/constants.ts` — TASK_STATUS_CONFIG をフォールバック化

---

## Task 3: ガントチャートの表示範囲拡張（動的ロード）

### 問題
現在、タイムラインは固定の1週間（7日）表示で、タスクバーのドラッグ先がその範囲内に限定される。バーを端まで移動しても、表示範囲外への移動ができない。

### 実装方針

#### アプローチ: 月単位表示 + 自動スクロール

1週間表示を**可変期間表示**に変更し、バーのドラッグが端に近づいたら自動でスクロール・範囲拡張する。

1. **表示期間の拡張**
   - `getWeekDates` の代わりに `getDateRange(start, days)` ユーティリティを追加
   - デフォルト表示を4週間（28日）に拡張
   - 前後ボタンで1週間ずつスライド（現状維持）

2. **自動スクロール**
   - ドラッグ中にバーがタイムライン右端 or 左端に近づいた（100px以内）場合、`setInterval` で表示範囲を自動拡張
   - `onDragMove` イベントでカーソル位置を監視
   - 拡張時は `weekStart` を前にずらすか、表示日数を増やす

3. **スクロール対応**
   - タイムラインコンテナに `overflow-x: auto` を維持
   - 日付カラム幅を固定（例: 40px/日）にし、全体幅 = 日数 × 40px
   - スクロール位置を今日の日付付近に初期セット

### 影響範囲
- `src/lib/date.ts` — `getDateRange` ユーティリティ追加
- `src/components/gantt/gantt-view.tsx` — 表示期間の state 管理変更
- `src/components/gantt/gantt-timeline.tsx` — 固定日数 → 可変日数対応、自動スクロール
- `src/components/gantt/gantt-task-list.tsx` — 行の高さ同期維持

---

## Task 4: ガントチャートのバー左右リサイズ

### 問題
現在は右端のリサイズハンドルのみ実装されている。Backlogと同様に左端もドラッグして開始日を変更できるようにしたい。

### 実装方針

1. **左端リサイズハンドル追加**
   - `gantt-bar.tsx` の左端に `cursor-col-resize` のハンドル要素を追加
   - `onPointerDown` でリサイズ開始、`pointermove` で追跡、`pointerup` で確定
   - 左リサイズは `startDate` を変更（`dueDate` は固定）

2. **リサイズコールバックの拡張**
   - 現在の `onResize(taskId, deltaDays)` を `onResize(taskId, deltaDays, edge: "left" | "right")` に変更
   - `gantt-timeline.tsx` の `handleResize` で edge に応じて startDate / dueDate を計算
   - 左リサイズ: `dueDate` より後にはさせない
   - 右リサイズ: `startDate` より前にはさせない（既存の制約維持）

3. **リサイズ中のプレビュー**
   - PointerMove中にバー幅をリアルタイムで変更（CSS transform or width 変更）
   - PointerUp時に確定して Server Action 呼び出し

### 影響範囲
- `src/components/gantt/gantt-bar.tsx` — 左端ハンドル追加、edge パラメータ追加
- `src/components/gantt/gantt-timeline.tsx` — handleResize の edge 分岐

---

## 実装順序

1. **Task 1**（ボードスクロール修正）→ CSS変更のみ、即座に効果あり
2. **Task 4**（ガントバー左右リサイズ）→ 既存コードの小規模拡張
3. **Task 3**（ガントチャート表示範囲拡張）→ タイムライン表示ロジックの改修
4. **Task 2**（ステータス追加機能）→ DB変更を伴う大規模変更、最後に実施

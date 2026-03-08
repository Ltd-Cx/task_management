# ガントチャート実装調査レポート

## 調査対象
- リポジトリ: `/Users/torii_hideya/Desktop/develop/Ltd.Cx/sample_todo_gantt`
- 主要ファイル: `public/index.html`（2573行）

---

## 1. パッケージ・ライブラリ使用状況

### 結論: **外部ライブラリ不使用（完全Vanilla JS実装）**

```json
// package.json - dependencies
{
  "dependencies": {
    "hono": "^4.11.8"  // バックエンドAPIのみ
  },
  "devDependencies": {
    "@hono/vite-build": "^1.2.0",
    "@hono/vite-cloudflare-pages": "^0.4.3",
    "@hono/vite-dev-server": "^0.18.2",
    "vite": "^6.3.5",
    "wrangler": "^4.0.0"
  }
}
```

### 使用していないライブラリ
以下のような一般的なガントチャートライブラリは**一切使用していない**:
- ❌ dhtmlxGantt
- ❌ Frappe Gantt
- ❌ GANTT.js
- ❌ React Gantt / Vue Gantt系
- ❌ FullCalendar
- ❌ vis-timeline

### 実装アプローチ
- **純粋なVanilla JavaScript + CSS**
- **外部依存なし**でドラッグ&ドロップ、リサイズ、タイムライン描画を実装
- **フレームワークなし**（React/Vue/Angular不使用）

---

## 2. 実装方法

### 2.1 基本定数

```javascript
const CELL_WIDTH = 25;  // 1日 = 25px
```

### 2.2 コアアーキテクチャ

#### データ構造
```javascript
let tasks = [];           // タスク配列
let projects = [];        // プロジェクト配列
let assignees = [];       // 対応者配列
let collapsedProjects = {};  // 折りたたみ状態
let draggedTask = null;   // ドラッグ中のタスク
let resizeMode = null;    // 'left' | 'right' | null
```

#### タスクオブジェクト構造
```javascript
{
  id: number,              // タイムスタンプベースID
  title: string,
  projectId: number | null,
  assignee: string,
  assigneeId: number | null,
  description: string,
  descriptionImages: string[],  // Base64
  images: string[],             // Base64
  urls: string[],
  startDate: string,       // 'YYYY-MM-DD'
  endDate: string,         // 'YYYY-MM-DD'
  priority: 'high' | 'medium' | 'low',
  progress: number,        // 0-100
  memo: string,
  createdAt: string        // ISO8601
}
```

### 2.3 ドラッグ&ドロップ実装

#### イベントハンドラ構成
```javascript
// 1. マウスダウン - ドラッグ開始
function onTaskBarMouseDown(event, taskId, timelineStartDate) {
  draggedTask = {
    id: taskId,
    originalStartDate: task.startDate,
    originalEndDate: task.endDate,
    timelineStartDate: timelineStartDate
  };
  dragStartX = event.clientX;
  dragStartLeft = parseInt(event.currentTarget.style.left);
  dragStartWidth = parseInt(event.currentTarget.style.width);
  dragHasMoved = false;

  document.addEventListener('mousemove', onTaskBarMouseMove);
  document.addEventListener('mouseup', onTaskBarMouseUp);
}

// 2. マウスムーブ - ドラッグ中の位置更新
function onTaskBarMouseMove(event) {
  const deltaX = event.clientX - dragStartX;

  // 5px以上動いたらドラッグとみなす（クリック誤検知防止）
  if (Math.abs(deltaX) > 5) {
    dragHasMoved = true;
  }

  if (dragHasMoved) {
    taskBar.classList.add('dragging');
    // 位置をリアルタイム更新
    taskBar.style.left = Math.max(0, dragStartLeft + deltaX) + 'px';
  }
}

// 3. マウスアップ - ドラッグ確定・日付更新
function onTaskBarMouseUp(event) {
  if (dragHasMoved) {
    const deltaX = event.clientX - dragStartX;
    const daysDelta = Math.round(deltaX / CELL_WIDTH);

    // 日付を更新
    const startDate = new Date(task.startDate);
    const endDate = new Date(task.endDate);
    startDate.setDate(startDate.getDate() + daysDelta);
    endDate.setDate(endDate.getDate() + daysDelta);

    task.startDate = startDate.toISOString().split('T')[0];
    task.endDate = endDate.toISOString().split('T')[0];
    saveTasks();
  } else {
    // ドラッグなし = クリック = 詳細表示
    showTaskDetail(taskId);
  }

  // クリーンアップ
  document.removeEventListener('mousemove', onTaskBarMouseMove);
  document.removeEventListener('mouseup', onTaskBarMouseUp);
  draggedTask = null;
}
```

### 2.4 両端リサイズ実装

```javascript
// リサイズハンドル生成
const leftHandle = document.createElement('div');
leftHandle.className = 'task-bar-resize-handle left';
leftHandle.onmousedown = (e) => onResizeHandleMouseDown(e, task.id, timelineStartDate, 'left');

const rightHandle = document.createElement('div');
rightHandle.className = 'task-bar-resize-handle right';
rightHandle.onmousedown = (e) => onResizeHandleMouseDown(e, task.id, timelineStartDate, 'right');

// リサイズ処理
function onTaskBarMouseMove(event) {
  if (resizeMode === 'left') {
    // 左端リサイズ: 開始日を変更（完了日固定）
    const newLeft = Math.max(0, dragStartLeft + deltaX);
    const newWidth = Math.max(CELL_WIDTH, dragStartWidth - deltaX);
    taskBar.style.left = newLeft + 'px';
    taskBar.style.width = newWidth + 'px';
  } else if (resizeMode === 'right') {
    // 右端リサイズ: 完了日を変更（開始日固定）
    const newWidth = Math.max(CELL_WIDTH, dragStartWidth + deltaX);
    taskBar.style.width = newWidth + 'px';
  } else {
    // 通常の移動: 両方の日付を同時に変更
    taskBar.style.left = Math.max(0, dragStartLeft + deltaX) + 'px';
  }
}
```

#### バリデーション
```javascript
// 左端リサイズ時: 開始日が完了日を超えないようチェック
if (newStartDateStr <= task.endDate) {
  task.startDate = newStartDateStr;
}

// 右端リサイズ時: 完了日が開始日より前にならないようチェック
if (newEndDateStr >= task.startDate) {
  task.endDate = newEndDateStr;
}
```

### 2.5 タスクバー位置計算

```javascript
function createTaskBar(task, timelineStartDate) {
  const taskStartDate = new Date(task.startDate);
  const taskEndDate = new Date(task.endDate);

  // 開始位置（左からのオフセット）
  const startOffset = Math.max(0,
    Math.ceil((taskStartDate - timelineStartDate) / (1000 * 60 * 60 * 24))
  );

  // タスクの期間（日数）
  const duration = Math.ceil(
    (taskEndDate - taskStartDate) / (1000 * 60 * 60 * 24)
  ) + 1;

  taskBar.style.left = `${startOffset * CELL_WIDTH}px`;
  taskBar.style.width = `${duration * CELL_WIDTH - 4}px`;  // -4px は余白
}
```

### 2.6 タイムラインヘッダー生成

```javascript
function renderGanttChart(filteredTasks, viewStartDate, viewEndDate) {
  const startDate = new Date(viewStartDate);
  const endDate = new Date(viewEndDate);

  // 日付配列を生成
  const dates = [];
  const current = new Date(startDate);
  while (current <= endDate) {
    dates.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }

  // 月表示行を生成
  dates.forEach((date, index) => {
    const monthKey = `${date.getFullYear()}-${date.getMonth() + 1}`;
    // 月が変わったら新しいセルを追加
  });

  // 日付行を生成
  dates.forEach(date => {
    const dateStr = date.toISOString().split('T')[0];
    const dayOfWeek = date.getDay();

    // 今日・土曜・日曜にクラスを付与
    if (dateStr === today) headerCell.classList.add('today');
    else if (dayOfWeek === 0) headerCell.classList.add('sunday');
    else if (dayOfWeek === 6) headerCell.classList.add('saturday');
  });
}
```

### 2.7 プロジェクトグループ化・折りたたみ

```javascript
// プロジェクトごとにグループ化
const groupedTasks = {};
filteredTasks.forEach(task => {
  const key = task.projectId || 'none';
  if (!groupedTasks[key]) {
    groupedTasks[key] = [];
  }
  groupedTasks[key].push(task);
});

// 折りたたみ状態管理
let collapsedProjects = {};

function toggleProject(projectKey) {
  collapsedProjects[projectKey] = !collapsedProjects[projectKey];
  filterAndSort();  // 再描画
}
```

### 2.8 データ永続化

```javascript
// LocalStorage使用
function saveTasks() {
  localStorage.setItem('tasks', JSON.stringify(tasks));
}

function loadData() {
  const savedTasks = localStorage.getItem('tasks');
  if (savedTasks) {
    tasks = JSON.parse(savedTasks);
  }
}
```

---

## 3. UI実装詳細

### 3.1 レイアウト構造

```
┌─────────────────────────────────────────────────────────────┐
│ コントロールバー（フィルター、ボタン）                         │
├──────────────────┬──────────────────────────────────────────┤
│ タスク情報列      │ タイムライン                              │
│ (固定: 400px)    │ (スクロール可能)                          │
├──────────────────┼──────────────────────────────────────────┤
│ タスク名 │担当│進捗│ │1月                    │2月           │ ← 月表示
│          │    │    │ │1 2 3 4 5 6 7 8 9...   │1 2 3...     │ ← 日表示
├──────────────────┼──────────────────────────────────────────┤
│ PROJECT A (3)  ▼ │ ───────────────────────────────────────── │ ← プロジェクトヘッダー
│  タスク1 │田中│50%│ │   [████████████]                       │ ← タスクバー
│  タスク2 │鈴木│80%│ │          [████████]                    │
├──────────────────┼──────────────────────────────────────────┤
│ PROJECT B (2)  ▼ │ ───────────────────────────────────────── │
│  タスク3 │佐藤│20%│ │ [████]                                 │
└──────────────────┴──────────────────────────────────────────┘
```

### 3.2 主要CSS

#### ガントチャート全体
```css
.gantt-chart {
  display: flex;
  position: relative;
  overflow-y: visible;
  max-height: none;
  min-height: calc(100vh - 250px);
}
```

#### 左側タスク情報列（固定）
```css
.task-info-column {
  width: 400px;
  flex-shrink: 0;
  background: #fafafa;
  border-right: 1px solid #e5e5e5;
  position: sticky;
  left: 0;
  z-index: 200;
}

.task-info-header {
  height: 85px;
  display: grid;
  grid-template-columns: 2.5fr 1.5fr 1fr;  /* タスク名 | 担当者 | 進捗 */
  position: sticky;
  top: 0;
  z-index: 101;
}

.task-info-row {
  height: 55px;
  display: grid;
  grid-template-columns: 2.5fr 1.5fr 1fr;
}
```

#### 右側タイムライン（スクロール可能）
```css
.timeline-column {
  flex: 1;
  overflow-x: auto;
  overflow-y: visible;
}

.timeline-header {
  position: sticky;
  top: 0;
  z-index: 100;
}
```

#### 日付セル
```css
.date-cell {
  min-width: 20px;
  width: 25px;              /* CELL_WIDTH と一致 */
  border-right: 1px solid #ecf0f1;
}

.date-cell.today {
  background: #62a3ff;      /* 今日: 青色 */
  color: white;
}

.date-cell.sunday {
  background: #ffebe1;      /* 日曜: 淡いオレンジ */
}

.date-cell.saturday {
  background: #e5ecf3;      /* 土曜: 淡いブルー */
}
```

#### タスクバー
```css
.task-bar {
  position: absolute;
  height: 35px;
  top: 10px;
  border-radius: 100px;     /* 角丸 */
  cursor: move;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  user-select: none;
  z-index: 10;
}

.task-bar:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
  transform: translateY(-1px);
  z-index: 20;
}

.task-bar.dragging {
  opacity: 0.7;
  cursor: grabbing;
  z-index: 30;
}
```

#### リサイズハンドル
```css
.task-bar-resize-handle {
  position: absolute;
  top: 0;
  width: 10px;
  height: 100%;
  z-index: 15;
  cursor: ew-resize;
}

.task-bar-resize-handle.left {
  left: 0;
  cursor: w-resize;
}

.task-bar-resize-handle.right {
  right: 0;
  cursor: e-resize;
}

.task-bar-resize-handle:hover {
  background: rgba(255,255,255,0.3);
}
```

#### 進捗バー（タスクバー内）
```css
.task-bar-progress {
  position: absolute;
  bottom: 0;
  left: 0;
  top: 0;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 100px;
  z-index: 1;
}
```

#### プロジェクトグループ
```css
.project-header {
  height: 35px;
  cursor: pointer;
  text-transform: uppercase;
}

.project-tasks.collapsed {
  display: none;
}
```

### 3.3 インタラクション一覧

| 操作 | 動作 |
|------|------|
| タスクバー ドラッグ | 期間全体を移動（開始日・完了日同時変更） |
| タスクバー 左端ドラッグ | 開始日のみ変更（完了日固定） |
| タスクバー 右端ドラッグ | 完了日のみ変更（開始日固定） |
| タスクバー クリック | タスク詳細モーダル表示 |
| タスクバー ダブルクリック | タスク詳細モーダル表示 |
| プロジェクトヘッダー クリック | タスク一覧の折りたたみ/展開 |
| 進捗率 クリック | プルダウンで進捗変更 |
| タイムライン空白 ドラッグ | 横スクロール |

### 3.4 カラースキーム

```javascript
// プロジェクトカラーパレット
const colors = [
  '#3498db',  // 青
  '#2ecc71',  // 緑
  '#e74c3c',  // 赤
  '#f39c12',  // オレンジ
  '#9b59b6',  // 紫
  '#1abc9c',  // ティール
  '#34495e',  // ダークグレー
  '#e91e63',  // ピンク
  '#95a5a6'   // グレー（デフォルト）
];

// タスクバーの色はプロジェクトカラーを継承
if (project && project.color) {
  taskBar.style.background = project.color;
} else {
  taskBar.style.background = '#95a5a6';  // プロジェクトなし
}
```

---

## 4. 特徴・ポイント

### 4.1 メリット
1. **軽量**: 外部ライブラリなしで約2500行
2. **カスタマイズ性**: すべてのUIをCSSで調整可能
3. **パフォーマンス**: DOM操作のみ、仮想DOMなし
4. **学習コスト**: 標準的なDOM APIのみ使用

### 4.2 実装上の工夫
1. **クリック誤検知防止**: 5px以上移動でドラッグと判定
2. **最小幅保証**: `Math.max(CELL_WIDTH, ...)` で1日未満を防止
3. **日付バリデーション**: 開始日 > 完了日 を防止
4. **z-index管理**: ドラッグ中のタスクを最前面に

### 4.3 制限事項
1. **サブタスク未対応**: 階層構造なし
2. **依存関係未対応**: タスク間の矢印なし
3. **マイルストーン未対応**: 期間なしの点表示なし
4. **リソース表示未対応**: 担当者別のビューなし

---

## 5. 移植時の考慮点

### React/Next.js への移植時
1. **状態管理**: `useState` / `useReducer` でタスク・プロジェクト管理
2. **イベントハンドリング**: `onMouseDown`, `onMouseMove`, `onMouseUp` をReact流に
3. **DOM参照**: `useRef` でタスクバー要素を参照
4. **パフォーマンス**: `useMemo`, `useCallback` で再レンダリング最適化
5. **ライブラリ検討**: react-dnd, @dnd-kit/core の使用も選択肢

### 推奨ライブラリ（参考）
- **react-big-calendar**: カレンダー表示
- **@dnd-kit/core**: モダンなドラッグ&ドロップ
- **date-fns**: 日付計算ユーティリティ
- **Tailwind CSS**: スタイリング

---

## 6. ファイルサイズ・行数

| ファイル | 行数 | 役割 |
|---------|------|------|
| `public/index.html` | 2,573行 | フロントエンド全体（HTML+CSS+JS） |
| `src/index.ts` | ~200行 | バックエンドAPI（Hono） |

### コード構成（index.html内）
- **HTML**: 1-1248行（約50%）
- **CSS（style内）**: 7-974行（約40%）
- **JavaScript**: 1249-2572行（約50%）

---

## 7. まとめ

| 項目 | 内容 |
|------|------|
| **ライブラリ** | 不使用（完全Vanilla JS） |
| **実装方式** | DOM操作 + マウスイベント |
| **ドラッグ機能** | 移動 + 両端リサイズ |
| **グループ化** | プロジェクト単位 + 折りたたみ |
| **データ保存** | LocalStorage |
| **1日の幅** | 25px（CELL_WIDTH） |
| **特徴** | 軽量、カスタマイズ性高、学習コスト低 |

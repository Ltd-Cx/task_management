# ガントチャートライブラリ移行タスク

## 概要

現在の SVAR React Gantt から rc-gantt ライブラリへ移行する。

### 移行理由

- SVAR React Gantt の行ドラッグ時に、タスク課題番号がヘッダーまで上がるUI/UX問題
- イベントハンドラやCSSでの制御が困難

---

## 新ライブラリ情報

### rc-gantt

- **GitHub**: https://github.com/ahwgs/react-gantt
- **ドキュメント**: https://ahwgs.github.io/react-gantt/en-US
- **TypeScript**: 対応

### インストール

```bash
pnpm add rc-gantt
```

### 基本的な使用方法

```tsx
import RcGantt, { GanttProps, enUS } from 'rc-gantt';

// コンテナに明示的な幅・高さが必要
<div style={{ width: '100%', height: 500 }}>
  <RcGantt
    data={tasks}
    columns={columns}
    locale={enUS}
    onUpdate={handleUpdate}
  />
</div>
```

### データフォーマット

```typescript
interface GanttTask {
  name: string;         // タスク名
  startDate: string;    // 開始日 (YYYY-MM-DD)
  endDate: string;      // 終了日 (YYYY-MM-DD)
  collapsed?: boolean;  // 子タスクの折りたたみ
  children?: GanttTask[];  // 子タスク
  content?: string;     // 追加情報
  // カスタムフィールド
  id?: string;
}
```

### カラム設定

```typescript
const columns = [
  {
    name: 'name',
    label: '課題',
    width: 300,
    // maxWidth, minWidth も指定可能
  },
];
```

### イベント

- **onUpdate**: `async (record, startDate, endDate) => boolean`
  - タスクの日付変更時に呼び出される
  - `true` を返すと変更を確定、`false` で取り消し

---

## 実装方針

### 1. 現在の実装を維持

現在の gantt-chart.tsx はそのまま保持し、新しいコンポーネントを別ファイルで作成。

### 2. 新コンポーネントの作成

`src/components/gantt/rc-gantt-chart.tsx` を新規作成。

### 3. gantt-view.tsx の変更

インポートを新しいコンポーネントに切り替え。

---

## タスク一覧

- [x] claudedocs にタスクドキュメント作成
- [ ] rc-gantt ライブラリをインストール
- [ ] rc-gantt-chart.tsx を新規作成
- [ ] TaskWithRelations から rc-gantt のデータ形式に変換
- [ ] 日付更新のコールバックを実装
- [ ] gantt-view.tsx のインポートを変更
- [ ] スタイリング調整

---

## データ変換

### TaskWithRelations → rc-gantt 形式

```typescript
// 現在の形式
interface TaskWithRelations {
  id: string;
  keyId: number;
  summary: string;
  startDate: string | null;  // "2024-01-15"
  dueDate: string | null;    // "2024-01-20"
  // ...
}

// rc-gantt 形式
interface RcGanttTask {
  id: string;
  name: string;      // `${projectKey}-${keyId} ${summary}`
  startDate: string; // "2024-01-15"
  endDate: string;   // "2024-01-20" (dueDateと同じ)
}
```

### 変換関数

```typescript
function convertToRcGanttTasks(
  tasks: TaskWithRelations[],
  projectKey: string
): RcGanttTask[] {
  return tasks
    .filter(t => t.startDate != null && t.dueDate != null)
    .map(t => ({
      id: t.id,
      name: `${projectKey}-${t.keyId} ${t.summary}`,
      startDate: t.startDate!,
      endDate: t.dueDate!,
    }));
}
```

---

## 注意事項

1. rc-gantt は日付終了時にコールバックで `startDate`, `endDate` を返す
2. SVAR では endDate を +1日して内部管理していたが、rc-gantt では終了日をそのまま使用
3. コンテナに明示的なサイズ指定が必要

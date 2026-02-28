# TipTapエディタ導入タスク

## 概要

課題の追加・編集フォームの詳細（description）フィールドを、現在のTextareaからWordPressライクなリッチテキストエディタ（TipTap）に置き換える。

## 現状分析

### 対象コンポーネント

| ファイル | 用途 |
|---------|------|
| `src/components/tasks/add-task-dialog.tsx` | 課題追加ダイアログ |
| `src/components/tasks/edit-task-dialog.tsx` | 課題編集ダイアログ |

### 現在の実装

```typescript
// 現在のdescriptionフィールド
<FormField
  control={form.control}
  name="description"
  render={({ field }) => (
    <FormItem>
      <FormLabel>詳細</FormLabel>
      <FormControl>
        <Textarea
          placeholder="課題の詳細を入力（任意）"
          className="min-h-[80px]"
          {...field}
        />
      </FormControl>
      <FormMessage />
    </FormItem>
  )}
/>
```

- Zod: `description: z.string().optional()`
- DB: `description: text("description")` (PostgreSQL text型、NULL許可)

### 技術スタック

| 項目 | バージョン |
|------|-----------|
| Next.js | 16.1.6 |
| React | 19.2.3 |
| TypeScript | 5 |
| React Hook Form | 7.71.2 |
| Zod | 4.3.6 |
| Tailwind CSS | 4 |
| shadcn/ui | 3.8.5 (new-york style) |

---

## TipTap導入計画

### Phase 1: パッケージインストール

**必須パッケージ:**
```bash
pnpm add @tiptap/react @tiptap/core @tiptap/starter-kit @tiptap/pm
```

**推奨拡張機能:**
```bash
# 基本フォーマット
pnpm add @tiptap/extension-placeholder
pnpm add @tiptap/extension-underline

# リンク
pnpm add @tiptap/extension-link

# 画像（将来対応）
# pnpm add @tiptap/extension-image

# メンション（将来対応）
# pnpm add @tiptap/extension-mention
```

**セキュリティ:**
```bash
pnpm add dompurify
pnpm add -D @types/dompurify
```

### Phase 2: TipTapEditorコンポーネント作成

**ファイル:** `src/components/ui/tiptap-editor.tsx`

**機能要件:**
- [ ] React Hook Form との統合（value/onChange）
- [ ] shadcn/ui テーマとの統合
- [ ] ツールバー（太字、斜体、下線、リスト、リンク）
- [ ] プレースホルダー対応
- [ ] 読み取り専用モード
- [ ] フォーカス状態のスタイリング

**ツールバー機能:**
| 機能 | キーボードショートカット | 優先度 |
|------|-------------------------|--------|
| 太字 | Cmd/Ctrl + B | 必須 |
| 斜体 | Cmd/Ctrl + I | 必須 |
| 下線 | Cmd/Ctrl + U | 必須 |
| 取り消し線 | - | 任意 |
| 見出し (H1-H3) | - | 必須 |
| 番号リスト | - | 必須 |
| 箇条書きリスト | - | 必須 |
| リンク | Cmd/Ctrl + K | 必須 |
| コードブロック | - | 任意 |
| 引用 | - | 任意 |
| 元に戻す/やり直す | Cmd/Ctrl + Z/Y | 必須 |

### Phase 3: フォーム統合

**AddTaskDialog / EditTaskDialog の変更:**

```typescript
// 変更後
import { TipTapEditor } from "@/components/ui/tiptap-editor";

<FormField
  control={form.control}
  name="description"
  render={({ field }) => (
    <FormItem>
      <FormLabel>詳細</FormLabel>
      <FormControl>
        <TipTapEditor
          value={field.value ?? ""}
          onChange={field.onChange}
          placeholder="課題の詳細を入力（任意）"
        />
      </FormControl>
      <FormMessage />
    </FormItem>
  )}
/>
```

### Phase 4: Server Actionのセキュリティ強化

**ファイル:** `src/actions/task-actions.ts`

**変更内容:**
- [ ] DOMPurify による HTML サニタイズ
- [ ] 許可タグのホワイトリスト定義
- [ ] 最大文字数バリデーション（HTML含む）

```typescript
import DOMPurify from "dompurify";

const ALLOWED_TAGS = [
  "p", "br", "strong", "em", "u", "s",
  "h1", "h2", "h3",
  "ul", "ol", "li",
  "a", "blockquote", "pre", "code"
];

function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS,
    ALLOWED_ATTR: ["href", "target", "rel"],
  });
}
```

### Phase 5: 表示コンポーネント更新

**課題詳細表示の更新:**
- [ ] HTML を安全にレンダリング
- [ ] スタイリング（prose クラス等）

```typescript
// 表示用コンポーネント
<div
  className="prose prose-sm max-w-none"
  dangerouslySetInnerHTML={{ __html: sanitizedDescription }}
/>
```

### Phase 6: テストと検証

- [ ] React 19 との互換性確認
- [ ] フォーム送信・保存テスト
- [ ] XSS 攻撃テスト
- [ ] モバイル対応確認
- [ ] アクセシビリティ確認

---

## 互換性チェックリスト

| 項目 | 状態 | 備考 |
|------|------|------|
| React 19 | 要確認 | TipTap v2 は React 18+ サポート |
| TypeScript 5 | ✅ | TipTap は型安全 |
| React Hook Form | ✅ | Controller ベースで統合可能 |
| shadcn/ui | ✅ | カスタムコンポーネントとして統合 |
| Tailwind CSS v4 | 要確認 | 最新版との互換性 |
| PostgreSQL text | ✅ | HTML 格納可能 |
| Server Action | ✅ | サニタイズ追加で対応 |

---

## リスクと対策

### 1. バンドルサイズ増加
- **リスク:** TipTap + extensions で 100KB+ 増加の可能性
- **対策:** dynamic import で遅延読み込み

### 2. React 19 互換性
- **リスク:** 最新React での未検証動作
- **対策:** インストール後に基本動作テスト

### 3. XSS 脆弱性
- **リスク:** ユーザー入力 HTML の危険性
- **対策:** DOMPurify による厳格なサニタイズ

### 4. 既存データ互換性
- **リスク:** 既存のプレーンテキストとの互換性
- **対策:** プレーンテキストはそのまま表示可能

---

## 実装順序

```
Phase 1: パッケージインストール
    ↓
Phase 2: TipTapEditorコンポーネント作成
    ↓
Phase 3: AddTaskDialog統合
    ↓
Phase 4: EditTaskDialog統合
    ↓
Phase 5: Server Actionセキュリティ強化
    ↓
Phase 6: 表示コンポーネント更新
    ↓
Phase 7: テスト・検証
```

---

## 将来拡張（スコープ外）

- ~~画像アップロード（Supabase Storage連携）~~ ✅ 実装済み
- メンション機能（@ユーザー名）
- マークダウンインポート/エクスポート
- 協調編集（Yjs + TipTap Collaboration）
- テンプレート機能

---

## ステータス

- [x] 調査完了
- [x] Phase 1: パッケージインストール
- [x] Phase 2: TipTapEditorコンポーネント作成
- [x] Phase 3: AddTaskDialog統合
- [x] Phase 4: EditTaskDialog統合
- [x] Phase 5: Server Actionセキュリティ強化
- [x] Phase 6: 表示コンポーネント更新
- [x] Phase 7: テスト・検証

---

## 参考リンク

- [TipTap公式ドキュメント](https://tiptap.dev/)
- [TipTap + React Hook Form統合例](https://tiptap.dev/docs/editor/getting-started/overview)
- [DOMPurify](https://github.com/cure53/DOMPurify)
- [shadcn/ui](https://ui.shadcn.com/)

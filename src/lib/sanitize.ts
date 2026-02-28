/** 許可するHTMLタグ */
const ALLOWED_TAGS = [
  // テキストフォーマット
  "p", "br", "strong", "b", "em", "i", "u", "s", "strike",
  // 見出し
  "h1", "h2", "h3",
  // リスト
  "ul", "ol", "li",
  // リンク
  "a",
  // 画像
  "img",
  // その他
  "blockquote", "pre", "code",
];

/** 許可する属性 */
const ALLOWED_ATTR = ["href", "target", "rel", "src", "alt", "class", "width", "height"];

/** 禁止する属性パターン */
const FORBIDDEN_ATTR_PATTERN = /\s(on\w+|style)\s*=/gi;

/** 禁止するタグパターン */
const FORBIDDEN_TAG_PATTERN = /<\s*(script|style|iframe|form|input)[^>]*>[\s\S]*?<\s*\/\s*\1\s*>|<\s*(script|style|iframe|form|input)[^>]*\/?>/gi;

/**
 * HTMLをサニタイズして安全な文字列を返す
 * サーバーサイドでも動作する軽量実装
 */
export function sanitizeHtml(html: string | undefined | null): string {
  if (!html) return "";

  let sanitized = html;

  // 危険なタグを除去
  sanitized = sanitized.replace(FORBIDDEN_TAG_PATTERN, "");

  // 危険な属性を除去
  sanitized = sanitized.replace(FORBIDDEN_ATTR_PATTERN, " ");

  // 許可されていないタグを除去（内容は保持）
  const allowedTagsPattern = ALLOWED_TAGS.join("|");
  const tagPattern = new RegExp(`<\\/?(?!(${allowedTagsPattern})\\b)[a-z][^>]*>`, "gi");
  sanitized = sanitized.replace(tagPattern, "");

  return sanitized;
}

/**
 * HTMLが空かどうかを判定
 * TipTapは空の場合に <p></p> を返すため、それも空として扱う
 */
export function isHtmlEmpty(html: string | undefined | null): boolean {
  if (!html) return true;

  // 画像タグが含まれている場合は空ではない
  if (/<img\s/i.test(html)) return false;

  // HTMLタグを除去してテキストのみを取得
  const textContent = html.replace(/<[^>]*>/g, "").trim();
  return textContent.length === 0;
}

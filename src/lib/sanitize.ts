import DOMPurify from "isomorphic-dompurify";

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

/**
 * HTMLをサニタイズして安全な文字列を返す
 */
export function sanitizeHtml(html: string | undefined | null): string {
  if (!html) return "";

  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    // target="_blank" のリンクに rel="noopener noreferrer" を自動追加
    ADD_ATTR: ["target"],
    FORBID_TAGS: ["script", "style", "iframe", "form", "input"],
    FORBID_ATTR: ["onclick", "onerror", "onload", "style"],
  });
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

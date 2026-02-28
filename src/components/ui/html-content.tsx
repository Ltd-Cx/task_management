"use client";

import { sanitizeHtml } from "@/lib/sanitize";
import { cn } from "@/lib/utils";

interface HtmlContentProps {
  html: string | null | undefined;
  className?: string;
}

/**
 * サニタイズされたHTMLを安全に表示するコンポーネント
 * TipTapエディタで作成されたコンテンツの表示に使用
 */
export function HtmlContent({ html, className }: HtmlContentProps) {
  if (!html) {
    return null;
  }

  const sanitized = sanitizeHtml(html);

  return (
    <div
      className={cn(
        "prose prose-sm max-w-none",
        "prose-headings:font-semibold prose-headings:mt-4 prose-headings:mb-2",
        "prose-p:my-1 prose-ul:my-1 prose-ol:my-1",
        "prose-a:text-primary prose-a:underline",
        "prose-img:my-2 prose-img:rounded-md prose-img:max-w-full",
        "dark:prose-invert",
        className
      )}
      dangerouslySetInnerHTML={{ __html: sanitized }}
    />
  );
}

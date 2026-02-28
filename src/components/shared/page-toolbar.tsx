import type { ReactNode } from "react";

interface PageToolbarProps {
  title: string;
  children?: ReactNode;
}

/** ページ上部のツールバー（タイトル + アクション） */
export function PageToolbar({ title, children }: PageToolbarProps) {
  return (
    <div className="flex items-center justify-between">
      <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
      {children && (
        <div className="flex items-center gap-2">{children}</div>
      )}
    </div>
  );
}

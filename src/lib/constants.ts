import type { TaskStatus, TaskPriority, UserRole } from "@/types";

/** ステータスのラベルと色定義 */
export const TASK_STATUS_CONFIG: Record<
  TaskStatus,
  { label: string; dotClass: string; bgClass: string; barClass: string; color: string }
> = {
  open: {
    label: "未対応",
    dotClass: "bg-neutral-400",
    bgClass: "bg-neutral-400/10 text-neutral-500 border-neutral-400/25",
    barClass: "bg-neutral-400",
    color: "#a3a3a3",
  },
  in_progress: {
    label: "処理中",
    dotClass: "bg-blue-500",
    bgClass: "bg-blue-500/10 text-blue-500 border-blue-500/25",
    barClass: "bg-blue-500",
    color: "#3b82f6",
  },
  resolved: {
    label: "処理済み",
    dotClass: "bg-amber-500",
    bgClass: "bg-amber-500/10 text-amber-600 border-amber-500/25",
    barClass: "bg-amber-500",
    color: "#f59e0b",
  },
  closed: {
    label: "完了",
    dotClass: "bg-green-500",
    bgClass: "bg-green-500/10 text-green-600 border-green-500/25",
    barClass: "bg-green-500",
    color: "#22c55e",
  },
};

/** 優先度のラベルと色定義 */
export const TASK_PRIORITY_CONFIG: Record<
  TaskPriority,
  { label: string; bgClass: string; variant: "destructive" | "outline" }
> = {
  high: {
    label: "高",
    bgClass: "bg-destructive text-white border-transparent",
    variant: "destructive",
  },
  medium: {
    label: "中",
    bgClass: "bg-amber-500/10 text-amber-600 border-amber-500/25",
    variant: "outline",
  },
  low: {
    label: "低",
    bgClass: "bg-green-500/10 text-green-600 border-green-500/25",
    variant: "outline",
  },
};

/** ロールのラベルと色定義 */
export const USER_ROLE_CONFIG: Record<
  UserRole,
  { label: string; variant: "default" | "secondary" }
> = {
  admin: {
    label: "管理者",
    variant: "default",
  },
  member: {
    label: "メンバー",
    variant: "secondary",
  },
};

/** サイドバーナビゲーション項目 */
export const SIDEBAR_NAV_ITEMS = [
  { title: "ダッシュボード", href: "", icon: "LayoutDashboard" as const },
  { title: "課題", href: "/tasks", icon: "ListChecks" as const },
  { title: "ボード", href: "/board", icon: "Columns3" as const },
  { title: "ガントチャート", href: "/gantt", icon: "Calendar" as const },
  { title: "メンバー", href: "/members", icon: "Users" as const },
  { title: "プロジェクト設定", href: "/settings", icon: "Settings" as const },
] as const;

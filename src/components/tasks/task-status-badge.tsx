import { cn } from "@/lib/utils";
import type { TaskStatusConfig } from "@/types";

interface TaskStatusBadgeProps {
  status: string;
  statusConfig?: TaskStatusConfig;
}

/** 課題ステータスバッジ（ドット付きピル型） */
export function TaskStatusBadge({ status, statusConfig }: TaskStatusBadgeProps) {
  const label = statusConfig?.label ?? status;
  const color = statusConfig?.color ?? "#6B7280";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold"
      )}
      style={{
        backgroundColor: `${color}15`,
        borderColor: `${color}40`,
        color: color,
      }}
    >
      <span
        className="size-2 rounded-full"
        style={{ backgroundColor: color }}
      />
      {label}
    </span>
  );
}

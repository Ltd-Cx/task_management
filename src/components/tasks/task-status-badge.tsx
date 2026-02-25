import { TASK_STATUS_CONFIG } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { TaskStatus } from "@/types";

interface TaskStatusBadgeProps {
  status: TaskStatus;
}

/** 課題ステータスバッジ（ドット付きピル型） */
export function TaskStatusBadge({ status }: TaskStatusBadgeProps) {
  const config = TASK_STATUS_CONFIG[status];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold",
        config.bgClass
      )}
    >
      <span className={cn("size-2 rounded-full", config.dotClass)} />
      {config.label}
    </span>
  );
}

import { TASK_PRIORITY_CONFIG } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { TaskPriority } from "@/types";

interface TaskPriorityBadgeProps {
  priority: TaskPriority;
}

/** 課題優先度バッジ */
export function TaskPriorityBadge({ priority }: TaskPriorityBadgeProps) {
  const config = TASK_PRIORITY_CONFIG[priority];

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold",
        config.bgClass
      )}
    >
      {config.label}
    </span>
  );
}

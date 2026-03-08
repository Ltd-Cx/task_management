"use client";

import { memo } from "react";
import { GANTT_CONSTANTS, type GanttTask } from "./types";
import { cn } from "@/lib/utils";

interface GanttTaskInfoRowProps {
  task: GanttTask;
  groupColor: string;
  onClick?: (taskId: string) => void;
  onProgressClick?: (taskId: string, e: React.MouseEvent) => void;
}

export const GanttTaskInfoRow = memo(function GanttTaskInfoRow({
  task,
  groupColor,
  onClick,
  onProgressClick,
}: GanttTaskInfoRowProps) {
  const handleClick = () => {
    onClick?.(task.id);
  };

  const handleProgressClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onProgressClick?.(task.id, e);
  };

  return (
    <div
      className={cn(
        "flex cursor-pointer items-center gap-2.5 border-b border-gray-200 px-4 transition-colors hover:bg-blue-50"
      )}
      style={{
        height: `${GANTT_CONSTANTS.TASK_ROW_HEIGHT}px`,
        borderLeftWidth: "5px",
        borderLeftColor: groupColor,
      }}
      onClick={handleClick}
    >
      {/* タスク名 */}
      <div className="min-w-0 flex-1">
        <div className="line-clamp-2 text-[13px] font-semibold text-gray-700">
          {task.summary}
        </div>
      </div>

      {/* 進捗率 */}
      <div className="flex w-16 flex-col gap-1">
        <div
          className="cursor-pointer text-[11px] font-semibold text-emerald-600 hover:underline"
          onClick={handleProgressClick}
        >
          {task.progress}%
        </div>
        <div
          className="h-1.5 w-full cursor-pointer overflow-hidden rounded-sm bg-gray-200"
          onClick={handleProgressClick}
        >
          <div
            className="h-full bg-emerald-500 transition-all"
            style={{ width: `${task.progress}%` }}
          />
        </div>
      </div>
    </div>
  );
});

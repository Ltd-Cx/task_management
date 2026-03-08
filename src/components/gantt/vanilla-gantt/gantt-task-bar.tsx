"use client";

import { memo, useMemo, useEffect, useRef } from "react";
import { GANTT_CONSTANTS, type GanttTask, type DragState } from "./types";
import {
  calculateTaskBarLeft,
  calculateTaskBarWidth,
} from "./utils/date-utils";
import { cn } from "@/lib/utils";

interface GanttTaskBarProps {
  task: GanttTask;
  timelineStartDate: Date;
  groupColor: string;
  registerTaskBar: (taskId: string, element: HTMLDivElement | null) => void;
  onMouseDown: (
    e: React.MouseEvent,
    taskId: string,
    mode: DragState["mode"],
    startLeft: number,
    startWidth: number,
    originalStartDate: string,
    originalEndDate: string
  ) => void;
  onDoubleClick?: (taskId: string) => void;
}

export const GanttTaskBar = memo(function GanttTaskBar({
  task,
  timelineStartDate,
  groupColor,
  registerTaskBar,
  onMouseDown,
  onDoubleClick,
}: GanttTaskBarProps) {
  const barRef = useRef<HTMLDivElement>(null);

  // タスクバー要素を登録
  useEffect(() => {
    registerTaskBar(task.id, barRef.current);
    return () => {
      registerTaskBar(task.id, null);
    };
  }, [task.id, registerTaskBar]);

  const baseLeft = useMemo(
    () => calculateTaskBarLeft(task.startDate, timelineStartDate),
    [task.startDate, timelineStartDate]
  );

  const baseWidth = useMemo(
    () => calculateTaskBarWidth(task.startDate, task.dueDate),
    [task.startDate, task.dueDate]
  );

  const handleBarMouseDown = (e: React.MouseEvent) => {
    // リサイズハンドルのクリックは無視
    if ((e.target as HTMLElement).dataset.resizeHandle) {
      return;
    }
    onMouseDown(
      e,
      task.id,
      "move",
      baseLeft,
      baseWidth,
      task.startDate,
      task.dueDate
    );
  };

  const handleLeftHandleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    onMouseDown(
      e,
      task.id,
      "resize-left",
      baseLeft,
      baseWidth,
      task.startDate,
      task.dueDate
    );
  };

  const handleRightHandleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    onMouseDown(
      e,
      task.id,
      "resize-right",
      baseLeft,
      baseWidth,
      task.startDate,
      task.dueDate
    );
  };

  const handleDoubleClick = () => {
    onDoubleClick?.(task.id);
  };

  return (
    <div
      ref={barRef}
      className={cn(
        "absolute z-10 flex cursor-move select-none flex-col justify-center overflow-visible rounded-full border border-black/5 px-5 shadow-sm",
        "transition-shadow duration-150 hover:-translate-y-px hover:z-20 hover:shadow-md"
      )}
      style={{
        left: `${baseLeft}px`,
        width: `${baseWidth}px`,
        height: `${GANTT_CONSTANTS.TASK_BAR_HEIGHT}px`,
        top: `${GANTT_CONSTANTS.TASK_BAR_TOP}px`,
        backgroundColor: groupColor,
      }}
      onMouseDown={handleBarMouseDown}
      onDoubleClick={handleDoubleClick}
    >
      {/* 進捗バー */}
      <div
        className="pointer-events-none absolute inset-0 rounded-full bg-white/20"
        style={{ width: `${task.progress}%` }}
      />

      {/* 左リサイズハンドル */}
      <div
        className="absolute left-0 top-0 z-[15] h-full cursor-w-resize hover:bg-white/30"
        style={{ width: `${GANTT_CONSTANTS.RESIZE_HANDLE_WIDTH}px` }}
        data-resize-handle="left"
        onMouseDown={handleLeftHandleMouseDown}
      />

      {/* 右リサイズハンドル */}
      <div
        className="absolute right-0 top-0 z-[15] h-full cursor-e-resize hover:bg-white/30"
        style={{ width: `${GANTT_CONSTANTS.RESIZE_HANDLE_WIDTH}px` }}
        data-resize-handle="right"
        onMouseDown={handleRightHandleMouseDown}
      />

      {/* タスク名 */}
      <div className="pointer-events-none relative z-[2] truncate text-xs font-semibold text-white">
        {task.summary}
      </div>
    </div>
  );
});

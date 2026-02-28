"use client";

import { useCallback } from "react";
import { useDraggable } from "@dnd-kit/core";
import { cn } from "@/lib/utils";
import { TASK_STATUS_CONFIG } from "@/lib/constants";
import type { TaskWithRelations } from "@/types";

interface GanttBarProps {
  task: TaskWithRelations;
  weekStart: Date;
  weekEnd: Date;
  dayWidth: number;
  onResize: (taskId: string, deltaDays: number, edge: "left" | "right") => void;
}

/** ガントバー（ドラッグ可能 + 左右リサイズ） */
export function GanttBar({
  task,
  weekStart,
  weekEnd,
  dayWidth,
  onResize,
}: GanttBarProps) {
  // 日付が未設定の場合は表示しない
  const hasDates = task.startDate != null && task.dueDate != null;

  const start = hasDates ? new Date(task.startDate!) : new Date();
  const end = hasDates ? new Date(task.dueDate!) : new Date();
  // 期限日を含むため+1日
  const endPlusOne = new Date(end);
  endPlusOne.setDate(endPlusOne.getDate() + 1);

  const totalMs = weekEnd.getTime() - weekStart.getTime();

  // バーの範囲を表示期間にクリップ
  const barStart = Math.max(start.getTime(), weekStart.getTime());
  const barEnd = Math.min(endPlusOne.getTime(), weekEnd.getTime());

  const isVisible = hasDates && barStart < barEnd;

  const leftPercent = isVisible ? ((barStart - weekStart.getTime()) / totalMs) * 100 : 0;
  const widthPercent = isVisible ? ((barEnd - barStart) / totalMs) * 100 : 0;

  const config = TASK_STATUS_CONFIG[task.status];

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `gantt-${task.id}`,
    data: { type: "gantt-bar", task },
  });

  const style = transform
    ? {
        left: `${leftPercent}%`,
        width: `${widthPercent}%`,
        transform: `translateX(${transform.x}px)`,
      }
    : {
        left: `${leftPercent}%`,
        width: `${widthPercent}%`,
      };

  /** リサイズ開始（左端・右端共通） */
  const handleResizeStart = useCallback(
    (e: React.PointerEvent<HTMLDivElement>, edge: "left" | "right") => {
      e.stopPropagation();
      e.preventDefault();

      const startX = e.clientX;
      const target = e.currentTarget as HTMLDivElement;
      target.setPointerCapture(e.pointerId);

      const handlePointerMove = (_moveEvent: Event) => {
        // PointerMove中はプレビュー（将来のリアルタイムプレビュー用）
      };

      const handlePointerUp = (upEvent: Event) => {
        const pe = upEvent as globalThis.PointerEvent;
        const deltaX = pe.clientX - startX;
        const deltaDays = Math.round(deltaX / dayWidth);
        target.releasePointerCapture(e.pointerId);
        target.removeEventListener("pointermove", handlePointerMove);
        target.removeEventListener("pointerup", handlePointerUp);

        if (deltaDays !== 0) {
          onResize(task.id, deltaDays, edge);
        }
      };

      target.addEventListener("pointermove", handlePointerMove);
      target.addEventListener("pointerup", handlePointerUp);
    },
    [dayWidth, onResize, task.id]
  );

  if (!isVisible) return null;

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "absolute top-2 flex h-6 items-center rounded px-2",
        config.barClass,
        isDragging && "opacity-70 shadow-lg",
        "cursor-grab active:cursor-grabbing"
      )}
      style={style}
      {...listeners}
      {...attributes}
    >
      {/* 左端リサイズハンドル */}
      <div
        className="absolute -left-1 top-0 flex h-full w-3 cursor-col-resize items-center justify-center"
        onPointerDown={(e) => handleResizeStart(e, "left")}
      >
        <div className="h-3 w-0.5 rounded-full bg-white/60" />
      </div>

      <span className="flex-1 truncate text-[10px] font-medium text-white">
        {task.summary}
      </span>

      {/* 右端リサイズハンドル */}
      <div
        className="absolute -right-1 top-0 flex h-full w-3 cursor-col-resize items-center justify-center"
        onPointerDown={(e) => handleResizeStart(e, "right")}
      >
        <div className="h-3 w-0.5 rounded-full bg-white/60" />
      </div>
    </div>
  );
}

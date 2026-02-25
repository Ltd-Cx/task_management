"use client";

import { useRef, useCallback, useEffect, forwardRef, useImperativeHandle } from "react";
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragMoveEvent,
} from "@dnd-kit/core";
import { cn } from "@/lib/utils";
import {
  formatShortDate,
  getDateRange,
  isWeekend,
} from "@/lib/date";
import { GanttBar } from "@/components/gantt/gantt-bar";
import type { TaskWithRelations } from "@/types";

/** 1日あたりの固定幅（px） */
const DAY_WIDTH_PX = 36;

interface GanttTimelineProps {
  tasks: TaskWithRelations[];
  rangeStart: Date;
  visibleDays: number;
  projectId: string;
  onUpdateDates: (taskId: string, startDate: string | null, dueDate: string | null) => void;
  onExtendRange: () => void;
}

/** ガントチャート右側のタイムライン */
export const GanttTimeline = forwardRef<HTMLDivElement, GanttTimelineProps>(
  function GanttTimeline({ tasks, rangeStart, visibleDays, projectId, onUpdateDates, onExtendRange }, ref) {
    const innerRef = useRef<HTMLDivElement>(null);
    useImperativeHandle(ref, () => innerRef.current!);

    const days = getDateRange(rangeStart, visibleDays);
    const rangeEnd = new Date(rangeStart);
    rangeEnd.setDate(rangeEnd.getDate() + visibleDays);

    const totalWidth = visibleDays * DAY_WIDTH_PX;

    const sensors = useSensors(
      useSensor(PointerSensor, {
        activationConstraint: { distance: 5 },
      })
    );

    /** ドラッグ中に右方向の範囲拡張を1回だけに制限するフラグ */
    const hasExtendedRef = useRef(false);

    /** ドラッグ開始時にフラグリセット */
    function handleDragStart() {
      hasExtendedRef.current = false;
    }

    /** ドラッグ中: カーソルがガントフィールド右端に近づいたら6ヶ月拡張 */
    function handleDragMove(event: DragMoveEvent) {
      if (!innerRef.current || hasExtendedRef.current) return;
      const rect = innerRef.current.getBoundingClientRect();
      const cursorX = (event.activatorEvent as PointerEvent).clientX + (event.delta?.x ?? 0);

      // カーソルがガントフィールドの右端50px以内に到達
      if (cursorX > rect.right - 50) {
        hasExtendedRef.current = true;
        onExtendRange();
      }
    }

    /** ドラッグ終了 */
    function handleDragEnd(event: DragEndEvent) {
      const { active, delta } = event;
      if (!delta || delta.x === 0) return;

      const deltaDays = Math.round(delta.x / DAY_WIDTH_PX);
      if (deltaDays === 0) return;

      const taskData = active.data.current as { type: string; task: TaskWithRelations } | undefined;
      if (!taskData || taskData.type !== "gantt-bar") return;

      const task = taskData.task;
      if (!task.startDate || !task.dueDate) return;

      // 表示範囲内にクランプ（rangeStart ≤ newStart, newEnd ≤ rangeEnd - 1日）
      const taskStart = new Date(task.startDate);
      taskStart.setHours(0, 0, 0, 0);
      const taskEnd = new Date(task.dueDate);
      taskEnd.setHours(0, 0, 0, 0);
      const lastDay = new Date(rangeEnd);
      lastDay.setDate(lastDay.getDate() - 1);

      const minDelta = Math.ceil((rangeStart.getTime() - taskStart.getTime()) / (1000 * 60 * 60 * 24));
      const maxDelta = Math.floor((lastDay.getTime() - taskEnd.getTime()) / (1000 * 60 * 60 * 24));
      const clampedDelta = Math.max(minDelta, Math.min(deltaDays, maxDelta));
      if (clampedDelta === 0) return;

      const newStart = new Date(task.startDate);
      newStart.setDate(newStart.getDate() + clampedDelta);
      const newEnd = new Date(task.dueDate);
      newEnd.setDate(newEnd.getDate() + clampedDelta);

      onUpdateDates(
        task.id,
        newStart.toISOString().split("T")[0],
        newEnd.toISOString().split("T")[0]
      );
    }

    /** リサイズ（左端: 開始日変更、右端: 期限日変更） */
    const handleResize = useCallback(
      (taskId: string, deltaDays: number, edge: "left" | "right") => {
        const task = tasks.find((t) => t.id === taskId);
        if (!task) return;

        if (edge === "right") {
          if (!task.dueDate) return;
          const newEnd = new Date(task.dueDate);
          newEnd.setDate(newEnd.getDate() + deltaDays);
          newEnd.setHours(0, 0, 0, 0);
          // rangeEnd より先にリサイズできないよう制限
          const lastDay = new Date(rangeEnd);
          lastDay.setDate(lastDay.getDate() - 1);
          if (newEnd > lastDay) return;
          if (task.startDate && newEnd < new Date(task.startDate)) return;
          onUpdateDates(taskId, task.startDate, newEnd.toISOString().split("T")[0]);
        } else {
          if (!task.startDate) return;
          const newStart = new Date(task.startDate);
          newStart.setDate(newStart.getDate() + deltaDays);
          newStart.setHours(0, 0, 0, 0);
          // rangeStart より前にリサイズできないよう制限
          if (newStart < rangeStart) return;
          if (task.dueDate && newStart > new Date(task.dueDate)) return;
          onUpdateDates(taskId, newStart.toISOString().split("T")[0], task.dueDate);
        }
      },
      [tasks, onUpdateDates]
    );

    /** 月ヘッダーの生成 */
    const monthHeaders: { label: string; span: number }[] = [];
    let currentMonth = -1;
    let currentSpan = 0;
    for (const day of days) {
      const month = day.getMonth();
      if (month !== currentMonth) {
        if (currentSpan > 0) {
          monthHeaders.push({
            label: `${days[days.indexOf(day) - 1].getFullYear()}/${currentMonth + 1}`,
            span: currentSpan,
          });
        }
        currentMonth = month;
        currentSpan = 1;
      } else {
        currentSpan++;
      }
    }
    if (currentSpan > 0 && days.length > 0) {
      const lastDay = days[days.length - 1];
      monthHeaders.push({
        label: `${lastDay.getFullYear()}/${currentMonth + 1}`,
        span: currentSpan,
      });
    }

    return (
      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragMove={handleDragMove}
        onDragEnd={handleDragEnd}
      >
        <div className="min-w-0 flex-1 overflow-x-auto" ref={innerRef}>
          <div style={{ width: totalWidth }}>
            {/* 月ヘッダー */}
            <div className="flex h-[30px] border-b bg-muted">
              {monthHeaders.map((mh, i) => (
                <div
                  key={i}
                  className="flex items-center border-r px-3 text-xs font-medium text-muted-foreground"
                  style={{ width: mh.span * DAY_WIDTH_PX }}
                >
                  {mh.label}月
                </div>
              ))}
            </div>

            {/* 日付ヘッダー */}
            <div className="flex h-[30px] border-b bg-muted">
              {days.map((day, i) => {
                const dayOfWeek = day.getDay();
                const isSat = dayOfWeek === 6;
                const isSun = dayOfWeek === 0;

                return (
                  <div
                    key={i}
                    className={cn(
                      "flex items-center justify-center border-r text-[10px] text-muted-foreground",
                      (isSat || isSun) && "bg-accent"
                    )}
                    style={{ width: DAY_WIDTH_PX }}
                  >
                    <span>{formatShortDate(day)}</span>
                  </div>
                );
              })}
            </div>

            {/* バー行 */}
            {tasks.map((task) => (
              <div key={task.id} className="relative flex h-11 border-b">
                {/* グリッド線 */}
                {days.map((day, i) => (
                  <div
                    key={i}
                    className={cn(
                      "border-r",
                      isWeekend(day) && "bg-muted/30"
                    )}
                    style={{ width: DAY_WIDTH_PX }}
                  />
                ))}

                {/* ガントバー */}
                {task.startDate && task.dueDate && (
                  <GanttBar
                    task={task}
                    weekStart={rangeStart}
                    weekEnd={rangeEnd}
                    dayWidth={DAY_WIDTH_PX}
                    onResize={handleResize}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </DndContext>
    );
  }
);

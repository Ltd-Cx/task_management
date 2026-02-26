"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GanttTaskList } from "@/components/gantt/gantt-task-list";
import { GanttTimeline } from "@/components/gantt/gantt-timeline";
import { updateTaskDates } from "@/actions/task-actions";
import type { TaskWithRelations } from "@/types";

/** デフォルト表示日数 */
const DEFAULT_VISIBLE_DAYS = 28;

interface GanttViewProps {
  tasks: TaskWithRelations[];
  projectKey: string;
  projectId: string;
}

/** ガントチャートビュー */
export function GanttView({ tasks, projectKey, projectId }: GanttViewProps) {
  // 表示開始日（今日の7日前から）
  const [rangeStart, setRangeStart] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    d.setHours(0, 0, 0, 0);
    return d;
  });
  const [visibleDays, setVisibleDays] = useState(DEFAULT_VISIBLE_DAYS);
  const [localTasks, setLocalTasks] = useState<TaskWithRelations[]>(tasks);
  const timelineRef = useRef<HTMLDivElement>(null);

  /** 初回: 今日の位置までスクロール */
  useEffect(() => {
    if (!timelineRef.current) return;
    const today = new Date();
    const diffMs = today.getTime() - rangeStart.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const dayWidth = 36; // DAY_WIDTH_PX と同じ
    const scrollTarget = Math.max(0, diffDays * dayWidth - timelineRef.current.clientWidth / 3);
    timelineRef.current.scrollLeft = scrollTarget;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** 1週間後にスライド */
  function goToNextWeek() {
    setVisibleDays((prev) => prev + 7);
  }

  /** 今日に戻る */
  function goToToday() {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    d.setHours(0, 0, 0, 0);
    setRangeStart(d);
    setVisibleDays(DEFAULT_VISIBLE_DAYS);
    // 今日の位置にスクロール
    requestAnimationFrame(() => {
      if (!timelineRef.current) return;
      const today = new Date();
      const diffMs = today.getTime() - d.getTime();
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      const dayWidth = 36; // DAY_WIDTH_PX と同じ
      const scrollTarget = Math.max(0, diffDays * dayWidth - timelineRef.current.clientWidth / 3);
      timelineRef.current.scrollTo({ left: scrollTarget, behavior: "smooth" });
    });
  }

  /** 表示範囲を右方向に6ヶ月分拡張（DnD右端到達時に1回だけ呼ばれる） */
  const extendRange = useCallback(() => {
    setVisibleDays((prev) => prev + 180);
  }, []);

  /** 日程更新（Optimistic UI + Server Action） */
  const handleUpdateDates = useCallback(
    (taskId: string, startDate: string | null, dueDate: string | null) => {
      setLocalTasks((prev) =>
        prev.map((t) =>
          t.id === taskId ? { ...t, startDate, dueDate } : t
        )
      );
      updateTaskDates({ taskId, projectId, startDate, dueDate });
    },
    [projectId]
  );

  return (
    <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
      {/* ツールバー */}
      <div className="flex items-center justify-between px-6 py-4">
        <h1 className="text-2xl font-semibold tracking-tight">ガントチャート</h1>
        <div className="flex items-center gap-2">
          <Button size="sm" onClick={goToToday}>
            今日
          </Button>
          <Button variant="outline" size="sm" onClick={goToNextWeek}>
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>

      {/* メインエリア: タスクリスト + タイムライン */}
      <div className="min-w-0 flex-1 overflow-hidden px-8">
        <div className="flex h-full overflow-hidden rounded-lg border bg-card">
          <GanttTaskList tasks={localTasks} projectKey={projectKey} />
          <GanttTimeline
            ref={timelineRef}
            tasks={localTasks}
            rangeStart={rangeStart}
            visibleDays={visibleDays}
            projectId={projectId}
            onUpdateDates={handleUpdateDates}
            onExtendRange={extendRange}
          />
        </div>
      </div>
    </div>
  );
}

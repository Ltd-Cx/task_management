"use client";

import { useState, useMemo, useCallback } from "react";
import type { TaskWithRelations } from "@/types";
import {
  GANTT_CONSTANTS,
  type GanttTask,
  type GanttTaskGroup,
  type TaskGroupWithCount,
  hasDateRange,
} from "./types";
import {
  generateDateRange,
  generateMonthCells,
  parseDateString,
} from "./utils/date-utils";
import { useGanttDrag } from "./hooks/use-gantt-drag";
import { useInfiniteTimeline } from "./hooks/use-infinite-timeline";
import { GanttHeader } from "./gantt-header";
import { GanttTaskInfoHeader } from "./gantt-task-info-header";
import { GanttTaskInfoRow } from "./gantt-task-info-row";
import { GanttGroupHeader } from "./gantt-group-header";
import { GanttTaskBar } from "./gantt-task-bar";
import { GanttTimelineGrid } from "./gantt-timeline-grid";
import { Loader2 } from "lucide-react";

interface GanttChartProps {
  tasks: TaskWithRelations[];
  taskGroups: TaskGroupWithCount[];
  repositoryKey: string;
  repositoryId: string;
  onTaskClick?: (taskId: string) => void;
  onTaskUpdate?: (taskId: string, startDate: string, dueDate: string) => void;
  onProgressUpdate?: (taskId: string, progress: number) => void;
}

const DEFAULT_GROUP_COLOR = "#95a5a6";

// 初期表示期間を計算（タスクの日付を考慮 + 大きなバッファ）
function getInitialDates(tasks: TaskWithRelations[]) {
  const today = new Date();

  // タスクから最も早い開始日と最も遅い終了日を取得
  const taskDates = tasks.reduce(
    (acc, task) => {
      if (task.startDate) {
        const startDate = parseDateString(task.startDate);
        if (!acc.earliest || startDate < acc.earliest) {
          acc.earliest = startDate;
        }
      }
      if (task.dueDate) {
        const dueDate = parseDateString(task.dueDate);
        if (!acc.latest || dueDate > acc.latest) {
          acc.latest = dueDate;
        }
      }
      return acc;
    },
    { earliest: null as Date | null, latest: null as Date | null }
  );

  // 開始日: タスクの最早開始日 or 今日のうち早い方 - 1年（365日）
  const baseStart = taskDates.earliest && taskDates.earliest < today
    ? new Date(taskDates.earliest)
    : new Date(today);
  const start = new Date(baseStart);
  start.setDate(start.getDate() - 365); // 1年前

  // 終了日: タスクの最遅終了日 or 今日のうち遅い方 + 1年（365日）
  const baseEnd = taskDates.latest && taskDates.latest > today
    ? new Date(taskDates.latest)
    : new Date(today);
  const end = new Date(baseEnd);
  end.setDate(end.getDate() + 365); // 1年後

  return { start, end };
}

export function GanttChart({
  tasks,
  taskGroups,
  repositoryKey,
  repositoryId,
  onTaskClick,
  onTaskUpdate,
  onProgressUpdate,
}: GanttChartProps) {
  // 折りたたみ状態
  const [collapsedGroups, setCollapsedGroups] = useState<
    Record<string, boolean>
  >({});

  // 無限スクロール対応のタイムライン（タスクの日付を考慮）
  const initialDates = useMemo(() => getInitialDates(tasks), [tasks]);
  const {
    viewStartDate,
    viewEndDate,
    timelineRef,
    isLoadingPast,
    isLoadingFuture,
    handleDragScroll,
    startDrag,
    endDrag,
    getScrollLeft,
  } = useInfiniteTimeline({
    initialStartDate: initialDates.start,
    initialEndDate: initialDates.end,
  });

  // 日付範囲を生成
  const dates = useMemo(
    () => generateDateRange(viewStartDate, viewEndDate),
    [viewStartDate, viewEndDate]
  );

  const months = useMemo(() => generateMonthCells(dates), [dates]);

  // タスクをGanttTask形式に変換（日付がなくても含める）
  const ganttTasks = useMemo((): GanttTask[] => {
    return tasks.map((t) => ({
      ...t,
      startDate: t.startDate ?? null,
      dueDate: t.dueDate ?? null,
    }));
  }, [tasks]);

  // タスクをグループ化
  const groupedTasks = useMemo((): GanttTaskGroup[] => {
    const groups: Record<string, GanttTask[]> = {};

    ganttTasks.forEach((task) => {
      const key = task.taskProjectId ?? "none";
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(task);
    });

    // グループの順序でソート
    const sortedGroups: GanttTaskGroup[] = [];

    // 既存のグループを追加
    taskGroups.forEach((group) => {
      if (groups[group.id]) {
        sortedGroups.push({
          group,
          tasks: groups[group.id],
          isCollapsed: collapsedGroups[group.id] ?? false,
        });
      }
    });

    // グループなしのタスクを追加
    if (groups["none"]) {
      sortedGroups.push({
        group: null,
        tasks: groups["none"],
        isCollapsed: collapsedGroups["none"] ?? false,
      });
    }

    return sortedGroups;
  }, [ganttTasks, taskGroups, collapsedGroups]);

  // ドラッグ機能
  const { registerTaskBar, handleMouseDown } = useGanttDrag({
    onDragEnd: (taskId, newStartDate, newEndDate) => {
      onTaskUpdate?.(taskId, newStartDate, newEndDate);
    },
    onTaskClick,
    onDragScroll: handleDragScroll,
    onDragStart: startDrag,
    onDragComplete: endDrag,
    getScrollLeft,
  });

  // グループの折りたたみトグル
  const toggleGroup = useCallback((groupId: string) => {
    setCollapsedGroups((prev) => ({
      ...prev,
      [groupId]: !prev[groupId],
    }));
  }, []);

  // 進捗率更新
  const handleProgressClick = useCallback(
    (taskId: string, e: React.MouseEvent) => {
      e.stopPropagation();

      // プルダウンを表示（簡易実装）
      const progress = prompt("進捗率を入力 (0-100):", "50");
      if (progress !== null) {
        const value = Math.min(100, Math.max(0, parseInt(progress, 10) || 0));
        onProgressUpdate?.(taskId, value);
      }
    },
    [onProgressUpdate]
  );

  // タイムラインの高さを計算
  const timelineHeight = useMemo(() => {
    let height = 0;
    groupedTasks.forEach((group) => {
      height += GANTT_CONSTANTS.GROUP_HEADER_HEIGHT;
      if (!group.isCollapsed) {
        height += group.tasks.length * GANTT_CONSTANTS.TASK_ROW_HEIGHT;
      }
    });
    return Math.max(height, 400);
  }, [groupedTasks]);

  const totalWidth = dates.length * GANTT_CONSTANTS.CELL_WIDTH;

  // タスクがない場合のメッセージ
  if (tasks.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-gray-500">
        タスクがありません
      </div>
    );
  }

  return (
    <div className="flex h-full overflow-hidden rounded-lg border bg-white">
      {/* 左側：タスク情報列 */}
      <div
        className="sticky left-0 z-[200] shrink-0 overflow-y-auto border-r border-gray-200 bg-gray-50"
        style={{ width: `${GANTT_CONSTANTS.TASK_INFO_WIDTH}px` }}
      >
        <GanttTaskInfoHeader />

        <div className="min-h-[400px]">
          {groupedTasks.map((group) => {
            const groupKey = group.group?.id ?? "none";
            const groupColor = group.group?.color ?? DEFAULT_GROUP_COLOR;

            return (
              <div key={groupKey}>
                {/* グループヘッダー */}
                <GanttGroupHeader
                  group={group.group}
                  taskCount={group.tasks.length}
                  isCollapsed={group.isCollapsed}
                  onToggle={() => toggleGroup(groupKey)}
                />

                {/* タスク情報行 */}
                {!group.isCollapsed && (
                  <div className="min-h-[55px]">
                    {group.tasks.map((task) => (
                      <GanttTaskInfoRow
                        key={task.id}
                        task={task}
                        groupColor={groupColor}
                        onClick={onTaskClick}
                        onProgressClick={handleProgressClick}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 右側：タイムライン */}
      <div
        ref={timelineRef}
        className="relative flex-1 overflow-x-auto overflow-y-auto [contain:paint]"
      >
        {/* 過去読み込み中インジケーター */}
        {isLoadingPast && (
          <div className="absolute left-2 top-2 z-[300] flex items-center gap-2 rounded bg-white/90 px-3 py-1.5 text-xs text-gray-600 shadow">
            <Loader2 className="h-3 w-3 animate-spin" />
            過去の日付を読み込み中...
          </div>
        )}

        {/* 未来読み込み中インジケーター */}
        {isLoadingFuture && (
          <div className="absolute right-2 top-2 z-[300] flex items-center gap-2 rounded bg-white/90 px-3 py-1.5 text-xs text-gray-600 shadow">
            <Loader2 className="h-3 w-3 animate-spin" />
            未来の日付を読み込み中...
          </div>
        )}

        <GanttHeader dates={dates} months={months} />

        <div
          className="relative flex min-h-[400px]"
          style={{ width: `${totalWidth}px` }}
        >
          {/* グリッド */}
          <GanttTimelineGrid dates={dates} height={timelineHeight} />

          {/* タスクコンテナ */}
          <div className="relative z-[2] w-full">
            {groupedTasks.map((group) => {
              const groupKey = group.group?.id ?? "none";
              const groupColor = group.group?.color ?? DEFAULT_GROUP_COLOR;

              return (
                <div key={groupKey} className="relative">
                  {/* グループヘッダー（タイムライン側） */}
                  <div
                    className="relative border-t border-gray-200 bg-transparent"
                    style={{
                      height: `${GANTT_CONSTANTS.GROUP_HEADER_HEIGHT}px`,
                      width: `${totalWidth}px`,
                    }}
                  />

                  {/* タスクバー */}
                  {!group.isCollapsed && (
                    <div className="min-h-[55px]">
                      {group.tasks.map((task) => (
                        <div
                          key={task.id}
                          className="relative"
                          style={{
                            height: `${GANTT_CONSTANTS.TASK_ROW_HEIGHT}px`,
                          }}
                        >
                          {/* 日付がある場合のみバーを表示 */}
                          {hasDateRange(task) && (
                            <GanttTaskBar
                              task={task}
                              timelineStartDate={viewStartDate}
                              groupColor={groupColor}
                              registerTaskBar={registerTaskBar}
                              onMouseDown={handleMouseDown}
                              onDoubleClick={onTaskClick}
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

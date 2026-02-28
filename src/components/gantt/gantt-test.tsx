"use client";

import React, { useState, useEffect, useRef } from "react";
import GanttChart, { TaskGroup, Task, ViewMode, TimelineHeaderRenderProps, TooltipRenderProps } from "react-modern-gantt";
import "react-modern-gantt/dist/index.css";
import type { TaskWithRelations } from "@/types";

/** 週の開始日から終了日を日本語形式で表示 */
function formatWeekLabel(date: Date): string {
  const startOfWeek = new Date(date);
  const endOfWeek = new Date(date);
  endOfWeek.setDate(endOfWeek.getDate() + 6);

  const startMonth = startOfWeek.getMonth() + 1;
  const startDay = startOfWeek.getDate();
  const endMonth = endOfWeek.getMonth() + 1;
  const endDay = endOfWeek.getDate();

  if (startMonth === endMonth) {
    return `${startMonth}/${startDay}〜${endDay}`;
  }
  return `${startMonth}/${startDay}〜${endMonth}/${endDay}`;
}

/** 日付を日本語形式でフォーマット */
function formatDateJa(date: Date): string {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  return `${year}年${month}月${day}日`;
}

/** カスタムツールチップ */
function CustomTooltip({ task, startDate, endDate }: TooltipRenderProps) {
  return (
    <div
      style={{
        backgroundColor: "white",
        border: "1px solid #e5e7eb",
        borderRadius: "6px",
        padding: "12px",
        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
        fontSize: "13px",
        minWidth: "200px",
      }}
    >
      <div style={{ fontWeight: "bold", marginBottom: "8px" }}>{task.name}</div>
      <div style={{ color: "#6b7280", marginBottom: "4px" }}>
        開始日: {formatDateJa(startDate)}
      </div>
      <div style={{ color: "#6b7280" }}>
        期限: {formatDateJa(endDate)}
      </div>
    </div>
  );
}

/** カスタムタイムラインヘッダー */
function CustomTimelineHeader({ timeUnits, unitWidth, viewMode }: TimelineHeaderRenderProps) {
  const formatLabel = (date: Date, index: number, allDates: Date[]) => {
    if (viewMode === ViewMode.WEEK) {
      return formatWeekLabel(date);
    }
    if (viewMode === ViewMode.DAY) {
      const day = date.getDate();
      const month = date.getMonth() + 1;
      // 月の最初の日、または表示範囲の最初の日に月を表示
      const isFirstOfMonth = day === 1;
      const isFirstInRange = index === 0;
      const prevDate = index > 0 ? allDates[index - 1] : null;
      const isMonthChange = prevDate && prevDate.getMonth() !== date.getMonth();

      if (isFirstOfMonth || isFirstInRange || isMonthChange) {
        return `${month}/${day}`;
      }
      return String(day);
    }
    return date.toLocaleDateString("ja-JP");
  };

  return (
    <div style={{ display: "flex", borderBottom: "1px solid #e5e7eb" }}>
      {timeUnits.map((date, index) => (
        <div
          key={index}
          style={{
            width: unitWidth,
            minWidth: unitWidth,
            padding: "8px 4px",
            textAlign: "center",
            fontSize: "12px",
            borderRight: "1px solid #e5e7eb",
            backgroundColor: "#f9fafb",
          }}
        >
          {formatLabel(date, index, timeUnits)}
        </div>
      ))}
    </div>
  );
}

interface GanttTestProps {
  tasks: TaskWithRelations[];
  projectKey: string;
  projectId: string;
  onTaskClick?: (taskId: string) => void;
}

/** TaskWithRelations を TaskGroup[] に変換 */
function convertToGanttData(tasks: TaskWithRelations[], projectKey: string): TaskGroup[] {
  return tasks
    .filter((t) => t.startDate != null && t.dueDate != null)
    .map((t) => ({
      id: `group-${t.id}`,
      name: `${projectKey}-${t.keyId} ${t.summary}`,
      tasks: [
        {
          id: t.id,
          name: t.summary,
          startDate: new Date(t.startDate!),
          endDate: new Date(t.dueDate!),
          color: "#3b82f6",
          percent: 0,
        },
      ],
    }));
}

/** quickstartパターンベースのガントチャート */
export function GanttTest({ tasks: initialTasks, projectKey, projectId, onTaskClick }: GanttTestProps) {
  // quickstartと同じパターン: useStateで直接管理
  const [tasks, setTasks] = useState<TaskGroup[]>(() =>
    convertToGanttData(initialTasks, projectKey)
  );

  // 外部からのタスク変更を検知して同期（ビューモードはリセットしない）
  const prevTasksKeyRef = useRef<string>("");
  useEffect(() => {
    const tasksKey = JSON.stringify(
      initialTasks.map((t) => `${t.id}:${t.summary}:${t.startDate}:${t.dueDate}`)
    );
    if (prevTasksKeyRef.current && tasksKey !== prevTasksKeyRef.current) {
      setTasks(convertToGanttData(initialTasks, projectKey));
    }
    prevTasksKeyRef.current = tasksKey;
  }, [initialTasks, projectKey]);

  // quickstartと同じパターン: handleTaskUpdate
  const handleTaskUpdate = (groupId: string, updatedTask: Task) => {
    console.log("handleTaskUpdate called:", groupId, updatedTask);
    setTasks((prevTasks) =>
      prevTasks.map((group) =>
        group.id === groupId
          ? {
              ...group,
              tasks: group.tasks.map((task) =>
                task.id === updatedTask.id ? updatedTask : task
              ),
            }
          : group
      )
    );

    // APIで永続化
    const formatLocalDate = (date: Date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    };

    fetch("/api/tasks/update-dates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        taskId: updatedTask.id,
        projectId,
        startDate: formatLocalDate(updatedTask.startDate),
        dueDate: formatLocalDate(updatedTask.endDate),
      }),
    }).catch((error) => {
      console.error("日付更新エラー:", error);
    });
  };

  // グループ（リソース行）クリック時のハンドラ
  const handleGroupClick = (group: TaskGroup) => {
    // group.id は "group-{taskId}" 形式なので taskId を抽出
    const taskId = group.id.replace("group-", "");
    if (onTaskClick) {
      onTaskClick(taskId);
    }
  };

  if (tasks.length === 0) {
    return (
      <div style={{ padding: "20px" }}>
        開始日と期限が設定されたタスクがありません
      </div>
    );
  }

  return (
    <div style={{ width: "100%", height: "100%", position: "relative", zIndex: 1 }}>
      <GanttChart
        tasks={tasks}
        onTaskUpdate={handleTaskUpdate}
        onGroupClick={handleGroupClick}
        viewMode={ViewMode.WEEK}
        locale="ja-JP"
        title=""
        headerLabel="課題"
        renderTimelineHeader={CustomTimelineHeader}
        renderTooltip={CustomTooltip}
        showTimelineHeader={false}
        darkMode={false}
        showProgress={false}
        editMode={true}
      />
    </div>
  );
}

export default GanttTest;

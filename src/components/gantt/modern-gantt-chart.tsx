"use client";

import React, { useState, useCallback, useRef, useEffect } from "react";
import GanttChart, { Task, TaskGroup, ViewMode } from "react-modern-gantt";
import "react-modern-gantt/dist/index.css";
import type { TaskWithRelations } from "@/types";

interface ModernGanttChartProps {
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
          color: "#3182ce",
          percent: 0,
        },
      ],
    }));
}

/** react-modern-gantt 本体（クライアント専用） */
function ModernGanttChart({ tasks, projectKey, projectId, onTaskClick }: ModernGanttChartProps) {
  // ローカル状態でganttDataを管理（quickstartパターン）
  const [ganttData, setGanttData] = useState<TaskGroup[]>(() =>
    convertToGanttData(tasks, projectKey)
  );

  // 外部からのtasks変更を検知して同期
  const prevTasksRef = useRef<string>("");
  useEffect(() => {
    const tasksKey = JSON.stringify(
      tasks.map((t) => `${t.id}:${t.startDate}:${t.dueDate}`)
    );
    if (tasksKey !== prevTasksRef.current) {
      prevTasksRef.current = tasksKey;
      setGanttData(convertToGanttData(tasks, projectKey));
    }
  }, [tasks, projectKey]);

  // projectId と onTaskClick の ref
  const projectIdRef = useRef(projectId);
  projectIdRef.current = projectId;

  const onTaskClickRef = useRef(onTaskClick);
  onTaskClickRef.current = onTaskClick;

  /** タスク更新ハンドラ - quickstartパターンに従いローカル状態を更新 */
  const handleTaskUpdate = useCallback((groupId: string, updatedTask: Task) => {
    // 1. ローカル状態を即座に更新（これが重要！）
    setGanttData((prevTasks) =>
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

    // 2. APIで永続化（非同期）
    // ローカルタイムゾーンで日付を取得（toISOStringはUTCに変換されるため使わない）
    const formatLocalDate = (date: Date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    };
    const startDate = formatLocalDate(updatedTask.startDate);
    const dueDate = formatLocalDate(updatedTask.endDate);

    fetch("/api/tasks/update-dates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        taskId: updatedTask.id,
        projectId: projectIdRef.current,
        startDate,
        dueDate,
      }),
    }).catch((error) => {
      console.error("日付更新エラー:", error);
    });
  }, []);

  /** タスククリックハンドラ */
  const handleTaskClick = useCallback((task: Task, _group: TaskGroup) => {
    if (task.id && onTaskClickRef.current) {
      onTaskClickRef.current(task.id);
    }
  }, []);

  if (ganttData.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground">
        開始日と期限が設定されたタスクがありません
      </div>
    );
  }

  return (
    <div style={{ width: "100%", height: "100%" }}>
      <GanttChart
        tasks={ganttData}
        onTaskUpdate={handleTaskUpdate}
        onTaskClick={handleTaskClick}
        viewMode={ViewMode.DAY}
        editMode={true}
        darkMode={false}
        showProgress={false}
      />
    </div>
  );
}

export default ModernGanttChart;

"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import type {
  TaskWithRelations,
  ProjectMemberWithUser,
  Category,
  TaskStatusConfig,
  TaskGroup,
} from "@/types";
import { EditTaskDialog } from "@/components/tasks/edit-task-dialog";

const GanttChart = dynamic(
  () =>
    import("@/components/gantt/vanilla-gantt/gantt-chart").then(
      (mod) => mod.GanttChart
    ),
  { ssr: false }
);

interface GanttViewProps {
  tasks: TaskWithRelations[];
  taskGroups: TaskGroup[];
  projectKey: string;
  projectId: string;
  members: ProjectMemberWithUser[];
  categories: Category[];
  statuses: TaskStatusConfig[];
}

/** ガントチャートビュー */
export function GanttView({
  tasks,
  taskGroups,
  projectKey,
  projectId,
  members,
  categories,
  statuses,
}: GanttViewProps) {
  const router = useRouter();
  const [selectedTask, setSelectedTask] = useState<TaskWithRelations | null>(
    null
  );
  const [dialogOpen, setDialogOpen] = useState(false);

  /** タスククリック時のハンドラ（APIから最新データを取得） */
  const handleTaskClick = useCallback(async (taskId: string) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}`);
      const json = await res.json();
      if (json.success && json.data) {
        setSelectedTask(json.data);
        setDialogOpen(true);
      }
    } catch (error) {
      console.error("タスク取得エラー:", error);
    }
  }, []);

  /** タスク更新ハンドラ（ドラッグ/リサイズ時） */
  const handleTaskUpdate = useCallback(
    async (taskId: string, startDate: string, dueDate: string) => {
      try {
        const res = await fetch("/api/tasks/update-dates", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            taskId,
            projectId,
            startDate,
            dueDate,
          }),
        });

        if (!res.ok) {
          throw new Error("Failed to update dates");
        }

        // ページをリフレッシュして最新データを取得
        router.refresh();
      } catch (error) {
        console.error("日付更新エラー:", error);
      }
    },
    [projectId, router]
  );

  /** 進捗更新ハンドラ */
  const handleProgressUpdate = useCallback(
    async (taskId: string, progress: number) => {
      try {
        const res = await fetch("/api/tasks/update-progress", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            taskId,
            projectId,
            progress,
          }),
        });

        if (!res.ok) {
          throw new Error("Failed to update progress");
        }

        // ページをリフレッシュして最新データを取得
        router.refresh();
      } catch (error) {
        console.error("進捗更新エラー:", error);
      }
    },
    [projectId, router]
  );

  /** タスク更新成功時のハンドラ */
  const handleTaskUpdated = useCallback(() => {
    router.refresh();
  }, [router]);

  return (
    <div className="flex h-full min-w-0 flex-1 flex-col overflow-hidden">
      {/* ガントチャート本体 */}
      <div className="min-w-0 flex-1 overflow-hidden">
        <GanttChart
          tasks={tasks}
          taskGroups={taskGroups}
          projectKey={projectKey}
          projectId={projectId}
          onTaskClick={handleTaskClick}
          onTaskUpdate={handleTaskUpdate}
          onProgressUpdate={handleProgressUpdate}
        />
      </div>

      {/* 編集ダイアログ */}
      {selectedTask && (
        <EditTaskDialog
          task={selectedTask}
          projectId={projectId}
          members={members}
          categories={categories}
          statuses={statuses}
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          onSuccess={handleTaskUpdated}
        />
      )}
    </div>
  );
}

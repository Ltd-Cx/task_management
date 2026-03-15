"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import type {
  TaskWithRelations,
  RepositoryMemberWithUser,
  Category,
  TaskStatusConfig,
} from "@/types";
import type { TaskGroupWithCount } from "@/components/tasks/add-task-group-dialog";
import { TaskDetailDialog } from "@/components/tasks/task-detail-dialog";

const GanttChart = dynamic(
  () =>
    import("@/components/gantt/vanilla-gantt/gantt-chart").then(
      (mod) => mod.GanttChart
    ),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full items-center justify-center">
        <div className="loading-spinner" />
      </div>
    ),
  }
);

interface GanttViewProps {
  tasks: TaskWithRelations[];
  taskGroups: TaskGroupWithCount[];
  repositoryKey: string;
  repositoryId: string;
  members: RepositoryMemberWithUser[];
  categories: Category[];
  statuses: TaskStatusConfig[];
}

/** ガントチャートビュー */
export function GanttView({
  tasks,
  taskGroups,
  repositoryKey,
  repositoryId,
  members,
  categories,
  statuses,
}: GanttViewProps) {
  const router = useRouter();
  const [selectedTask, setSelectedTask] = useState<TaskWithRelations | null>(null);
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
            repositoryId,
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
    [repositoryId, router]
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
            repositoryId,
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
    [repositoryId, router]
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
          repositoryKey={repositoryKey}
          repositoryId={repositoryId}
          onTaskClick={handleTaskClick}
          onTaskUpdate={handleTaskUpdate}
          onProgressUpdate={handleProgressUpdate}
        />
      </div>

      {/* 詳細ダイアログ */}
      {selectedTask && (
        <TaskDetailDialog
          task={selectedTask}
          repositoryKey={repositoryKey}
          repositoryId={repositoryId}
          members={members}
          categories={categories}
          statuses={statuses}
          taskGroups={taskGroups}
          open={dialogOpen}
          onOpenChange={setDialogOpen}
        />
      )}
    </div>
  );
}

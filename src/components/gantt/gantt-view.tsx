"use client";

import { useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import type { TaskWithRelations, ProjectMemberWithUser, Category, TaskStatusConfig } from "@/types";
import { EditTaskDialog } from "@/components/tasks/edit-task-dialog";

const GanttChart = dynamic(
  () => import("@/components/gantt/gantt-chart"),
  { ssr: false }
);

interface GanttViewProps {
  tasks: TaskWithRelations[];
  projectKey: string;
  projectId: string;
  members: ProjectMemberWithUser[];
  categories: Category[];
  statuses: TaskStatusConfig[];
}

/** ガントチャートビュー */
export function GanttView({ tasks, projectKey, projectId, members, categories, statuses }: GanttViewProps) {
  const router = useRouter();
  const [selectedTask, setSelectedTask] = useState<TaskWithRelations | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  /** タスクデータのハッシュキー（データ変更時に再マウントをトリガー） */
  const ganttKey = useMemo(() => {
    return tasks
      .map((t) => `${t.id}:${t.summary}:${t.startDate}:${t.dueDate}`)
      .join("|");
  }, [tasks]);

  /** タスククリック時のハンドラ（APIから最新データを取得） */
  const handleTaskClick = useCallback(async (taskId: string) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/tasks/${taskId}`);
      const json = await res.json();
      if (json.success && json.data) {
        setSelectedTask(json.data);
        setDialogOpen(true);
      }
    } catch (error) {
      console.error("タスク取得エラー:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /** タスク更新成功時のハンドラ */
  const handleTaskUpdated = useCallback(() => {
    // ページをリフレッシュして最新データを取得
    router.refresh();
  }, [router]);

  return (
    <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
      {/* ツールバー */}
      <div className="flex items-center justify-between px-6 py-4">
        <h1 className="text-2xl font-semibold tracking-tight">
          ガントチャート
        </h1>
      </div>

      {/* ガントチャート本体 */}
      <div className="gantt-wrapper min-w-0 flex-1 overflow-hidden px-8 pb-4">
        <div className="h-full overflow-hidden rounded-lg border bg-card">
          <GanttChart
            key={ganttKey}
            tasks={tasks}
            projectKey={projectKey}
            projectId={projectId}
            onTaskClick={handleTaskClick}
          />
        </div>
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

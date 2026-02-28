"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import type { TaskWithRelations, ProjectMemberWithUser, Category, TaskStatusConfig } from "@/types";
import { EditTaskDialog } from "@/components/tasks/edit-task-dialog";

const GanttTest = dynamic(
  () => import("@/components/gantt/gantt-test"),
  { ssr: false }
);

interface GanttTestWrapperProps {
  tasks: TaskWithRelations[];
  projectKey: string;
  projectId: string;
  members: ProjectMemberWithUser[];
  categories: Category[];
  statuses: TaskStatusConfig[];
}

export function GanttTestWrapper({
  tasks,
  projectKey,
  projectId,
  members,
  categories,
  statuses,
}: GanttTestWrapperProps) {
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

  /** タスク更新成功時のハンドラ */
  const handleTaskUpdated = useCallback(() => {
    router.refresh();
  }, [router]);

  return (
    <>
      <GanttTest
        tasks={tasks}
        projectKey={projectKey}
        projectId={projectId}
        onTaskClick={handleTaskClick}
      />

      {/* 編集ダイアログ */}
      {selectedTask && statuses && statuses.length > 0 && (
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
    </>
  );
}

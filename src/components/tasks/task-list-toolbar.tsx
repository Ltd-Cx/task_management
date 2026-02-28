"use client";

import { PageToolbar } from "@/components/shared/page-toolbar";
import { AddTaskDialog } from "@/components/tasks/add-task-dialog";
import type { ProjectMemberWithUser, Category, TaskStatusConfig } from "@/types";

interface TaskListToolbarProps {
  projectId: string;
  members: ProjectMemberWithUser[];
  categories: Category[];
  statuses: TaskStatusConfig[];
}

/** 課題一覧ツールバー */
export function TaskListToolbar({
  projectId,
  members,
  categories,
  statuses,
}: TaskListToolbarProps) {
  return (
    <PageToolbar title="課題">
      <AddTaskDialog
        projectId={projectId}
        members={members}
        categories={categories}
        statuses={statuses}
      />
    </PageToolbar>
  );
}

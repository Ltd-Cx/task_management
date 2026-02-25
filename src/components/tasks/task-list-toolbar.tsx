"use client";

import { PageToolbar } from "@/components/shared/page-toolbar";
import { AddTaskDialog } from "@/components/tasks/add-task-dialog";
import type { ProjectMemberWithUser, Category } from "@/types";

interface TaskListToolbarProps {
  projectId: string;
  members: ProjectMemberWithUser[];
  categories: Category[];
}

/** 課題一覧ツールバー */
export function TaskListToolbar({
  projectId,
  members,
  categories,
}: TaskListToolbarProps) {
  return (
    <PageToolbar title="課題">
      <AddTaskDialog
        projectId={projectId}
        members={members}
        categories={categories}
      />
    </PageToolbar>
  );
}

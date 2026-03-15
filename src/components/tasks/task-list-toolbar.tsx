"use client";

import { PageToolbar } from "@/components/shared/page-toolbar";
import { AddTaskDialog } from "@/components/tasks/add-task-dialog";
import type { TaskGroupWithCount } from "@/components/tasks/add-task-group-dialog";
import type { ProjectMemberWithUser, Category, TaskStatusConfig } from "@/types";

interface TaskListToolbarProps {
  projectId: string;
  members: ProjectMemberWithUser[];
  categories: Category[];
  statuses: TaskStatusConfig[];
  taskGroups: TaskGroupWithCount[];
}

/** 課題一覧ツールバー */
export function TaskListToolbar({
  projectId,
  members,
  categories,
  statuses,
  taskGroups,
}: TaskListToolbarProps) {
  return (
    <PageToolbar title="課題">
      <AddTaskDialog
        projectId={projectId}
        members={members}
        categories={categories}
        statuses={statuses}
        taskGroups={taskGroups}
      />
    </PageToolbar>
  );
}

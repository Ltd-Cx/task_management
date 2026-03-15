"use client";

import { useState, useMemo } from "react";
import { GanttToolbar, type GanttFilters } from "@/components/gantt/gantt-toolbar";
import { GanttView } from "@/components/gantt/gantt-view";
import type { TaskGroupWithCount } from "@/components/tasks/add-task-group-dialog";
import type {
  TaskWithRelations,
  RepositoryMemberWithUser,
  Category,
  TaskStatusConfig,
} from "@/types";

interface GanttPageClientProps {
  tasks: TaskWithRelations[];
  taskGroups: TaskGroupWithCount[];
  repositoryKey: string;
  repositoryId: string;
  members: RepositoryMemberWithUser[];
  categories: Category[];
  statuses: TaskStatusConfig[];
}

/** ガントチャートページのクライアントコンポーネント */
export function GanttPageClient({
  tasks,
  taskGroups,
  repositoryKey,
  repositoryId,
  members,
  categories,
  statuses,
}: GanttPageClientProps) {
  const [filters, setFilters] = useState<GanttFilters>({
    taskGroupId: "",
    categoryId: "",
    assigneeId: "",
    startDate: "",
    endDate: "",
  });

  /** フィルター適用後のタスク */
  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      // プロジェクトフィルター
      if (filters.taskGroupId) {
        if (filters.taskGroupId === "__none__") {
          if (task.taskProjectId) return false;
        } else {
          if (task.taskProjectId !== filters.taskGroupId) return false;
        }
      }

      // カテゴリーフィルター
      if (filters.categoryId && task.categoryId !== filters.categoryId) {
        return false;
      }

      // 担当者フィルター
      if (filters.assigneeId && task.assigneeId !== filters.assigneeId) {
        return false;
      }

      // 開始日フィルター（指定日以降）
      if (filters.startDate && task.startDate) {
        if (task.startDate < filters.startDate) return false;
      }

      // 終了日フィルター（指定日以前）
      if (filters.endDate && task.dueDate) {
        if (task.dueDate > filters.endDate) return false;
      }

      return true;
    });
  }, [tasks, filters]);

  return (
    <div className="flex flex-1 flex-col gap-6 overflow-hidden p-6">
      <GanttToolbar
        repositoryId={repositoryId}
        members={members}
        categories={categories}
        statuses={statuses}
        taskGroups={taskGroups}
        filters={filters}
        onFiltersChange={setFilters}
      />
      <div className="min-h-0 flex-1 overflow-hidden shadow-lg rounded-lg">
        <GanttView
          tasks={filteredTasks}
          taskGroups={taskGroups}
          repositoryKey={repositoryKey}
          repositoryId={repositoryId}
          members={members}
          categories={categories}
          statuses={statuses}
        />
      </div>
    </div>
  );
}

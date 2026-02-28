"use client";

import { useState, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { TaskStatusBadge } from "@/components/tasks/task-status-badge";
import { TaskPriorityBadge } from "@/components/tasks/task-priority-badge";
import { TaskListFilters, type TaskFilters } from "@/components/tasks/task-list-filters";
import { UserAvatar } from "@/components/shared/user-avatar";
import { EditTaskDialog } from "@/components/tasks/edit-task-dialog";
import { formatDate } from "@/lib/date";
import type { TaskWithRelations, ProjectMemberWithUser, Category, TaskStatusConfig } from "@/types";

interface TaskTableProps {
  tasks: TaskWithRelations[];
  projectKey: string;
  projectId: string;
  members: ProjectMemberWithUser[];
  categories: Category[];
  statuses: TaskStatusConfig[];
}

/** 課題一覧テーブル */
export function TaskTable({ tasks, projectKey, projectId, members, categories, statuses }: TaskTableProps) {
  // ステータスキーからステータス設定を取得するヘルパー
  const getStatusConfig = (key: string) => statuses.find((s) => s.key === key);
  const [editingTask, setEditingTask] = useState<TaskWithRelations | null>(null);
  const [filters, setFilters] = useState<TaskFilters>({
    status: null,
    priority: null,
    assigneeId: null,
    categoryId: null,
  });

  // フィルター適用
  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      // 状態フィルター
      if (filters.status && task.status !== filters.status) {
        return false;
      }
      // 優先度フィルター
      if (filters.priority && task.priority !== filters.priority) {
        return false;
      }
      // 担当者フィルター
      if (filters.assigneeId) {
        if (filters.assigneeId === "unassigned") {
          if (task.assigneeId) return false;
        } else if (task.assigneeId !== filters.assigneeId) {
          return false;
        }
      }
      // カテゴリーフィルター
      if (filters.categoryId) {
        if (filters.categoryId === "none") {
          if (task.categoryId) return false;
        } else if (task.categoryId !== filters.categoryId) {
          return false;
        }
      }
      return true;
    });
  }, [tasks, filters]);

  const hasActiveFilters =
    filters.status || filters.priority || filters.assigneeId || filters.categoryId;

  return (
    <div className="space-y-4">
      {/* フィルター */}
      <TaskListFilters
        statuses={statuses}
        members={members}
        categories={categories}
        filters={filters}
        onFiltersChange={setFilters}
      />

      {/* 結果件数 */}
      {hasActiveFilters && (
        <p className="text-sm text-muted-foreground">
          {filteredTasks.length}件の課題が見つかりました
        </p>
      )}

      {/* テーブル */}
      {filteredTasks.length === 0 ? (
        <div className="flex h-40 items-center justify-center text-muted-foreground rounded-lg border bg-card">
          {tasks.length === 0 ? "課題がありません" : "条件に一致する課題がありません"}
        </div>
      ) : (
      <div className="overflow-hidden rounded-lg border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[100px]">キー</TableHead>
            <TableHead>件名</TableHead>
            <TableHead className="w-[100px]">状態</TableHead>
            <TableHead className="w-[80px]">優先度</TableHead>
            <TableHead className="w-[140px]">担当者</TableHead>
            <TableHead className="w-[120px]">カテゴリー</TableHead>
            <TableHead className="w-[110px]">更新日</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredTasks.map((task) => (
            <TableRow
              key={task.id}
              className="cursor-pointer"
              onClick={() => setEditingTask(task)}
            >
              <TableCell className="font-mono text-[13px] font-medium text-muted-foreground">
                {projectKey}-{task.keyId}
              </TableCell>
              <TableCell className="text-[13px]">{task.summary}</TableCell>
              <TableCell>
                <TaskStatusBadge status={task.status} statusConfig={getStatusConfig(task.status)} />
              </TableCell>
              <TableCell>
                <TaskPriorityBadge priority={task.priority} />
              </TableCell>
              <TableCell>
                {task.assignee ? (
                  <div className="flex items-center gap-2">
                    <UserAvatar user={task.assignee} size="md" />
                    <span className="text-[13px]">{task.assignee.displayName}</span>
                  </div>
                ) : (
                  <span className="text-sm text-muted-foreground">未割当</span>
                )}
              </TableCell>
              <TableCell>
                {task.category ? (
                  <Badge variant="outline" className="text-[11px]">
                    {task.category.name}
                  </Badge>
                ) : (
                  <span className="text-[13px] text-muted-foreground">-</span>
                )}
              </TableCell>
              <TableCell className="text-[13px] text-muted-foreground">
                {formatDate(task.updatedAt)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      </div>
      )}

      {editingTask && (
        <EditTaskDialog
          task={editingTask}
          projectId={projectId}
          members={members}
          categories={categories}
          statuses={statuses}
          open={!!editingTask}
          onOpenChange={(open) => {
            if (!open) setEditingTask(null);
          }}
        />
      )}
    </div>
  );
}

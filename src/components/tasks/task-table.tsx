"use client";

import { useState } from "react";
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
import { UserAvatar } from "@/components/shared/user-avatar";
import { EditTaskDialog } from "@/components/tasks/edit-task-dialog";
import { formatDate } from "@/lib/date";
import type { TaskWithRelations, ProjectMemberWithUser, Category } from "@/types";

interface TaskTableProps {
  tasks: TaskWithRelations[];
  projectKey: string;
  projectId: string;
  members: ProjectMemberWithUser[];
  categories: Category[];
}

/** 課題一覧テーブル */
export function TaskTable({ tasks, projectKey, projectId, members, categories }: TaskTableProps) {
  const [editingTask, setEditingTask] = useState<TaskWithRelations | null>(null);

  if (tasks.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center text-muted-foreground">
        課題がありません
      </div>
    );
  }

  return (
    <>
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
          {tasks.map((task) => (
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
                <TaskStatusBadge status={task.status} />
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

      {editingTask && (
        <EditTaskDialog
          task={editingTask}
          projectId={projectId}
          members={members}
          categories={categories}
          open={!!editingTask}
          onOpenChange={(open) => {
            if (!open) setEditingTask(null);
          }}
        />
      )}
    </>
  );
}

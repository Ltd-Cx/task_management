"use client";

import { useState, useMemo } from "react";
import { X } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TaskStatusBadge } from "@/components/tasks/task-status-badge";
import { TaskPriorityBadge } from "@/components/tasks/task-priority-badge";
import { UserAvatar } from "@/components/shared/user-avatar";
import { TaskDetailDialog } from "@/components/tasks/task-detail-dialog";
import { AddTaskDialog } from "@/components/tasks/add-task-dialog";
import { AddTaskGroupDialog, type TaskGroupWithCount } from "@/components/tasks/add-task-group-dialog";
import { AddMemberInlineDialog } from "@/components/tasks/add-member-inline-dialog";
import { AddCategoryInlineDialog } from "@/components/tasks/add-category-inline-dialog";
import { TASK_PRIORITY_CONFIG } from "@/lib/constants";
import { formatDate } from "@/lib/date";
import type { TaskWithRelations, ProjectMemberWithUser, Category, TaskStatusConfig, TaskPriority } from "@/types";

interface TaskFilters {
  taskGroupId: string;
  categoryId: string;
  assigneeId: string;
  status: string;
  priority: string;
}

interface TaskTableProps {
  tasks: TaskWithRelations[];
  projectKey: string;
  projectId: string;
  members: ProjectMemberWithUser[];
  categories: Category[];
  statuses: TaskStatusConfig[];
  taskGroups: TaskGroupWithCount[];
}

/** 課題一覧テーブル */
export function TaskTable({ tasks, projectKey, projectId, members, categories, statuses, taskGroups }: TaskTableProps) {
  const getStatusConfig = (key: string) => statuses.find((s) => s.key === key);
  const [selectedTask, setSelectedTask] = useState<TaskWithRelations | null>(null);
  const [filters, setFilters] = useState<TaskFilters>({
    taskGroupId: "",
    categoryId: "",
    assigneeId: "",
    status: "",
    priority: "",
  });

  /** フィルターの更新 */
  const updateFilter = <K extends keyof TaskFilters>(
    key: K,
    value: TaskFilters[K]
  ) => {
    setFilters({ ...filters, [key]: value });
  };

  /** フィルターをリセット */
  const resetFilters = () => {
    setFilters({
      taskGroupId: "",
      categoryId: "",
      assigneeId: "",
      status: "",
      priority: "",
    });
  };

  /** アクティブなフィルター数 */
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.taskGroupId) count++;
    if (filters.categoryId) count++;
    if (filters.assigneeId) count++;
    if (filters.status) count++;
    if (filters.priority) count++;
    return count;
  }, [filters]);

  // フィルター適用
  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      // グループフィルター
      if (filters.taskGroupId) {
        if (filters.taskGroupId === "__none__") {
          if (task.taskGroupId) return false;
        } else if (task.taskGroupId !== filters.taskGroupId) {
          return false;
        }
      }
      // カテゴリーフィルター
      if (filters.categoryId) {
        if (filters.categoryId === "__none__") {
          if (task.categoryId) return false;
        } else if (task.categoryId !== filters.categoryId) {
          return false;
        }
      }
      // 担当者フィルター
      if (filters.assigneeId) {
        if (filters.assigneeId === "__none__") {
          if (task.assigneeId) return false;
        } else if (task.assigneeId !== filters.assigneeId) {
          return false;
        }
      }
      // 状態フィルター
      if (filters.status && task.status !== filters.status) {
        return false;
      }
      // 優先度フィルター
      if (filters.priority && task.priority !== filters.priority) {
        return false;
      }
      return true;
    });
  }, [tasks, filters]);

  return (
    <div className="space-y-4">
      <div className="flex items-end gap-3 rounded-lg border bg-muted/30 p-4">
        <div className="min-w-0 flex-1 space-y-1.5">
          <Label className="mb-2 text-xs font-medium text-muted-foreground">プロジェクト</Label>
          <Select
            value={filters.taskGroupId || "__all__"}
            onValueChange={(v) => updateFilter("taskGroupId", v === "__all__" ? "" : v)}
          >
            <SelectTrigger className="w-full rounded-full bg-background">
              <SelectValue placeholder="すべて" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">すべて</SelectItem>
              <SelectItem value="__none__">グループなし</SelectItem>
              {taskGroups.map((g) => (
                <SelectItem key={g.id} value={g.id}>
                  <span className="flex items-center gap-2">
                    <span
                      className="size-3 rounded-full"
                      style={{ backgroundColor: g.color }}
                    />
                    {g.name}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* カテゴリー */}
        <div className="min-w-0 flex-1 space-y-1.5">
          <Label className="mb-2 text-xs font-medium text-muted-foreground">カテゴリー</Label>
          <Select
            value={filters.categoryId || "__all__"}
            onValueChange={(v) => updateFilter("categoryId", v === "__all__" ? "" : v)}
          >
            <SelectTrigger className="w-full rounded-full bg-background">
              <SelectValue placeholder="すべて" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">すべて</SelectItem>
              <SelectItem value="__none__">カテゴリーなし</SelectItem>
              {categories.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  <span className="flex items-center gap-2">
                    <span
                      className="size-3 rounded-full"
                      style={{ backgroundColor: c.color ?? "#95a5a6" }}
                    />
                    {c.name}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* 担当者 */}
        <div className="min-w-0 flex-1 space-y-1.5">
          <Label className="mb-2 text-xs font-medium text-muted-foreground">担当者</Label>
          <Select
            value={filters.assigneeId || "__all__"}
            onValueChange={(v) => updateFilter("assigneeId", v === "__all__" ? "" : v)}
          >
            <SelectTrigger className="w-full rounded-full bg-background">
              <SelectValue placeholder="すべて" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">すべて</SelectItem>
              <SelectItem value="__none__">未割当</SelectItem>
              {members.map((m) => (
                <SelectItem key={m.user.id} value={m.user.id}>
                  {m.user.displayName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* 状態 */}
        <div className="min-w-0 flex-1 space-y-1.5">
          <Label className="mb-2 text-xs font-medium text-muted-foreground">状態</Label>
          <Select
            value={filters.status || "__all__"}
            onValueChange={(v) => updateFilter("status", v === "__all__" ? "" : v)}
          >
            <SelectTrigger className="w-full rounded-full bg-background">
              <SelectValue placeholder="すべて" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">すべて</SelectItem>
              {statuses.map((s) => (
                <SelectItem key={s.key} value={s.key}>
                  <span className="flex items-center gap-2">
                    <span
                      className="size-2 rounded-full"
                      style={{ backgroundColor: s.color }}
                    />
                    {s.label}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* 優先度 */}
        <div className="min-w-0 flex-1 space-y-1.5">
          <Label className="mb-2 text-xs font-medium text-muted-foreground">優先度</Label>
          <Select
            value={filters.priority || "__all__"}
            onValueChange={(v) => updateFilter("priority", v === "__all__" ? "" : v)}
          >
            <SelectTrigger className="w-full rounded-full bg-background">
              <SelectValue placeholder="すべて" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">すべて</SelectItem>
              {(Object.entries(TASK_PRIORITY_CONFIG) as [TaskPriority, { label: string }][]).map(
                ([value, config]) => (
                  <SelectItem key={value} value={value}>{config.label}</SelectItem>
                )
              )}
            </SelectContent>
          </Select>
        </div>

        {/* リセットボタン */}
        {activeFilterCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={resetFilters}
            className="shrink-0 gap-1 rounded-full text-muted-foreground hover:text-foreground"
          >
            <X className="size-4" />
            リセット
          </Button>
        )}
      </div>

      {/* 追加セクション */}
      <div className="flex items-center gap-2 rounded-lg border bg-muted/30 p-4">
        <AddTaskGroupDialog
          projectId={projectId}
          existingGroups={taskGroups}
          buttonLabel="プロジェクト追加"
        />
        <AddMemberInlineDialog
          projectId={projectId}
          existingMembers={members}
          buttonLabel="担当者追加"
        />
        <AddCategoryInlineDialog
          projectId={projectId}
          existingCategories={categories}
          buttonLabel="カテゴリー追加"
        />
        <AddTaskDialog
          projectId={projectId}
          members={members}
          categories={categories}
          statuses={statuses}
          taskGroups={taskGroups}
        />
      </div>

      {/* 結果件数 */}
      {activeFilterCount > 0 && (
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
              onClick={() => setSelectedTask(task)}
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

      {/* 詳細ダイアログ */}
      {selectedTask && (
        <TaskDetailDialog
          task={selectedTask}
          projectKey={projectKey}
          projectId={projectId}
          members={members}
          categories={categories}
          statuses={statuses}
          taskGroups={taskGroups}
          open={!!selectedTask}
          onOpenChange={(open) => {
            if (!open) setSelectedTask(null);
          }}
        />
      )}
    </div>
  );
}

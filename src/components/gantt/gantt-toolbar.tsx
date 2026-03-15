"use client";

import { useMemo } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AddTaskDialog } from "@/components/tasks/add-task-dialog";
import { AddMemberInlineDialog } from "@/components/tasks/add-member-inline-dialog";
import { AddCategoryInlineDialog } from "@/components/tasks/add-category-inline-dialog";
import { AddTaskGroupDialog, type TaskGroupWithCount } from "@/components/tasks/add-task-group-dialog";
import type { ProjectMemberWithUser, Category, TaskStatusConfig } from "@/types";
import { Label } from "@/components/ui/label";


export interface GanttFilters {
  taskGroupId: string;
  categoryId: string;
  assigneeId: string;
  startDate: string;
  endDate: string;
}

interface GanttToolbarProps {
  projectId: string;
  members: ProjectMemberWithUser[];
  categories: Category[];
  statuses: TaskStatusConfig[];
  taskGroups: TaskGroupWithCount[];
  filters: GanttFilters;
  onFiltersChange: (filters: GanttFilters) => void;
}

/** ガントチャートツールバー */
export function GanttToolbar({
  projectId,
  members,
  categories,
  statuses,
  taskGroups,
  filters,
  onFiltersChange,
}: GanttToolbarProps) {
  /** フィルターの更新 */
  const updateFilter = <K extends keyof GanttFilters>(
    key: K,
    value: GanttFilters[K]
  ) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  /** フィルターをリセット */
  const resetFilters = () => {
    onFiltersChange({
      taskGroupId: "",
      categoryId: "",
      assigneeId: "",
      startDate: "",
      endDate: "",
    });
  };

  /** アクティブなフィルター数 */
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.taskGroupId) count++;
    if (filters.categoryId) count++;
    if (filters.assigneeId) count++;
    if (filters.startDate) count++;
    if (filters.endDate) count++;
    return count;
  }, [filters]);

  return (
    <div className="space-y-4">
      {/* ヘッダー行 */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">ガントチャート</h1>
      </div>

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
              {members.map((m) => (
                <SelectItem key={m.user.id} value={m.user.id}>
                  {m.user.displayName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* 開始日 */}
        <div className="min-w-0 flex-1 space-y-1.5">
          <Label className="mb-2 text-xs font-medium text-muted-foreground">開始日</Label>
          <DatePicker
            value={filters.startDate}
            onChange={(v) => updateFilter("startDate", v ?? "")}
            placeholder="年 / 月 / 日"
            className="w-full rounded-full"
            rounded
          />
        </div>

        {/* 終了日 */}
        <div className="min-w-0 flex-1 space-y-1.5">
          <Label className="mb-2 text-xs font-medium text-muted-foreground">終了日</Label>
          <DatePicker
            value={filters.endDate}
            onChange={(v) => updateFilter("endDate", v ?? "")}
            placeholder="年 / 月 / 日"
            className="w-full rounded-full"
            rounded
          />
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
    </div>
  );
}

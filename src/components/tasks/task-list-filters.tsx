"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { TASK_PRIORITY_CONFIG } from "@/lib/constants";
import type { ProjectMemberWithUser, Category, TaskStatusConfig, TaskPriority } from "@/types";

export interface TaskFilters {
  status: string | null;
  priority: string | null;
  assigneeId: string | null;
  categoryId: string | null;
}

interface TaskListFiltersProps {
  statuses: TaskStatusConfig[];
  members: ProjectMemberWithUser[];
  categories: Category[];
  filters: TaskFilters;
  onFiltersChange: (filters: TaskFilters) => void;
}

/** 課題一覧フィルター */
export function TaskListFilters({
  statuses,
  members,
  categories,
  filters,
  onFiltersChange,
}: TaskListFiltersProps) {
  const hasActiveFilters =
    filters.status || filters.priority || filters.assigneeId || filters.categoryId;

  const handleClearFilters = () => {
    onFiltersChange({
      status: null,
      priority: null,
      assigneeId: null,
      categoryId: null,
    });
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* 状態 */}
      <Select
        value={filters.status ?? "all"}
        onValueChange={(value) =>
          onFiltersChange({ ...filters, status: value === "all" ? null : value })
        }
      >
        <SelectTrigger className="w-[130px] h-9">
          <SelectValue placeholder="状態" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">すべての状態</SelectItem>
          {statuses.map((status) => (
            <SelectItem key={status.key} value={status.key}>
              <span className="flex items-center gap-2">
                <span
                  className="size-2 rounded-full"
                  style={{ backgroundColor: status.color }}
                />
                {status.label}
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* 優先度 */}
      <Select
        value={filters.priority ?? "all"}
        onValueChange={(value) =>
          onFiltersChange({ ...filters, priority: value === "all" ? null : value })
        }
      >
        <SelectTrigger className="w-[130px] h-9">
          <SelectValue placeholder="優先度" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">すべての優先度</SelectItem>
          {(Object.entries(TASK_PRIORITY_CONFIG) as [TaskPriority, { label: string }][]).map(
            ([value, config]) => (
              <SelectItem key={value} value={value}>
                {config.label}
              </SelectItem>
            )
          )}
        </SelectContent>
      </Select>

      {/* 担当者 */}
      <Select
        value={filters.assigneeId ?? "all"}
        onValueChange={(value) =>
          onFiltersChange({ ...filters, assigneeId: value === "all" ? null : value })
        }
      >
        <SelectTrigger className="w-[150px] h-9">
          <SelectValue placeholder="担当者" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">すべての担当者</SelectItem>
          <SelectItem value="unassigned">未割当</SelectItem>
          {members.map((member) => (
            <SelectItem key={member.user.id} value={member.user.id}>
              {member.user.displayName}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* カテゴリー */}
      <Select
        value={filters.categoryId ?? "all"}
        onValueChange={(value) =>
          onFiltersChange({ ...filters, categoryId: value === "all" ? null : value })
        }
      >
        <SelectTrigger className="w-[150px] h-9">
          <SelectValue placeholder="カテゴリー" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">すべてのカテゴリー</SelectItem>
          <SelectItem value="none">カテゴリーなし</SelectItem>
          {categories.map((category) => (
            <SelectItem key={category.id} value={category.id}>
              {category.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* クリアボタン */}
      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleClearFilters}
          className="h-9 px-2 text-muted-foreground"
        >
          <X className="size-4 mr-1" />
          クリア
        </Button>
      )}
    </div>
  );
}

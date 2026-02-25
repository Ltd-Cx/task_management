"use client";

import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { TaskPriorityBadge } from "@/components/tasks/task-priority-badge";
import { UserAvatar } from "@/components/shared/user-avatar";
import type { TaskWithRelations } from "@/types";

interface BoardCardProps {
  task: TaskWithRelations;
  projectKey: string;
  isDragOverlay?: boolean;
}

/** ボードカード（課題カード） */
export function BoardCard({ task, projectKey, isDragOverlay }: BoardCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task.id,
  });

  const style = transform
    ? { transform: CSS.Translate.toString(transform) }
    : undefined;

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={cn(
        "gap-2.5 py-3.5 shadow-sm transition-colors hover:bg-accent/50",
        isDragging && "opacity-50",
        isDragOverlay && "rotate-3 shadow-lg"
      )}
      {...listeners}
      {...attributes}
    >
      <CardContent className="space-y-2.5 px-3.5 py-0">
        {/* タスクキー */}
        <span className="font-mono text-xs font-medium text-muted-foreground">
          {projectKey}-{task.keyId}
        </span>

        {/* 件名 */}
        <p className="text-[13px] font-medium leading-snug">{task.summary}</p>

        {/* 下段: 優先度 + 担当者 */}
        <div className="flex items-center justify-between pt-1">
          <TaskPriorityBadge priority={task.priority} />
          {task.assignee && (
            <UserAvatar user={task.assignee} size="sm" />
          )}
        </div>
      </CardContent>
    </Card>
  );
}

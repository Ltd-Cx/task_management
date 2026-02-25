"use client";

import { useDroppable } from "@dnd-kit/core";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { TASK_STATUS_CONFIG } from "@/lib/constants";
import { BoardCard } from "@/components/board/board-card";
import type { TaskWithRelations, TaskStatus } from "@/types";

interface BoardColumnProps {
  status: TaskStatus;
  tasks: TaskWithRelations[];
  projectKey: string;
}

/** ボードカラム（ステータス別列） */
export function BoardColumn({ status, tasks, projectKey }: BoardColumnProps) {
  const config = TASK_STATUS_CONFIG[status];
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex min-w-[280px] flex-1 flex-col gap-3 rounded-lg bg-muted p-3 transition-colors",
        isOver && "bg-accent/60"
      )}
    >
      {/* カラムヘッダー */}
      <div className="flex items-center gap-2">
        <span className={cn("size-2.5 rounded-full", config.dotClass)} />
        <span className="text-sm font-semibold">{config.label}</span>
        <Badge variant="secondary" className="ml-auto text-xs">
          {tasks.length}
        </Badge>
      </div>

      {/* カード一覧 */}
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="flex flex-col gap-3">
          {tasks.length === 0 ? (
            <div className="flex h-20 items-center justify-center text-sm text-muted-foreground">
              課題なし
            </div>
          ) : (
            tasks.map((task) => (
              <BoardCard key={task.id} task={task} projectKey={projectKey} />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

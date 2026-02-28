"use client";

import { useState, useCallback, useMemo } from "react";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import { BoardColumn } from "@/components/board/board-column";
import { BoardCard } from "@/components/board/board-card";
import { updateTaskStatus } from "@/actions/task-actions";
import type { DynamicTasksByStatus, TaskWithRelations, TaskStatusConfig } from "@/types";

interface BoardViewProps {
  tasksByStatus: DynamicTasksByStatus;
  statuses: TaskStatusConfig[];
  projectKey: string;
  projectId: string;
}

/** ボードビュー（カンバン全体） */
export function BoardView({ tasksByStatus, statuses, projectKey, projectId }: BoardViewProps) {
  const [localTasks, setLocalTasks] = useState<DynamicTasksByStatus>(tasksByStatus);
  const [activeTask, setActiveTask] = useState<TaskWithRelations | null>(null);

  // ステータスキーの配列を生成
  const statusKeys = useMemo(() => statuses.map((s) => s.key), [statuses]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  );

  /** ドラッグ中のタスクを特定 */
  const findTask = useCallback(
    (taskId: string): TaskWithRelations | undefined => {
      for (const status of statusKeys) {
        const found = localTasks[status]?.find((t) => t.id === taskId);
        if (found) return found;
      }
      return undefined;
    },
    [localTasks, statusKeys]
  );

  /** ドラッグ中のタスクの現在のステータスを特定 */
  const findTaskStatus = useCallback(
    (taskId: string): string | undefined => {
      for (const status of statusKeys) {
        if (localTasks[status]?.some((t) => t.id === taskId)) return status;
      }
      return undefined;
    },
    [localTasks, statusKeys]
  );

  function handleDragStart(event: DragStartEvent) {
    const task = findTask(String(event.active.id));
    setActiveTask(task ?? null);
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveTask(null);

    const { active, over } = event;
    if (!over) return;

    const taskId = String(active.id);
    const currentStatus = findTaskStatus(taskId);

    // ドロップ先のステータスを判定（カラムIDまたはカードのステータス）
    const overIdStr = String(over.id);
    let newStatus: string;
    if (statusKeys.includes(overIdStr)) {
      newStatus = overIdStr;
    } else {
      // カード上にドロップした場合、そのカードのステータスを使う
      const overTaskStatus = findTaskStatus(overIdStr);
      if (!overTaskStatus) return;
      newStatus = overTaskStatus;
    }

    if (!currentStatus || currentStatus === newStatus) return;

    const task = findTask(taskId);
    if (!task) return;

    // Optimistic UI: ローカルstate更新
    setLocalTasks((prev) => {
      const updated = { ...prev };
      updated[currentStatus] = (prev[currentStatus] ?? []).filter((t) => t.id !== taskId);
      updated[newStatus] = [...(prev[newStatus] ?? []), { ...task, status: newStatus as typeof task.status }];
      return updated;
    });

    // Server Action 実行
    updateTaskStatus({ taskId, status: newStatus, projectId });
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex min-h-0 flex-1 gap-4 overflow-x-auto pb-4">
        {statuses.map((statusConfig) => (
          <BoardColumn
            key={statusConfig.key}
            status={statusConfig.key}
            statusConfig={statusConfig}
            tasks={localTasks[statusConfig.key] ?? []}
            projectKey={projectKey}
          />
        ))}
      </div>

      <DragOverlay>
        {activeTask && (
          <BoardCard task={activeTask} projectKey={projectKey} isDragOverlay />
        )}
      </DragOverlay>
    </DndContext>
  );
}

import type { TaskWithRelations } from "@/types";

interface GanttTaskListProps {
  tasks: TaskWithRelations[];
  projectKey: string;
}

/** ガントチャート左側のタスクリスト */
export function GanttTaskList({ tasks, projectKey }: GanttTaskListProps) {
  return (
    <div className="w-[260px] shrink-0 border-r">
      {/* ヘッダー（月ヘッダー+日ヘッダーと高さを合わせる） */}
      <div className="flex h-[60px] items-center border-b bg-muted px-4">
        <span className="text-[13px] font-medium text-muted-foreground">課題</span>
      </div>

      {/* タスク行 */}
      {tasks.map((task) => (
        <div
          key={task.id}
          className="flex h-11 items-center gap-2 border-b px-4"
        >
          <span className="font-mono text-xs font-medium text-primary">
            {projectKey}-{task.keyId}
          </span>
          <span className="truncate text-xs">{task.summary}</span>
        </div>
      ))}
    </div>
  );
}

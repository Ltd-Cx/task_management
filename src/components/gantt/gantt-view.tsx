"use client";

import dynamic from "next/dynamic";
import type { TaskWithRelations } from "@/types";

const GanttChart = dynamic(
  () => import("@/components/gantt/gantt-chart"),
  { ssr: false }
);

interface GanttViewProps {
  tasks: TaskWithRelations[];
  projectKey: string;
  projectId: string;
}

/** ガントチャートビュー */
export function GanttView({ tasks, projectKey, projectId }: GanttViewProps) {
  return (
    <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
      {/* ツールバー */}
      <div className="flex items-center justify-between px-6 py-4">
        <h1 className="text-2xl font-semibold tracking-tight">
          ガントチャート
        </h1>
      </div>

      {/* ガントチャート本体 */}
      <div className="gantt-wrapper min-w-0 flex-1 overflow-hidden px-8 pb-4">
        <div className="h-full overflow-hidden rounded-lg border bg-card">
          <GanttChart
            tasks={tasks}
            projectKey={projectKey}
            projectId={projectId}
          />
        </div>
      </div>
    </div>
  );
}

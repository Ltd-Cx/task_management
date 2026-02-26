"use client";

import { memo, useRef, useState, useCallback } from "react";
import { Gantt, Willow } from "@svar-ui/react-gantt";
import "@svar-ui/react-gantt/style.css";
import type { TaskWithRelations } from "@/types";

interface GanttChartProps {
  tasks: TaskWithRelations[];
  projectKey: string;
  projectId: string;
}

/** 週末セルのハイライト（モジュールスコープで安定した参照を保持） */
function highlightTime(date: Date, unit: "day" | "hour"): string {
  if (unit === "day") {
    const day = date.getDay();
    if (day === 0 || day === 6) return "gantt-weekend";
  }
  return "";
}

/** SVAR React Gantt 本体（クライアント専用）
 *
 * memo で再レンダリングを完全に遮断する。
 * Server Action 呼び出し後に Next.js がサーバーコンポーネントを再フェッチしても、
 * このコンポーネントは再レンダリングされない。
 * SVAR はドラッグ/リサイズの結果を内部状態で管理するため問題ない。
 */
const GanttChart = memo(
  function GanttChart({ tasks, projectKey, projectId }: GanttChartProps) {
    const projectIdRef = useRef(projectId);
    projectIdRef.current = projectId;

    /** 初回マウント時のみタスクデータを変換（SVAR が以降の変更を内部管理） */
    const [ganttTasks] = useState(() =>
      tasks
        .filter((t) => t.startDate != null && t.dueDate != null)
        .map((t) => {
          const endDate = new Date(t.dueDate!);
          endDate.setDate(endDate.getDate() + 1);
          return {
            id: t.id,
            text: `${projectKey}-${t.keyId} ${t.summary}`,
            start: new Date(t.startDate!),
            end: endDate,
            progress: 0,
            type: "task" as const,
          };
        })
    );

    /** タイムライン表示範囲（タスクの最小・最大日付から前後7日の余白） */
    const [rangeStart] = useState<Date | undefined>(() => {
      if (ganttTasks.length === 0) return undefined;
      const min = ganttTasks.reduce(
        (m, t) => (t.start < m ? t.start : m),
        ganttTasks[0].start
      );
      const d = new Date(min);
      d.setDate(d.getDate() - 7);
      return d;
    });
    const [rangeEnd] = useState<Date | undefined>(() => {
      if (ganttTasks.length === 0) return undefined;
      const max = ganttTasks.reduce(
        (m, t) => (t.end > m ? t.end : m),
        ganttTasks[0].end
      );
      const d = new Date(max);
      d.setDate(d.getDate() + 7);
      return d;
    });

    const [columns] = useState(() => [
      { id: "text", header: "課題", flexgrow: 1 },
      { id: "start", header: "開始日", align: "center" as const, width: 110 },
      { id: "duration", header: "期間", align: "center" as const, width: 80 },
    ]);

    const [scales] = useState(() => [
      {
        unit: "month" as const,
        step: 1,
        format: (date: Date) =>
          `${date.getFullYear()}年${date.getMonth() + 1}月`,
      },
      {
        unit: "day" as const,
        step: 1,
        format: (date: Date) => `${date.getDate()}`,
      },
    ]);

    /** Gantt API 初期化時にイベントリスナーを登録 */
    const handleInit = useCallback(
      (api: {
        on: (
          action: string,
          callback: (ev: Record<string, unknown>) => void
        ) => void;
        getTask: (
          id: string | number
        ) => { start?: Date; end?: Date; [key: string]: unknown };
      }) => {
        api.on("update-task", (ev) => {
          if (ev.inProgress) return;

          const id = ev.id as string | number;
          const fullTask = api.getTask(id);
          if (
            !(fullTask.start instanceof Date) ||
            !(fullTask.end instanceof Date)
          )
            return;

          const startDate = fullTask.start.toISOString().split("T")[0];
          const dueEnd = new Date(fullTask.end);
          dueEnd.setDate(dueEnd.getDate() - 1);
          const dueDate = dueEnd.toISOString().split("T")[0];

          fetch("/api/tasks/update-dates", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              taskId: String(id),
              projectId: projectIdRef.current,
              startDate,
              dueDate,
            }),
          });
        });
      },
      []
    );

    return (
      <Willow>
        <Gantt
          tasks={ganttTasks}
          columns={columns}
          scales={scales}
          start={rangeStart}
          end={rangeEnd}
          autoScale={true}
          cellWidth={25}
          cellHeight={40}
          scaleHeight={48}
          highlightTime={highlightTime}
          init={handleInit}
        />
      </Willow>
    );
  },
  // Server Action 後の再レンダリングを完全に遮断
  () => true
);

export default GanttChart;

"use client";

import { memo, useRef, useState, useCallback, useMemo } from "react";
import RcGantt, { Gantt } from "rc-gantt";
import type { TaskWithRelations } from "@/types";

interface RcGanttChartProps {
  tasks: TaskWithRelations[];
  projectKey: string;
  projectId: string;
  onTaskClick?: (taskId: string) => void;
}

/** 日本語ローカライズ型 */
interface GanttLocale {
  today: string;
  day: string;
  days: string;
  week: string;
  month: string;
  quarter: string;
  halfYear: string;
  firstHalf: string;
  secondHalf: string;
  majorFormat: {
    day: string;
    week: string;
    month: string;
    quarter: string;
    halfYear: string;
  };
  minorFormat: {
    day: string;
    week: string;
    month: string;
    quarter: string;
    halfYear: string;
  };
}

/** 日本語ローカライズ */
const jaJP: GanttLocale = {
  today: "今日",
  day: "日",
  days: "日",
  week: "週",
  month: "月",
  quarter: "四半期",
  halfYear: "半期",
  firstHalf: "上半期",
  secondHalf: "下半期",
  majorFormat: {
    day: "YYYY年M月",
    week: "YYYY年M月",
    month: "YYYY年",
    quarter: "YYYY年",
    halfYear: "YYYY年",
  },
  minorFormat: {
    day: "D",
    week: "w週",
    month: "M月",
    quarter: "Q",
    halfYear: "M月",
  },
};

/** rc-gantt 用のレコード型 */
interface GanttRecord {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  content?: string;
}

/** rc-gantt 本体（クライアント専用） */
const RcGanttChart = memo(
  function RcGanttChart({ tasks, projectKey, projectId, onTaskClick }: RcGanttChartProps) {
    const projectIdRef = useRef(projectId);
    projectIdRef.current = projectId;

    const onTaskClickRef = useRef(onTaskClick);
    onTaskClickRef.current = onTaskClick;

    /** タスクデータを rc-gantt 形式に変換 */
    const ganttData = useMemo<Gantt.Record<GanttRecord>[]>(() => {
      return tasks
        .filter((t) => t.startDate != null && t.dueDate != null)
        .map((t) => ({
          id: t.id,
          name: `${projectKey}-${t.keyId} ${t.summary}`,
          startDate: t.startDate!,
          endDate: t.dueDate!,
          content: t.summary,
        }));
    }, [tasks, projectKey]);

    /** カラム定義 */
    const columns = useMemo<Gantt.Column[]>(() => [
      {
        name: "name",
        label: "課題",
        width: 300,
      },
    ], []);

    /** バークリックハンドラ */
    const handleBarClick = useCallback((record: Gantt.Record<GanttRecord>) => {
      if (record.id && onTaskClickRef.current) {
        onTaskClickRef.current(record.id);
      }
    }, []);

    /** 行クリックハンドラ */
    const handleRowClick = useMemo(() => ({
      onClick: (record: Gantt.Record<GanttRecord>) => {
        if (record.id && onTaskClickRef.current) {
          onTaskClickRef.current(record.id);
        }
      },
    }), []);

    /** 日付更新ハンドラ */
    const handleUpdate = useCallback(
      async (record: Gantt.Record<GanttRecord>, startDate: string, endDate: string) => {
        try {
          const res = await fetch("/api/tasks/update-dates", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              taskId: record.id,
              projectId: projectIdRef.current,
              startDate,
              dueDate: endDate,
            }),
          });

          if (!res.ok) {
            throw new Error("Failed to update dates");
          }

          return true;
        } catch (error) {
          console.error("日付更新エラー:", error);
          return false;
        }
      },
      []
    );

    /** 休日判定（土日） */
    const isRestDay = useCallback((date: string) => {
      const d = new Date(date);
      const day = d.getDay();
      return day === 0 || day === 6;
    }, []);

    if (ganttData.length === 0) {
      return (
        <div className="flex h-full items-center justify-center text-muted-foreground">
          開始日と期限が設定されたタスクがありません
        </div>
      );
    }

    return (
      <div style={{ width: "100%", height: "100%" }}>
        <RcGantt<GanttRecord>
          data={ganttData}
          columns={columns}
          onUpdate={handleUpdate}
          onBarClick={handleBarClick}
          onRow={handleRowClick}
          isRestDay={isRestDay}
          locale={jaJP}
          unit="day"
          rowHeight={40}
          showBackToday={true}
          showUnitSwitch={true}
        />
      </div>
    );
  },
  // 再レンダリングを遮断
  () => true
);

export default RcGanttChart;

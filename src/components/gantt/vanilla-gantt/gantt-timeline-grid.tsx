"use client";

import { memo } from "react";
import { GANTT_CONSTANTS, type DateCell } from "./types";
import { cn } from "@/lib/utils";

interface GanttTimelineGridProps {
  dates: DateCell[];
  height: number;
}

export const GanttTimelineGrid = memo(function GanttTimelineGrid({
  dates,
  height,
}: GanttTimelineGridProps) {
  return (
    <div
      className="pointer-events-none absolute inset-0 z-[1] flex"
      style={{ height: `${height}px` }}
    >
      {dates.map((dateCell) => (
        <div
          key={dateCell.dateStr}
          className={cn(
            "shrink-0 border-r border-gray-200",
            dateCell.isToday && "bg-blue-400/10",
            dateCell.isWeekend && !dateCell.isToday && "bg-gray-50"
          )}
          style={{
            width: `${GANTT_CONSTANTS.CELL_WIDTH}px`,
            minWidth: `${GANTT_CONSTANTS.CELL_WIDTH}px`,
          }}
        />
      ))}
    </div>
  );
});

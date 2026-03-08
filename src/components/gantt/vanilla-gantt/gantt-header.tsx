"use client";

import { memo } from "react";
import { GANTT_CONSTANTS, type DateCell, type MonthCell } from "./types";
import { getWeekdayName } from "./utils/date-utils";
import { cn } from "@/lib/utils";

interface GanttHeaderProps {
  dates: DateCell[];
  months: MonthCell[];
}

export const GanttHeader = memo(function GanttHeader({
  dates,
  months,
}: GanttHeaderProps) {
  const totalWidth = dates.length * GANTT_CONSTANTS.CELL_WIDTH;

  return (
    <div className="sticky top-0 z-[100] flex flex-col bg-white">
      {/* 月表示行 */}
      <div
        className="flex h-5 border-b border-gray-200 bg-gray-50"
        style={{ width: `${totalWidth}px` }}
      >
        {months.map((month, index) => (
          <div
            key={`${month.year}-${month.month}-${index}`}
            className="flex shrink-0 items-center justify-center border-r border-gray-200 text-[10px] font-bold text-gray-500"
            style={{ width: `${month.width}px` }}
          >
            {month.label}
          </div>
        ))}
      </div>

      {/* 日付行 */}
      <div className="flex h-[65px]">
        {dates.map((dateCell) => (
          <div
            key={dateCell.dateStr}
            className={cn(
              "flex shrink-0 flex-col items-center justify-center gap-0.5 border-r border-gray-200 px-0.5 py-1.5",
              dateCell.isToday && "bg-blue-400 text-white",
              dateCell.dayOfWeek === 0 &&
                !dateCell.isToday &&
                "bg-orange-50 text-gray-900",
              dateCell.dayOfWeek === 6 &&
                !dateCell.isToday &&
                "bg-blue-50 text-gray-900",
              !dateCell.isToday &&
                !dateCell.isWeekend &&
                "bg-white text-gray-900"
            )}
            style={{
              width: `${GANTT_CONSTANTS.CELL_WIDTH}px`,
              minWidth: `${GANTT_CONSTANTS.CELL_WIDTH}px`,
            }}
          >
            <div className="text-xs leading-none">
              {dateCell.date.getDate()}
            </div>
            <div
              className={cn(
                "pt-1 text-[8px] font-semibold leading-none",
                dateCell.isToday ? "text-white/80" : "text-gray-400"
              )}
            >
              {getWeekdayName(dateCell.dayOfWeek)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});

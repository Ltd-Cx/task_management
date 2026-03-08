"use client";

import { memo } from "react";
import { GANTT_CONSTANTS } from "./types";

export const GanttTaskInfoHeader = memo(function GanttTaskInfoHeader() {
  return (
    <div
      className="sticky top-0 z-[101] flex items-end border-b border-gray-300 bg-white px-4 pb-2.5 font-bold text-[10px] text-gray-700"
      style={{ height: `${GANTT_CONSTANTS.HEADER_HEIGHT}px` }}
    >
      <div className="pl-2.5">タスク名</div>
    </div>
  );
});

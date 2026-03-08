"use client";

import { memo } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { GANTT_CONSTANTS } from "./types";
import type { TaskGroup } from "@/types";
import { cn } from "@/lib/utils";

interface GanttGroupHeaderProps {
  group: TaskGroup | null;
  taskCount: number;
  isCollapsed: boolean;
  onToggle: () => void;
}

export const GanttGroupHeader = memo(function GanttGroupHeader({
  group,
  taskCount,
  isCollapsed,
  onToggle,
}: GanttGroupHeaderProps) {
  const groupName = group?.name ?? "グループなし";

  return (
    <div
      className={cn(
        "flex h-[35px] cursor-pointer items-center justify-between px-5 text-[13px] font-semibold uppercase tracking-wide transition-colors",
        group ? "bg-white hover:bg-gray-50" : "bg-white hover:bg-gray-50"
      )}
      onClick={onToggle}
    >
      <span className="text-gray-900">
        {groupName} ({taskCount})
      </span>
      <span className="text-xs text-gray-500">
        {isCollapsed ? (
          <ChevronRight className="h-4 w-4" />
        ) : (
          <ChevronDown className="h-4 w-4" />
        )}
      </span>
    </div>
  );
});

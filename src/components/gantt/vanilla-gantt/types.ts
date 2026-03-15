import type { TaskWithRelations, TaskProject } from "@/types";

/** ガントチャートの定数 */
export const GANTT_CONSTANTS = {
  CELL_WIDTH: 25,           // 1日 = 25px
  TASK_ROW_HEIGHT: 55,      // タスク行の高さ
  HEADER_HEIGHT: 85,        // ヘッダーの高さ
  GROUP_HEADER_HEIGHT: 35,  // グループヘッダーの高さ
  TASK_INFO_WIDTH: 400,     // 左側列の幅
  TASK_BAR_HEIGHT: 35,      // タスクバーの高さ
  TASK_BAR_TOP: 10,         // タスクバーの上マージン
  RESIZE_HANDLE_WIDTH: 10,  // リサイズハンドルの幅
} as const;

/** タスクプロジェクト（課題数付き） */
export interface TaskGroupWithCount extends TaskProject {
  taskCount: number;
}

/** ガントチャート用のタスクデータ（日付は任意） */
export interface GanttTask extends TaskWithRelations {
  startDate: string | null;
  dueDate: string | null;
}

/** グループ化されたタスク */
export interface GanttTaskGroup {
  group: TaskProject | null;
  tasks: GanttTask[];
  isCollapsed: boolean;
}

/** 日付範囲を持つタスク（バー表示可能） */
export type GanttTaskWithDateRange = GanttTask & { startDate: string; dueDate: string };

/** タスクがバー表示可能かどうか */
export function hasDateRange(task: GanttTask): task is GanttTaskWithDateRange {
  return task.startDate != null && task.dueDate != null;
}

/** ドラッグ状態 */
export interface DragState {
  taskId: string;
  mode: "move" | "resize-left" | "resize-right";
  startX: number;
  startLeft: number;
  startWidth: number;
  originalStartDate: string;
  originalEndDate: string;
}

/** ガントチャートのProps */
export interface GanttChartProps {
  tasks: TaskWithRelations[];
  taskGroups: TaskGroupWithCount[];
  repositoryKey: string;
  repositoryId: string;
  viewStartDate: Date;
  viewEndDate: Date;
  onTaskClick?: (taskId: string) => void;
  onTaskUpdate?: (taskId: string, startDate: string, dueDate: string) => void;
  onProgressUpdate?: (taskId: string, progress: number) => void;
}

/** 日付セルの情報 */
export interface DateCell {
  date: Date;
  dateStr: string;
  dayOfWeek: number;
  isToday: boolean;
  isWeekend: boolean;
}

/** 月セルの情報 */
export interface MonthCell {
  year: number;
  month: number;
  label: string;
  width: number;
}

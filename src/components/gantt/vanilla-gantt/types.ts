import type { TaskWithRelations, TaskGroup } from "@/types";

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

/** ガントチャート用のタスクデータ */
export interface GanttTask extends TaskWithRelations {
  startDate: string;
  dueDate: string;
}

/** グループ化されたタスク */
export interface GanttTaskGroup {
  group: TaskGroup | null;
  tasks: GanttTask[];
  isCollapsed: boolean;
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
  taskGroups: TaskGroup[];
  projectKey: string;
  projectId: string;
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

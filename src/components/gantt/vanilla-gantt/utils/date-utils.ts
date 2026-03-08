import { GANTT_CONSTANTS, type DateCell, type MonthCell } from "../types";

const WEEKDAY_NAMES = ["日", "月", "火", "水", "木", "金", "土"];

/** 日付をYYYY-MM-DD形式の文字列に変換 */
export function formatDateToString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** 日付文字列からDateオブジェクトを生成（ローカルタイムゾーン） */
export function parseDateString(dateStr: string): Date {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day);
}

/** 曜日名を取得 */
export function getWeekdayName(dayOfWeek: number): string {
  return WEEKDAY_NAMES[dayOfWeek];
}

/** 2つの日付間の日数を計算 */
export function getDaysBetween(startDate: Date, endDate: Date): number {
  const oneDay = 24 * 60 * 60 * 1000;
  return Math.ceil((endDate.getTime() - startDate.getTime()) / oneDay);
}

/** 日付配列を生成 */
export function generateDateRange(startDate: Date, endDate: Date): DateCell[] {
  const dates: DateCell[] = [];
  const current = new Date(startDate);
  const todayStr = formatDateToString(new Date());

  while (current <= endDate) {
    const dateStr = formatDateToString(current);
    const dayOfWeek = current.getDay();

    dates.push({
      date: new Date(current),
      dateStr,
      dayOfWeek,
      isToday: dateStr === todayStr,
      isWeekend: dayOfWeek === 0 || dayOfWeek === 6,
    });

    current.setDate(current.getDate() + 1);
  }

  return dates;
}

/** 月セル配列を生成 */
export function generateMonthCells(dates: DateCell[]): MonthCell[] {
  const months: MonthCell[] = [];
  let currentMonth = -1;
  let currentYear = -1;
  let dayCount = 0;

  dates.forEach((dateCell, index) => {
    const year = dateCell.date.getFullYear();
    const month = dateCell.date.getMonth();

    if (year !== currentYear || month !== currentMonth) {
      // 前の月を確定
      if (currentMonth !== -1) {
        months.push({
          year: currentYear,
          month: currentMonth + 1,
          label: `${currentMonth + 1}月`,
          width: dayCount * GANTT_CONSTANTS.CELL_WIDTH,
        });
      }

      currentYear = year;
      currentMonth = month;
      dayCount = 1;
    } else {
      dayCount++;
    }

    // 最後の日
    if (index === dates.length - 1) {
      months.push({
        year: currentYear,
        month: currentMonth + 1,
        label: `${currentMonth + 1}月`,
        width: dayCount * GANTT_CONSTANTS.CELL_WIDTH,
      });
    }
  });

  return months;
}

/** タスクバーの左位置を計算 */
export function calculateTaskBarLeft(
  taskStartDate: string,
  timelineStartDate: Date
): number {
  const start = parseDateString(taskStartDate);
  const days = getDaysBetween(timelineStartDate, start);
  // 負の位置も許可（タイムライン範囲外のタスクも表示可能に）
  return days * GANTT_CONSTANTS.CELL_WIDTH;
}

/** タスクバーの幅を計算 */
export function calculateTaskBarWidth(
  taskStartDate: string,
  taskEndDate: string
): number {
  const start = parseDateString(taskStartDate);
  const end = parseDateString(taskEndDate);
  const days = getDaysBetween(start, end) + 1;
  return days * GANTT_CONSTANTS.CELL_WIDTH - 4; // 4pxの余白
}

/** ピクセル差分から日数差分を計算 */
export function pixelsToDays(pixels: number): number {
  return Math.round(pixels / GANTT_CONSTANTS.CELL_WIDTH);
}

/** 日付に日数を加算 */
export function addDays(dateStr: string, days: number): string {
  const date = parseDateString(dateStr);
  date.setDate(date.getDate() + days);
  return formatDateToString(date);
}

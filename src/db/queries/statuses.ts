import { eq, asc } from "drizzle-orm";
import { db } from "@/db";
import { taskStatuses } from "@/db/schema";
import type { TaskStatusConfig } from "@/types";

/** デフォルトステータス設定（プロジェクトにステータスがない場合のフォールバック） */
const DEFAULT_STATUSES: Omit<TaskStatusConfig, "id" | "projectId" | "createdAt">[] = [
  { key: "open", label: "未対応", color: "#a3a3a3", displayOrder: 0 },
  { key: "in_progress", label: "処理中", color: "#3b82f6", displayOrder: 1 },
  { key: "resolved", label: "処理済み", color: "#f59e0b", displayOrder: 2 },
  { key: "closed", label: "完了", color: "#22c55e", displayOrder: 3 },
];

/** プロジェクトのカスタムステータス一覧を取得 */
export async function getProjectStatuses(projectId: string) {
  return db.query.taskStatuses.findMany({
    where: eq(taskStatuses.projectId, projectId),
    orderBy: [asc(taskStatuses.displayOrder)],
  });
}

/** プロジェクトのステータス一覧を取得（なければデフォルトを作成） */
export async function getProjectStatusesWithDefaults(projectId: string): Promise<TaskStatusConfig[]> {
  const existingStatuses = await getProjectStatuses(projectId);

  if (existingStatuses.length > 0) {
    return existingStatuses;
  }

  // ステータスが存在しない場合、デフォルトを作成
  const defaultStatusValues = DEFAULT_STATUSES.map((status) => ({
    ...status,
    projectId,
  }));

  await db.insert(taskStatuses).values(defaultStatusValues);

  return getProjectStatuses(projectId);
}

/** ステータスキーからステータス設定を取得 */
export async function getStatusByKey(projectId: string, key: string): Promise<TaskStatusConfig | undefined> {
  const statuses = await getProjectStatusesWithDefaults(projectId);
  return statuses.find((s) => s.key === key);
}

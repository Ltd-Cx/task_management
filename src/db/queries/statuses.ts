import { eq, asc } from "drizzle-orm";
import { db } from "@/db";
import { taskStatuses } from "@/db/schema";
import type { TaskStatusConfig } from "@/types";

/** デフォルトステータス設定（リポジトリにステータスがない場合のフォールバック） */
const DEFAULT_STATUSES: Omit<TaskStatusConfig, "id" | "repositoryId" | "createdAt">[] = [
  { key: "open", label: "未対応", color: "#a3a3a3", displayOrder: 0 },
  { key: "in_progress", label: "処理中", color: "#3b82f6", displayOrder: 1 },
  { key: "resolved", label: "処理済み", color: "#f59e0b", displayOrder: 2 },
  { key: "closed", label: "完了", color: "#22c55e", displayOrder: 3 },
];

/** リポジトリのカスタムステータス一覧を取得 */
export async function getRepositoryStatuses(repositoryId: string) {
  return db.query.taskStatuses.findMany({
    where: eq(taskStatuses.repositoryId, repositoryId),
    orderBy: [asc(taskStatuses.displayOrder)],
  });
}

/** リポジトリのステータス一覧を取得（なければデフォルトを作成） */
export async function getRepositoryStatusesWithDefaults(repositoryId: string): Promise<TaskStatusConfig[]> {
  const existingStatuses = await getRepositoryStatuses(repositoryId);

  if (existingStatuses.length > 0) {
    return existingStatuses;
  }

  // ステータスが存在しない場合、デフォルトを作成
  const defaultStatusValues = DEFAULT_STATUSES.map((status) => ({
    ...status,
    repositoryId,
  }));

  await db.insert(taskStatuses).values(defaultStatusValues);

  return getRepositoryStatuses(repositoryId);
}

/** ステータスキーからステータス設定を取得 */
export async function getStatusByKey(repositoryId: string, key: string): Promise<TaskStatusConfig | undefined> {
  const statuses = await getRepositoryStatusesWithDefaults(repositoryId);
  return statuses.find((s) => s.key === key);
}

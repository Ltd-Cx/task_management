import { eq, asc } from "drizzle-orm";
import { db } from "@/db";
import { taskStatuses } from "@/db/schema";

/** プロジェクトのカスタムステータス一覧を取得 */
export async function getProjectStatuses(projectId: string) {
  return db.query.taskStatuses.findMany({
    where: eq(taskStatuses.projectId, projectId),
    orderBy: [asc(taskStatuses.displayOrder)],
  });
}

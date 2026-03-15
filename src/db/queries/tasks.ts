import { eq, desc } from "drizzle-orm";
import { db } from "@/db";
import { tasks } from "@/db/schema";
import type { DynamicTasksByStatus } from "@/types";
import { getRepositoryStatusesWithDefaults } from "./statuses";

/** 課題一覧（リレーション含む）を取得 */
export async function getTasksWithRelations(repositoryId: string) {
  return db.query.tasks.findMany({
    where: eq(tasks.repositoryId, repositoryId),
    with: {
      assignee: true,
      category: true,
    },
    orderBy: [desc(tasks.updatedAt)],
  });
}

/** ステータス別課題を取得（ボード用） - 動的ステータス対応 */
export async function getTasksByStatus(
  repositoryId: string
): Promise<DynamicTasksByStatus> {
  const [allTasks, statuses] = await Promise.all([
    getTasksWithRelations(repositoryId),
    getRepositoryStatusesWithDefaults(repositoryId),
  ]);

  return Object.fromEntries(
    statuses.map((status) => [
      status.key,
      allTasks.filter((t) => t.status === status.key),
    ])
  );
}

/** 日付付き課題を取得（ガント用） */
export async function getTasksWithDates(repositoryId: string) {
  return db.query.tasks.findMany({
    where: eq(tasks.repositoryId, repositoryId),
    with: {
      assignee: true,
      category: true,
    },
    orderBy: [tasks.startDate],
  });
}

/** 単一課題を取得 */
export async function getTaskById(taskId: string) {
  return db.query.tasks.findFirst({
    where: eq(tasks.id, taskId),
    with: {
      assignee: true,
      category: true,
    },
  });
}

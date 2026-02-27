import { eq, desc } from "drizzle-orm";
import { db } from "@/db";
import { tasks } from "@/db/schema";
import type { DynamicTasksByStatus } from "@/types";
import { getProjectStatusesWithDefaults } from "./statuses";

/** 課題一覧（リレーション含む）を取得 */
export async function getTasksWithRelations(projectId: string) {
  return db.query.tasks.findMany({
    where: eq(tasks.projectId, projectId),
    with: {
      assignee: true,
      category: true,
    },
    orderBy: [desc(tasks.updatedAt)],
  });
}

/** ステータス別課題を取得（ボード用） - 動的ステータス対応 */
export async function getTasksByStatus(
  projectId: string
): Promise<DynamicTasksByStatus> {
  const [allTasks, statuses] = await Promise.all([
    getTasksWithRelations(projectId),
    getProjectStatusesWithDefaults(projectId),
  ]);

  return Object.fromEntries(
    statuses.map((status) => [
      status.key,
      allTasks.filter((t) => t.status === status.key),
    ])
  );
}

/** 日付付き課題を取得（ガント用） */
export async function getTasksWithDates(projectId: string) {
  return db.query.tasks.findMany({
    where: eq(tasks.projectId, projectId),
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

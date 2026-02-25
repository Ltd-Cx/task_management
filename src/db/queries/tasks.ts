import { eq, desc } from "drizzle-orm";
import { db } from "@/db";
import { tasks } from "@/db/schema";
import type { TasksByStatus, TaskStatus } from "@/types";

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

/** ステータス別課題を取得（ボード用） */
export async function getTasksByStatus(
  projectId: string
): Promise<TasksByStatus> {
  const allTasks = await getTasksWithRelations(projectId);
  const statuses: TaskStatus[] = [
    "open",
    "in_progress",
    "resolved",
    "closed",
  ];
  return Object.fromEntries(
    statuses.map((status) => [
      status,
      allTasks.filter((t) => t.status === status),
    ])
  ) as TasksByStatus;
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

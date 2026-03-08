import { eq, asc } from "drizzle-orm";
import { db } from "@/db";
import { taskGroups } from "@/db/schema";
import type { TaskGroup } from "@/types";

/** プロジェクトのタスクグループ一覧を取得 */
export async function getTaskGroups(projectId: string): Promise<TaskGroup[]> {
  return db.query.taskGroups.findMany({
    where: eq(taskGroups.projectId, projectId),
    orderBy: [asc(taskGroups.displayOrder), asc(taskGroups.createdAt)],
  });
}

/** タスクグループを作成 */
export async function createTaskGroup(
  projectId: string,
  name: string,
  color: string = "#95a5a6"
): Promise<TaskGroup> {
  const [group] = await db
    .insert(taskGroups)
    .values({
      projectId,
      name,
      color,
    })
    .returning();

  return group;
}

/** タスクグループを更新 */
export async function updateTaskGroup(
  groupId: string,
  data: { name?: string; color?: string; displayOrder?: number }
): Promise<TaskGroup | null> {
  const [group] = await db
    .update(taskGroups)
    .set(data)
    .where(eq(taskGroups.id, groupId))
    .returning();

  return group ?? null;
}

/** タスクグループを削除 */
export async function deleteTaskGroup(groupId: string): Promise<void> {
  await db.delete(taskGroups).where(eq(taskGroups.id, groupId));
}

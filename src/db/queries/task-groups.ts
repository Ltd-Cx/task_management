import { eq, asc, count } from "drizzle-orm";
import { db } from "@/db";
import { taskGroups, tasks } from "@/db/schema";
import type { TaskGroup } from "@/types";

/** プロジェクトのタスクグループ一覧を取得 */
export async function getTaskGroups(projectId: string): Promise<TaskGroup[]> {
  return db.query.taskGroups.findMany({
    where: eq(taskGroups.projectId, projectId),
    orderBy: [asc(taskGroups.displayOrder), asc(taskGroups.createdAt)],
  });
}

/** タスクグループ（課題数付き）を取得 */
export type TaskGroupWithCount = TaskGroup & { taskCount: number };

export async function getTaskGroupsWithCounts(projectId: string): Promise<TaskGroupWithCount[]> {
  const groups = await db.query.taskGroups.findMany({
    where: eq(taskGroups.projectId, projectId),
    orderBy: [asc(taskGroups.displayOrder), asc(taskGroups.createdAt)],
  });

  const groupsWithCounts = await Promise.all(
    groups.map(async (group) => {
      const countResult = await db
        .select({ count: count() })
        .from(tasks)
        .where(eq(tasks.taskGroupId, group.id));
      return {
        ...group,
        taskCount: countResult[0]?.count ?? 0,
      };
    })
  );

  return groupsWithCounts;
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

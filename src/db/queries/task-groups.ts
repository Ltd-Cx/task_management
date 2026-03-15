import { eq, asc, count } from "drizzle-orm";
import { db } from "@/db";
import { taskProjects, tasks } from "@/db/schema";
import type { TaskProject } from "@/types";

/** リポジトリのタスクプロジェクト一覧を取得 */
export async function getTaskProjects(repositoryId: string): Promise<TaskProject[]> {
  return db.query.taskProjects.findMany({
    where: eq(taskProjects.repositoryId, repositoryId),
    orderBy: [asc(taskProjects.displayOrder), asc(taskProjects.createdAt)],
  });
}

/** タスクプロジェクト（課題数付き）を取得 */
export type TaskProjectWithCount = TaskProject & { taskCount: number };

export async function getTaskProjectsWithCounts(repositoryId: string): Promise<TaskProjectWithCount[]> {
  const projects = await db.query.taskProjects.findMany({
    where: eq(taskProjects.repositoryId, repositoryId),
    orderBy: [asc(taskProjects.displayOrder), asc(taskProjects.createdAt)],
  });

  const projectsWithCounts = await Promise.all(
    projects.map(async (project) => {
      const countResult = await db
        .select({ count: count() })
        .from(tasks)
        .where(eq(tasks.taskProjectId, project.id));
      return {
        ...project,
        taskCount: countResult[0]?.count ?? 0,
      };
    })
  );

  return projectsWithCounts;
}

/** タスクプロジェクトを作成 */
export async function createTaskProject(
  repositoryId: string,
  name: string,
  color: string = "#95a5a6"
): Promise<TaskProject> {
  const [project] = await db
    .insert(taskProjects)
    .values({
      repositoryId,
      name,
      color,
    })
    .returning();

  return project;
}

/** タスクプロジェクトを更新 */
export async function updateTaskProject(
  projectId: string,
  data: { name?: string; color?: string; displayOrder?: number }
): Promise<TaskProject | null> {
  const [project] = await db
    .update(taskProjects)
    .set(data)
    .where(eq(taskProjects.id, projectId))
    .returning();

  return project ?? null;
}

/** タスクプロジェクトを削除 */
export async function deleteTaskProject(projectId: string): Promise<void> {
  await db.delete(taskProjects).where(eq(taskProjects.id, projectId));
}

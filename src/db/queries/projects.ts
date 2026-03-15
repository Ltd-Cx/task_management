import { eq, sql, count } from "drizzle-orm";
import { db } from "@/db";
import { projects, categories, taskGroups, tasks } from "@/db/schema";

/** プロジェクト詳細を取得 */
export async function getProject(projectId: string) {
  return db.query.projects.findFirst({
    where: eq(projects.id, projectId),
  });
}

/** プロジェクトのカテゴリー一覧を取得 */
export async function getCategories(projectId: string) {
  return db.query.categories.findMany({
    where: eq(categories.projectId, projectId),
    orderBy: [categories.displayOrder],
  });
}

/** 最初のプロジェクトを取得（リダイレクト用） */
export async function getFirstProject() {
  return db.query.projects.findFirst();
}

/** 全プロジェクト一覧を取得 */
export async function getAllProjects() {
  return db.query.projects.findMany({
    orderBy: [projects.createdAt],
  });
}

/** プロジェクト一覧（グループ名と課題数付き）を取得 */
export async function getProjectsWithStats() {
  const projectList = await db.query.projects.findMany({
    orderBy: [projects.createdAt],
  });

  const projectsWithStats = await Promise.all(
    projectList.map(async (project) => {
      // グループ一覧を取得
      const groups = await db.query.taskGroups.findMany({
        where: eq(taskGroups.projectId, project.id),
        orderBy: [taskGroups.displayOrder],
      });

      // 課題数を取得
      const taskCountResult = await db
        .select({ count: count() })
        .from(tasks)
        .where(eq(tasks.projectId, project.id));
      const taskCount = taskCountResult[0]?.count ?? 0;

      return {
        ...project,
        taskGroups: groups,
        taskCount,
      };
    })
  );

  return projectsWithStats;
}

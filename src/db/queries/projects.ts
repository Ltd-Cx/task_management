import { eq, sql, count } from "drizzle-orm";
import { db } from "@/db";
import { repositories, categories, taskProjects, tasks } from "@/db/schema";

/** リポジトリ詳細を取得 */
export async function getRepository(repositoryId: string) {
  return db.query.repositories.findFirst({
    where: eq(repositories.id, repositoryId),
  });
}

/** リポジトリのカテゴリー一覧を取得 */
export async function getCategories(repositoryId: string) {
  return db.query.categories.findMany({
    where: eq(categories.repositoryId, repositoryId),
    orderBy: [categories.displayOrder],
  });
}

/** 最初のリポジトリを取得（リダイレクト用） */
export async function getFirstRepository() {
  return db.query.repositories.findFirst();
}

/** 全リポジトリ一覧を取得 */
export async function getAllRepositories() {
  return db.query.repositories.findMany({
    orderBy: [repositories.createdAt],
  });
}

/** リポジトリ一覧（プロジェクト名と課題数付き）を取得 */
export async function getRepositoriesWithStats() {
  const repositoryList = await db.query.repositories.findMany({
    orderBy: [repositories.createdAt],
  });

  const repositoriesWithStats = await Promise.all(
    repositoryList.map(async (repository) => {
      // プロジェクト一覧を取得
      const projects = await db.query.taskProjects.findMany({
        where: eq(taskProjects.repositoryId, repository.id),
        orderBy: [taskProjects.displayOrder],
      });

      // 課題数を取得
      const taskCountResult = await db
        .select({ count: count() })
        .from(tasks)
        .where(eq(tasks.repositoryId, repository.id));
      const taskCount = taskCountResult[0]?.count ?? 0;

      return {
        ...repository,
        taskProjects: projects,
        taskCount,
      };
    })
  );

  return repositoriesWithStats;
}

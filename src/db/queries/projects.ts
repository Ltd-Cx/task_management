import { eq } from "drizzle-orm";
import { db } from "@/db";
import { projects, categories } from "@/db/schema";

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

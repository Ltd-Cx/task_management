"use server";

import { z } from "zod";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { taskProjects } from "@/db/schema";
import type { ActionResult, TaskProject } from "@/types";

/** タスクプロジェクト作成のバリデーションスキーマ */
const createTaskProjectSchema = z.object({
  repositoryId: z.string().uuid(),
  name: z.string().min(1, "プロジェクト名は必須です").max(50, "プロジェクト名は50文字以内で入力してください"),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "有効なカラーコードを入力してください"),
});

/**
 * タスクプロジェクトを作成する
 */
export async function createTaskProjectAction(data: {
  repositoryId: string;
  name: string;
  color: string;
}): Promise<ActionResult<TaskProject>> {
  try {
    const parsed = createTaskProjectSchema.safeParse(data);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? "入力内容に誤りがあります" };
    }

    // 同名プロジェクトの重複チェック
    const existing = await db.query.taskProjects.findFirst({
      where: and(
        eq(taskProjects.repositoryId, parsed.data.repositoryId),
        eq(taskProjects.name, parsed.data.name)
      ),
    });

    if (existing) {
      return { success: false, error: "同じ名前のプロジェクトが既に存在します" };
    }

    // 最大 displayOrder を取得
    const maxOrderResult = await db.query.taskProjects.findMany({
      where: eq(taskProjects.repositoryId, parsed.data.repositoryId),
      orderBy: (taskProjects, { desc }) => [desc(taskProjects.displayOrder)],
      limit: 1,
    });
    const maxOrder = maxOrderResult[0]?.displayOrder ?? -1;

    const [newProject] = await db.insert(taskProjects).values({
      repositoryId: parsed.data.repositoryId,
      name: parsed.data.name,
      color: parsed.data.color,
      displayOrder: maxOrder + 1,
    }).returning();

    revalidatePath(`/repositories/${parsed.data.repositoryId}/settings`);
    revalidatePath(`/repositories/${parsed.data.repositoryId}/tasks`);
    revalidatePath(`/repositories/${parsed.data.repositoryId}/gantt`);

    return { success: true, data: newProject };
  } catch (error) {
    const message = error instanceof Error ? error.message : "プロジェクトの作成に失敗しました";
    return { success: false, error: message };
  }
}

/** タスクプロジェクト削除のバリデーションスキーマ */
const deleteTaskProjectSchema = z.object({
  projectId: z.string().uuid(),
  repositoryId: z.string().uuid(),
});

/**
 * タスクプロジェクトを削除する
 * 紐づいているタスクは自動的にプロジェクトなし（taskProjectId = null）になる
 */
export async function deleteTaskProjectAction(data: {
  projectId: string;
  repositoryId: string;
}): Promise<ActionResult<void>> {
  try {
    const parsed = deleteTaskProjectSchema.safeParse(data);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? "入力内容に誤りがあります" };
    }

    // プロジェクトの存在確認
    const existing = await db.query.taskProjects.findFirst({
      where: and(
        eq(taskProjects.id, parsed.data.projectId),
        eq(taskProjects.repositoryId, parsed.data.repositoryId)
      ),
    });

    if (!existing) {
      return { success: false, error: "プロジェクトが見つかりません" };
    }

    // プロジェクトを削除（タスクのtaskProjectIdは自動的にnullになる - onDelete: "set null"）
    await db.delete(taskProjects).where(eq(taskProjects.id, parsed.data.projectId));

    revalidatePath(`/repositories/${parsed.data.repositoryId}/settings`);
    revalidatePath(`/repositories/${parsed.data.repositoryId}/tasks`);
    revalidatePath(`/repositories/${parsed.data.repositoryId}/gantt`);
    revalidatePath(`/repositories/${parsed.data.repositoryId}/board`);

    return { success: true, data: undefined };
  } catch (error) {
    const message = error instanceof Error ? error.message : "プロジェクトの削除に失敗しました";
    return { success: false, error: message };
  }
}

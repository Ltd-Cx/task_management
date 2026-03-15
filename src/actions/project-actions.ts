"use server";

import { z } from "zod";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { projects, projectMembers } from "@/db/schema";
import type { ActionResult, Project } from "@/types";

/** プロジェクト作成のバリデーションスキーマ */
const createProjectSchema = z.object({
  name: z.string().trim().min(1, "プロジェクト名は必須です").max(100, "プロジェクト名は100文字以内で入力してください"),
  key: z.string().trim().min(1, "プロジェクトキーは必須です").max(10, "プロジェクトキーは10文字以内で入力してください").regex(/^[A-Z0-9_]+$/, "プロジェクトキーは大文字英数字とアンダースコアのみ使用できます"),
  description: z.string().optional(),
});

/**
 * プロジェクトを作成する
 */
export async function createProject(data: {
  name: string;
  key: string;
  description?: string;
  createdBy: string;
}): Promise<ActionResult<Project>> {
  try {
    const parsed = createProjectSchema.safeParse(data);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? "入力内容に誤りがあります" };
    }

    // プロジェクトキーの重複チェック
    const existing = await db.query.projects.findFirst({
      where: eq(projects.key, parsed.data.key),
    });
    if (existing) {
      return { success: false, error: "このプロジェクトキーは既に使用されています" };
    }

    const [newProject] = await db.insert(projects).values({
      name: parsed.data.name,
      key: parsed.data.key,
      description: parsed.data.description ?? null,
    }).returning();

    // 作成者をプロジェクトメンバーとして追加
    if (newProject && data.createdBy) {
      await db.insert(projectMembers).values({
        projectId: newProject.id,
        userId: data.createdBy,
        role: "admin",
      });
    }

    revalidatePath("/");

    return { success: true, data: newProject };
  } catch (error) {
    const message = error instanceof Error ? error.message : "プロジェクトの作成に失敗しました";
    return { success: false, error: message };
  }
}

/** プロジェクト更新のバリデーションスキーマ */
const updateProjectSchema = z.object({
  name: z.string().trim().min(1, "プロジェクト名は必須です").max(100, "プロジェクト名は100文字以内で入力してください"),
  description: z.string().optional(),
});

/**
 * プロジェクトの名前・説明を更新する
 */
export async function updateProject(
  projectId: string,
  data: { name: string; description?: string }
): Promise<ActionResult> {
  try {
    const parsed = updateProjectSchema.safeParse(data);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? "入力内容に誤りがあります" };
    }

    await db
      .update(projects)
      .set({
        name: parsed.data.name,
        description: parsed.data.description ?? null,
        updatedAt: new Date(),
      })
      .where(eq(projects.id, projectId));

    revalidatePath(`/projects/${projectId}/settings`);
    revalidatePath(`/projects/${projectId}`);

    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "プロジェクトの更新に失敗しました";
    return { success: false, error: message };
  }
}

/**
 * プロジェクトを削除する
 * redirect() は NEXT_REDIRECT 例外をスローするため try/catch の外で呼び出す
 */
export async function deleteProject(projectId: string): Promise<ActionResult> {
  try {
    await db.delete(projects).where(eq(projects.id, projectId));
  } catch (error) {
    const message = error instanceof Error ? error.message : "プロジェクトの削除に失敗しました";
    return { success: false, error: message };
  }

  redirect("/");
}

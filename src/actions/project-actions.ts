"use server";

import { z } from "zod";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { repositories, repositoryMembers } from "@/db/schema";
import type { ActionResult, Repository } from "@/types";

/** リポジトリ作成のバリデーションスキーマ */
const createRepositorySchema = z.object({
  name: z.string().trim().min(1, "リポジトリ名は必須です").max(100, "リポジトリ名は100文字以内で入力してください"),
  key: z.string().trim().min(1, "リポジトリキーは必須です").max(10, "リポジトリキーは10文字以内で入力してください").regex(/^[A-Z0-9_]+$/, "リポジトリキーは大文字英数字とアンダースコアのみ使用できます"),
  description: z.string().optional(),
});

/**
 * リポジトリを作成する
 */
export async function createRepository(data: {
  name: string;
  key: string;
  description?: string;
  createdBy: string;
}): Promise<ActionResult<Repository>> {
  try {
    const parsed = createRepositorySchema.safeParse(data);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? "入力内容に誤りがあります" };
    }

    // リポジトリキーの重複チェック
    const existing = await db.query.repositories.findFirst({
      where: eq(repositories.key, parsed.data.key),
    });
    if (existing) {
      return { success: false, error: "このリポジトリキーは既に使用されています" };
    }

    const [newRepository] = await db.insert(repositories).values({
      name: parsed.data.name,
      key: parsed.data.key,
      description: parsed.data.description ?? null,
    }).returning();

    // 作成者をリポジトリメンバーとして追加
    if (newRepository && data.createdBy) {
      await db.insert(repositoryMembers).values({
        repositoryId: newRepository.id,
        userId: data.createdBy,
        role: "admin",
      });
    }

    revalidatePath("/");

    return { success: true, data: newRepository };
  } catch (error) {
    const message = error instanceof Error ? error.message : "リポジトリの作成に失敗しました";
    return { success: false, error: message };
  }
}

/** リポジトリ更新のバリデーションスキーマ */
const updateRepositorySchema = z.object({
  name: z.string().trim().min(1, "リポジトリ名は必須です").max(100, "リポジトリ名は100文字以内で入力してください"),
  description: z.string().optional(),
});

/**
 * リポジトリの名前・説明を更新する
 */
export async function updateRepository(
  repositoryId: string,
  data: { name: string; description?: string }
): Promise<ActionResult> {
  try {
    const parsed = updateRepositorySchema.safeParse(data);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? "入力内容に誤りがあります" };
    }

    await db
      .update(repositories)
      .set({
        name: parsed.data.name,
        description: parsed.data.description ?? null,
        updatedAt: new Date(),
      })
      .where(eq(repositories.id, repositoryId));

    revalidatePath(`/repositories/${repositoryId}/settings`);
    revalidatePath(`/repositories/${repositoryId}`);

    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "リポジトリの更新に失敗しました";
    return { success: false, error: message };
  }
}

/**
 * リポジトリを削除する
 * redirect() は NEXT_REDIRECT 例外をスローするため try/catch の外で呼び出す
 */
export async function deleteRepository(repositoryId: string): Promise<ActionResult> {
  try {
    await db.delete(repositories).where(eq(repositories.id, repositoryId));
  } catch (error) {
    const message = error instanceof Error ? error.message : "リポジトリの削除に失敗しました";
    return { success: false, error: message };
  }

  redirect("/");
}

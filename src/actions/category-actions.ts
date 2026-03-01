"use server";

import { z } from "zod";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { categories } from "@/db/schema";
import type { ActionResult } from "@/types";

/** カテゴリー作成のバリデーションスキーマ */
const createCategorySchema = z.object({
  projectId: z.string().uuid(),
  name: z.string().min(1, "カテゴリー名は必須です").max(50, "カテゴリー名は50文字以内で入力してください"),
  color: z.string().optional(),
});

/** カテゴリー更新のバリデーションスキーマ */
const updateCategorySchema = z.object({
  id: z.string().uuid(),
  projectId: z.string().uuid(),
  name: z.string().min(1, "カテゴリー名は必須です").max(50, "カテゴリー名は50文字以内で入力してください"),
  color: z.string().optional(),
});

/** カテゴリー削除のバリデーションスキーマ */
const deleteCategorySchema = z.object({
  id: z.string().uuid(),
  projectId: z.string().uuid(),
});

/** 並び替えのバリデーションスキーマ */
const reorderCategoriesSchema = z.object({
  projectId: z.string().uuid(),
  items: z.array(z.object({
    id: z.string().uuid(),
    displayOrder: z.number(),
  })),
});

/**
 * カテゴリーを作成する
 */
export async function createCategory(data: {
  projectId: string;
  name: string;
  color?: string;
}): Promise<ActionResult> {
  try {
    const parsed = createCategorySchema.safeParse(data);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? "入力内容に誤りがあります" };
    }

    // 同名カテゴリーの重複チェック
    const existing = await db.query.categories.findFirst({
      where: and(
        eq(categories.projectId, parsed.data.projectId),
        eq(categories.name, parsed.data.name)
      ),
    });

    if (existing) {
      return { success: false, error: "同じ名前のカテゴリーが既に存在します" };
    }

    // 最大 displayOrder を取得
    const maxOrderResult = await db.query.categories.findMany({
      where: eq(categories.projectId, parsed.data.projectId),
      orderBy: (categories, { desc }) => [desc(categories.displayOrder)],
      limit: 1,
    });
    const maxOrder = maxOrderResult[0]?.displayOrder ?? -1;

    await db.insert(categories).values({
      projectId: parsed.data.projectId,
      name: parsed.data.name,
      color: parsed.data.color ?? null,
      displayOrder: maxOrder + 1,
    });

    revalidatePath(`/projects/${parsed.data.projectId}/settings`);
    revalidatePath(`/projects/${parsed.data.projectId}/tasks`);

    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "カテゴリーの作成に失敗しました";
    return { success: false, error: message };
  }
}

/**
 * カテゴリーを更新する
 */
export async function updateCategory(data: {
  id: string;
  projectId: string;
  name: string;
  color?: string;
}): Promise<ActionResult> {
  try {
    const parsed = updateCategorySchema.safeParse(data);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? "入力内容に誤りがあります" };
    }

    // 同名カテゴリーの重複チェック（自分自身は除く）
    const existing = await db.query.categories.findFirst({
      where: and(
        eq(categories.projectId, parsed.data.projectId),
        eq(categories.name, parsed.data.name)
      ),
    });

    if (existing && existing.id !== parsed.data.id) {
      return { success: false, error: "同じ名前のカテゴリーが既に存在します" };
    }

    await db
      .update(categories)
      .set({
        name: parsed.data.name,
        color: parsed.data.color ?? null,
      })
      .where(eq(categories.id, parsed.data.id));

    revalidatePath(`/projects/${parsed.data.projectId}/settings`);
    revalidatePath(`/projects/${parsed.data.projectId}/tasks`);

    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "カテゴリーの更新に失敗しました";
    return { success: false, error: message };
  }
}

/**
 * カテゴリーを削除する
 */
export async function deleteCategory(data: {
  id: string;
  projectId: string;
}): Promise<ActionResult> {
  try {
    const parsed = deleteCategorySchema.safeParse(data);
    if (!parsed.success) {
      return { success: false, error: "入力内容に誤りがあります" };
    }

    await db.delete(categories).where(eq(categories.id, parsed.data.id));

    revalidatePath(`/projects/${parsed.data.projectId}/settings`);
    revalidatePath(`/projects/${parsed.data.projectId}/tasks`);

    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "カテゴリーの削除に失敗しました";
    return { success: false, error: message };
  }
}

/**
 * カテゴリーの並び順を更新する
 */
export async function reorderCategories(data: {
  projectId: string;
  items: { id: string; displayOrder: number }[];
}): Promise<ActionResult> {
  try {
    const parsed = reorderCategoriesSchema.safeParse(data);
    if (!parsed.success) {
      return { success: false, error: "入力内容に誤りがあります" };
    }

    // トランザクションで一括更新
    await Promise.all(
      parsed.data.items.map((item) =>
        db
          .update(categories)
          .set({ displayOrder: item.displayOrder })
          .where(eq(categories.id, item.id))
      )
    );

    revalidatePath(`/projects/${parsed.data.projectId}/settings`);

    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "並び順の更新に失敗しました";
    return { success: false, error: message };
  }
}

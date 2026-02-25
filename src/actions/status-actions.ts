"use server";

import { z } from "zod";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { taskStatuses } from "@/db/schema";
import type { ActionResult } from "@/types";

const createStatusSchema = z.object({
  projectId: z.string().uuid(),
  key: z.string().trim().min(1).max(50).regex(/^[a-z0-9_]+$/, "英小文字・数字・アンダースコアのみ"),
  label: z.string().trim().min(1, "ステータス名は必須です").max(50),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "カラーコードが無効です"),
});

const updateStatusSchema = z.object({
  id: z.string().uuid(),
  projectId: z.string().uuid(),
  label: z.string().trim().min(1).max(50),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  displayOrder: z.number().int().min(0),
});

/** カスタムステータスを作成 */
export async function createCustomStatus(data: {
  projectId: string;
  key: string;
  label: string;
  color: string;
}): Promise<ActionResult> {
  try {
    const parsed = createStatusSchema.safeParse(data);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? "入力内容に誤りがあります" };
    }

    // 同一プロジェクト内でkeyの重複チェック
    const existing = await db.query.taskStatuses.findFirst({
      where: and(
        eq(taskStatuses.projectId, parsed.data.projectId),
        eq(taskStatuses.key, parsed.data.key)
      ),
    });
    if (existing) {
      return { success: false, error: "同じキーのステータスが既に存在します" };
    }

    // displayOrder は既存の最大値 + 1
    const allStatuses = await db.query.taskStatuses.findMany({
      where: eq(taskStatuses.projectId, parsed.data.projectId),
    });
    const maxOrder = allStatuses.reduce((max, s) => Math.max(max, s.displayOrder), -1);

    await db.insert(taskStatuses).values({
      ...parsed.data,
      displayOrder: maxOrder + 1,
    });

    revalidatePath(`/projects/${parsed.data.projectId}/settings`);
    revalidatePath(`/projects/${parsed.data.projectId}/board`);
    revalidatePath(`/projects/${parsed.data.projectId}/tasks`);

    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "ステータスの作成に失敗しました";
    return { success: false, error: message };
  }
}

/** カスタムステータスを更新 */
export async function updateCustomStatus(data: {
  id: string;
  projectId: string;
  label: string;
  color: string;
  displayOrder: number;
}): Promise<ActionResult> {
  try {
    const parsed = updateStatusSchema.safeParse(data);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? "入力内容に誤りがあります" };
    }

    await db
      .update(taskStatuses)
      .set({
        label: parsed.data.label,
        color: parsed.data.color,
        displayOrder: parsed.data.displayOrder,
      })
      .where(eq(taskStatuses.id, parsed.data.id));

    revalidatePath(`/projects/${parsed.data.projectId}/settings`);
    revalidatePath(`/projects/${parsed.data.projectId}/board`);

    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "ステータスの更新に失敗しました";
    return { success: false, error: message };
  }
}

/** カスタムステータスを削除 */
export async function deleteCustomStatus(data: {
  id: string;
  projectId: string;
}): Promise<ActionResult> {
  try {
    await db.delete(taskStatuses).where(eq(taskStatuses.id, data.id));
    revalidatePath(`/projects/${data.projectId}/settings`);
    revalidatePath(`/projects/${data.projectId}/board`);
    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "ステータスの削除に失敗しました";
    return { success: false, error: message };
  }
}

/** ステータスの表示順を一括更新 */
export async function reorderStatuses(data: {
  projectId: string;
  items: { id: string; displayOrder: number }[];
}): Promise<ActionResult> {
  try {
    await Promise.all(
      data.items.map((item) =>
        db
          .update(taskStatuses)
          .set({ displayOrder: item.displayOrder })
          .where(eq(taskStatuses.id, item.id))
      )
    );

    revalidatePath(`/projects/${data.projectId}/settings`);
    revalidatePath(`/projects/${data.projectId}/board`);

    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "並び替えに失敗しました";
    return { success: false, error: message };
  }
}

"use server";

import { z } from "zod";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { users } from "@/db/schema";
import type { ActionResult } from "@/types";

const updateAvatarSchema = z.object({
  userId: z.string().uuid(),
  avatarUrl: z.string().url("有効なURLを入力してください").or(z.literal("")),
});

/** ユーザーのアバターURLを更新 */
export async function updateUserAvatar(data: {
  userId: string;
  avatarUrl: string;
}): Promise<ActionResult> {
  try {
    const parsed = updateAvatarSchema.safeParse(data);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? "入力内容に誤りがあります" };
    }

    await db
      .update(users)
      .set({ avatarUrl: parsed.data.avatarUrl || null })
      .where(eq(users.id, parsed.data.userId));

    // 全プロジェクトページをrevalidate（サイドバーに影響するため）
    revalidatePath("/projects", "layout");

    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "アバターの更新に失敗しました";
    return { success: false, error: message };
  }
}

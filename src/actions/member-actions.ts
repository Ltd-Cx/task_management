"use server";

import { z } from "zod";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { projectMembers } from "@/db/schema";
import type { ActionResult } from "@/types";

/** メンバー追加のバリデーションスキーマ */
const addMemberSchema = z.object({
  projectId: z.string().uuid(),
  userId: z.string().uuid(),
  role: z.enum(["admin", "member"]).optional(),
});

/**
 * プロジェクトにメンバーを追加する
 */
export async function addMember(data: {
  projectId: string;
  userId: string;
  role?: string;
}): Promise<ActionResult> {
  try {
    const parsed = addMemberSchema.safeParse(data);
    if (!parsed.success) {
      return { success: false, error: "入力内容に誤りがあります" };
    }

    // 重複チェック
    const existing = await db.query.projectMembers.findFirst({
      where: and(
        eq(projectMembers.projectId, parsed.data.projectId),
        eq(projectMembers.userId, parsed.data.userId)
      ),
    });

    if (existing) {
      return { success: false, error: "このユーザーは既にプロジェクトメンバーです" };
    }

    await db.insert(projectMembers).values({
      projectId: parsed.data.projectId,
      userId: parsed.data.userId,
      role: parsed.data.role ?? "member",
    });

    revalidatePath(`/projects/${parsed.data.projectId}/members`);
    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "メンバーの追加に失敗しました";
    return { success: false, error: message };
  }
}

/**
 * プロジェクトからメンバーを削除する
 */
export async function removeMember(data: {
  projectId: string;
  userId: string;
}): Promise<ActionResult> {
  try {
    await db
      .delete(projectMembers)
      .where(
        and(
          eq(projectMembers.projectId, data.projectId),
          eq(projectMembers.userId, data.userId)
        )
      );

    revalidatePath(`/projects/${data.projectId}/members`);
    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "メンバーの削除に失敗しました";
    return { success: false, error: message };
  }
}

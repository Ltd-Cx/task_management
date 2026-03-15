"use server";

import { z } from "zod";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { repositoryMembers } from "@/db/schema";
import type { ActionResult } from "@/types";

/** メンバー追加のバリデーションスキーマ */
const addMemberSchema = z.object({
  repositoryId: z.string().uuid(),
  userId: z.string().uuid(),
  role: z.enum(["admin", "member"]).optional(),
});

/**
 * リポジトリにメンバーを追加する
 */
export async function addMember(data: {
  repositoryId: string;
  userId: string;
  role?: string;
}): Promise<ActionResult> {
  try {
    const parsed = addMemberSchema.safeParse(data);
    if (!parsed.success) {
      return { success: false, error: "入力内容に誤りがあります" };
    }

    // 重複チェック
    const existing = await db.query.repositoryMembers.findFirst({
      where: and(
        eq(repositoryMembers.repositoryId, parsed.data.repositoryId),
        eq(repositoryMembers.userId, parsed.data.userId)
      ),
    });

    if (existing) {
      return { success: false, error: "このユーザーは既にリポジトリメンバーです" };
    }

    await db.insert(repositoryMembers).values({
      repositoryId: parsed.data.repositoryId,
      userId: parsed.data.userId,
      role: parsed.data.role ?? "member",
    });

    revalidatePath(`/repositories/${parsed.data.repositoryId}/members`);
    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "メンバーの追加に失敗しました";
    return { success: false, error: message };
  }
}

/**
 * リポジトリからメンバーを削除する
 */
export async function removeMember(data: {
  repositoryId: string;
  userId: string;
}): Promise<ActionResult> {
  try {
    await db
      .delete(repositoryMembers)
      .where(
        and(
          eq(repositoryMembers.repositoryId, data.repositoryId),
          eq(repositoryMembers.userId, data.userId)
        )
      );

    revalidatePath(`/repositories/${data.repositoryId}/members`);
    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "メンバーの削除に失敗しました";
    return { success: false, error: message };
  }
}

/** メンバー更新のバリデーションスキーマ */
const updateMemberSchema = z.object({
  repositoryId: z.string().uuid(),
  userId: z.string().uuid(),
  role: z.enum(["admin", "member"]),
});

/**
 * メンバー情報を更新する
 */
export async function updateMember(data: {
  repositoryId: string;
  userId: string;
  role: string;
}): Promise<ActionResult> {
  try {
    const parsed = updateMemberSchema.safeParse(data);
    if (!parsed.success) {
      return { success: false, error: "入力内容に誤りがあります" };
    }

    await db
      .update(repositoryMembers)
      .set({ role: parsed.data.role })
      .where(
        and(
          eq(repositoryMembers.repositoryId, parsed.data.repositoryId),
          eq(repositoryMembers.userId, parsed.data.userId)
        )
      );

    revalidatePath(`/repositories/${parsed.data.repositoryId}/members`);
    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "メンバーの更新に失敗しました";
    return { success: false, error: message };
  }
}

"use server";

import { z } from "zod";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { users, projectMembers } from "@/db/schema";
import type { ActionResult } from "@/types";

const createUserSchema = z.object({
  displayName: z.string().min(1, "表示名は必須です"),
  email: z.string().email("有効なメールアドレスを入力してください"),
  role: z.enum(["admin", "member"]).default("member"),
  avatarUrl: z.string().url().optional().or(z.literal("")),
});

const updateAvatarSchema = z.object({
  userId: z.string().uuid(),
  avatarUrl: z.string().url("有効なURLを入力してください").or(z.literal("")),
});

/** ユーザーを作成する */
export async function createUser(data: {
  displayName: string;
  email: string;
  role?: "admin" | "member";
  avatarUrl?: string;
  projectId?: string;
}): Promise<ActionResult<{ userId: string }>> {
  try {
    const parsed = createUserSchema.safeParse(data);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? "入力内容に誤りがあります" };
    }

    // メールアドレス重複チェック
    const existing = await db.query.users.findFirst({
      where: eq(users.email, parsed.data.email),
    });

    if (existing) {
      return { success: false, error: "このメールアドレスは既に登録されています" };
    }

    // ユーザー作成
    const [newUser] = await db.insert(users).values({
      displayName: parsed.data.displayName,
      email: parsed.data.email,
      role: parsed.data.role ?? "member",
      avatarUrl: parsed.data.avatarUrl || null,
    }).returning({ id: users.id });

    // プロジェクトIDが指定されていれば、そのプロジェクトにもメンバーとして追加
    if (data.projectId && newUser) {
      await db.insert(projectMembers).values({
        projectId: data.projectId,
        userId: newUser.id,
        role: parsed.data.role ?? "member",
      });
      revalidatePath(`/projects/${data.projectId}/members`);
    }

    return { success: true, data: { userId: newUser.id } };
  } catch (error) {
    const message = error instanceof Error ? error.message : "ユーザーの作成に失敗しました";
    return { success: false, error: message };
  }
}

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

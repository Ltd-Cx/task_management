"use server";

import { z } from "zod";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { taskGroups } from "@/db/schema";
import type { ActionResult, TaskGroup } from "@/types";

/** タスクグループ作成のバリデーションスキーマ */
const createTaskGroupSchema = z.object({
  projectId: z.string().uuid(),
  name: z.string().min(1, "グループ名は必須です").max(50, "グループ名は50文字以内で入力してください"),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "有効なカラーコードを入力してください"),
});

/**
 * タスクグループを作成する
 */
export async function createTaskGroupAction(data: {
  projectId: string;
  name: string;
  color: string;
}): Promise<ActionResult<TaskGroup>> {
  try {
    const parsed = createTaskGroupSchema.safeParse(data);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? "入力内容に誤りがあります" };
    }

    // 同名グループの重複チェック
    const existing = await db.query.taskGroups.findFirst({
      where: and(
        eq(taskGroups.projectId, parsed.data.projectId),
        eq(taskGroups.name, parsed.data.name)
      ),
    });

    if (existing) {
      return { success: false, error: "同じ名前のグループが既に存在します" };
    }

    // 最大 displayOrder を取得
    const maxOrderResult = await db.query.taskGroups.findMany({
      where: eq(taskGroups.projectId, parsed.data.projectId),
      orderBy: (taskGroups, { desc }) => [desc(taskGroups.displayOrder)],
      limit: 1,
    });
    const maxOrder = maxOrderResult[0]?.displayOrder ?? -1;

    const [newGroup] = await db.insert(taskGroups).values({
      projectId: parsed.data.projectId,
      name: parsed.data.name,
      color: parsed.data.color,
      displayOrder: maxOrder + 1,
    }).returning();

    revalidatePath(`/projects/${parsed.data.projectId}/settings`);
    revalidatePath(`/projects/${parsed.data.projectId}/tasks`);
    revalidatePath(`/projects/${parsed.data.projectId}/gantt`);

    return { success: true, data: newGroup };
  } catch (error) {
    const message = error instanceof Error ? error.message : "グループの作成に失敗しました";
    return { success: false, error: message };
  }
}

/** タスクグループ削除のバリデーションスキーマ */
const deleteTaskGroupSchema = z.object({
  groupId: z.string().uuid(),
  projectId: z.string().uuid(),
});

/**
 * タスクグループを削除する
 * 紐づいているタスクは自動的にグループなし（taskGroupId = null）になる
 */
export async function deleteTaskGroupAction(data: {
  groupId: string;
  projectId: string;
}): Promise<ActionResult<void>> {
  try {
    const parsed = deleteTaskGroupSchema.safeParse(data);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? "入力内容に誤りがあります" };
    }

    // グループの存在確認
    const existing = await db.query.taskGroups.findFirst({
      where: and(
        eq(taskGroups.id, parsed.data.groupId),
        eq(taskGroups.projectId, parsed.data.projectId)
      ),
    });

    if (!existing) {
      return { success: false, error: "グループが見つかりません" };
    }

    // グループを削除（タスクのtaskGroupIdは自動的にnullになる - onDelete: "set null"）
    await db.delete(taskGroups).where(eq(taskGroups.id, parsed.data.groupId));

    revalidatePath(`/projects/${parsed.data.projectId}/settings`);
    revalidatePath(`/projects/${parsed.data.projectId}/tasks`);
    revalidatePath(`/projects/${parsed.data.projectId}/gantt`);
    revalidatePath(`/projects/${parsed.data.projectId}/board`);

    return { success: true, data: undefined };
  } catch (error) {
    const message = error instanceof Error ? error.message : "グループの削除に失敗しました";
    return { success: false, error: message };
  }
}

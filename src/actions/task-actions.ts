"use server";

import { z } from "zod";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { tasks } from "@/db/schema";
import type { ActionResult } from "@/types";
import { getRepositoryStatusesWithDefaults } from "@/db/queries/statuses";
import { isValidStatusKey } from "@/lib/status-utils";
import { sanitizeHtml, isHtmlEmpty } from "@/lib/sanitize";

/** 課題作成のバリデーションスキーマ（ステータス以外） */
const createTaskBaseSchema = z.object({
  repositoryId: z.string().uuid("リポジトリIDは有効なUUID形式で入力してください"),
  summary: z.string().trim().min(1, "件名は必須です").max(255, "件名は255文字以内で入力してください"),
  description: z.string().optional(),
  status: z.string().optional(),
  priority: z.enum(["high", "medium", "low"]).optional(),
  assigneeId: z.string().uuid().optional().or(z.literal("")),
  categoryId: z.string().uuid().optional().or(z.literal("")),
  taskProjectId: z.string().uuid().optional().or(z.literal("")),
  progress: z.number().min(0).max(100).optional(),
  startDate: z.string().optional(),
  dueDate: z.string().optional(),
});

/** 課題ステータス更新のバリデーションスキーマ（ステータス以外） */
const updateTaskStatusBaseSchema = z.object({
  taskId: z.string().uuid(),
  status: z.string(),
  repositoryId: z.string().uuid(),
});

/**
 * 課題を作成する
 */
export async function createTask(data: {
  repositoryId: string;
  summary: string;
  description?: string;
  status?: string;
  priority?: string;
  assigneeId?: string;
  categoryId?: string;
  taskProjectId?: string;
  progress?: number;
  startDate?: string;
  dueDate?: string;
  createdBy: string;
}): Promise<ActionResult> {
  try {
    const parsed = createTaskBaseSchema.safeParse(data);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? "入力内容に誤りがあります" };
    }

    const { repositoryId, assigneeId, categoryId, taskProjectId, progress, status, description, ...taskData } = parsed.data;

    // 動的ステータスバリデーション
    if (status) {
      const statuses = await getRepositoryStatusesWithDefaults(repositoryId);
      if (!isValidStatusKey(statuses, status)) {
        return { success: false, error: "無効なステータスです" };
      }
    }

    // HTML サニタイズ
    const sanitizedDescription = isHtmlEmpty(description) ? null : sanitizeHtml(description);

    await db.insert(tasks).values({
      ...taskData,
      description: sanitizedDescription,
      status: status ?? "open",
      repositoryId,
      assigneeId: assigneeId || null,
      categoryId: categoryId || null,
      taskProjectId: taskProjectId || null,
      progress: progress ?? 0,
      createdBy: data.createdBy,
    });

    revalidatePath(`/repositories/${repositoryId}/tasks`);
    revalidatePath(`/repositories/${repositoryId}/board`);

    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "課題の作成に失敗しました";
    return { success: false, error: message };
  }
}

/**
 * 課題のステータスを更新する
 */
export async function updateTaskStatus(data: {
  taskId: string;
  status: string;
  repositoryId: string;
}): Promise<ActionResult> {
  try {
    const parsed = updateTaskStatusBaseSchema.safeParse(data);
    if (!parsed.success) {
      return { success: false, error: "入力内容に誤りがあります" };
    }

    // 動的ステータスバリデーション
    const statuses = await getRepositoryStatusesWithDefaults(parsed.data.repositoryId);
    if (!isValidStatusKey(statuses, parsed.data.status)) {
      return { success: false, error: "無効なステータスです" };
    }

    await db
      .update(tasks)
      .set({
        status: parsed.data.status,
        updatedAt: new Date(),
      })
      .where(eq(tasks.id, parsed.data.taskId));

    revalidatePath(`/repositories/${parsed.data.repositoryId}/tasks`);
    revalidatePath(`/repositories/${parsed.data.repositoryId}/board`);

    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "ステータスの更新に失敗しました";
    return { success: false, error: message };
  }
}

/**
 * 課題を削除する
 */
export async function deleteTask(data: {
  taskId: string;
  repositoryId: string;
}): Promise<ActionResult> {
  try {
    await db.delete(tasks).where(eq(tasks.id, data.taskId));
    revalidatePath(`/repositories/${data.repositoryId}/tasks`);
    revalidatePath(`/repositories/${data.repositoryId}/board`);
    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "課題の削除に失敗しました";
    return { success: false, error: message };
  }
}

/** 課題更新のバリデーションスキーマ（ステータス以外） */
const updateTaskBaseSchema = z.object({
  taskId: z.string().uuid(),
  repositoryId: z.string().uuid(),
  summary: z.string().trim().min(1, "件名は必須です").max(255, "件名は255文字以内で入力してください"),
  description: z.string().optional(),
  status: z.string().optional(),
  priority: z.enum(["high", "medium", "low"]).optional(),
  assigneeId: z.string().uuid().optional().or(z.literal("")),
  categoryId: z.string().uuid().optional().or(z.literal("")),
  taskProjectId: z.string().uuid().optional().or(z.literal("")),
  progress: z.number().min(0).max(100).optional(),
  statusMemo: z.string().optional(),
  startDate: z.string().optional(),
  dueDate: z.string().optional(),
});

/**
 * 課題を更新する
 */
export async function updateTask(data: {
  taskId: string;
  repositoryId: string;
  summary: string;
  description?: string;
  status?: string;
  priority?: string;
  assigneeId?: string;
  categoryId?: string;
  taskProjectId?: string;
  progress?: number;
  statusMemo?: string;
  startDate?: string;
  dueDate?: string;
}): Promise<ActionResult> {
  try {
    const parsed = updateTaskBaseSchema.safeParse(data);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? "入力内容に誤りがあります" };
    }

    const { taskId, repositoryId, assigneeId, categoryId, taskProjectId, progress, status, description, statusMemo, ...taskData } = parsed.data;

    // 動的ステータスバリデーション
    if (status) {
      const statuses = await getRepositoryStatusesWithDefaults(repositoryId);
      if (!isValidStatusKey(statuses, status)) {
        return { success: false, error: "無効なステータスです" };
      }
    }

    // HTML サニタイズ
    const sanitizedDescription = isHtmlEmpty(description) ? null : sanitizeHtml(description);
    const sanitizedStatusMemo = isHtmlEmpty(statusMemo) ? null : sanitizeHtml(statusMemo);

    await db
      .update(tasks)
      .set({
        ...taskData,
        description: sanitizedDescription,
        status: status,
        assigneeId: assigneeId || null,
        categoryId: categoryId || null,
        taskProjectId: taskProjectId || null,
        progress: progress ?? 0,
        statusMemo: sanitizedStatusMemo,
        startDate: taskData.startDate || null,
        dueDate: taskData.dueDate || null,
        updatedAt: new Date(),
      })
      .where(eq(tasks.id, taskId));

    revalidatePath(`/repositories/${repositoryId}/tasks`);
    revalidatePath(`/repositories/${repositoryId}/board`);
    revalidatePath(`/repositories/${repositoryId}/gantt`);

    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "課題の更新に失敗しました";
    return { success: false, error: message };
  }
}

/** 課題日程更新のバリデーションスキーマ */
const updateTaskDatesSchema = z.object({
  taskId: z.string().uuid(),
  repositoryId: z.string().uuid(),
  startDate: z.string().nullable(),
  dueDate: z.string().nullable(),
});

/**
 * 課題の日程を更新する
 */
export async function updateTaskDates(data: {
  taskId: string;
  repositoryId: string;
  startDate: string | null;
  dueDate: string | null;
}): Promise<ActionResult> {
  try {
    const parsed = updateTaskDatesSchema.safeParse(data);
    if (!parsed.success) {
      return { success: false, error: "入力内容に誤りがあります" };
    }

    await db
      .update(tasks)
      .set({
        startDate: parsed.data.startDate,
        dueDate: parsed.data.dueDate,
        updatedAt: new Date(),
      })
      .where(eq(tasks.id, parsed.data.taskId));

    // ガントパスは revalidate しない（SVAR が内部状態で更新済み、再フェッチは全体再描画を引き起こす）
    revalidatePath(`/repositories/${parsed.data.repositoryId}/tasks`);

    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "日程の更新に失敗しました";
    return { success: false, error: message };
  }
}

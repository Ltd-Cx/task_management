import { NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { tasks } from "@/db/schema";

/** リクエストボディのバリデーションスキーマ */
const schema = z.object({
  taskId: z.string().uuid(),
  projectId: z.string().uuid(),
  startDate: z.string().nullable(),
  dueDate: z.string().nullable(),
});

/**
 * ガントチャートからの日程更新 API
 *
 * Server Action ではなく Route Handler を使うことで、
 * Next.js の自動 RSC 再フェッチを回避し、ガントのちらつきを防止する。
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = schema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "入力内容に誤りがあります" },
        { status: 400 }
      );
    }

    await db
      .update(tasks)
      .set({
        startDate: parsed.data.startDate,
        dueDate: parsed.data.dueDate,
        updatedAt: new Date(),
      })
      .where(eq(tasks.id, parsed.data.taskId));

    return NextResponse.json({ success: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "日程の更新に失敗しました";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

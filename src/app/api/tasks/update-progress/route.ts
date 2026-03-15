import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { tasks } from "@/db/schema";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { taskId, repositoryId, progress } = body;

    if (!taskId || repositoryId === undefined || progress === undefined) {
      return NextResponse.json(
        { success: false, error: "taskId, repositoryId, progress are required" },
        { status: 400 }
      );
    }

    const progressValue = Math.min(100, Math.max(0, Number(progress)));

    await db
      .update(tasks)
      .set({
        progress: progressValue,
        updatedAt: new Date(),
      })
      .where(eq(tasks.id, taskId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Progress update error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update progress" },
      { status: 500 }
    );
  }
}

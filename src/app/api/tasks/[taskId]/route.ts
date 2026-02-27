import { NextResponse } from "next/server";
import { getTaskById } from "@/db/queries/tasks";

type Params = Promise<{ taskId: string }>;

/** 単一タスクを取得 */
export async function GET(
  _request: Request,
  { params }: { params: Params }
) {
  try {
    const { taskId } = await params;
    const task = await getTaskById(taskId);

    if (!task) {
      return NextResponse.json(
        { success: false, error: "タスクが見つかりません" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: task });
  } catch (error) {
    console.error("タスク取得エラー:", error);
    return NextResponse.json(
      { success: false, error: "タスクの取得に失敗しました" },
      { status: 500 }
    );
  }
}

import { eq } from "drizzle-orm";
import { db } from "@/db";
import { projectMembers } from "@/db/schema";

/** プロジェクトメンバー一覧（ユーザー情報含む）を取得 */
export async function getProjectMembersWithUsers(projectId: string) {
  return db.query.projectMembers.findMany({
    where: eq(projectMembers.projectId, projectId),
    with: {
      user: true,
    },
  });
}

import { eq } from "drizzle-orm";
import { db } from "@/db";
import { repositoryMembers } from "@/db/schema";

/** リポジトリメンバー一覧（ユーザー情報含む）を取得 */
export async function getRepositoryMembersWithUsers(repositoryId: string) {
  return db.query.repositoryMembers.findMany({
    where: eq(repositoryMembers.repositoryId, repositoryId),
    with: {
      user: true,
    },
  });
}

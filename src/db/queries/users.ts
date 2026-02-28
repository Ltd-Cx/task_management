import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";

/** ユーザーをIDで取得 */
export async function getUserById(userId: string) {
  return db.query.users.findFirst({
    where: eq(users.id, userId),
  });
}

/** メールアドレスでユーザーを取得 */
export async function getUserByEmail(email: string) {
  return db.query.users.findFirst({
    where: eq(users.email, email),
  });
}

/**
 * 現在のログインユーザーを取得
 * TODO: 認証実装後に実際のセッションから取得するように変更
 */
export async function getCurrentUser() {
  // 仮実装: admin@example.com のユーザーを返す
  return getUserByEmail("admin@example.com");
}

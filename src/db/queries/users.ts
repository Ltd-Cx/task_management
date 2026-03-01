import { eq, notInArray } from "drizzle-orm";
import { db } from "@/db";
import { users, projectMembers } from "@/db/schema";

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

/** 全ユーザーを取得 */
export async function getAllUsers() {
  return db.query.users.findMany({
    orderBy: (users, { asc }) => [asc(users.displayName)],
  });
}

/** プロジェクトに未参加のユーザーを取得 */
export async function getAvailableUsersForProject(projectId: string) {
  // プロジェクトに既に参加しているユーザーIDを取得
  const existingMembers = await db.query.projectMembers.findMany({
    where: eq(projectMembers.projectId, projectId),
    columns: {
      userId: true,
    },
  });

  const memberUserIds = existingMembers.map((m) => m.userId);

  // 未参加ユーザーを取得
  if (memberUserIds.length === 0) {
    return db.query.users.findMany({
      orderBy: (users, { asc }) => [asc(users.displayName)],
    });
  }

  return db.query.users.findMany({
    where: notInArray(users.id, memberUserIds),
    orderBy: (users, { asc }) => [asc(users.displayName)],
  });
}

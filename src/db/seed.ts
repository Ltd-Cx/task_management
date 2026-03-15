import { db } from "./index";
import { users, repositories, repositoryMembers, categories, taskStatuses } from "./schema";

async function seed() {
  console.log("🌱 Seeding database...");

  // ダミーユーザー
  const [admin] = await db.insert(users).values({
    displayName: "管理者ユーザー",
    email: "admin@example.com",
    role: "admin",
  }).returning();

  const [member] = await db.insert(users).values({
    displayName: "一般ユーザー",
    email: "member@example.com",
    role: "member",
  }).returning();

  // サンプルリポジトリ
  const [repository] = await db.insert(repositories).values({
    name: "サンプルリポジトリ",
    key: "SAMPLE",
    description: "開発テスト用のサンプルリポジトリ",
  }).returning();

  // リポジトリメンバー
  await db.insert(repositoryMembers).values([
    { repositoryId: repository.id, userId: admin.id, role: "admin" },
    { repositoryId: repository.id, userId: member.id, role: "member" },
  ]);

  // カテゴリー
  await db.insert(categories).values([
    { repositoryId: repository.id, name: "機能追加", color: "#3B82F6", displayOrder: 1 },
    { repositoryId: repository.id, name: "バグ修正", color: "#EF4444", displayOrder: 2 },
    { repositoryId: repository.id, name: "改善", color: "#22C55E", displayOrder: 3 },
  ]);

  // デフォルトステータス
  await db.insert(taskStatuses).values([
    { repositoryId: repository.id, key: "open", label: "未対応", color: "#EF4444", displayOrder: 0 },
    { repositoryId: repository.id, key: "in_progress", label: "処理中", color: "#3B82F6", displayOrder: 1 },
    { repositoryId: repository.id, key: "resolved", label: "処理済み", color: "#22C55E", displayOrder: 2 },
    { repositoryId: repository.id, key: "closed", label: "完了", color: "#6B7280", displayOrder: 3 },
  ]);

  console.log("✅ Seed completed!");
  process.exit(0);
}

seed().catch((e) => {
  console.error("❌ Seed failed:", e);
  process.exit(1);
});

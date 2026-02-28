import { db } from "./index";
import { users, projects, projectMembers, categories, taskStatuses } from "./schema";

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

  // サンプルプロジェクト
  const [project] = await db.insert(projects).values({
    name: "サンプルプロジェクト",
    key: "SAMPLE",
    description: "開発テスト用のサンプルプロジェクト",
  }).returning();

  // プロジェクトメンバー
  await db.insert(projectMembers).values([
    { projectId: project.id, userId: admin.id, role: "admin" },
    { projectId: project.id, userId: member.id, role: "member" },
  ]);

  // カテゴリー
  await db.insert(categories).values([
    { projectId: project.id, name: "機能追加", color: "#3B82F6", displayOrder: 1 },
    { projectId: project.id, name: "バグ修正", color: "#EF4444", displayOrder: 2 },
    { projectId: project.id, name: "改善", color: "#22C55E", displayOrder: 3 },
  ]);

  // デフォルトステータス
  await db.insert(taskStatuses).values([
    { projectId: project.id, key: "open", label: "未対応", color: "#EF4444", displayOrder: 0 },
    { projectId: project.id, key: "in_progress", label: "処理中", color: "#3B82F6", displayOrder: 1 },
    { projectId: project.id, key: "resolved", label: "処理済み", color: "#22C55E", displayOrder: 2 },
    { projectId: project.id, key: "closed", label: "完了", color: "#6B7280", displayOrder: 3 },
  ]);

  console.log("✅ Seed completed!");
  process.exit(0);
}

seed().catch((e) => {
  console.error("❌ Seed failed:", e);
  process.exit(1);
});

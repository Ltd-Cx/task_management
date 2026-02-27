import type { InferSelectModel } from "drizzle-orm";
import type {
  tasks,
  users,
  categories,
  projects,
  projectMembers,
  taskStatuses,
} from "@/db/schema";

// --- Drizzle スキーマから推論される基本型 ---
export type Task = InferSelectModel<typeof tasks>;
export type User = InferSelectModel<typeof users>;
export type Category = InferSelectModel<typeof categories>;
export type Project = InferSelectModel<typeof projects>;
export type ProjectMember = InferSelectModel<typeof projectMembers>;

// --- ステータス・優先度のリテラル型 ---
export type TaskStatus = Task["status"];
export type TaskPriority = Task["priority"];
export type UserRole = User["role"];

// --- リレーション付きの型（クエリ結果） ---
export type TaskWithRelations = Task & {
  assignee: User | null;
  category: Category | null;
};

export type ProjectMemberWithUser = ProjectMember & {
  user: User;
};

// --- ステータス別グループ（ボード用） ---
export type TasksByStatus = Record<TaskStatus, TaskWithRelations[]>;

// --- 動的ステータス対応のボード用型 ---
export type DynamicTasksByStatus = Record<string, TaskWithRelations[]>;

// --- カスタムステータス設定 ---
export type TaskStatusConfig = InferSelectModel<typeof taskStatuses>;

// --- Server Action のレスポンス型 ---
export type ActionResult = {
  success: boolean;
  error?: string;
};

import type { InferSelectModel } from "drizzle-orm";
import type {
  tasks,
  users,
  categories,
  repositories,
  repositoryMembers,
  taskStatuses,
  taskProjects,
} from "@/db/schema";

// --- Drizzle スキーマから推論される基本型 ---
export type Task = InferSelectModel<typeof tasks>;
export type User = InferSelectModel<typeof users>;
export type Category = InferSelectModel<typeof categories>;
export type Repository = InferSelectModel<typeof repositories>;
export type RepositoryMember = InferSelectModel<typeof repositoryMembers>;
export type TaskProject = InferSelectModel<typeof taskProjects>;

// --- ステータス・優先度のリテラル型 ---
export type TaskStatus = Task["status"];
export type TaskPriority = Task["priority"];
export type UserRole = User["role"];

// --- リレーション付きの型（クエリ結果） ---
export type TaskWithRelations = Task & {
  assignee: User | null;
  category: Category | null;
  taskProject?: TaskProject | null;
};

export type RepositoryMemberWithUser = RepositoryMember & {
  user: User;
};

// --- ステータス別グループ（ボード用） ---
export type TasksByStatus = Record<TaskStatus, TaskWithRelations[]>;

// --- 動的ステータス対応のボード用型 ---
export type DynamicTasksByStatus = Record<string, TaskWithRelations[]>;

// --- カスタムステータス設定 ---
export type TaskStatusConfig = InferSelectModel<typeof taskStatuses>;

// --- Server Action のレスポンス型 ---
export type ActionResult<T = void> = {
  success: boolean;
  error?: string;
  data?: T;
};

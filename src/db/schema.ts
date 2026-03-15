import { pgTable, pgEnum, uuid, text, serial, date, integer, timestamp } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// Enums
export const userRoleEnum = pgEnum("user_role", ["admin", "member"]);
export const taskStatusEnum = pgEnum("task_status", ["open", "in_progress", "resolved", "closed"]);
export const taskPriorityEnum = pgEnum("task_priority", ["high", "medium", "low"]);

// Repositories (旧: Projects)
export const repositories = pgTable("repositories", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  key: text("key").unique().notNull(),
  description: text("description"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// Users
export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  displayName: text("display_name").notNull(),
  email: text("email").unique().notNull(),
  avatarUrl: text("avatar_url"),
  role: userRoleEnum("role").notNull().default("member"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// Categories
export const categories = pgTable("categories", {
  id: uuid("id").defaultRandom().primaryKey(),
  repositoryId: uuid("repository_id").references(() => repositories.id).notNull(),
  name: text("name").notNull(),
  color: text("color"),
  displayOrder: integer("display_order").notNull().default(0),
});

// Task Projects (旧: Task Groups)
export const taskProjects = pgTable("task_projects", {
  id: uuid("id").defaultRandom().primaryKey(),
  repositoryId: uuid("repository_id").references(() => repositories.id, { onDelete: "cascade" }).notNull(),
  name: text("name").notNull(),
  color: text("color").notNull().default("#95a5a6"),
  displayOrder: integer("display_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// Tasks
export const tasks = pgTable("tasks", {
  id: uuid("id").defaultRandom().primaryKey(),
  repositoryId: uuid("repository_id").references(() => repositories.id).notNull(),
  keyId: serial("key_id").notNull(),
  summary: text("summary").notNull(),
  description: text("description"),
  status: text("status").notNull().default("open"),
  priority: taskPriorityEnum("priority").notNull().default("medium"),
  assigneeId: uuid("assignee_id").references(() => users.id),
  categoryId: uuid("category_id").references(() => categories.id),
  taskProjectId: uuid("task_project_id").references(() => taskProjects.id, { onDelete: "set null" }),
  parentId: uuid("parent_id"), // 自己参照は後で .references(() => tasks.id) を追加
  startDate: date("start_date"),
  dueDate: date("due_date"),
  progress: integer("progress").notNull().default(0),
  statusMemo: text("status_memo"),
  createdBy: uuid("created_by").references(() => users.id).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// Repository Members (旧: Project Members)
export const repositoryMembers = pgTable("repository_members", {
  repositoryId: uuid("repository_id").references(() => repositories.id).notNull(),
  userId: uuid("user_id").references(() => users.id).notNull(),
  role: userRoleEnum("role").notNull().default("member"),
  joinedAt: timestamp("joined_at", { withTimezone: true }).defaultNow().notNull(),
});

// カスタムステータス（リポジトリ単位の表示設定）
export const taskStatuses = pgTable("task_statuses", {
  id: uuid("id").defaultRandom().primaryKey(),
  repositoryId: uuid("repository_id").references(() => repositories.id, { onDelete: "cascade" }).notNull(),
  key: text("key").notNull(),
  label: text("label").notNull(),
  color: text("color").notNull().default("#6B7280"),
  displayOrder: integer("display_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// --- Relations ---

export const repositoriesRelations = relations(repositories, ({ many }) => ({
  tasks: many(tasks),
  categories: many(categories),
  members: many(repositoryMembers),
  statuses: many(taskStatuses),
  taskProjects: many(taskProjects),
}));

export const usersRelations = relations(users, ({ many }) => ({
  assignedTasks: many(tasks, { relationName: "assignee" }),
  createdTasks: many(tasks, { relationName: "creator" }),
  repositoryMemberships: many(repositoryMembers),
}));

export const tasksRelations = relations(tasks, ({ one }) => ({
  repository: one(repositories, {
    fields: [tasks.repositoryId],
    references: [repositories.id],
  }),
  assignee: one(users, {
    fields: [tasks.assigneeId],
    references: [users.id],
    relationName: "assignee",
  }),
  category: one(categories, {
    fields: [tasks.categoryId],
    references: [categories.id],
  }),
  taskProject: one(taskProjects, {
    fields: [tasks.taskProjectId],
    references: [taskProjects.id],
  }),
  creator: one(users, {
    fields: [tasks.createdBy],
    references: [users.id],
    relationName: "creator",
  }),
}));

export const categoriesRelations = relations(categories, ({ one, many }) => ({
  repository: one(repositories, {
    fields: [categories.repositoryId],
    references: [repositories.id],
  }),
  tasks: many(tasks),
}));

export const repositoryMembersRelations = relations(repositoryMembers, ({ one }) => ({
  repository: one(repositories, {
    fields: [repositoryMembers.repositoryId],
    references: [repositories.id],
  }),
  user: one(users, {
    fields: [repositoryMembers.userId],
    references: [users.id],
  }),
}));

export const taskStatusesRelations = relations(taskStatuses, ({ one }) => ({
  repository: one(repositories, {
    fields: [taskStatuses.repositoryId],
    references: [repositories.id],
  }),
}));

export const taskProjectsRelations = relations(taskProjects, ({ one, many }) => ({
  repository: one(repositories, {
    fields: [taskProjects.repositoryId],
    references: [repositories.id],
  }),
  tasks: many(tasks),
}));

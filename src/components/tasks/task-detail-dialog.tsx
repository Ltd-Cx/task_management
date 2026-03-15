"use client";

import { useState, useTransition, useEffect, useMemo, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Pencil, ArrowLeft, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { DatePicker } from "@/components/ui/date-picker";
import { TipTapEditor } from "@/components/ui/tiptap-editor";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TaskStatusBadge } from "@/components/tasks/task-status-badge";
import { TaskPriorityBadge } from "@/components/tasks/task-priority-badge";
import { UserAvatar } from "@/components/shared/user-avatar";
import { AddTaskGroupDialog, type TaskGroupWithCount } from "@/components/tasks/add-task-group-dialog";
import { AddMemberInlineDialog } from "@/components/tasks/add-member-inline-dialog";
import { AddCategoryInlineDialog } from "@/components/tasks/add-category-inline-dialog";
import { TASK_PRIORITY_CONFIG } from "@/lib/constants";
import { updateTask } from "@/actions/task-actions";
import { formatDate } from "@/lib/date";
import type { TaskWithRelations, RepositoryMemberWithUser, Category, TaskPriority, TaskStatusConfig, TaskProject } from "@/types";

type DialogMode = "detail" | "edit";

interface TaskDetailDialogProps {
  task: TaskWithRelations;
  repositoryKey: string;
  repositoryId: string;
  members: RepositoryMemberWithUser[];
  categories: Category[];
  statuses: TaskStatusConfig[];
  taskGroups: TaskGroupWithCount[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** タスク詳細/編集ダイアログ */
export function TaskDetailDialog({
  task,
  repositoryKey,
  repositoryId,
  members: initialMembers,
  categories,
  statuses,
  taskGroups: initialTaskGroups,
  open,
  onOpenChange,
}: TaskDetailDialogProps) {
  const [mode, setMode] = useState<DialogMode>("detail");
  const [isPending, startTransition] = useTransition();
  const [localTaskGroups, setLocalTaskGroups] = useState<TaskGroupWithCount[]>(initialTaskGroups);
  const [localMembers, setLocalMembers] = useState<RepositoryMemberWithUser[]>(initialMembers);
  const [localCategories, setLocalCategories] = useState<Category[]>(categories);

  const statusConfig = statuses.find((s) => s.key === task.status);
  const taskGroup = localTaskGroups.find((g) => g.id === task.taskProjectId);

  // ダイアログが閉じたらモードをリセット
  useEffect(() => {
    if (!open) {
      setMode("detail");
    }
  }, [open]);

  /** 新しいグループが追加された時のハンドラ */
  const handleTaskGroupAdded = useCallback((newGroup: TaskProject) => {
    const groupWithCount: TaskGroupWithCount = { ...newGroup, taskCount: 0 };
    setLocalTaskGroups((prev) => [...prev, groupWithCount]);
  }, []);

  /** 新しいメンバーが追加された時のハンドラ */
  const handleMemberAdded = useCallback((newMember: RepositoryMemberWithUser) => {
    setLocalMembers((prev) => [...prev, newMember]);
  }, []);

  /** 新しいカテゴリーが追加された時のハンドラ */
  const handleCategoryAdded = useCallback((newCategory: Category) => {
    setLocalCategories((prev) => [...prev, newCategory]);
  }, []);

  /** propsが変わったらローカル状態を更新 */
  useEffect(() => {
    setLocalTaskGroups(initialTaskGroups);
  }, [initialTaskGroups]);

  useEffect(() => {
    setLocalMembers(initialMembers);
  }, [initialMembers]);

  useEffect(() => {
    setLocalCategories(categories);
  }, [categories]);

  // 動的にZodスキーマを生成
  const editTaskFormSchema = useMemo(() => {
    const statusKeys = statuses.map((s) => s.key) as [string, ...string[]];
    return z.object({
      summary: z.string().min(1, "件名は必須です"),
      description: z.string().optional(),
      status: z.enum(statusKeys),
      priority: z.enum(["high", "medium", "low"]),
      assigneeId: z.string().optional(),
      categoryId: z.string().optional(),
      taskGroupId: z.string().optional(),
      progress: z.number().min(0).max(100).default(0),
      statusMemo: z.string().optional(),
      startDate: z.string().optional(),
      dueDate: z.string().optional(),
    });
  }, [statuses]);

  type EditTaskFormValues = z.infer<typeof editTaskFormSchema>;

  const form = useForm<EditTaskFormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Zod v4 compat層と@hookform/resolversの型不整合を回避
    resolver: zodResolver(editTaskFormSchema as any),
    defaultValues: {
      summary: task.summary,
      description: task.description ?? "",
      status: task.status,
      priority: task.priority,
      assigneeId: task.assigneeId ?? "",
      categoryId: task.categoryId ?? "",
      taskGroupId: task.taskProjectId ?? "",
      progress: task.progress ?? 0,
      statusMemo: task.statusMemo ?? "",
      startDate: task.startDate ?? "",
      dueDate: task.dueDate ?? "",
    },
  });

  // タスクが変更されたらフォームをリセット
  useEffect(() => {
    form.reset({
      summary: task.summary,
      description: task.description ?? "",
      status: task.status,
      priority: task.priority,
      assigneeId: task.assigneeId ?? "",
      categoryId: task.categoryId ?? "",
      taskGroupId: task.taskProjectId ?? "",
      progress: task.progress ?? 0,
      statusMemo: task.statusMemo ?? "",
      startDate: task.startDate ?? "",
      dueDate: task.dueDate ?? "",
    });
  }, [task, form]);

  function onSubmit(values: EditTaskFormValues) {
    startTransition(async () => {
      const result = await updateTask({
        taskId: task.id,
        repositoryId,
        summary: values.summary,
        description: values.description,
        status: values.status,
        priority: values.priority,
        assigneeId: values.assigneeId || undefined,
        categoryId: values.categoryId || undefined,
        taskProjectId: values.taskGroupId === "__none__" ? undefined : values.taskGroupId || undefined,
        progress: values.progress,
        statusMemo: values.statusMemo || undefined,
        startDate: values.startDate || undefined,
        dueDate: values.dueDate || undefined,
      });

      if (result.success) {
        onOpenChange(false);
        toast.success("課題を更新しました");
      } else {
        toast.error(result.error ?? "課題の更新に失敗しました");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] w-[calc(100%-2rem)] max-w-[800px] flex-col no-scrollbar">
        {mode === "detail" ? (
          <>
            {/* 詳細モード */}
            <DialogHeader className="flex flex-row items-start justify-between gap-4">
              <div className="flex-1 space-y-1">
                <DialogTitle className="text-xl">{task.summary}</DialogTitle>
              </div>
            </DialogHeader>
            <div className="flex-1 space-y-6 overflow-y-auto px-1 pb-4">
              {/* ステータスと優先度 */}
              <div className="flex flex-wrap gap-3">
                <TaskStatusBadge status={task.status} statusConfig={statusConfig} />
                <TaskPriorityBadge priority={task.priority} />
              </div>

              {/* 詳細情報グリッド */}
              <div className="grid grid-cols-2 gap-x-8 gap-y-4 text-sm">
                {/* 担当者 */}
                <div>
                  <p className="text-muted-foreground mb-1">担当者</p>
                  {task.assignee ? (
                    <div className="flex items-center gap-2">
                      <UserAvatar user={task.assignee} size="md" />
                      <span>{task.assignee.displayName}</span>
                    </div>
                  ) : (
                    <span className="text-muted-foreground">未割当</span>
                  )}
                </div>

                {/* カテゴリー */}
                <div>
                  <p className="text-muted-foreground mb-1">カテゴリー</p>
                  {task.category ? (
                    <Badge variant="outline" className="text-xs">
                      <span
                        className="size-2 rounded-full mr-1.5"
                        style={{ backgroundColor: task.category.color ?? "#95a5a6" }}
                      />
                      {task.category.name}
                    </Badge>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </div>

                {/* グループ */}
                <div>
                  <p className="text-muted-foreground mb-1">グループ</p>
                  {taskGroup ? (
                    <Badge variant="outline" className="text-xs">
                      <span
                        className="size-2 rounded-full mr-1.5"
                        style={{ backgroundColor: taskGroup.color }}
                      />
                      {taskGroup.name}
                    </Badge>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </div>

                {/* 進捗率 */}
                <div>
                  <p className="text-muted-foreground mb-1">進捗率</p>
                  <div className="flex items-center gap-2">
                    <Progress value={task.progress ?? 0} className="h-2 flex-1" />
                    <span className="text-sm font-medium w-10 text-right">{task.progress ?? 0}%</span>
                  </div>
                </div>

                {/* 開始日 */}
                <div>
                  <p className="text-muted-foreground mb-1">開始日</p>
                  <span>{task.startDate ? formatDate(task.startDate) : "-"}</span>
                </div>

                {/* 期限日 */}
                <div>
                  <p className="text-muted-foreground mb-1">期限日</p>
                  <span>{task.dueDate ? formatDate(task.dueDate) : "-"}</span>
                </div>

                {/* 作成日 */}
                <div>
                  <p className="text-muted-foreground mb-1">作成日</p>
                  <span>{formatDate(task.createdAt)}</span>
                </div>

                {/* 更新日 */}
                <div>
                  <p className="text-muted-foreground mb-1">更新日</p>
                  <span>{formatDate(task.updatedAt)}</span>
                </div>
              </div>

              {/* 詳細説明 */}
              {task.description && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">詳細</p>
                  <div
                    className="prose prose-sm max-w-none rounded-lg border bg-muted/30 p-4"
                    dangerouslySetInnerHTML={{ __html: task.description }}
                  />
                </div>
              )}

              {/* 状況メモ */}
              {task.statusMemo && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">状況メモ</p>
                  <div
                    className="prose prose-sm max-w-none rounded-lg border bg-muted/30 p-4"
                    dangerouslySetInnerHTML={{ __html: task.statusMemo }}
                  />
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t">
              <DialogClose asChild>
                <Button variant="outline" className="rounded-full">閉じる</Button>
              </DialogClose>
              <Button
                variant="default"
                className="rounded-full"
                onClick={() => setMode("edit")}
              >
                <Pencil className="size-4 mr-1" />
                編集
              </Button>
            </div>
          </>
        ) : (
          <>
            {/* 編集モード */}
            <DialogHeader className="flex flex-row items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                className="shrink-0 rounded-full"
                onClick={() => setMode("detail")}
              >
                <ArrowLeft className="size-4 mr-1" />
                戻る
              </Button>
              <div className="flex-1">
                <DialogTitle>タスク編集</DialogTitle>
              </div>
            </DialogHeader>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-1 flex-col overflow-hidden">
                <div className="flex-1 space-y-6 overflow-x-hidden overflow-y-auto px-1 no-scrollbar w-full">
                  {/* グループ */}
                  <FormField
                    control={form.control}
                    name="taskGroupId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>グループ</FormLabel>
                        <div className="flex gap-2">
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="グループを選択" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="__none__">
                                <span className="text-muted-foreground">グループなし</span>
                              </SelectItem>
                              {localTaskGroups.map((g) => (
                                <SelectItem key={g.id} value={g.id}>
                                  <span className="flex items-center gap-2">
                                    <span
                                      className="size-3 rounded-full"
                                      style={{ backgroundColor: g.color }}
                                    />
                                    {g.name}
                                  </span>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <AddTaskGroupDialog
                            repositoryId={repositoryId}
                            existingGroups={localTaskGroups}
                            onSuccess={handleTaskGroupAdded}
                          />
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* 件名 */}
                  <FormField
                    control={form.control}
                    name="summary"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>タイトル <span className="text-destructive">*</span></FormLabel>
                        <FormControl>
                          <Input placeholder="課題のタイトルを入力" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* 詳細 */}
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>詳細</FormLabel>
                        <FormControl>
                          <TipTapEditor
                            value={field.value ?? ""}
                            onChange={field.onChange}
                            placeholder="課題の詳細を入力（任意）"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* 状態 + 優先度 */}
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="status"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>状態</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger className="w-full">
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {statuses.map((s) => (
                                <SelectItem key={s.key} value={s.key}>
                                  <span className="flex items-center gap-2">
                                    <span
                                      className="size-2 rounded-full"
                                      style={{ backgroundColor: s.color }}
                                    />
                                    {s.label}
                                  </span>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="priority"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>優先度</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger className="w-full">
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {(Object.entries(TASK_PRIORITY_CONFIG) as [TaskPriority, { label: string }][]).map(
                                ([value, config]) => (
                                  <SelectItem key={value} value={value}>{config.label}</SelectItem>
                                )
                              )}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* 担当者 */}
                  <FormField
                    control={form.control}
                    name="assigneeId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>担当者</FormLabel>
                        <div className="flex gap-2">
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="担当者を選択" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {localMembers.map((m) => (
                                <SelectItem key={m.user.id} value={m.user.id}>
                                  {m.user.displayName}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <AddMemberInlineDialog
                            repositoryId={repositoryId}
                            existingMembers={localMembers}
                            onSuccess={handleMemberAdded}
                          />
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* カテゴリー */}
                  <FormField
                    control={form.control}
                    name="categoryId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>カテゴリー</FormLabel>
                        <div className="flex gap-2">
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="カテゴリーを選択" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {localCategories.map((c) => (
                                <SelectItem key={c.id} value={c.id}>
                                  <span className="flex items-center gap-2">
                                    <span
                                      className="size-3 rounded-full"
                                      style={{ backgroundColor: c.color ?? "#95a5a6" }}
                                    />
                                    {c.name}
                                  </span>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <AddCategoryInlineDialog
                            repositoryId={repositoryId}
                            existingCategories={localCategories}
                            onSuccess={handleCategoryAdded}
                          />
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* 開始日 + 期限日 */}
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="startDate"
                      render={({ field }) => (
                        <FormItem className="min-w-0">
                          <FormLabel>開始日</FormLabel>
                          <FormControl>
                            <DatePicker
                              value={field.value}
                              onChange={field.onChange}
                              placeholder="開始日を選択"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="dueDate"
                      render={({ field }) => (
                        <FormItem className="min-w-0">
                          <FormLabel>期限日</FormLabel>
                          <FormControl>
                            <DatePicker
                              value={field.value}
                              onChange={field.onChange}
                              placeholder="期限日を選択"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* 進捗率 */}
                  <FormField
                    control={form.control}
                    name="progress"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex items-center justify-between">
                          <FormLabel>進捗率</FormLabel>
                          <span className="text-sm font-medium">{field.value}%</span>
                        </div>
                        <FormControl>
                          <Slider
                            value={[field.value]}
                            onValueChange={(values) => field.onChange(values[0])}
                            min={0}
                            max={100}
                            step={1}
                            className="w-full"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* 状況メモ */}
                  <FormField
                    control={form.control}
                    name="statusMemo"
                    render={({ field }) => (
                      <FormItem className="pb-4">
                        <FormLabel>状況メモ</FormLabel>
                        <FormControl>
                          <TipTapEditor
                            value={field.value ?? ""}
                            onChange={field.onChange}
                            placeholder="現在の状況や進捗について記録（任意）"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <DialogFooter className="pt-6 border-t">
                  <Button
                    type="button"
                    variant="outline"
                    className="rounded-full"
                    onClick={() => {
                      form.reset();
                      setMode("detail");
                    }}
                  >
                    キャンセル
                  </Button>
                  <Button type="submit" disabled={isPending} className="rounded-full">
                    <Save />
                    {isPending ? "保存中..." : "保存"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

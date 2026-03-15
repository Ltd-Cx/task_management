"use client";

import { useState, useTransition, useMemo, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { DatePicker } from "@/components/ui/date-picker";
import { TipTapEditor } from "@/components/ui/tiptap-editor";
import { Slider } from "@/components/ui/slider";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TASK_PRIORITY_CONFIG } from "@/lib/constants";
import { createTask } from "@/actions/task-actions";
import { AddTaskGroupDialog, type TaskGroupWithCount } from "@/components/tasks/add-task-group-dialog";
import { AddMemberInlineDialog } from "@/components/tasks/add-member-inline-dialog";
import { AddCategoryInlineDialog } from "@/components/tasks/add-category-inline-dialog";
import type { ProjectMemberWithUser, Category, TaskPriority, TaskStatusConfig, TaskGroup } from "@/types";

interface AddTaskDialogProps {
  projectId: string;
  members: ProjectMemberWithUser[];
  categories: Category[];
  statuses: TaskStatusConfig[];
  taskGroups: TaskGroupWithCount[];
}

/** 課題追加ダイアログ */
export function AddTaskDialog({
  projectId,
  members: initialMembers,
  categories,
  statuses,
  taskGroups: initialTaskGroups,
}: AddTaskDialogProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [localTaskGroups, setLocalTaskGroups] = useState<TaskGroupWithCount[]>(initialTaskGroups);
  const [localMembers, setLocalMembers] = useState<ProjectMemberWithUser[]>(initialMembers);
  const [localCategories, setLocalCategories] = useState<Category[]>(categories);

  /** 新しいグループが追加された時のハンドラ */
  const handleTaskGroupAdded = useCallback((newGroup: TaskGroup) => {
    const groupWithCount: TaskGroupWithCount = { ...newGroup, taskCount: 0 };
    setLocalTaskGroups((prev) => [...prev, groupWithCount]);
  }, []);

  /** 新しいメンバーが追加された時のハンドラ */
  const handleMemberAdded = useCallback((newMember: ProjectMemberWithUser) => {
    setLocalMembers((prev) => [...prev, newMember]);
  }, []);

  /** 新しいカテゴリーが追加された時のハンドラ */
  const handleCategoryAdded = useCallback((newCategory: Category) => {
    setLocalCategories((prev) => [...prev, newCategory]);
  }, []);

  // 動的にZodスキーマを生成
  const addTaskFormSchema = useMemo(() => {
    const statusKeys = statuses.map((s) => s.key) as [string, ...string[]];
    return z.object({
      summary: z.string().min(1, "件名は必須です"),
      description: z.string().optional(),
      status: z.enum(statusKeys).default(statusKeys[0] ?? "open"),
      priority: z.enum(["high", "medium", "low"]).default("medium"),
      assigneeId: z.string().optional(),
      categoryId: z.string().optional(),
      taskGroupId: z.string().optional(),
      progress: z.number().min(0).max(100).default(0),
      startDate: z.string().optional(),
      dueDate: z.string().optional(),
    });
  }, [statuses]);

  type AddTaskFormValues = z.infer<typeof addTaskFormSchema>;

  const defaultStatus = statuses[0]?.key ?? "open";

  const form = useForm<AddTaskFormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Zod v4 compat層と@hookform/resolversの型不整合を回避
    resolver: zodResolver(addTaskFormSchema as any),
    defaultValues: {
      summary: "",
      description: "",
      status: defaultStatus,
      priority: "medium",
      assigneeId: "",
      categoryId: "",
      taskGroupId: "",
      progress: 0,
      startDate: "",
      dueDate: "",
    },
  });

  function onSubmit(values: AddTaskFormValues) {
    startTransition(async () => {
      // TODO: 認証実装後にログインユーザーIDを使用
      const createdBy = localMembers[0]?.user.id ?? "";

      const result = await createTask({
        projectId,
        summary: values.summary,
        description: values.description,
        status: values.status,
        priority: values.priority,
        assigneeId: values.assigneeId || undefined,
        categoryId: values.categoryId || undefined,
        taskGroupId: values.taskGroupId === "__none__" ? undefined : values.taskGroupId || undefined,
        progress: values.progress,
        startDate: values.startDate || undefined,
        dueDate: values.dueDate || undefined,
        createdBy,
      });

      if (result.success) {
        form.reset();
        setOpen(false);
        toast.success("課題を追加しました");
      } else {
        toast.error(result.error ?? "課題の追加に失敗しました");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="rounded-full">
          <Plus className="size-4" />
          課題を追加
        </Button>
      </DialogTrigger>

      <DialogContent className="flex max-h-[90vh] w-[calc(100%-2rem)] max-w-[800px] flex-col no-scrollbar">
        <DialogHeader>
          <DialogTitle>課題の追加</DialogTitle>
          <p className="text-sm text-muted-foreground">新しい課題をプロジェクトに追加します。</p>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-1 flex-col space-y-8 overflow-hidden">
            <div className="flex-1 space-y-8 overflow-x-hidden overflow-y-auto px-1 w-full">
            {/* グループ */}
            <FormField
              control={form.control}
              name="taskGroupId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>プロジェクト</FormLabel>
                  <div className="flex gap-2">
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="プロジェクトを選択" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="__none__">
                          <span className="text-muted-foreground">プロジェクトなし</span>
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
                      projectId={projectId}
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
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {statuses.map((statusConfig) => (
                          <SelectItem key={statusConfig.key} value={statusConfig.key}>
                            <span className="flex items-center gap-2">
                              <span
                                className="size-2 rounded-full"
                                style={{ backgroundColor: statusConfig.color }}
                              />
                              {statusConfig.label}
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
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                      projectId={projectId}
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
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                      projectId={projectId}
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
                <FormItem className="pb-4">
                  <div className="flex items-center justify-between">
                    <FormLabel>進捗率</FormLabel>
                    <span className="text-sm font-medium">{field.value}%</span>
                  </div>
                  <FormControl>
                    <div className="space-y-2">
                      <Slider
                        value={[field.value]}
                        onValueChange={(values) => field.onChange(values[0])}
                        min={0}
                        max={100}
                        step={1}
                        className="w-full"
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            </div>

            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">キャンセル</Button>
              </DialogClose>
              <Button type="submit" disabled={isPending}>
                {isPending ? "追加中..." : "追加する"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

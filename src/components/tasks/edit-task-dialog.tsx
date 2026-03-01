"use client";

import { useTransition, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
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
import { DatePicker } from "@/components/ui/date-picker";
import { TipTapEditor } from "@/components/ui/tiptap-editor";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TASK_PRIORITY_CONFIG } from "@/lib/constants";
import { updateTask } from "@/actions/task-actions";
import type { TaskWithRelations, ProjectMemberWithUser, Category, TaskPriority, TaskStatusConfig } from "@/types";

interface EditTaskDialogProps {
  task: TaskWithRelations;
  projectId: string;
  members: ProjectMemberWithUser[];
  categories: Category[];
  statuses: TaskStatusConfig[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

/** 課題編集ダイアログ */
export function EditTaskDialog({
  task,
  projectId,
  members,
  categories,
  statuses,
  open,
  onOpenChange,
  onSuccess,
}: EditTaskDialogProps) {
  const [isPending, startTransition] = useTransition();

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
      startDate: task.startDate ?? "",
      dueDate: task.dueDate ?? "",
    });
  }, [task, form]);

  function onSubmit(values: EditTaskFormValues) {
    startTransition(async () => {
      const result = await updateTask({
        taskId: task.id,
        projectId,
        summary: values.summary,
        description: values.description,
        status: values.status,
        priority: values.priority,
        assigneeId: values.assigneeId || undefined,
        categoryId: values.categoryId || undefined,
        startDate: values.startDate || undefined,
        dueDate: values.dueDate || undefined,
      });

      if (result.success) {
        onOpenChange(false);
        onSuccess?.();
        toast.success("課題を更新しました");
      } else {
        toast.error(result.error ?? "課題の更新に失敗しました");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] w-[calc(100%-2rem)] max-w-[640px] flex-col no-scrollbar">
        <DialogHeader>
          <DialogTitle>課題の編集</DialogTitle>
          <p className="text-sm text-muted-foreground">課題の内容を編集します。</p>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-1 flex-col overflow-hidden">
            <div className="flex-1 space-y-8 overflow-x-hidden overflow-y-auto px-1 no-scrollbar w-full">
            {/* 件名 */}
            <FormField
              control={form.control}
              name="summary"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>件名 <span className="text-destructive">*</span></FormLabel>
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

            {/* 担当者 + カテゴリー */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="assigneeId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>担当者</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="担当者を選択" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {members.map((m) => (
                          <SelectItem key={m.user.id} value={m.user.id}>
                            {m.user.displayName}
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
                name="categoryId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>カテゴリー</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="カテゴリーを選択" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* 開始日 + 期限日 */}
            <div className="grid grid-cols-1 gap-4 pb-4 sm:grid-cols-2">
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
            </div>

            <DialogFooter className="pt-8 pb-4">
              <DialogClose asChild>
                <Button type="button" variant="outline">キャンセル</Button>
              </DialogClose>
              <Button type="submit" disabled={isPending}>
                {isPending ? "保存中..." : "保存する"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

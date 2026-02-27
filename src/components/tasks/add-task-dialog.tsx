"use client";

import { useState, useTransition, useMemo } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TASK_PRIORITY_CONFIG } from "@/lib/constants";
import { createTask } from "@/actions/task-actions";
import type { ProjectMemberWithUser, Category, TaskPriority, TaskStatusConfig } from "@/types";

interface AddTaskDialogProps {
  projectId: string;
  members: ProjectMemberWithUser[];
  categories: Category[];
  statuses: TaskStatusConfig[];
}

/** 課題追加ダイアログ */
export function AddTaskDialog({
  projectId,
  members,
  categories,
  statuses,
}: AddTaskDialogProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

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
      startDate: "",
      dueDate: "",
    },
  });

  function onSubmit(values: AddTaskFormValues) {
    startTransition(async () => {
      // TODO: 認証実装後にログインユーザーIDを使用
      const createdBy = members[0]?.user.id ?? "";

      const result = await createTask({
        projectId,
        summary: values.summary,
        description: values.description,
        status: values.status,
        priority: values.priority,
        assigneeId: values.assigneeId || undefined,
        categoryId: values.categoryId || undefined,
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
        <Button size="sm">
          <Plus className="size-4" />
          課題を追加
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>課題の追加</DialogTitle>
          <p className="text-sm text-muted-foreground">新しい課題をプロジェクトに追加します。</p>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                    <Textarea placeholder="課題の詳細を入力（任意）" className="min-h-[80px]" {...field} />
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
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>開始日</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="dueDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>期限日</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
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

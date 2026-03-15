"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Check, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { createTaskProjectAction, deleteTaskProjectAction } from "@/actions/task-group-actions";
import type { TaskProject } from "@/types";
import { cn } from "@/lib/utils";

/** プロジェクト（課題数付き） */
export interface TaskGroupWithCount extends TaskProject {
  taskCount: number;
}

/** プリセットカラー */
const PRESET_COLORS = [
  "#3498db", // 青
  "#2ecc71", // 緑
  "#e74c3c", // 赤
  "#f39c12", // オレンジ
  "#9b59b6", // 紫
  "#1abc9c", // ティール
  "#e91e63", // ピンク
  "#607d8b", // ブルーグレー
  "#795548", // ブラウン
  "#95a5a6", // グレー
];

const addTaskGroupFormSchema = z.object({
  name: z.string().min(1, "グループ名は必須です").max(50, "グループ名は50文字以内で入力してください"),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "カラーを選択してください"),
});

type AddTaskGroupFormValues = z.infer<typeof addTaskGroupFormSchema>;

interface AddTaskGroupDialogProps {
  repositoryId: string;
  existingGroups?: TaskGroupWithCount[];
  onSuccess?: (newGroup: TaskProject) => void;
  onDelete?: (groupId: string) => void;
  buttonLabel?: string;
}

/** タスクプロジェクト追加ダイアログ */
export function AddTaskGroupDialog({ repositoryId, existingGroups = [], onSuccess, onDelete, buttonLabel = "管理" }: AddTaskGroupDialogProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [deletingGroupId, setDeletingGroupId] = useState<string | null>(null);

  const form = useForm<AddTaskGroupFormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Zod v4 compat層と@hookform/resolversの型不整合を回避
    resolver: zodResolver(addTaskGroupFormSchema as any),
    defaultValues: {
      name: "",
      color: PRESET_COLORS[0],
    },
  });

  function onSubmit(values: AddTaskGroupFormValues) {
    startTransition(async () => {
      const result = await createTaskProjectAction({
        repositoryId,
        name: values.name,
        color: values.color,
      });

      if (result.success && result.data) {
        form.reset();
        setOpen(false);
        toast.success("プロジェクトを追加しました");
        onSuccess?.(result.data);
      } else {
        toast.error(result.error ?? "プロジェクトの追加に失敗しました");
      }
    });
  }

  /** プロジェクトを削除 */
  const handleDeleteGroup = (groupId: string, groupName: string, taskCount: number) => {
    const message = taskCount > 0
      ? `「${groupName}」を削除しますか？\n紐づいている${taskCount}件のタスクは「プロジェクトなし」になります。`
      : `「${groupName}」を削除しますか？`;

    if (!confirm(message)) return;

    setDeletingGroupId(groupId);
    startTransition(async () => {
      const result = await deleteTaskProjectAction({ projectId: groupId, repositoryId });
      setDeletingGroupId(null);

      if (result.success) {
        toast.success("プロジェクトを削除しました");
        onDelete?.(groupId);
      } else {
        toast.error(result.error ?? "プロジェクトの削除に失敗しました");
      }
    });
  };

  /** ダイアログを開く（イベント伝播を防止） */
  const handleOpenDialog = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setOpen(true);
  };

  /** フォーム送信（イベント伝播を防止） */
  const handleFormSubmit = (e: React.FormEvent) => {
    e.stopPropagation();
    form.handleSubmit(onSubmit)(e);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button
        type="button"
        variant="default"
        className="rounded-full"
        onClick={handleOpenDialog}
      >
        {buttonLabel}
      </Button>

      <DialogContent
        className="max-w-[400px] z-[600]"
        onPointerDownOutside={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.stopPropagation()}
        onCloseAutoFocus={(e) => e.preventDefault()}
        onClick={(e) => e.stopPropagation()}
      >
        <DialogHeader>
          <DialogTitle>プロジェクトの追加</DialogTitle>
        </DialogHeader>

        {/* 登録済みプロジェクト一覧 */}
        {existingGroups.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">登録済みプロジェクト</p>
            <ScrollArea className="h-[150px] rounded-md border">
              <div className="space-y-1 p-2">
                {existingGroups.map((group) => (
                  <div
                    key={group.id}
                    className="flex items-center justify-between rounded-md bg-muted/50 px-3 py-2"
                  >
                    <div className="flex min-w-0 flex-1 items-center gap-2">
                      <span
                        className="size-3 shrink-0 rounded-full"
                        style={{ backgroundColor: group.color }}
                      />
                      <span className="truncate text-sm">{group.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {group.taskCount}件のタスク
                      </span>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <Button
                        type="button"
                        variant="delete"
                        onClick={() => handleDeleteGroup(group.id, group.name, group.taskCount)}
                        disabled={deletingGroupId === group.id}
                        className="rounded-full"
                      >
                        <Trash2 className="size-4" />
                        削除
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}

        <Form {...form}>
          <form onSubmit={handleFormSubmit} className="space-y-6">
            {/* グループ名 */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>プロジェクト名 <span className="text-destructive">*</span></FormLabel>
                  <FormControl>
                    <Input placeholder="プロジェクト名を入力" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* カラー選択 */}
            <FormField
              control={form.control}
              name="color"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>カラー</FormLabel>
                  <FormControl>
                    <div className="flex flex-wrap gap-2">
                      {PRESET_COLORS.map((color) => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => field.onChange(color)}
                          className={cn(
                            "size-8 rounded-full flex items-center justify-center transition-all",
                            "ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                            field.value === color && "ring-2 ring-ring ring-offset-2"
                          )}
                          style={{ backgroundColor: color }}
                        >
                          {field.value === color && (
                            <Check className="size-4 text-white drop-shadow-md" />
                          )}
                        </button>
                      ))}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  form.reset();
                  setOpen(false);
                }}
              >
                キャンセル
              </Button>
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

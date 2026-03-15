"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Check } from "lucide-react";
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
import { createCategory } from "@/actions/category-actions";
import type { Category } from "@/types";
import { cn } from "@/lib/utils";

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

const addCategoryFormSchema = z.object({
  name: z.string().min(1, "カテゴリー名は必須です").max(50, "カテゴリー名は50文字以内で入力してください"),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "カラーを選択してください"),
});

type AddCategoryFormValues = z.infer<typeof addCategoryFormSchema>;

interface AddCategoryInlineDialogProps {
  projectId: string;
  existingCategories?: Category[];
  onSuccess?: (newCategory: Category) => void;
  buttonLabel?: string;
}

/** カテゴリー追加ダイアログ（タスクダイアログ内で使用） */
export function AddCategoryInlineDialog({
  projectId,
  existingCategories = [],
  onSuccess,
  buttonLabel = "管理",
}: AddCategoryInlineDialogProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const form = useForm<AddCategoryFormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(addCategoryFormSchema as any),
    defaultValues: {
      name: "",
      color: PRESET_COLORS[0],
    },
  });

  function onSubmit(values: AddCategoryFormValues) {
    startTransition(async () => {
      const result = await createCategory({
        projectId,
        name: values.name,
        color: values.color,
      });

      if (result.success && result.data) {
        form.reset();
        setOpen(false);
        toast.success("カテゴリーを追加しました");
        onSuccess?.(result.data);
      } else {
        toast.error(result.error ?? "カテゴリーの追加に失敗しました");
      }
    });
  }

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
          <DialogTitle>カテゴリーの追加</DialogTitle>
        </DialogHeader>

        {/* 登録済みカテゴリー一覧 */}
        {existingCategories.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">登録済みカテゴリー</p>
            <ScrollArea className="h-[120px] rounded-md border">
              <div className="space-y-1 p-2">
                {existingCategories.map((category) => (
                  <div
                    key={category.id}
                    className="flex items-center gap-2 rounded-md bg-muted/50 px-3 py-2"
                  >
                    <span
                      className="size-3 rounded-full shrink-0"
                      style={{ backgroundColor: category.color ?? "#95a5a6" }}
                    />
                    <span className="text-sm">{category.name}</span>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}

        <Form {...form}>
          <form onSubmit={handleFormSubmit} className="space-y-4">
            {/* カテゴリー名 */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>カテゴリー名 <span className="text-destructive">*</span></FormLabel>
                  <FormControl>
                    <Input placeholder="カテゴリー名を入力" {...field} />
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

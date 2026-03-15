"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, FolderKanban, Save } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
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
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { createProject } from "@/actions/project-actions";
import type { TaskGroup } from "@/types";

/** リポジトリ情報（グループと課題数付き） */
interface ProjectWithStats {
  id: string;
  name: string;
  key: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
  taskGroups: TaskGroup[];
  taskCount: number;
}

interface AddProjectDialogProps {
  projects: ProjectWithStats[];
  currentUserId: string;
}

const addProjectFormSchema = z.object({
  name: z.string().min(1, "リポジトリ名は必須です").max(100, "リポジトリ名は100文字以内で入力してください"),
  key: z.string().min(1, "リポジトリキーは必須です").max(10, "リポジトリキーは10文字以内で入力してください").regex(/^[A-Z0-9_]+$/, "大文字英数字とアンダースコアのみ"),
  description: z.string().optional(),
});

type AddProjectFormValues = z.infer<typeof addProjectFormSchema>;

/** リポジトリ追加ダイアログ */
export function AddProjectDialog({ projects, currentUserId }: AddProjectDialogProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const form = useForm<AddProjectFormValues>({
    resolver: zodResolver(addProjectFormSchema),
    defaultValues: {
      name: "",
      key: "",
      description: "",
    },
  });

  /** リポジトリ名からキーを自動生成 */
  const generateKey = (name: string) => {
    return name
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "")
      .slice(0, 10);
  };

  function onSubmit(values: AddProjectFormValues) {
    startTransition(async () => {
      const result = await createProject({
        name: values.name,
        key: values.key,
        description: values.description,
        createdBy: currentUserId,
      });

      if (result.success && result.data) {
        form.reset();
        setOpen(false);
        toast.success("リポジトリを作成しました");
        router.push(`/projects/${result.data.id}`);
      } else {
        toast.error(result.error ?? "リポジトリの作成に失敗しました");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <Plus className="size-4" />
          リポジトリを追加
        </Button>
      </DialogTrigger>

      <DialogContent className="flex max-h-[90vh] w-[calc(100%-2rem)] max-w-[640px] flex-col">
        <DialogHeader>
          <DialogTitle>リポジトリの追加</DialogTitle>
          <p className="text-sm text-muted-foreground">新しいリポジトリを作成します。</p>
        </DialogHeader>

        {/* 登録済みリポジトリ一覧 */}
        {projects.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">登録済みリポジトリ</p>
            <ScrollArea className="h-[160px] rounded-md border">
              <div className="space-y-1 p-2">
                {projects.map((project) => (
                  <div
                    key={project.id}
                    className="flex items-center justify-between rounded-md bg-muted/50 px-3 py-2"
                  >
                    <div className="flex items-center gap-2">
                      <FolderKanban className="size-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">{project.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {project.taskGroups.length > 0 ? (
                            <>
                              リポジトリ: {project.taskGroups.map((g) => g.name).join(", ")}
                            </>
                          ) : (
                            "リポジトリなし"
                          )}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {project.taskCount}件
                    </span>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-1 flex-col space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>リポジトリ名 <span className="text-destructive">*</span></FormLabel>
                  <FormControl>
                    <Input
                      placeholder="例: Webサイトリニューアル"
                      {...field}
                      onChange={(e) => {
                        field.onChange(e);
                        // キーが空の場合は自動生成
                        const currentKey = form.getValues("key");
                        if (!currentKey) {
                          form.setValue("key", generateKey(e.target.value));
                        }
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* リポジトリキー */}
            <FormField
              control={form.control}
              name="key"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>リポジトリキー <span className="text-destructive">*</span></FormLabel>
                  <FormControl>
                    <Input
                      placeholder="例: WEB"
                      {...field}
                      onChange={(e) => {
                        field.onChange(e.target.value.toUpperCase());
                      }}
                    />
                  </FormControl>
                  <FormDescription>
                    課題番号の接頭辞として使用されます（例: WEB-1）
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 説明 */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>説明</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="リポジトリの説明（任意）"
                      className="resize-none"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="pt-4">
              <DialogClose asChild>
                <Button type="button" variant="outline" className="rounded-full">キャンセル</Button>
              </DialogClose>
              <Button type="submit" disabled={isPending} className="rounded-full">
                <Save />
                {isPending ? "作成中..." : "作成する"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

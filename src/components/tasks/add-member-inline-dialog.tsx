"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { UserPlus } from "lucide-react";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { createUser } from "@/actions/user-actions";
import type { RepositoryMemberWithUser } from "@/types";

const addUserFormSchema = z.object({
  displayName: z.string().min(1, "表示名は必須です"),
  email: z.string().email("有効なメールアドレスを入力してください"),
});

type AddUserFormValues = z.infer<typeof addUserFormSchema>;

interface AddMemberInlineDialogProps {
  repositoryId: string;
  existingMembers?: RepositoryMemberWithUser[];
  onSuccess?: (newMember: RepositoryMemberWithUser) => void;
  buttonLabel?: string;
}

/** 担当者追加ダイアログ（タスクダイアログ内で使用） */
export function AddMemberInlineDialog({
  repositoryId,
  existingMembers = [],
  onSuccess,
  buttonLabel = "管理",
}: AddMemberInlineDialogProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const form = useForm<AddUserFormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(addUserFormSchema as any),
    defaultValues: {
      displayName: "",
      email: "",
    },
  });

  function onSubmit(values: AddUserFormValues) {
    startTransition(async () => {
      const result = await createUser({
        displayName: values.displayName,
        email: values.email,
        role: "member",
        repositoryId,
      });

      if (result.success && result.data) {
        form.reset();
        setOpen(false);
        toast.success("担当者を追加しました");
        // 新しいメンバー情報を構築してコールバック
        const newMember: RepositoryMemberWithUser = {
          repositoryId,
          userId: result.data.userId,
          role: "member",
          joinedAt: new Date(),
          user: {
            id: result.data.userId,
            displayName: values.displayName,
            email: values.email,
            avatarUrl: null,
            role: "member",
            createdAt: new Date(),
          },
        };
        onSuccess?.(newMember);
      } else {
        toast.error(result.error ?? "担当者の追加に失敗しました");
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
          <DialogTitle>担当者の追加</DialogTitle>
        </DialogHeader>

        {/* 登録済み担当者一覧 */}
        {existingMembers.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">登録済み担当者</p>
            <ScrollArea className="h-[120px] rounded-md border">
              <div className="space-y-1 p-2">
                {existingMembers.map((member) => (
                  <div
                    key={member.user.id}
                    className="flex items-center gap-2 rounded-md bg-muted/50 px-3 py-2"
                  >
                    <Avatar className="size-6">
                      <AvatarImage src={member.user.avatarUrl ?? undefined} />
                      <AvatarFallback className="text-xs">
                        {member.user.displayName.slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate">{member.user.displayName}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {member.user.email}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}

        <Form {...form}>
          <form onSubmit={handleFormSubmit} className="space-y-4">
            {/* 表示名 */}
            <FormField
              control={form.control}
              name="displayName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>表示名 <span className="text-destructive">*</span></FormLabel>
                  <FormControl>
                    <Input placeholder="山田 太郎" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* メールアドレス */}
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>メールアドレス <span className="text-destructive">*</span></FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="example@example.com"
                      {...field}
                    />
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

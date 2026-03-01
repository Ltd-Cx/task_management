"use client";

import { useState, useTransition } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { addMember } from "@/actions/member-actions";
import type { User, UserRole } from "@/types";

const ROLE_OPTIONS: { value: UserRole; label: string }[] = [
  { value: "member", label: "メンバー" },
  { value: "admin", label: "管理者" },
];

const addMemberFormSchema = z.object({
  userId: z.string().min(1, "ユーザーを選択してください"),
  role: z.enum(["admin", "member"]).default("member"),
});

type AddMemberFormValues = z.infer<typeof addMemberFormSchema>;

interface AddMemberDialogProps {
  projectId: string;
  availableUsers: User[];
}

/** メンバー追加ダイアログ */
export function AddMemberDialog({ projectId, availableUsers }: AddMemberDialogProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const form = useForm<AddMemberFormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(addMemberFormSchema as any),
    defaultValues: {
      userId: "",
      role: "member",
    },
  });

  function onSubmit(values: AddMemberFormValues) {
    startTransition(async () => {
      const result = await addMember({
        projectId,
        userId: values.userId,
        role: values.role,
      });

      if (result.success) {
        form.reset();
        setOpen(false);
        toast.success("メンバーを追加しました");
      } else {
        toast.error(result.error ?? "メンバーの追加に失敗しました");
      }
    });
  }

  const hasAvailableUsers = availableUsers.length > 0;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="size-4" />
          メンバー追加
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>メンバーの追加</DialogTitle>
          <p className="text-sm text-muted-foreground">
            プロジェクトに新しいメンバーを追加します。
          </p>
        </DialogHeader>

        {hasAvailableUsers ? (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* ユーザー選択 */}
              <FormField
                control={form.control}
                name="userId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      ユーザー <span className="text-destructive">*</span>
                    </FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="ユーザーを選択" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {availableUsers.map((user) => (
                          <SelectItem key={user.id} value={user.id}>
                            <div className="flex items-center gap-2">
                              <Avatar className="size-6">
                                <AvatarImage src={user.avatarUrl ?? undefined} />
                                <AvatarFallback className="text-xs">
                                  {user.displayName.slice(0, 2)}
                                </AvatarFallback>
                              </Avatar>
                              <span>{user.displayName}</span>
                              <span className="text-muted-foreground text-xs">
                                ({user.email})
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* 権限選択 */}
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>権限</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {ROLE_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <DialogClose asChild>
                  <Button type="button" variant="outline">
                    キャンセル
                  </Button>
                </DialogClose>
                <Button type="submit" disabled={isPending}>
                  {isPending ? "追加中..." : "追加する"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        ) : (
          <div className="py-6 text-center text-muted-foreground">
            <p>追加可能なユーザーがいません。</p>
            <p className="text-sm mt-2">
              すべてのユーザーが既にプロジェクトに参加しています。
            </p>
            <DialogFooter className="mt-6">
              <DialogClose asChild>
                <Button variant="outline">閉じる</Button>
              </DialogClose>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

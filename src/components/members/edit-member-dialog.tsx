"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Pencil, Save, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UserAvatar } from "@/components/shared/user-avatar";
import { updateMember, removeMember } from "@/actions/member-actions";
import { USER_ROLE_CONFIG } from "@/lib/constants";
import type { RepositoryMemberWithUser, UserRole } from "@/types";

interface EditMemberDialogProps {
  member: RepositoryMemberWithUser;
  repositoryId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** メンバー編集ダイアログ */
export function EditMemberDialog({
  member,
  repositoryId,
  open,
  onOpenChange,
}: EditMemberDialogProps) {
  const [isPending, startTransition] = useTransition();
  const [role, setRole] = useState<string>(member.role);

  const handleSave = () => {
    startTransition(async () => {
      const result = await updateMember({
        repositoryId,
        userId: member.userId,
        role,
      });

      if (result.success) {
        toast.success("メンバー情報を更新しました");
        onOpenChange(false);
      } else {
        toast.error(result.error ?? "更新に失敗しました");
      }
    });
  };

  const handleRemove = () => {
    if (!confirm(`${member.user.displayName} をリポジトリから削除しますか？`)) {
      return;
    }

    startTransition(async () => {
      const result = await removeMember({
        repositoryId,
        userId: member.userId,
      });

      if (result.success) {
        toast.success("メンバーを削除しました");
        onOpenChange(false);
      } else {
        toast.error(result.error ?? "削除に失敗しました");
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[400px]">
        <DialogHeader>
          <DialogTitle>メンバー編集</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* ユーザー情報 */}
          <div className="flex items-center gap-3">
            <UserAvatar user={member.user} size="lg" />
            <div>
              <p className="font-medium">{member.user.displayName}</p>
              <p className="text-sm text-muted-foreground">{member.user.email}</p>
            </div>
          </div>

          {/* ロール選択 */}
          <div className="space-y-2">
            <Label>ロール</Label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.entries(USER_ROLE_CONFIG) as [UserRole, { label: string }][]).map(
                  ([value, config]) => (
                    <SelectItem key={value} value={value}>
                      {config.label}
                    </SelectItem>
                  )
                )}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            type="button"
            variant="destructive"
            onClick={handleRemove}
            disabled={isPending}
            className="rounded-full"
          >
            <Trash2 />
            削除
          </Button>
          <div className="flex-1" />
          <DialogClose asChild>
            <Button type="button" variant="outline" className="rounded-full">
              キャンセル
            </Button>
          </DialogClose>
          <Button
            type="button"
            onClick={handleSave}
            disabled={isPending}
            className="rounded-full"
          >
            <Save />
            {isPending ? "保存中..." : "保存"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

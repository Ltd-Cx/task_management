"use client";

import { useState, useTransition, useRef } from "react";
import { Upload, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { updateUserAvatar } from "@/actions/user-actions";
import { uploadAvatar, deleteAvatar } from "@/lib/supabase";
import type { User } from "@/types";

interface AvatarSettingsProps {
  user: User;
}

/** アバター設定セクション */
export function AvatarSettings({ user }: AvatarSettingsProps) {
  const [isPending, startTransition] = useTransition();
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(user.avatarUrl ?? "");
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleFileSelect() {
    fileInputRef.current?.click();
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);

    try {
      // Supabase Storageにアップロード
      const result = await uploadAvatar(user.id, file);

      if ("error" in result) {
        toast.error(result.error);
        return;
      }

      // プレビューを更新
      setPreviewUrl(result.url);

      // DBに保存
      startTransition(async () => {
        const saveResult = await updateUserAvatar({
          userId: user.id,
          avatarUrl: result.url,
        });

        if (saveResult.success) {
          toast.success("アバターを更新しました");
        } else {
          toast.error(saveResult.error ?? "アバターの保存に失敗しました");
        }
      });
    } catch {
      toast.error("アップロード中にエラーが発生しました");
    } finally {
      setIsUploading(false);
      // ファイル入力をリセット
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  function handleClear() {
    startTransition(async () => {
      // Storageから削除
      const deleteResult = await deleteAvatar(user.id);
      if (!deleteResult.success) {
        toast.error(deleteResult.error ?? "削除に失敗しました");
        return;
      }

      // DBから削除
      const result = await updateUserAvatar({
        userId: user.id,
        avatarUrl: "",
      });

      if (result.success) {
        setPreviewUrl("");
        toast.success("アバターを削除しました");
      } else {
        toast.error(result.error ?? "アバターの削除に失敗しました");
      }
    });
  }

  const isProcessing = isPending || isUploading;

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle>アバター設定</CardTitle>
      </CardHeader>
      <CardContent>
        <Separator className="mb-4" />
        <p className="mb-4 text-sm text-muted-foreground">
          サイドバーに表示されるプロフィール画像を設定できます。
        </p>

        <div className="flex items-start gap-6">
          {/* プレビュー */}
          <div className="flex flex-col items-center gap-2">
            <Avatar className="size-20">
              <AvatarImage src={previewUrl} alt={user.displayName} />
              <AvatarFallback className="bg-primary text-primary-foreground text-xl">
                {user.displayName.slice(0, 2)}
              </AvatarFallback>
            </Avatar>
          </div>

          {/* アップロードフォーム */}
          <div className="flex-1 space-y-4">
            <div className="space-y-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                onChange={handleFileChange}
                className="hidden"
              />

              <div className="flex flex-col gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleFileSelect}
                  disabled={isProcessing}
                  className="w-fit"
                >
                  <Upload className="size-4" />
                  {isUploading ? "アップロード中..." : "画像を選択"}
                </Button>
                <p className="text-xs text-muted-foreground">
                  JPG, PNG, GIF, WEBP形式（最大5MB）
                </p>
              </div>
            </div>

            {previewUrl && (
              <Button
                type="button"
                variant="outline"
                onClick={handleClear}
                disabled={isProcessing}
                className="text-destructive hover:text-destructive"
              >
                <X className="size-4" />
                アバターを削除
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

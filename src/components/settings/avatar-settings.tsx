"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { updateUserAvatar } from "@/actions/user-actions";
import type { User } from "@/types";

interface AvatarSettingsProps {
  user: User;
}

/** アバター設定セクション */
export function AvatarSettings({ user }: AvatarSettingsProps) {
  const [isPending, startTransition] = useTransition();
  const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl ?? "");
  const [previewUrl, setPreviewUrl] = useState(user.avatarUrl ?? "");

  function handlePreview() {
    setPreviewUrl(avatarUrl);
  }

  function handleSave() {
    startTransition(async () => {
      const result = await updateUserAvatar({
        userId: user.id,
        avatarUrl,
      });
      if (result.success) {
        setPreviewUrl(avatarUrl);
      }
    });
  }

  function handleClear() {
    setAvatarUrl("");
    setPreviewUrl("");
    startTransition(async () => {
      await updateUserAvatar({
        userId: user.id,
        avatarUrl: "",
      });
    });
  }

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
            <span className="text-xs text-muted-foreground">プレビュー</span>
          </div>

          {/* 入力フォーム */}
          <div className="flex-1 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="avatarUrl">画像URL</Label>
              <div className="flex gap-2">
                <Input
                  id="avatarUrl"
                  type="url"
                  placeholder="https://example.com/avatar.jpg"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handlePreview}
                  disabled={!avatarUrl}
                >
                  プレビュー
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                外部の画像URLを入力してください（例: Gravatar, GitHub Avatar など）
              </p>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleSave} disabled={isPending}>
                {isPending ? "保存中..." : "保存する"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleClear}
                disabled={isPending || !user.avatarUrl}
              >
                削除
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

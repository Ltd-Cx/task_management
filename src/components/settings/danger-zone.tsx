"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { deleteProject } from "@/actions/project-actions";

interface DangerZoneProps {
  projectId: string;
  projectName: string;
}

/** プロジェクト削除セクション */
export function DangerZone({ projectId, projectName }: DangerZoneProps) {
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    if (!confirm(`「${projectName}」を本当に削除しますか？\nこの操作は元に戻すことができません。`)) {
      return;
    }
    startTransition(async () => {
      await deleteProject(projectId);
    });
  }

  return (
    <Card className="border-destructive shadow-sm">
      <CardHeader>
        <CardTitle className="text-destructive">危険な操作</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <p className="text-sm font-semibold">プロジェクトを削除する</p>
        <p className="text-[13px] text-muted-foreground">
          この操作は元に戻すことができません。すべてのデータが削除されます。
        </p>
        <div className="pt-4">
          <Button
            variant="destructive"
            disabled={isPending}
            onClick={handleDelete}
          >
            <Trash2 className="size-4" />
            {isPending ? "削除中..." : "削除"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

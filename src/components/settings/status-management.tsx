"use client";

import { useState, useTransition } from "react";
import { Plus, GripVertical, Trash2, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { createCustomStatus, deleteCustomStatus, updateCustomStatus } from "@/actions/status-actions";
import type { TaskStatusConfig } from "@/types";

interface StatusManagementProps {
  projectId: string;
  statuses: TaskStatusConfig[];
}

const PRESET_COLORS = [
  "#EF4444", "#F97316", "#EAB308", "#22C55E",
  "#3B82F6", "#6366F1", "#8B5CF6", "#EC4899",
  "#6B7280", "#0EA5E9",
];

/** ステータス管理セクション */
export function StatusManagement({ projectId, statuses }: StatusManagementProps) {
  const [isPending, startTransition] = useTransition();
  const [addOpen, setAddOpen] = useState(false);
  const [editingStatus, setEditingStatus] = useState<TaskStatusConfig | null>(null);

  // 追加フォーム
  const [newKey, setNewKey] = useState("");
  const [newLabel, setNewLabel] = useState("");
  const [newColor, setNewColor] = useState("#3B82F6");

  // 編集フォーム
  const [editLabel, setEditLabel] = useState("");
  const [editColor, setEditColor] = useState("");

  function handleAdd() {
    if (!newKey || !newLabel) return;
    startTransition(async () => {
      const result = await createCustomStatus({
        projectId,
        key: newKey,
        label: newLabel,
        color: newColor,
      });
      if (result.success) {
        setAddOpen(false);
        setNewKey("");
        setNewLabel("");
        setNewColor("#3B82F6");
      }
    });
  }

  function handleEdit() {
    if (!editingStatus || !editLabel) return;
    startTransition(async () => {
      const result = await updateCustomStatus({
        id: editingStatus.id,
        projectId,
        label: editLabel,
        color: editColor,
        displayOrder: editingStatus.displayOrder,
      });
      if (result.success) {
        setEditingStatus(null);
      }
    });
  }

  function handleDelete(id: string) {
    if (!confirm("このステータスを削除しますか？")) return;
    startTransition(async () => {
      await deleteCustomStatus({ id, projectId });
    });
  }

  function openEdit(status: TaskStatusConfig) {
    setEditingStatus(status);
    setEditLabel(status.label);
    setEditColor(status.color);
  }

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>カスタムステータス</CardTitle>
          <Button variant="outline" size="sm" onClick={() => setAddOpen(true)}>
            <Plus className="size-4" />
            追加
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Separator className="mb-4" />
        <p className="mb-4 text-sm text-muted-foreground">
          デフォルトステータス（未対応・処理中・処理済み・完了）に加えて、プロジェクト固有のステータスを追加できます。
        </p>

        {statuses.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">
            カスタムステータスはまだ追加されていません
          </p>
        ) : (
          <div className="space-y-2">
            {statuses.map((status) => (
              <div
                key={status.id}
                className="flex items-center gap-3 rounded-lg border px-3 py-2"
              >
                <GripVertical className="size-4 text-muted-foreground" />
                <span
                  className="size-3 rounded-full"
                  style={{ backgroundColor: status.color }}
                />
                <span className="flex-1 text-sm font-medium">{status.label}</span>
                <span className="text-xs text-muted-foreground">{status.key}</span>
                <Button variant="ghost" size="sm" onClick={() => openEdit(status)}>
                  <Pencil className="size-3.5" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => handleDelete(status.id)}>
                  <Trash2 className="size-3.5 text-destructive" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      {/* 追加ダイアログ */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>ステータスを追加</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>キー（英数字）</Label>
              <Input
                placeholder="review"
                value={newKey}
                onChange={(e) => setNewKey(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
              />
            </div>
            <div className="space-y-2">
              <Label>表示名</Label>
              <Input
                placeholder="レビュー中"
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>カラー</Label>
              <div className="flex flex-wrap gap-2">
                {PRESET_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={`size-7 rounded-full border-2 transition-transform ${newColor === color ? "scale-110 border-foreground" : "border-transparent"}`}
                    style={{ backgroundColor: color }}
                    onClick={() => setNewColor(color)}
                  />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">キャンセル</Button>
            </DialogClose>
            <Button onClick={handleAdd} disabled={isPending || !newKey || !newLabel}>
              {isPending ? "追加中..." : "追加する"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 編集ダイアログ */}
      <Dialog open={!!editingStatus} onOpenChange={(open) => { if (!open) setEditingStatus(null); }}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>ステータスを編集</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>表示名</Label>
              <Input
                value={editLabel}
                onChange={(e) => setEditLabel(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>カラー</Label>
              <div className="flex flex-wrap gap-2">
                {PRESET_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={`size-7 rounded-full border-2 transition-transform ${editColor === color ? "scale-110 border-foreground" : "border-transparent"}`}
                    style={{ backgroundColor: color }}
                    onClick={() => setEditColor(color)}
                  />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">キャンセル</Button>
            </DialogClose>
            <Button onClick={handleEdit} disabled={isPending || !editLabel}>
              {isPending ? "保存中..." : "保存する"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

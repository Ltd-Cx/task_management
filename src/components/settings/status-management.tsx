"use client";

import { useState, useTransition, useEffect, useId } from "react";
import { Plus, GripVertical, Trash2, Pencil } from "lucide-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
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
import { createCustomStatus, deleteCustomStatus, updateCustomStatus, reorderStatuses } from "@/actions/status-actions";
import type { TaskStatusConfig } from "@/types";

interface StatusManagementProps {
  projectId: string;
  statuses: TaskStatusConfig[];
}

/** デフォルトステータスのキー（削除不可） */
const DEFAULT_STATUS_KEYS = ["open", "in_progress", "resolved", "closed"];

/** デフォルトステータスかどうかを判定 */
function isDefaultStatus(key: string): boolean {
  return DEFAULT_STATUS_KEYS.includes(key);
}

const PRESET_COLORS = [
  "#EF4444", "#F97316", "#EAB308", "#22C55E",
  "#3B82F6", "#6366F1", "#8B5CF6", "#EC4899",
  "#6B7280", "#0EA5E9",
];

/** ソート可能なステータスアイテム */
function SortableStatusItem({
  status,
  isDefault,
  onEdit,
  onDelete,
  isPending,
}: {
  status: TaskStatusConfig;
  isDefault: boolean;
  onEdit: (status: TaskStatusConfig) => void;
  onDelete: (id: string) => void;
  isPending: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: status.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-2 rounded-lg border bg-card px-3 py-2 sm:gap-3"
    >
      <button
        type="button"
        className="cursor-grab touch-none active:cursor-grabbing"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="size-4 text-muted-foreground" />
      </button>
      <span
        className="size-3 shrink-0 rounded-full"
        style={{ backgroundColor: status.color }}
      />
      <div className="flex min-w-0 flex-1 flex-col sm:flex-row sm:items-center sm:gap-2">
        <span className="truncate text-sm font-medium">{status.label}</span>
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-muted-foreground">{status.key}</span>
          {isDefault && (
            <span className="rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
              デフォルト
            </span>
          )}
        </div>
      </div>
      <div className="flex shrink-0 items-center">
        <Button variant="ghost" size="sm" onClick={() => onEdit(status)} disabled={isPending}>
          <Pencil className="size-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onDelete(status.id)}
          disabled={isDefault || isPending}
          title={isDefault ? "デフォルトステータスは削除できません" : "削除"}
        >
          <Trash2 className={`size-3.5 ${isDefault ? "text-muted-foreground" : "text-destructive"}`} />
        </Button>
      </div>
    </div>
  );
}

/** ステータス管理セクション */
export function StatusManagement({ projectId, statuses }: StatusManagementProps) {
  const [isPending, startTransition] = useTransition();
  const [addOpen, setAddOpen] = useState(false);
  const [editingStatus, setEditingStatus] = useState<TaskStatusConfig | null>(null);
  const [localStatuses, setLocalStatuses] = useState<TaskStatusConfig[]>(statuses);
  const [isMounted, setIsMounted] = useState(false);
  const dndContextId = useId();

  // クライアントサイドでのみDnDをレンダリング（ハイドレーションエラー回避）
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // 追加フォーム
  const [newKey, setNewKey] = useState("");
  const [newLabel, setNewLabel] = useState("");
  const [newColor, setNewColor] = useState("#3B82F6");

  // 編集フォーム
  const [editLabel, setEditLabel] = useState("");
  const [editColor, setEditColor] = useState("");

  // DnD センサー設定
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // props の statuses が変更されたら localStatuses も更新
  if (statuses !== localStatuses && statuses.length !== localStatuses.length) {
    setLocalStatuses(statuses);
  }

  /** ドラッグ終了時のハンドラ */
  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = localStatuses.findIndex((s) => s.id === active.id);
    const newIndex = localStatuses.findIndex((s) => s.id === over.id);

    const newOrder = arrayMove(localStatuses, oldIndex, newIndex);
    setLocalStatuses(newOrder);

    // displayOrder を更新
    startTransition(async () => {
      await reorderStatuses({
        projectId,
        items: newOrder.map((s, index) => ({ id: s.id, displayOrder: index })),
      });
    });
  }

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
          <CardTitle>ステータス</CardTitle>
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

        {localStatuses.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">
            ステータスはまだ追加されていません
          </p>
        ) : !isMounted ? (
          // SSR時は静的なリストを表示
          <div className="space-y-2">
            {localStatuses.map((status) => (
              <div
                key={status.id}
                className="flex items-center gap-2 rounded-lg border bg-card px-3 py-2 sm:gap-3"
              >
                <GripVertical className="size-4 text-muted-foreground" />
                <span
                  className="size-3 shrink-0 rounded-full"
                  style={{ backgroundColor: status.color }}
                />
                <div className="flex min-w-0 flex-1 flex-col sm:flex-row sm:items-center sm:gap-2">
                  <span className="truncate text-sm font-medium">{status.label}</span>
                  <span className="text-xs text-muted-foreground">{status.key}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <DndContext
            id={dndContextId}
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={localStatuses.map((s) => s.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-2">
                {localStatuses.map((status) => (
                  <SortableStatusItem
                    key={status.id}
                    status={status}
                    isDefault={isDefaultStatus(status.key)}
                    onEdit={openEdit}
                    onDelete={handleDelete}
                    isPending={isPending}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
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

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
import { createCategory, deleteCategory, updateCategory, reorderCategories } from "@/actions/category-actions";
import type { Category } from "@/types";

interface CategoryManagementProps {
  projectId: string;
  categories: Category[];
}

const PRESET_COLORS = [
  "#EF4444", "#F97316", "#EAB308", "#22C55E",
  "#3B82F6", "#6366F1", "#8B5CF6", "#EC4899",
  "#6B7280", "#0EA5E9",
];

/** ソート可能なカテゴリーアイテム */
function SortableCategoryItem({
  category,
  onEdit,
  onDelete,
  isPending,
}: {
  category: Category;
  onEdit: (category: Category) => void;
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
  } = useSortable({ id: category.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 rounded-lg border bg-card px-3 py-2"
    >
      <button
        type="button"
        className="cursor-grab touch-none active:cursor-grabbing"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="size-4 text-muted-foreground" />
      </button>
      {category.color && (
        <span
          className="size-3 rounded-full"
          style={{ backgroundColor: category.color }}
        />
      )}
      <span className="flex-1 text-sm font-medium">{category.name}</span>
      <Button variant="ghost" size="sm" onClick={() => onEdit(category)} disabled={isPending}>
        <Pencil className="size-3.5" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onDelete(category.id)}
        disabled={isPending}
      >
        <Trash2 className="size-3.5 text-destructive" />
      </Button>
    </div>
  );
}

/** カテゴリー管理セクション */
export function CategoryManagement({ projectId, categories: initialCategories }: CategoryManagementProps) {
  const [isPending, startTransition] = useTransition();
  const [addOpen, setAddOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [localCategories, setLocalCategories] = useState<Category[]>(initialCategories);
  const [isMounted, setIsMounted] = useState(false);
  const dndContextId = useId();

  // クライアントサイドでのみDnDをレンダリング（ハイドレーションエラー回避）
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // 追加フォーム
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState("#3B82F6");

  // 編集フォーム
  const [editName, setEditName] = useState("");
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

  // props の categories が変更されたら localCategories も更新
  useEffect(() => {
    setLocalCategories(initialCategories);
  }, [initialCategories]);

  /** ドラッグ終了時のハンドラ */
  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = localCategories.findIndex((c) => c.id === active.id);
    const newIndex = localCategories.findIndex((c) => c.id === over.id);

    const newOrder = arrayMove(localCategories, oldIndex, newIndex);
    setLocalCategories(newOrder);

    // displayOrder を更新
    startTransition(async () => {
      await reorderCategories({
        projectId,
        items: newOrder.map((c, index) => ({ id: c.id, displayOrder: index })),
      });
    });
  }

  function handleAdd() {
    if (!newName) return;
    startTransition(async () => {
      const result = await createCategory({
        projectId,
        name: newName,
        color: newColor,
      });
      if (result.success) {
        setAddOpen(false);
        setNewName("");
        setNewColor("#3B82F6");
      }
    });
  }

  function handleEdit() {
    if (!editingCategory || !editName) return;
    startTransition(async () => {
      const result = await updateCategory({
        id: editingCategory.id,
        projectId,
        name: editName,
        color: editColor,
      });
      if (result.success) {
        setEditingCategory(null);
      }
    });
  }

  function handleDelete(id: string) {
    if (!confirm("このカテゴリーを削除しますか？")) return;
    startTransition(async () => {
      await deleteCategory({ id, projectId });
    });
  }

  function openEdit(category: Category) {
    setEditingCategory(category);
    setEditName(category.name);
    setEditColor(category.color ?? "#6B7280");
  }

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>カテゴリー</CardTitle>
          <Button variant="outline" size="sm" onClick={() => setAddOpen(true)}>
            <Plus className="size-4" />
            追加
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Separator className="mb-4" />
        <p className="mb-4 text-sm text-muted-foreground">
          課題を分類するためのカテゴリーを管理します。ドラッグで並び替えができます。
        </p>

        {localCategories.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">
            カテゴリーはまだ追加されていません
          </p>
        ) : !isMounted ? (
          // SSR時は静的なリストを表示
          <div className="space-y-2">
            {localCategories.map((category) => (
              <div
                key={category.id}
                className="flex items-center gap-3 rounded-lg border bg-card px-3 py-2"
              >
                <GripVertical className="size-4 text-muted-foreground" />
                {category.color && (
                  <span
                    className="size-3 rounded-full"
                    style={{ backgroundColor: category.color }}
                  />
                )}
                <span className="flex-1 text-sm font-medium">{category.name}</span>
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
              items={localCategories.map((c) => c.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-2">
                {localCategories.map((category) => (
                  <SortableCategoryItem
                    key={category.id}
                    category={category}
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
            <DialogTitle>カテゴリーを追加</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>カテゴリー名</Label>
              <Input
                placeholder="バグ"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
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
            <Button onClick={handleAdd} disabled={isPending || !newName}>
              {isPending ? "追加中..." : "追加する"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 編集ダイアログ */}
      <Dialog open={!!editingCategory} onOpenChange={(open) => { if (!open) setEditingCategory(null); }}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>カテゴリーを編集</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>カテゴリー名</Label>
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
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
            <Button onClick={handleEdit} disabled={isPending || !editName}>
              {isPending ? "保存中..." : "保存する"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

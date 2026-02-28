"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import { useEffect, useCallback, useState, useRef } from "react";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Link as LinkIcon,
  Unlink,
  Undo,
  Redo,
  ImageIcon,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { uploadEditorImage } from "@/lib/supabase";

interface TipTapEditorProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

/** ツールバーボタン */
function ToolbarButton({
  onClick,
  isActive = false,
  disabled = false,
  children,
  title,
}: {
  onClick: () => void;
  isActive?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
  title?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={cn(
        "rounded p-1.5 transition-colors hover:bg-muted disabled:opacity-50",
        isActive && "bg-muted text-primary"
      )}
    >
      {children}
    </button>
  );
}

/** リンク挿入ポップオーバー */
function LinkPopover({
  onSubmit,
  onRemove,
  hasLink,
  disabled,
}: {
  onSubmit: (url: string) => void;
  onRemove: () => void;
  hasLink: boolean;
  disabled?: boolean;
}) {
  const [url, setUrl] = useState("");
  const [open, setOpen] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (url) {
      onSubmit(url);
      setUrl("");
      setOpen(false);
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          title={hasLink ? "リンクを編集" : "リンクを追加"}
          className={cn(
            "rounded p-1.5 transition-colors hover:bg-muted disabled:opacity-50",
            hasLink && "bg-muted text-primary"
          )}
        >
          <LinkIcon className="size-4" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="start">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            type="url"
            placeholder="https://example.com"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="flex-1"
          />
          <Button type="submit" size="sm">
            追加
          </Button>
        </form>
        {hasLink && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              onRemove();
              setOpen(false);
            }}
            className="mt-2 w-full text-destructive hover:text-destructive"
          >
            <Unlink className="mr-1 size-3" />
            リンクを削除
          </Button>
        )}
      </PopoverContent>
    </Popover>
  );
}

/** TipTapエディタ本体 */
export function TipTapEditor({
  value = "",
  onChange,
  placeholder = "内容を入力...",
  className,
  disabled = false,
}: TipTapEditorProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-primary underline",
        },
      }),
      Image.configure({
        inline: false,
        allowBase64: false,
        HTMLAttributes: {
          class: "max-w-full h-auto rounded-md",
        },
      }),
    ],
    content: value,
    editable: !disabled,
    onUpdate: ({ editor }) => {
      onChange?.(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: cn(
          "prose prose-sm max-w-none focus:outline-none min-h-[120px] px-3 py-2",
          "prose-headings:font-semibold prose-headings:mt-4 prose-headings:mb-2",
          "prose-p:my-1 prose-ul:my-1 prose-ol:my-1",
          "prose-a:text-primary prose-a:underline",
          "prose-img:my-2 prose-img:rounded-md"
        ),
      },
    },
    immediatelyRender: false,
  });

  // クライアントサイドでのみレンダリング（ハイドレーションエラー回避）
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // 外部からの値変更に対応
  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value);
    }
  }, [editor, value]);

  const setLink = useCallback(
    (url: string) => {
      if (!editor) return;
      editor
        .chain()
        .focus()
        .extendMarkRange("link")
        .setLink({ href: url })
        .run();
    },
    [editor]
  );

  const removeLink = useCallback(() => {
    if (!editor) return;
    editor.chain().focus().unsetLink().run();
  }, [editor]);

  // 画像アップロード処理
  const handleImageUpload = useCallback(
    async (file: File) => {
      if (!editor) return;

      setIsUploading(true);
      try {
        const result = await uploadEditorImage(file);

        if ("error" in result) {
          toast.error(result.error);
          return;
        }

        // 画像を挿入
        editor.chain().focus().setImage({ src: result.url }).run();
        toast.success("画像をアップロードしました");
      } catch {
        toast.error("画像のアップロードに失敗しました");
      } finally {
        setIsUploading(false);
      }
    },
    [editor]
  );

  // ファイル選択ハンドラ
  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        handleImageUpload(file);
      }
      // ファイル入力をリセット
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    },
    [handleImageUpload]
  );

  // 画像ボタンクリック
  const handleImageButtonClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  if (!isMounted) {
    return (
      <div
        className={cn(
          "rounded-md border border-input bg-background",
          className
        )}
      >
        <div className="flex flex-wrap gap-0.5 border-b border-input bg-muted/50 p-1">
          <div className="h-7 w-full" />
        </div>
        <div className="min-h-[120px] px-3 py-2 text-muted-foreground">
          {placeholder}
        </div>
      </div>
    );
  }

  if (!editor) {
    return null;
  }

  return (
    <div
      className={cn(
        "rounded-md border-2 bg-background ",
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
    >
      {/* 隠しファイル入力 */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* ツールバー */}
      <div className="flex flex-wrap gap-0.5 border-b border-input bg-muted/50 p-1">
        {/* テキストフォーマット */}
        <div className="flex items-center gap-0.5 border-r border-input pr-1">
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBold().run()}
            isActive={editor.isActive("bold")}
            disabled={disabled}
            title="太字 (Ctrl+B)"
          >
            <Bold className="size-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleItalic().run()}
            isActive={editor.isActive("italic")}
            disabled={disabled}
            title="斜体 (Ctrl+I)"
          >
            <Italic className="size-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            isActive={editor.isActive("underline")}
            disabled={disabled}
            title="下線 (Ctrl+U)"
          >
            <UnderlineIcon className="size-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleStrike().run()}
            isActive={editor.isActive("strike")}
            disabled={disabled}
            title="取り消し線"
          >
            <Strikethrough className="size-4" />
          </ToolbarButton>
        </div>

        {/* 見出し */}
        <div className="flex items-center gap-0.5 border-r border-input pr-1">
          <ToolbarButton
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 1 }).run()
            }
            isActive={editor.isActive("heading", { level: 1 })}
            disabled={disabled}
            title="見出し1"
          >
            <Heading1 className="size-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 2 }).run()
            }
            isActive={editor.isActive("heading", { level: 2 })}
            disabled={disabled}
            title="見出し2"
          >
            <Heading2 className="size-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 3 }).run()
            }
            isActive={editor.isActive("heading", { level: 3 })}
            disabled={disabled}
            title="見出し3"
          >
            <Heading3 className="size-4" />
          </ToolbarButton>
        </div>

        {/* リスト */}
        <div className="flex items-center gap-0.5 border-r border-input pr-1">
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            isActive={editor.isActive("bulletList")}
            disabled={disabled}
            title="箇条書きリスト"
          >
            <List className="size-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            isActive={editor.isActive("orderedList")}
            disabled={disabled}
            title="番号付きリスト"
          >
            <ListOrdered className="size-4" />
          </ToolbarButton>
        </div>

        {/* リンク・画像 */}
        <div className="flex items-center gap-0.5 border-r border-input pr-1">
          <LinkPopover
            onSubmit={setLink}
            onRemove={removeLink}
            hasLink={editor.isActive("link")}
            disabled={disabled}
          />
          <ToolbarButton
            onClick={handleImageButtonClick}
            disabled={disabled || isUploading}
            title="画像を挿入"
          >
            {isUploading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <ImageIcon className="size-4" />
            )}
          </ToolbarButton>
        </div>

        {/* Undo/Redo */}
        <div className="flex items-center gap-0.5">
          <ToolbarButton
            onClick={() => editor.chain().focus().undo().run()}
            disabled={disabled || !editor.can().undo()}
            title="元に戻す (Ctrl+Z)"
          >
            <Undo className="size-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().redo().run()}
            disabled={disabled || !editor.can().redo()}
            title="やり直す (Ctrl+Y)"
          >
            <Redo className="size-4" />
          </ToolbarButton>
        </div>
      </div>

      {/* エディタ本体 */}
      <EditorContent editor={editor} />
    </div>
  );
}

"use client";

import { useTranslations } from "next-intl";
import { type Editor } from "@tiptap/react";
import { useEffect, useRef, useState } from "react";
import {
  Undo2, Redo2, Bold, Italic, Underline as UnderlineIcon, Strikethrough,
  Highlighter, Heading1, Heading2, Heading3, List, ListOrdered,
  AlignLeft, AlignCenter, AlignRight, Code, Link2, ImageIcon, Plus,
  ListTodo, Quote, Minus, Table, ChevronDown,
  ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Trash2, PanelTop,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { CALLOUT_TYPES } from "./callout-extension";

function Btn({
  onClick, active, disabled, title, children,
}: {
  onClick: () => void; active?: boolean; disabled?: boolean; title: string; children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "size-8 rounded-md flex items-center justify-center transition-colors shrink-0",
        "text-muted-foreground hover:text-foreground hover:bg-muted",
        active && "bg-muted text-foreground",
        disabled && "opacity-40 pointer-events-none"
      )}
    >
      {children}
    </button>
  );
}

const Div = () => <Separator orientation="vertical" className="h-5 mx-1" />;

export default function EditorToolbar({ editor }: { editor: Editor | null }) {
  const t = useTranslations("LessonEditorToolbar");
  const fileRef = useRef<HTMLInputElement>(null);
  // Tiptap v3 useEditor har tranzaksiyada qayta render qilmaydi — toolbar
  // active/disabled holatlari va jadval menyusi yangilanishi uchun obuna.
  const [, force] = useState(0);
  useEffect(() => {
    if (!editor) return;
    const update = () => force((n) => n + 1);
    editor.on("transaction", update);
    return () => { editor.off("transaction", update); };
  }, [editor]);
  if (!editor) return null;

  /** Callout qoʻshish — ANDOZA: sarlavha boshlangʻich yorliq bilan, foydalanuvchi
   *  oʻzgartiradi. Kursor callout ichida boʻlsa, ichma-ich emas, undan keyin. */
  const insertCallout = (type: string, label: string) => {
    const { $to } = editor.state.selection;
    const content = {
      type: "callout",
      attrs: { type },
      content: [
        { type: "calloutTitle", content: [{ type: "text", text: label }] },
        { type: "paragraph" },
      ],
    };
    for (let d = $to.depth; d > 0; d--) {
      if ($to.node(d).type.name === "callout") {
        editor.chain().focus().insertContentAt($to.after(d), content).run();
        return;
      }
    }
    editor.chain().focus().insertContent(content).run();
  };

  const addLink = () => {
    const prev = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt(t("linkPrompt"), prev ?? "https://");
    if (url === null) return;
    if (url === "") { editor.chain().focus().extendMarkRange("link").unsetLink().run(); return; }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  };

  const onPickImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => editor.chain().focus().setImage({ src: reader.result as string }).run();
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  return (
    <div className="flex items-center gap-0.5 flex-wrap">
      <Btn title={t("undo")} onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()}><Undo2 className="size-4" /></Btn>
      <Btn title={t("redo")} onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()}><Redo2 className="size-4" /></Btn>
      <Div />
      <Btn title={t("bold")} active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()}><Bold className="size-4" /></Btn>
      <Btn title={t("italic")} active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()}><Italic className="size-4" /></Btn>
      <Btn title={t("underline")} active={editor.isActive("underline")} onClick={() => editor.chain().focus().toggleUnderline().run()}><UnderlineIcon className="size-4" /></Btn>
      <Btn title={t("strikethrough")} active={editor.isActive("strike")} onClick={() => editor.chain().focus().toggleStrike().run()}><Strikethrough className="size-4" /></Btn>
      <Btn title={t("highlight")} active={editor.isActive("highlight")} onClick={() => editor.chain().focus().toggleHighlight().run()}><Highlighter className="size-4" /></Btn>
      <Div />
      <Btn title={t("heading1")} active={editor.isActive("heading", { level: 1 })} onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}><Heading1 className="size-4" /></Btn>
      <Btn title={t("heading2")} active={editor.isActive("heading", { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}><Heading2 className="size-4" /></Btn>
      <Btn title={t("heading3")} active={editor.isActive("heading", { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}><Heading3 className="size-4" /></Btn>
      <Div />
      <Btn title={t("bulletList")} active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()}><List className="size-4" /></Btn>
      <Btn title={t("orderedList")} active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()}><ListOrdered className="size-4" /></Btn>
      <Btn title={t("taskList")} active={editor.isActive("taskList")} onClick={() => editor.chain().focus().toggleTaskList().run()}><ListTodo className="size-4" /></Btn>
      <Div />
      <Btn title={t("alignLeft")} active={editor.isActive({ textAlign: "left" })} onClick={() => editor.chain().focus().setTextAlign("left").run()}><AlignLeft className="size-4" /></Btn>
      <Btn title={t("alignCenter")} active={editor.isActive({ textAlign: "center" })} onClick={() => editor.chain().focus().setTextAlign("center").run()}><AlignCenter className="size-4" /></Btn>
      <Btn title={t("alignRight")} active={editor.isActive({ textAlign: "right" })} onClick={() => editor.chain().focus().setTextAlign("right").run()}><AlignRight className="size-4" /></Btn>
      <Div />
      <Btn title={t("blockquote")} active={editor.isActive("blockquote")} onClick={() => editor.chain().focus().toggleBlockquote().run()}><Quote className="size-4" /></Btn>
      <Btn title={t("codeBlock")} active={editor.isActive("codeBlock")} onClick={() => editor.chain().focus().toggleCodeBlock().run()}><Code className="size-4" /></Btn>
      <Btn title={t("horizontalRule")} onClick={() => editor.chain().focus().setHorizontalRule().run()}><Minus className="size-4" /></Btn>
      {editor.isActive("table") ? (
        /* Jadval ichida — amallar menyusi (qator/ustun qoʻshish/oʻchirish) */
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button type="button" title={t("tableActions")} className="h-8 px-1.5 rounded-md flex items-center gap-0.5 transition-colors shrink-0 bg-muted text-foreground hover:bg-muted/70">
              <Table className="size-4" /><ChevronDown className="size-3 opacity-60" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-52">
            <DropdownMenuItem onSelect={() => editor.chain().focus().addRowBefore().run()} className="gap-2.5"><ArrowUp className="size-4 text-muted-foreground" /> {t("table.rowAbove")}</DropdownMenuItem>
            <DropdownMenuItem onSelect={() => editor.chain().focus().addRowAfter().run()} className="gap-2.5"><ArrowDown className="size-4 text-muted-foreground" /> {t("table.rowBelow")}</DropdownMenuItem>
            <DropdownMenuItem onSelect={() => editor.chain().focus().addColumnBefore().run()} className="gap-2.5"><ArrowLeft className="size-4 text-muted-foreground" /> {t("table.columnLeft")}</DropdownMenuItem>
            <DropdownMenuItem onSelect={() => editor.chain().focus().addColumnAfter().run()} className="gap-2.5"><ArrowRight className="size-4 text-muted-foreground" /> {t("table.columnRight")}</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => editor.chain().focus().toggleHeaderRow().run()} className="gap-2.5"><PanelTop className="size-4 text-muted-foreground" /> {t("table.headerRow")}</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => editor.chain().focus().deleteRow().run()} className="gap-2.5"><Trash2 className="size-4 text-muted-foreground" /> {t("table.deleteRow")}</DropdownMenuItem>
            <DropdownMenuItem onSelect={() => editor.chain().focus().deleteColumn().run()} className="gap-2.5"><Trash2 className="size-4 text-muted-foreground" /> {t("table.deleteColumn")}</DropdownMenuItem>
            <DropdownMenuItem onSelect={() => editor.chain().focus().deleteTable().run()} className="gap-2.5 text-destructive focus:text-destructive"><Trash2 className="size-4" /> {t("table.deleteTable")}</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        <Btn title={t("insertTable")} onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}><Table className="size-4" /></Btn>
      )}
      <Btn title={t("link")} active={editor.isActive("link")} onClick={addLink}><Link2 className="size-4" /></Btn>
      <Btn title={t("insertImage")} onClick={() => fileRef.current?.click()}><ImageIcon className="size-4" /></Btn>
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onPickImage} />
      <Div />
      {/* "+" — callout qoʻshish menyusi (Obsidian uslubi, lucide ikonlar) */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            title={t("insertCallout")}
            className="size-8 rounded-md flex items-center justify-center transition-colors shrink-0 text-muted-foreground hover:text-foreground hover:bg-muted"
          >
            <Plus className="size-4" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-52 max-h-[320px] overflow-y-auto">
          {CALLOUT_TYPES.map(({ type, label, icon: Icon, color }) => (
            <DropdownMenuItem
              key={type}
              onSelect={() => insertCallout(type, label)}
              className="gap-2.5"
            >
              <Icon className="size-4 shrink-0" style={{ color }} />
              {label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

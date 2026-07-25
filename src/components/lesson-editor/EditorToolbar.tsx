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
  SubscriptIcon, SuperscriptIcon, Palette, ScissorsLineDashed, Ban,
  Check, Pilcrow,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { compressImageFile } from "@/lib/image-compress";
import { CALLOUT_TYPES } from "./callout-extension";

export function Btn({
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

export const Div = () => <Separator orientation="vertical" className="h-5" />;

/* Matn rangi — belgilangan palitra + tozalash; rasmga bogʻliq boʻlmagan
   ranglar (OKLCH) ishlatiladi, dizayn tokenlariga mos. */
export const TEXT_COLORS = [
  "oklch(0.55 0.22 25)", "oklch(0.6 0.2 45)", "oklch(0.65 0.16 95)",
  "oklch(0.6 0.15 145)", "oklch(0.55 0.15 220)", "oklch(0.5 0.2 280)",
  "oklch(0.35 0 0)",
];

const HEADING_LEVELS = [1, 2, 3] as const;
const HEADING_ICONS = { 1: Heading1, 2: Heading2, 3: Heading3 } as const;

const LIST_TYPES = [
  { name: "bulletList", icon: List, toggle: (e: Editor) => e.chain().focus().toggleBulletList().run() },
  { name: "orderedList", icon: ListOrdered, toggle: (e: Editor) => e.chain().focus().toggleOrderedList().run() },
  { name: "taskList", icon: ListTodo, toggle: (e: Editor) => e.chain().focus().toggleTaskList().run() },
] as const;

const ALIGN_TYPES = [
  { value: "left", label: "alignLeft", icon: AlignLeft },
  { value: "center", label: "alignCenter", icon: AlignCenter },
  { value: "right", label: "alignRight", icon: AlignRight },
] as const;

export default function EditorToolbar({ editor }: { editor: Editor | null }) {
  const t = useTranslations("LessonEditorToolbar");
  const fileRef = useRef<HTMLInputElement>(null);
  const [linkOpen, setLinkOpen] = useState(false);
  const [linkValue, setLinkValue] = useState("");
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

  const openLinkPopover = () => {
    setLinkValue((editor.getAttributes("link").href as string | undefined) ?? "");
    setLinkOpen(true);
  };
  const applyLink = () => {
    const url = linkValue.trim();
    if (!url) { editor.chain().focus().extendMarkRange("link").unsetLink().run(); }
    else { editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run(); }
    setLinkOpen(false);
  };

  const onPickImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const src = await compressImageFile(file);
    editor.chain().focus().setImage({ src }).run();
  };

  const activeHeading = HEADING_LEVELS.find((lvl) => editor.isActive("heading", { level: lvl }));
  const HeadingTrigger = activeHeading ? HEADING_ICONS[activeHeading] : Pilcrow;
  const activeList = LIST_TYPES.find((l) => editor.isActive(l.name));
  const ListTrigger = activeList?.icon ?? List;
  const activeAlign = ALIGN_TYPES.find((a) => editor.isActive({ textAlign: a.value })) ?? ALIGN_TYPES[0];
  const AlignTrigger = activeAlign.icon;

  return (
    <div className="flex items-center gap-3 flex-wrap">
      {/* Tarix */}
      <div className="flex items-center gap-0.5">
        <Btn title={t("undo")} onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()}><Undo2 className="size-4" /></Btn>
        <Btn title={t("redo")} onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()}><Redo2 className="size-4" /></Btn>
      </div>
      <Div />

      {/* Struktura: sarlavha, roʻyxat, blok elementlari */}
      <div className="flex items-center gap-0.5">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button type="button" title={t("heading1")}
            className="h-8 px-1.5 rounded-md flex items-center gap-0.5 shrink-0 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors data-[state=open]:bg-muted data-[state=open]:text-foreground">
            <HeadingTrigger className="size-4" />
            <ChevronDown className="size-3 opacity-60" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-40">
          <DropdownMenuItem onSelect={() => editor.chain().focus().setParagraph().run()} className="gap-2.5">
            <Pilcrow className="size-4 text-muted-foreground" />
            <span className="flex-1">{t("paragraph")}</span>
            {!activeHeading && <Check className="size-4 shrink-0" />}
          </DropdownMenuItem>
          {HEADING_LEVELS.map((lvl) => {
            const Icon = HEADING_ICONS[lvl];
            return (
              <DropdownMenuItem key={lvl} onSelect={() => editor.chain().focus().toggleHeading({ level: lvl }).run()} className="gap-2.5">
                <Icon className="size-4 text-muted-foreground" />
                <span className="flex-1">{t(`heading${lvl}` as "heading1" | "heading2" | "heading3")}</span>
                {activeHeading === lvl && <Check className="size-4 shrink-0" />}
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button type="button" title={t("bulletList")}
            className="h-8 px-1.5 rounded-md flex items-center gap-0.5 shrink-0 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors data-[state=open]:bg-muted data-[state=open]:text-foreground">
            <ListTrigger className="size-4" />
            <ChevronDown className="size-3 opacity-60" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-44">
          {LIST_TYPES.map(({ name, icon: Icon, toggle }) => (
            <DropdownMenuItem key={name} onSelect={() => toggle(editor)} className="gap-2.5">
              <Icon className="size-4 text-muted-foreground" />
              <span className="flex-1">{t(name)}</span>
              {editor.isActive(name) && <Check className="size-4 shrink-0" />}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
      <Btn title={t("blockquote")} active={editor.isActive("blockquote")} onClick={() => editor.chain().focus().toggleBlockquote().run()}><Quote className="size-4" /></Btn>
      <Btn title={t("codeBlock")} active={editor.isActive("codeBlock")} onClick={() => editor.chain().focus().toggleCodeBlock().run()}><Code className="size-4" /></Btn>
      <Btn title={t("horizontalRule")} onClick={() => editor.chain().focus().setHorizontalRule().run()}><Minus className="size-4" /></Btn>
      <Btn title={t("pageBreak")} onClick={() => editor.chain().focus().insertContent({ type: "pageBreak" }).run()}><ScissorsLineDashed className="size-4" /></Btn>
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
      </div>
      <Div />

      {/* Formatlash: matn belgilari */}
      <div className="flex items-center gap-0.5">
      <Btn title={t("bold")} active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()}><Bold className="size-4" /></Btn>
      <Btn title={t("italic")} active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()}><Italic className="size-4" /></Btn>
      <Btn title={t("underline")} active={editor.isActive("underline")} onClick={() => editor.chain().focus().toggleUnderline().run()}><UnderlineIcon className="size-4" /></Btn>
      <Btn title={t("strikethrough")} active={editor.isActive("strike")} onClick={() => editor.chain().focus().toggleStrike().run()}><Strikethrough className="size-4" /></Btn>
      <Btn title={t("highlight")} active={editor.isActive("highlight")} onClick={() => editor.chain().focus().toggleHighlight().run()}><Highlighter className="size-4" /></Btn>
      <Btn title={t("superscript")} active={editor.isActive("superscript")} onClick={() => editor.chain().focus().toggleSuperscript().run()}><SuperscriptIcon className="size-4" /></Btn>
      <Btn title={t("subscript")} active={editor.isActive("subscript")} onClick={() => editor.chain().focus().toggleSubscript().run()}><SubscriptIcon className="size-4" /></Btn>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <span>
            <Btn title={t("textColor")} active={!!editor.getAttributes("textStyle").color} onClick={() => {}}>
              <Palette className="size-4" style={editor.getAttributes("textStyle").color ? { color: editor.getAttributes("textStyle").color } : undefined} />
            </Btn>
          </span>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-auto p-2">
          <div className="flex items-center gap-1.5">
            <button type="button" title={t("clearColor")} onClick={() => editor.chain().focus().unsetColor().run()}
              className="size-6 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:text-foreground shrink-0">
              <Ban className="size-3.5" />
            </button>
            {TEXT_COLORS.map((c) => (
              <button key={c} type="button" title={c} onClick={() => editor.chain().focus().setColor(c).run()}
                className="size-6 rounded-full shrink-0 ring-offset-2 ring-offset-popover transition-shadow"
                style={{ backgroundColor: c, boxShadow: editor.getAttributes("textStyle").color === c ? `0 0 0 2px ${c}` : undefined }}
              />
            ))}
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
      </div>
      <Div />

      {/* Tekislash */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button type="button" title={t("alignLeft")}
            className="h-8 px-1.5 rounded-md flex items-center gap-0.5 shrink-0 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors data-[state=open]:bg-muted data-[state=open]:text-foreground">
            <AlignTrigger className="size-4" />
            <ChevronDown className="size-3 opacity-60" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-40">
          {ALIGN_TYPES.map(({ value, label, icon: Icon }) => (
            <DropdownMenuItem key={value} onSelect={() => editor.chain().focus().setTextAlign(value).run()} className="gap-2.5">
              <Icon className="size-4 text-muted-foreground" />
              <span className="flex-1">{t(label)}</span>
              {editor.isActive({ textAlign: value }) && <Check className="size-4 shrink-0" />}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
      <Div />

      {/* Qoʻshish: havola, rasm, callout */}
      <div className="flex items-center gap-0.5">
      <Popover open={linkOpen} onOpenChange={setLinkOpen}>
        <PopoverTrigger asChild>
          <span><Btn title={t("link")} active={editor.isActive("link")} onClick={openLinkPopover}><Link2 className="size-4" /></Btn></span>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-72 p-3">
          <div className="flex items-center gap-2">
            <Input
              autoFocus
              value={linkValue}
              onChange={(e) => setLinkValue(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); applyLink(); } }}
              placeholder="https://"
              className="h-8"
            />
            <Button size="sm" onClick={applyLink}>{t("linkApply")}</Button>
          </div>
        </PopoverContent>
      </Popover>
      <Btn title={t("insertImage")} onClick={() => fileRef.current?.click()}><ImageIcon className="size-4" /></Btn>
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onPickImage} />
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
    </div>
  );
}

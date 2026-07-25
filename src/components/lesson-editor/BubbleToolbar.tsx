"use client";

import { useTranslations } from "next-intl";
import { type Editor } from "@tiptap/react";
import {
  Bold, Italic, Underline as UnderlineIcon, Strikethrough, Highlighter,
  SubscriptIcon, SuperscriptIcon, Link2, ChevronDown, Check,
  Pilcrow, Heading1, Heading2, Heading3, List, ListOrdered, ListTodo,
} from "lucide-react";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Btn, Div, TEXT_COLORS } from "./EditorToolbar";

const HEADING_LEVELS = [1, 2, 3] as const;
const HEADING_ICONS = { 1: Heading1, 2: Heading2, 3: Heading3 } as const;

const LIST_TYPES = [
  { name: "bulletList", icon: List, toggle: (e: Editor) => e.chain().focus().toggleBulletList().run() },
  { name: "orderedList", icon: ListOrdered, toggle: (e: Editor) => e.chain().focus().toggleOrderedList().run() },
  { name: "taskList", icon: ListTodo, toggle: (e: Editor) => e.chain().focus().toggleTaskList().run() },
] as const;

/** Matn tanlanganda chiqadigan qisqa formatlash paneli (Notion/Medium uslubi). */
export default function BubbleToolbar({ editor }: { editor: Editor }) {
  const t = useTranslations("LessonEditorToolbar");

  const activeHeading = HEADING_LEVELS.find((lvl) => editor.isActive("heading", { level: lvl }));
  const HeadingTrigger = activeHeading ? HEADING_ICONS[activeHeading] : Pilcrow;
  const activeList = LIST_TYPES.find((l) => editor.isActive(l.name));
  const ListTrigger = activeList?.icon ?? List;

  return (
    <div className="flex items-center gap-0.5 rounded-lg border border-border bg-popover p-1 shadow-md">
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
      <Div />
      <Btn title={t("bold")} active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()}><Bold className="size-4" /></Btn>
      <Btn title={t("italic")} active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()}><Italic className="size-4" /></Btn>
      <Btn title={t("underline")} active={editor.isActive("underline")} onClick={() => editor.chain().focus().toggleUnderline().run()}><UnderlineIcon className="size-4" /></Btn>
      <Btn title={t("strikethrough")} active={editor.isActive("strike")} onClick={() => editor.chain().focus().toggleStrike().run()}><Strikethrough className="size-4" /></Btn>
      <Btn title={t("highlight")} active={editor.isActive("highlight")} onClick={() => editor.chain().focus().toggleHighlight().run()}><Highlighter className="size-4" /></Btn>
      <Btn title={t("superscript")} active={editor.isActive("superscript")} onClick={() => editor.chain().focus().toggleSuperscript().run()}><SuperscriptIcon className="size-4" /></Btn>
      <Btn title={t("subscript")} active={editor.isActive("subscript")} onClick={() => editor.chain().focus().toggleSubscript().run()}><SubscriptIcon className="size-4" /></Btn>
      <Div />
      <Btn title={t("link")} active={editor.isActive("link")} onClick={() => {
        const url = window.prompt(t("linkPrompt"), (editor.getAttributes("link").href as string | undefined) ?? "");
        if (url === null) return;
        if (!url.trim()) editor.chain().focus().extendMarkRange("link").unsetLink().run();
        else editor.chain().focus().extendMarkRange("link").setLink({ href: url.trim() }).run();
      }}><Link2 className="size-4" /></Btn>
      <Div />
      {TEXT_COLORS.slice(0, 5).map((c) => (
        <button key={c} type="button" title={c} onClick={() => editor.chain().focus().setColor(c).run()}
          className="size-5 rounded-full shrink-0 mx-0.5" style={{ backgroundColor: c }}
        />
      ))}
    </div>
  );
}

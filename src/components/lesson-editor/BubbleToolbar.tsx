"use client";

import { useTranslations } from "next-intl";
import { type Editor } from "@tiptap/react";
import {
  Bold, Italic, Underline as UnderlineIcon, Strikethrough, Highlighter,
  SubscriptIcon, SuperscriptIcon, Link2,
} from "lucide-react";
import { Btn, Div, TEXT_COLORS } from "./EditorToolbar";

/** Matn tanlanganda chiqadigan qisqa formatlash paneli (Notion/Medium uslubi). */
export default function BubbleToolbar({ editor }: { editor: Editor }) {
  const t = useTranslations("LessonEditorToolbar");

  return (
    <div className="flex items-center gap-0.5 rounded-lg border border-border bg-popover p-1 shadow-md">
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

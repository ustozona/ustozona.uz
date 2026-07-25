"use client";

import { useTranslations } from "next-intl";
import { type Editor } from "@tiptap/react";
import {
  Heading1, Heading2, Heading3, List, ListOrdered, ListTodo, Quote, Table, ScissorsLineDashed,
} from "lucide-react";
import { Btn, Div } from "./EditorToolbar";

/** Boʻsh qatorda chiqadigan tez-blok-qoʻshish paneli (Notion "/" menyusi uslubi). */
export default function FloatingToolbar({ editor }: { editor: Editor }) {
  const t = useTranslations("LessonEditorToolbar");

  return (
    <div className="flex items-center gap-0.5 rounded-lg border border-border bg-popover p-1 shadow-md">
      <Btn title={t("heading1")} onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}><Heading1 className="size-4" /></Btn>
      <Btn title={t("heading2")} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}><Heading2 className="size-4" /></Btn>
      <Btn title={t("heading3")} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}><Heading3 className="size-4" /></Btn>
      <Div />
      <Btn title={t("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()}><List className="size-4" /></Btn>
      <Btn title={t("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()}><ListOrdered className="size-4" /></Btn>
      <Btn title={t("taskList")} onClick={() => editor.chain().focus().toggleTaskList().run()}><ListTodo className="size-4" /></Btn>
      <Div />
      <Btn title={t("blockquote")} onClick={() => editor.chain().focus().toggleBlockquote().run()}><Quote className="size-4" /></Btn>
      <Btn title={t("insertTable")} onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}><Table className="size-4" /></Btn>
      <Btn title={t("pageBreak")} onClick={() => editor.chain().focus().insertContent({ type: "pageBreak" }).run()}><ScissorsLineDashed className="size-4" /></Btn>
    </div>
  );
}

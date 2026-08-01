"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useEditor, EditorContent } from "@tiptap/react";
import { BubbleMenu } from "@tiptap/react/menus";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import TextAlign from "@tiptap/extension-text-align";
import Highlight from "@tiptap/extension-highlight";
import Image from "@tiptap/extension-image";
import { Mathematics } from "@tiptap/extension-mathematics";
import { Subscript } from "@tiptap/extension-subscript";
import { Superscript } from "@tiptap/extension-superscript";
import { TextStyle } from "@tiptap/extension-text-style";
import { Color } from "@tiptap/extension-color";
import { Typography } from "@tiptap/extension-typography";
import { CharacterCount } from "@tiptap/extension-character-count";
import { TableKit } from "@tiptap/extension-table";
import { TaskList, TaskItem } from "@tiptap/extension-list";
import "katex/dist/katex.min.css";
import { ArrowLeft, ImageIcon, Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { initialsOf } from "@/store/useFeedbackStore";
import { Callout, CalloutTitle } from "@/components/lesson-editor/callout-extension";
import { NotionCallout, NotionCalloutTitle } from "@/components/lesson-editor/notion-callout-extension";
import { LeadingParagraph } from "@/components/lesson-editor/leading-paragraph-extension";
import { AppleEmojiDisplay } from "@/components/lesson-editor/apple-emoji-extension";
import EditorToolbar from "@/components/lesson-editor/EditorToolbar";
import BubbleToolbar from "@/components/lesson-editor/BubbleToolbar";
import { savePostAction, setPostStatusAction } from "@/server/actions/blog";
import type { BlogPostFull } from "@/server/dal/blog";

/* Xuddi dars muharriridagi Tiptap toʻplami (EditorToolbar/BubbleToolbar
   lesson-ga bogʻliq emas — toʻgʻridan-toʻgʻri qayta ishlatildi). AI panel,
   Tafsilotlar (sinf/jadval) va A4/chop qismi olinmadi — bular dars
   modeliga xos, blogga tegishli emas.

   Joylashuv — Substack uslubi: quti/kulrang fon yoʻq, matn sahifaning
   oʻzida oqadi; asboblar paneli toʻliq-kengliq panel emas, markazlashgan
   suzuvchi pilla (referens skrinshot). */
export function BlogEditor({ post }: { post: BlogPostFull }) {
  const router = useRouter();
  const [title, setTitle] = useState(post.title);
  const [excerpt, setExcerpt] = useState(post.excerpt);
  const [coverImageUrl, setCoverImageUrl] = useState(post.coverImageUrl ?? "");
  const [status, setStatus] = useState(post.status);
  const [slug, setSlug] = useState(post.slug);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [coverEditorOpen, setCoverEditorOpen] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const titleRef = useRef<HTMLTextAreaElement>(null);
  const subtitleRef = useRef<HTMLTextAreaElement>(null);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        link: { openOnClick: false, autolink: true, HTMLAttributes: { rel: "noopener noreferrer" } },
      }),
      Placeholder.configure({
        includeChildren: true,
        placeholder: ({ node }) => (node.type.name === "paragraph" ? "Yozishni boshlang..." : ""),
      }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Highlight.configure({ multicolor: true }),
      Image.configure({ inline: false, allowBase64: true }),
      Callout,
      CalloutTitle,
      NotionCallout,
      NotionCalloutTitle,
      LeadingParagraph,
      Mathematics.configure({ katexOptions: { throwOnError: false } }),
      TableKit.configure({ table: { resizable: true } }),
      TaskList,
      TaskItem.configure({ nested: true }),
      TextStyle,
      Color,
      Subscript,
      Superscript,
      Typography,
      CharacterCount,
      AppleEmojiDisplay,
    ],
    content: post.content,
    editorProps: { attributes: { class: "lesson-prose blog-prose focus:outline-none" } },
    onUpdate: () => {
      setSaving(true);
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => save({ silent: true }), 800);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
  });

  useEffect(() => {
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, []);

  // Sarlavha/subtitle — Google Docs/Notion uslubi: avto-balandlik <textarea>.
  useEffect(() => {
    for (const el of [titleRef.current, subtitleRef.current]) {
      if (!el) continue;
      el.style.height = "auto";
      el.style.height = `${el.scrollHeight}px`;
    }
  }, [title, excerpt]);

  const scheduleSave = () => {
    setSaving(true);
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => save({ silent: true }), 800);
  };

  const save = (opts?: { silent?: boolean }) => {
    if (!editor) return;
    setSaving(true);
    savePostAction({
      id: post.id,
      title,
      excerpt,
      coverImageUrl: coverImageUrl.trim() || null,
      content: editor.getHTML(),
    })
      .then(() => {
        setSaving(false);
        if (!opts?.silent) toast.success("Saqlandi");
      })
      .catch(() => {
        setSaving(false);
        toast.error("Saqlashda xatolik");
      });
  };

  const togglePublish = async () => {
    setPublishing(true);
    save({ silent: true });
    const next = status === "published" ? "draft" : "published";
    await setPostStatusAction({ id: post.id, status: next });
    setStatus(next);
    setPublishing(false);
    toast.success(next === "published" ? "Nashr qilindi" : "Qoralamaga oʻtkazildi");
    router.refresh();
  };

  return (
    <div className="flex h-dvh w-full flex-col bg-background">
      {/* ── Top bar ── */}
      <header className="flex h-14 shrink-0 items-center justify-between gap-4 border-b border-border px-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/blog/studio" aria-label="Mening maqolalarim">
              <ArrowLeft className="size-4" />
            </Link>
          </Button>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
            {saving ? (
              <>
                <Loader2 className="size-3 animate-spin" />
                Saqlanmoqda
              </>
            ) : (
              <>
                <span className="size-1.5 rounded-full bg-success" />
                Saqlandi
              </>
            )}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" disabled={status !== "published"} asChild={status === "published"}>
            {status === "published" ? (
              <Link href={`/blog/${slug}`} target="_blank">
                Koʻrish
              </Link>
            ) : (
              <span>Koʻrish</span>
            )}
          </Button>
          <Button size="sm" disabled={publishing} onClick={togglePublish}>
            {status === "published" ? "Qoralamaga oʻtkazish" : "Nashr qilish"}
          </Button>
        </div>
      </header>

      {/* ── Asboblar paneli — bitta qatorda, alohida karta emas (dars
          muharriri bilan bir xil naqsh). ── */}
      <div className="no-print flex shrink-0 justify-center overflow-x-auto border-b border-border bg-card/80 px-3 py-1.5 backdrop-blur">
        <EditorToolbar editor={editor} />
      </div>

      {/* ── Kontent — quti/fon yoʻq, sahifaning oʻzida oqadi ── */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="mx-auto max-w-2xl px-4 py-10 md:py-14">
          <textarea
            ref={titleRef}
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              scheduleSave();
            }}
            placeholder="Sarlavha"
            rows={1}
            className="blog-title w-full resize-none overflow-hidden bg-transparent text-4xl font-bold leading-tight text-foreground outline-none placeholder:text-muted-foreground/40 md:text-5xl"
          />
          <textarea
            ref={subtitleRef}
            value={excerpt}
            onChange={(e) => {
              setExcerpt(e.target.value);
              scheduleSave();
            }}
            placeholder="Subtitr qoʻshing..."
            rows={1}
            className="blog-title mt-2 w-full resize-none overflow-hidden bg-transparent text-xl text-muted-foreground outline-none placeholder:text-muted-foreground/40"
          />

          <div className="mt-5 flex items-center gap-2.5">
            <Avatar className="size-7">
              {post.authorAvatarUrl && <AvatarImage src={post.authorAvatarUrl} alt={post.authorName} />}
              <AvatarFallback className="bg-muted text-xs font-semibold text-muted-foreground">
                {initialsOf(post.authorName)}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm font-medium text-foreground">{post.authorName}</span>
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5 text-xs text-muted-foreground"
              onClick={() => setCoverEditorOpen((v) => !v)}
            >
              <ImageIcon className="size-3.5" />
              {coverImageUrl ? "Muqova rasmi" : "Muqova rasmi qoʻshish"}
            </Button>
          </div>

          {(coverEditorOpen || coverImageUrl) && (
            <div className="mt-3 flex items-center gap-2">
              <input
                value={coverImageUrl}
                onChange={(e) => {
                  setCoverImageUrl(e.target.value);
                  scheduleSave();
                }}
                placeholder="https://..."
                className="h-8 flex-1 rounded-md border-0 bg-muted px-2.5 text-xs text-foreground outline-none placeholder:text-muted-foreground"
              />
              {coverImageUrl && (
                <button
                  type="button"
                  aria-label="Olib tashlash"
                  className="text-muted-foreground hover:text-foreground"
                  onClick={() => {
                    setCoverImageUrl("");
                    setCoverEditorOpen(false);
                    scheduleSave();
                  }}
                >
                  <X className="size-3.5" />
                </button>
              )}
            </div>
          )}

          <div className={cn("relative", coverImageUrl || coverEditorOpen ? "mt-6" : "mt-8")}>
            {editor && (
              <BubbleMenu editor={editor} className="no-print">
                <BubbleToolbar editor={editor} />
              </BubbleMenu>
            )}
            <EditorContent editor={editor} />
          </div>
        </div>
      </div>
    </div>
  );
}

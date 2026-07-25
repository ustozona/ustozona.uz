"use client";

import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { useEditor, EditorContent } from "@tiptap/react";
import { BubbleMenu, FloatingMenu } from "@tiptap/react/menus";
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
import "katex/dist/katex.min.css";
import {
  FileText, X, MoreHorizontal, Check, Loader2, Download, Save, Copy, BookmarkPlus, Trash2,
  SlidersHorizontal, FolderOpen, Target, BookOpen, Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useLessonStore } from "@/store/useLessonStore";
import { flushLessonsNow } from "@/components/sync/LessonsServerSync";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription, EmptyContent,
} from "@/components/ui/empty";
import {
  AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogFooter,
  AlertDialogTitle, AlertDialogDescription, AlertDialogCancel, AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { lessonClassIds, type Lesson } from "@/lib/lessons-data";
import EditorToolbar from "./EditorToolbar";
import DetailsPanel from "./DetailsPanel";
import AiAssistantPanel from "./AiAssistantPanel";
import { TableKit } from "@tiptap/extension-table";
import { TaskList, TaskItem } from "@tiptap/extension-list";
import { Callout, CalloutTitle } from "./callout-extension";
import { PageBreak } from "./page-break-extension";
import BubbleToolbar from "./BubbleToolbar";
import FloatingToolbar from "./FloatingToolbar";
import { useLiveClasses } from "@/hooks/useLiveClasses";
import { formatFeedbackAgo, useRelativeT } from "@/app/dashboard/(with-sidebar)/feedback/_components/feedback-meta";

const PANEL_EASE = [0.2, 0, 0, 1] as const;
const PANEL_DURATION = 0.2;

const STATUS_CLS = {
  Completed: "bg-success/10 text-success",
  Scheduled: "bg-info/10 text-info",
  Unscheduled: "bg-warning/10 text-warning-foreground",
  Draft: "bg-muted text-muted-foreground",
} as const;

export default function LessonEditor({ lessonId }: { lessonId: string }) {
  const t = useTranslations("LessonEditor");
  const router = useRouter();
  const liveClasses = useLiveClasses();
  const hydrated = useLessonStore((s) => s._hasHydrated);
  const lesson = useLessonStore((s) => s.lessons.find((l) => l.id === lessonId));
  const units = useLessonStore((s) => s.units);
  const updateLesson = useLessonStore((s) => s.updateLesson);
  const addLesson = useLessonStore((s) => s.addLesson);
  const deleteLesson = useLessonStore((s) => s.deleteLesson);
  const setLessonClasses = useLessonStore((s) => s.setLessonClasses);
  const setUnitForClass = useLessonStore((s) => s.setUnitForClass);
  const addScheduleForClass = useLessonStore((s) => s.addScheduleForClass);
  const removeScheduleForClass = useLessonStore((s) => s.removeScheduleForClass);

  const [activePanel, setActivePanel] = useState<"details" | "ai" | null>("details");
  const [saving, setSaving] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const relativeT = useRelativeT();
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const titleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [titleDraft, setTitleDraft] = useState<string | null>(null);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        link: { openOnClick: false, autolink: true, HTMLAttributes: { rel: "noopener noreferrer" } },
      }),
      Placeholder.configure({ placeholder: t("contentPlaceholder") }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Highlight,
      Image.configure({ inline: false, allowBase64: true }),
      Callout,
      CalloutTitle,
      // AI yordamchisi qoʻshgan $..$ / $$..$$ formulalar KaTeX bilan renderlanadi
      // (chat panelidagi koʻrinish bilan bir xil).
      Mathematics.configure({ katexOptions: { throwOnError: false } }),
      TableKit.configure({ table: { resizable: true } }),
      TaskList,
      TaskItem.configure({ nested: true }),
      TextStyle,
      Color,
      Subscript,
      Superscript,
      // Aqlli tinish belgilari: "--" -> "—", to'g'ri tirnoqlar va h.k.
      Typography,
      CharacterCount,
      PageBreak,
    ],
    content: lesson?.content ?? "",
    editorProps: { attributes: { class: "lesson-prose focus:outline-none" } },
    onUpdate: ({ editor }) => {
      setSaving(true);
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => {
        updateLesson(lessonId, { content: editor.getHTML() });
        setSaving(false);
      }, 600);
    },
  });

  // Store dan kontent tiklanganda (hydration) muharrirni bir marta toʻldiramiz.
  // queueMicrotask — React lifecycle ichida transaction (NodeView flushSync
  // ogohlantirishi) boʻlmasligi uchun renderdan keyinga suriladi.
  useEffect(() => {
    if (editor && lesson?.content && editor.isEmpty) {
      const html = lesson.content;
      queueMicrotask(() => { if (!editor.isDestroyed) editor.commands.setContent(html); });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor, hydrated]);

  // Boshqa darsga oʻtilganda mahalliy sarlavha qoralamasi tozalanadi.
  useEffect(() => { setTitleDraft(null); }, [lessonId]);

  const handleTitleChange = (value: string) => {
    setTitleDraft(value);
    if (titleTimer.current) clearTimeout(titleTimer.current);
    titleTimer.current = setTimeout(() => updateLesson(lessonId, { title: value }), 600);
  };

  if (hydrated && !lesson) {
    return (
      <Empty className="h-dvh">
        <EmptyHeader>
          <EmptyMedia variant="icon"><FileText /></EmptyMedia>
          <EmptyTitle>{t("notFoundTitle")}</EmptyTitle>
          <EmptyDescription>{t("notFoundDescription")}</EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button variant="outline" onClick={() => router.push("/dashboard/lessons")}>
            {t("backToLessons")}
          </Button>
        </EmptyContent>
      </Empty>
    );
  }

  const STATUS = {
    Completed: { label: t("status.completed"), cls: STATUS_CLS.Completed },
    Scheduled: { label: t("status.scheduled"), cls: STATUS_CLS.Scheduled },
    Unscheduled: { label: t("status.unscheduled"), cls: STATUS_CLS.Unscheduled },
    Draft: { label: t("status.draft"), cls: STATUS_CLS.Draft },
  } as const;
  const st = lesson ? STATUS[lesson.status] : STATUS.Draft;

  const togglePanel = (panel: "details" | "ai") =>
    setActivePanel((cur) => (cur === panel ? null : panel));

  const railItems = [
    { icon: SlidersHorizontal, title: t("rail.details"), active: activePanel === "details", onClick: () => togglePanel("details") },
    { icon: FolderOpen, title: t("rail.materials"), soon: true },
    { icon: Target, title: t("rail.goals"), soon: true },
    { icon: BookOpen, title: t("rail.resources"), soon: true },
    { icon: Sparkles, title: t("rail.ai"), active: activePanel === "ai", onClick: () => togglePanel("ai") },
  ];

  /* ── "..." menyu amallari ── */
  const handleSaveNow = async () => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    if (titleTimer.current) clearTimeout(titleTimer.current);
    const patch: Partial<Lesson> = {};
    if (editor) patch.content = editor.getHTML();
    if (titleDraft !== null) { patch.title = titleDraft; setTitleDraft(null); }
    if (Object.keys(patch).length) updateLesson(lessonId, patch);
    await flushLessonsNow();
    setSaving(false);
    toast.success(t("toast.saved"));
  };
  const handleDuplicate = () => {
    if (!lesson) return;
    const newId = addLesson({ classId: lesson.classId, unitId: lesson.unitId, title: `${lesson.title || t("untitled")} (${t("copySuffix")})`, status: "Draft" });
    updateLesson(newId, {
      content: editor?.getHTML() ?? lesson.content,
      classIds: lessonClassIds(lesson),
      unitByClass: lesson.unitByClass,
      scheduleByClass: lesson.scheduleByClass,
      classCount: lessonClassIds(lesson).length,
    });
    toast.success(t("toast.duplicated"));
    router.push(`/lessons/${newId}`);
  };
  const performDelete = () => {
    deleteLesson(lessonId);
    toast.success(t("toast.deleted"));
    router.push("/dashboard/lessons");
  };

  const updatedLabel = lesson?.updatedAt ? formatFeedbackAgo(lesson.updatedAt, relativeT) : null;

  return (
    <div className="h-dvh w-full flex flex-col bg-muted overflow-hidden">
      {/* ── Top bar ── */}
      <header className="no-print h-14 shrink-0 flex items-center justify-between gap-4 px-4 bg-card border-b border-border">
        <div className="flex items-center gap-3 min-w-0">
          <div className="size-9 rounded-lg bg-muted flex items-center justify-center shrink-0">
            <FileText className="size-5 text-foreground" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2.5">
              <h1 className="text-base font-bold text-foreground truncate max-w-[40vw]">
                {(titleDraft ?? lesson?.title)?.trim() || t("untitled")}
              </h1>
              <span className={cn("shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold", st.cls)}>
                {st.label}
              </span>
              <span className="shrink-0 inline-flex items-center gap-1 text-xs text-muted-foreground">
                {saving ? <Loader2 className="size-3.5 animate-spin" /> : <Check className="size-3.5 text-success" />}
                {saving ? t("saving") : t("saved")}
              </span>
            </div>
            {updatedLabel && <p className="text-xs text-muted-foreground mt-0.5">{updatedLabel}</p>}
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" aria-label={t("more")}>
                <MoreHorizontal className="size-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuItem onClick={handleSaveNow} className="gap-2">
                <Save className="size-4" /> {t("menu.saveNow")}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => window.print()} className="gap-2">
                <Download className="size-4" /> {t("menu.downloadPdf")}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleDuplicate} className="gap-2">
                <Copy className="size-4" /> {t("menu.duplicate")}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => toast(t("toast.templateSoon"))} className="gap-2">
                <BookmarkPlus className="size-4" /> {t("menu.saveAsTemplate")}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setConfirmDeleteOpen(true)} className="gap-2 text-destructive focus:text-destructive">
                <Trash2 className="size-4" /> {t("menu.deleteLesson")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <AlertDialog open={confirmDeleteOpen} onOpenChange={setConfirmDeleteOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{t("deleteDialog.title")}</AlertDialogTitle>
                <AlertDialogDescription>
                  {t("deleteDialog.description")}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{t("deleteDialog.cancel")}</AlertDialogCancel>
                <AlertDialogAction className="bg-destructive text-white hover:bg-destructive/90" onClick={performDelete}>
                  {t("deleteDialog.confirm")}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <Button variant="ghost" size="icon" aria-label={t("close")} onClick={() => router.push("/dashboard/lessons")}>
            <X className="size-5" />
          </Button>
        </div>
      </header>

      {/* ── Body ── */}
      <div className="flex-1 min-h-0 flex">
        {/* Editor pane */}
        <div className="flex-1 min-w-0 flex flex-col">
          {/* Sticky toolbar */}
          <div className="no-print shrink-0 bg-card/80 backdrop-blur border-b border-border px-3 py-1.5 flex items-center gap-3">
            <div className="flex-1 min-w-0 overflow-x-auto">
              <EditorToolbar editor={editor} />
            </div>
            {editor && (
              <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                {t("characterCount", { count: editor.storage.characterCount?.characters() ?? 0 })}
              </span>
            )}
          </div>
          {/* Scrollable canvas with A4 sheet */}
          <div className="flex-1 min-h-0 overflow-y-auto">
            <div className="a4-print a4-sheet bg-card mx-auto my-8 rounded-sm card-elevation px-16 py-14">
              <input
                value={titleDraft ?? lesson?.title ?? ""}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder={t("untitled")}
                className="w-full bg-transparent border-0 outline-none text-4xl font-bold text-foreground placeholder:text-muted-foreground/40 mb-5"
              />
              {editor && (
                <>
                  <BubbleMenu editor={editor} className="no-print">
                    <BubbleToolbar editor={editor} />
                  </BubbleMenu>
                  <FloatingMenu editor={editor} className="no-print">
                    <FloatingToolbar editor={editor} />
                  </FloatingMenu>
                </>
              )}
              <EditorContent editor={editor} />
            </div>
          </div>
        </div>

        <AnimatePresence initial={false}>
          {activePanel === "ai" && lesson && (
            <motion.aside
              key="ai-panel"
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 440, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: PANEL_DURATION, ease: PANEL_EASE }}
              className="no-print shrink-0 bg-card border-l border-border overflow-hidden"
            >
              <div className="w-[440px] h-full">
                <AiAssistantPanel
                  lessonContext={{
                    title: lesson.title,
                    classes: lessonClassIds(lesson).map((id) => liveClasses.find((c) => c.id === id)?.name ?? id).join(", "),
                    unit: units.find((u) => u.id === lesson.unitId)?.title,
                    content: editor?.getHTML(),
                  }}
                  classIds={lessonClassIds(lesson)}
                  lessonId={lesson.id}
                  onClose={() => setActivePanel(null)}
                  onInsert={(html) => editor?.chain().focus().insertContent(html).run()}
                />
              </div>
            </motion.aside>
          )}

          {activePanel === "details" && lesson && (
            <motion.aside
              key="details-panel"
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 340, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: PANEL_DURATION, ease: PANEL_EASE }}
              className="no-print shrink-0 bg-card border-l border-border overflow-hidden"
            >
              <div className="w-[340px] h-full">
                <DetailsPanel
                  lesson={lesson}
                  units={units}
                  onClose={() => setActivePanel(null)}
                  onSetClasses={(classIds) => setLessonClasses(lessonId, classIds)}
                  onSetUnitForClass={(classId, unitId) => setUnitForClass(lessonId, classId, unitId)}
                  onAddScheduleForClass={(classId, date, s, e) => addScheduleForClass(lessonId, classId, date, s, e)}
                  onRemoveScheduleForClass={(classId, idx) => removeScheduleForClass(lessonId, classId, idx)}
                />
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* Icon rail */}
        <nav className="no-print w-14 shrink-0 bg-card border-l border-border flex flex-col items-center gap-1.5 py-4">
          {railItems.map(({ icon: Icon, title, active, soon, onClick }) => (
            <Button
              key={title}
              variant="ghost"
              size="icon-lg"
              aria-label={title}
              disabled={soon}
              disabledReason={soon ? t("rail.soon") : undefined}
              onClick={onClick}
              className={cn(
                "rounded-xl",
                active && "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground"
              )}
            >
              <Icon className="size-5" />
            </Button>
          ))}
        </nav>
      </div>
    </div>
  );
}

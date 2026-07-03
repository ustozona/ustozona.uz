"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import TextAlign from "@tiptap/extension-text-align";
import Highlight from "@tiptap/extension-highlight";
import Image from "@tiptap/extension-image";
import {
  FileText, X, MoreHorizontal, Check, Loader2, Download, Save, Copy, BookmarkPlus, Trash2,
  SlidersHorizontal, FolderOpen, Target, BookOpen, Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useLessonStore } from "@/store/useLessonStore";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { lessonClassIds } from "@/lib/lessons-data";
import EditorToolbar from "./EditorToolbar";
import DetailsPanel from "./DetailsPanel";
import AiAssistantPanel from "./AiAssistantPanel";
import { TableKit } from "@tiptap/extension-table";
import { TaskList, TaskItem } from "@tiptap/extension-list";
import { Callout, CalloutTitle } from "./callout-extension";
import { useLiveClasses } from "@/hooks/useLiveClasses";

const STATUS = {
  Completed: { label: "Tugallandi", cls: "bg-success/10 text-success" },
  Scheduled: { label: "Rejalashtirilgan", cls: "bg-info/10 text-info" },
  Unscheduled: { label: "Rejasiz", cls: "bg-warning/10 text-warning-foreground" },
  Draft: { label: "Qoralama", cls: "bg-muted text-muted-foreground" },
} as const;

export default function LessonEditor({ lessonId }: { lessonId: string }) {
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

  const [detailsOpen, setDetailsOpen] = useState(true);
  const [aiOpen, setAiOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        link: { openOnClick: false, autolink: true, HTMLAttributes: { rel: "noopener noreferrer" } },
      }),
      Placeholder.configure({ placeholder: "Dars matnini yozishni boshlang…" }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Highlight,
      Image.configure({ inline: false, allowBase64: true }),
      Callout,
      CalloutTitle,
      TableKit.configure({ table: { resizable: true } }),
      TaskList,
      TaskItem.configure({ nested: true }),
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

  if (hydrated && !lesson) {
    return (
      <div className="h-dvh flex flex-col items-center justify-center gap-3 text-center">
        <FileText className="size-10 text-muted-foreground/30" />
        <p className="text-base font-semibold">Dars topilmadi</p>
        <button onClick={() => router.push("/dashboard/lessons")} className="text-sm text-primary underline">
          Darslar roʻyxatiga qaytish
        </button>
      </div>
    );
  }

  const st = lesson ? STATUS[lesson.status] : STATUS.Draft;

  const railItems = [
    { icon: SlidersHorizontal, title: "Tafsilotlar", active: detailsOpen && !aiOpen, onClick: () => { setAiOpen(false); setDetailsOpen((o) => !o); } },
    { icon: FolderOpen, title: "Materiallar" },
    { icon: Target, title: "Maqsadlar" },
    { icon: BookOpen, title: "Resurslar" },
    { icon: Sparkles, title: "Ustozona AI", active: aiOpen, onClick: () => setAiOpen((o) => !o) },
  ];

  /* ── "..." menyu amallari ── */
  const handleSaveNow = () => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    if (editor) updateLesson(lessonId, { content: editor.getHTML() });
    setSaving(false);
    toast.success("Saqlandi");
  };
  const handleDuplicate = () => {
    if (!lesson) return;
    const newId = addLesson({ classId: lesson.classId, unitId: lesson.unitId, title: `${lesson.title || "Nomsiz"} (nusxa)`, status: "Draft" });
    updateLesson(newId, {
      content: editor?.getHTML() ?? lesson.content,
      classIds: lessonClassIds(lesson),
      unitByClass: lesson.unitByClass,
      scheduleByClass: lesson.scheduleByClass,
      classCount: lessonClassIds(lesson).length,
    });
    toast.success("Dars nusxalandi");
    router.push(`/lessons/${newId}`);
  };
  const handleDelete = () => {
    if (!window.confirm("Bu darsni oʻchirishni tasdiqlaysizmi?")) return;
    deleteLesson(lessonId);
    toast.success("Dars oʻchirildi");
    router.push("/dashboard/lessons");
  };

  return (
    <div className="h-dvh w-full flex flex-col bg-[oklch(0.97_0_0)] overflow-hidden">
      {/* ── Top bar ── */}
      <header className="no-print h-14 shrink-0 flex items-center justify-between gap-4 px-4 bg-card border-b border-border">
        <div className="flex items-center gap-3 min-w-0">
          <div className="size-9 rounded-lg bg-muted flex items-center justify-center shrink-0">
            <FileText className="size-5 text-foreground" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2.5">
              <h1 className="text-base font-bold text-foreground truncate max-w-[40vw]">
                {lesson?.title?.trim() || "Nomsiz"}
              </h1>
              <span className={cn("shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold", st.cls)}>
                {st.label}
              </span>
              <span className="shrink-0 inline-flex items-center gap-1 text-xs text-muted-foreground">
                {saving ? <Loader2 className="size-3.5 animate-spin" /> : <Check className="size-3.5 text-success" />}
                {saving ? "Saqlanmoqda…" : "Saqlandi"}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">Hozirgina tahrirlandi</p>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button title="Koʻproq" className="size-9 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                <MoreHorizontal className="size-5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuItem onClick={handleSaveNow} className="gap-2">
                <Save className="size-4" /> Hozir saqlash
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => window.print()} className="gap-2">
                <Download className="size-4" /> Yuklab olish (PDF)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleDuplicate} className="gap-2">
                <Copy className="size-4" /> Nusxalash
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => toast("Shablon sifatida saqlash — tez orada")} className="gap-2">
                <BookmarkPlus className="size-4" /> Shablon sifatida saqlash
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleDelete} className="gap-2 text-destructive focus:text-destructive">
                <Trash2 className="size-4" /> Darsni oʻchirish
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <button
            onClick={() => router.push("/dashboard/lessons")}
            title="Yopish"
            className="size-9 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <X className="size-5" />
          </button>
        </div>
      </header>

      {/* ── Body ── */}
      <div className="flex-1 min-h-0 flex">
        {/* Editor pane */}
        <div className="flex-1 min-w-0 flex flex-col">
          {/* Sticky toolbar */}
          <div className="no-print shrink-0 bg-card/80 backdrop-blur border-b border-border px-3 py-1.5 overflow-x-auto">
            <EditorToolbar editor={editor} />
          </div>
          {/* Scrollable canvas with A4 sheet */}
          <div className="flex-1 min-h-0 overflow-y-auto">
            <div className="a4-print a4-sheet bg-card mx-auto my-8 rounded-sm shadow-[0_2px_16px_-2px_rgb(0_0_0/0.12)] px-16 py-14">
              <input
                value={lesson?.title ?? ""}
                onChange={(e) => updateLesson(lessonId, { title: e.target.value })}
                placeholder="Nomsiz"
                className="w-full bg-transparent border-0 outline-none text-4xl font-bold text-foreground placeholder:text-muted-foreground/40 mb-5"
              />
              <EditorContent editor={editor} />
            </div>
          </div>
        </div>

        {/* Murabbiyona AI panel (Tafsilotlar ustidan ustun) */}
        {aiOpen && lesson && (
          <aside className="no-print w-[440px] shrink-0 bg-card border-l border-border">
            <AiAssistantPanel
              lessonContext={{
                title: lesson.title,
                classes: lessonClassIds(lesson).map((id) => liveClasses.find((c) => c.id === id)?.name ?? id).join(", "),
                unit: units.find((u) => u.id === lesson.unitId)?.title,
                content: editor?.getHTML(),
              }}
              onClose={() => setAiOpen(false)}
              onInsert={(html) => editor?.chain().focus().insertContent(html).run()}
            />
          </aside>
        )}

        {/* Details panel */}
        {detailsOpen && !aiOpen && lesson && (
          <aside className="no-print w-[340px] shrink-0 bg-card border-l border-border">
            <DetailsPanel
              lesson={lesson}
              units={units}
              onClose={() => setDetailsOpen(false)}
              onSetClasses={(classIds) => setLessonClasses(lessonId, classIds)}
              onSetUnitForClass={(classId, unitId) => setUnitForClass(lessonId, classId, unitId)}
              onAddScheduleForClass={(classId, date, s, e) => addScheduleForClass(lessonId, classId, date, s, e)}
              onRemoveScheduleForClass={(classId, idx) => removeScheduleForClass(lessonId, classId, idx)}
            />
          </aside>
        )}

        {/* Icon rail */}
        <nav className="no-print w-14 shrink-0 bg-card border-l border-border flex flex-col items-center gap-1.5 py-4">
          {railItems.map(({ icon: Icon, title, active, onClick }) => (
            <button
              key={title}
              title={title}
              onClick={onClick}
              className={cn(
                "size-10 rounded-xl flex items-center justify-center transition-colors",
                active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              <Icon className="size-5" />
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
}

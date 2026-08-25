"use client";

import { useTranslations } from "next-intl";
import { Fragment, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
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
import "katex/dist/katex.min.css";
import {
  FileText, X, MoreHorizontal, Check, CheckCircle2, Loader2, Download, Save, Copy, BookmarkPlus, Trash2,
  SlidersHorizontal, Sparkles, Plus, Minus, CalendarClock, CircleAlert, PenLine, ChevronDown,
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
import { lessonClassIds, lessonSessions, type Lesson } from "@/lib/lessons-data";
import EditorToolbar from "./EditorToolbar";
import DetailsPanel from "./DetailsPanel";
import AiAssistantPanel from "./AiAssistantPanel";
import { TableKit } from "@tiptap/extension-table";
import { TaskList, TaskItem } from "@tiptap/extension-list";
import { Callout, CalloutTitle } from "./callout-extension";
import { normalizeCalloutType } from "./callout-types";
import { NotionCallout, NotionCalloutTitle } from "./notion-callout-extension";
import { LeadingParagraph } from "./leading-paragraph-extension";
import { PageBreak } from "./page-break-extension";
import { PageBreakMarkers } from "./PageBreakMarkers";
import { AppleEmojiDisplay } from "./apple-emoji-extension";
import BubbleToolbar from "./BubbleToolbar";
import { useLiveClasses } from "@/hooks/useLiveClasses";
import { useStandardsStore } from "@/store/useStandardsStore";
import { formatFeedbackAgo, formatFeedbackFull, useRelativeT } from "@/app/dashboard/(with-sidebar)/feedback/_components/feedback-meta";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import { useResponsivePanelWidth } from "@/hooks/useResponsivePanelWidth";
import { SectionIcon } from "@/components/ui/section-icon";

const PANEL_EASE = [0.2, 0, 0, 1] as const;
const PANEL_DURATION = 0.2;

/* Status haqidagi HAMMA vizual maʼlumot (rang, ikonka) — YAGONA joyda.
   Yangi status qoʻshilsa faqat shu obyektni yangilash yetarli. `tone`dan
   trigger/dropdown-item/active-fon sinflari hosil qilinadi (pastda). */
const STATUS_META = {
  Completed: { icon: CheckCircle2, tone: "success" },
  Scheduled: { icon: CalendarClock, tone: "info" },
  Unscheduled: { icon: CircleAlert, tone: "warning" },
  Draft: { icon: PenLine, tone: "muted" },
} as const;

type StatusTone = (typeof STATUS_META)[keyof typeof STATUS_META]["tone"];

const TONE_BADGE_CLS: Record<StatusTone, string> = {
  success: "bg-success/10 text-success",
  info: "bg-info/10 text-info",
  warning: "bg-warning/10 text-warning",
  muted: "bg-muted text-muted-foreground",
};

/* dropdown-menu.tsx ichki qoidasi ("text-" sinfi yoʻq svg'larni majburan
   text-muted-foreground qiladi) sabab ikonka rangini alohida berish shart. */
const TONE_ICON_CLS: Record<StatusTone, string> = {
  success: "text-success",
  info: "text-info",
  warning: "text-warning",
  muted: "text-muted-foreground",
};

const TONE_ITEM_CLS: Record<StatusTone, string> = {
  success: "text-success focus:bg-success/10 focus:text-success",
  info: "text-info focus:bg-info/10 focus:text-info",
  warning: "text-warning focus:bg-warning/10 focus:text-warning",
  muted: "text-muted-foreground focus:bg-muted focus:text-muted-foreground",
};

/* Joriy status qatori — hover kutmasdan ham darhol koʻzga tashlanishi uchun
   doimiy yengil fon (nafaqat oʻng chetdagi check belgisi). */
const TONE_ACTIVE_CLS: Record<StatusTone, string> = {
  success: "bg-success/10",
  info: "bg-info/10",
  warning: "bg-warning/10",
  muted: "bg-muted",
};

/* Menyu tartibi — dars hayot-siklini aks ettiradi (Draft → Unscheduled →
   Scheduled → Completed). "Qoralama"ga qaytarish orqaga qadam boʻlgani
   uchun alohida, separator bilan pastda koʻrsatiladi. */
const STATUS_ORDER = ["Unscheduled", "Scheduled", "Completed", "Draft"] as const;

export default function LessonEditor({ lessonId }: { lessonId: string }) {
  const t = useTranslations("LessonEditor");
  const tToolbar = useTranslations("LessonEditorToolbar");
  const router = useRouter();
  const liveClasses = useLiveClasses();
  const isMobile = useIsMobile();
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
  const setStatus = useLessonStore((s) => s.setStatus);
  const standardSets = useStandardsStore((s) => s.sets);

  const [activePanel, setActivePanel] = useState<"details" | "ai" | null>("details");
  const [saving, setSaving] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  /* A4 sahifa zoom'i — faqat KOʻRINISH uchun (CSS transform), saqlangan
     kontentga taʼsir qilmaydi. Chop etishda @media print orqali bekor
     qilinadi (globals.css) — chop doim 100% oʻlchamda chiqadi. */
  const [zoom, setZoom] = useState(100);
  const ZOOM_MIN = 50;
  const ZOOM_MAX = 150;
  const ZOOM_STEP = 10;
  const relativeT = useRelativeT();
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const titleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [titleDraft, setTitleDraft] = useState<string | null>(null);
  const titleDraftRef = useRef<string | null>(null);
  const titleRef = useRef<HTMLTextAreaElement>(null);
  const [sheetEl, setSheetEl] = useState<HTMLDivElement | null>(null);
  const aiPanelWidth = useResponsivePanelWidth(280, 0.25);
  const detailsPanelWidth = useResponsivePanelWidth(260, 0.25);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        link: { openOnClick: false, autolink: true, HTMLAttributes: { rel: "noopener noreferrer" } },
      }),
      Placeholder.configure({
        /* Callout sarlavhasi uchun ham xira namuna: ilgari blok qoʻyilganda
           sarlavhaga literal "Maqsad" kabi soʻz YOZILARDI — oʻqituvchi oʻz
           sarlavhasini yozish uchun avval uni oʻchirishi kerak edi. Endi
           sarlavha boʻsh boshlanadi, turga mos nom faqat placeholder
           sifatida koʻrinadi (yozmasa ham blok "Maqsad" boʻlib turadi).
           `includeChildren: true` SHART: standart holda Placeholder faqat
           hujjatning 1-darajali tugunlarini (paragraf/sarlavha) tekshiradi;
           calloutTitle esa callout ichida ikkinchi darajada — shu bayroqsiz
           quyidagi funksiya calloutTitle uchun HECH QACHON chaqirilmaydi. */
        includeChildren: true,
        placeholder: ({ editor, node, pos }) => {
          if (node.type.name === "calloutTitle") {
            const parentType = editor.state.doc.resolve(pos).parent.attrs.type as string | undefined;
            return tToolbar(`calloutTypes.${normalizeCalloutType(parentType)}`);
          }
          // Emojili blok sarlavhasi — Callout'dan farqli, bu yerda "tur"
          // konsepti yoʻq (erkin blok), shuning uchun bitta umumiy nom.
          if (node.type.name === "notionCalloutTitle") {
            return tToolbar("notionCalloutTitlePlaceholder");
          }
          return t("contentPlaceholder");
        },
      }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Highlight.configure({ multicolor: true }),
      Image.configure({ inline: false, allowBase64: true }),
      Callout,
      CalloutTitle,
      NotionCallout,
      NotionCalloutTitle,
      LeadingParagraph,
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
      AppleEmojiDisplay,
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
  useEffect(() => { setTitleDraft(null); titleDraftRef.current = null; }, [lessonId]);

  // Sahifa yopilayotganda (tab yopish/refresh) hali debounce navbatida
  // turgan oʻzgarish bor boʻlsa brauzer oʻzining "chiqasizmi?" ogohlantirishini
  // koʻrsatadi — SPA ichidagi navigatsiyaga taʼsir qilmaydi (unmount-flush
  // buni allaqachon boshqaradi).
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (saving) { e.preventDefault(); }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [saving]);

  // Sahifadan chiqishda (X, orqaga, darsni almashtirish) hali debounce
  // kutayotgan oʻzgarishlar (matn/sarlavha) yoʻqolib ketmasligi uchun
  // taymerlarni bekor qilib, oxirgi qiymatni darhol saqlaymiz.
  useEffect(() => {
    return () => {
      const patch: Partial<Lesson> = {};
      if (saveTimer.current) { clearTimeout(saveTimer.current); if (editor && !editor.isDestroyed) patch.content = editor.getHTML(); }
      if (titleTimer.current) { clearTimeout(titleTimer.current); if (titleDraftRef.current !== null) patch.title = titleDraftRef.current; }
      if (Object.keys(patch).length) updateLesson(lessonId, patch);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lessonId]);

  const handleTitleChange = (value: string) => {
    setTitleDraft(value);
    titleDraftRef.current = value;
    if (titleTimer.current) clearTimeout(titleTimer.current);
    titleTimer.current = setTimeout(() => {
      updateLesson(lessonId, { title: value });
      titleTimer.current = null;
    }, 600);
  };

  const handleSaveNow = async () => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    if (titleTimer.current) clearTimeout(titleTimer.current);
    const patch: Partial<Lesson> = {};
    if (editor) patch.content = editor.getHTML();
    if (titleDraft !== null) { patch.title = titleDraft; setTitleDraft(null); titleDraftRef.current = null; }
    if (Object.keys(patch).length) updateLesson(lessonId, patch);
    await flushLessonsNow();
    setSaving(false);
    toast.success(t("toast.saved"));
  };
  const handleSaveNowRef = useRef(handleSaveNow);
  handleSaveNowRef.current = handleSaveNow;

  // Cmd/Ctrl+S — hujjat muharrirlarida kutilgan refleks; brauzerning oʻz
  // "Sahifani saqlash" dialogini bosib, darhol serverga yuboradi.
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        handleSaveNowRef.current();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // Sarlavha maydoni bir qatorli <input> boʻlsa uzun matn kesilib qolardi
  // (Google Docs/Notion uslubida sarlavha koʻp qatorga oʻralishi kerak) —
  // shuning uchun avto-balandlik <textarea> ishlatiladi.
  // DIQQAT: quyidagi "dars topilmadi" erta return'idan OLDIN turishi SHART —
  // aks holda hook shartli chaqirilib, "Rendered fewer hooks than expected"
  // xatosi chiqadi (dars oʻchirilgan/topilmagan holatga oʻtishda).
  useEffect(() => {
    const el = titleRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [titleDraft, lesson?.title]);

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

  const STATUS = (Object.keys(STATUS_META) as (keyof typeof STATUS_META)[]).reduce(
    (acc, key) => {
      const meta = STATUS_META[key];
      acc[key] = {
        label: t(`status.${key.toLowerCase()}`),
        icon: meta.icon,
        cls: TONE_BADGE_CLS[meta.tone],
        itemCls: TONE_ITEM_CLS[meta.tone],
        iconCls: TONE_ICON_CLS[meta.tone],
        activeCls: TONE_ACTIVE_CLS[meta.tone],
      };
      return acc;
    },
    {} as Record<keyof typeof STATUS_META, { label: string; icon: typeof CheckCircle2; cls: string; itemCls: string; iconCls: string; activeCls: string }>,
  );
  const st = lesson ? STATUS[lesson.status] : STATUS.Draft;
  const StatusIcon = st.icon;

  const changeStatus = (key: keyof typeof STATUS_META) => {
    if (!lesson || lesson.status === key) return;
    const prev = lesson.status;
    setStatus(lessonId, key);
    toast.success(t("toast.statusChanged", { status: STATUS[key].label }), {
      action: { label: t("toast.undo"), onClick: () => setStatus(lessonId, prev) },
    });
  };

  const togglePanel = (panel: "details" | "ai") =>
    setActivePanel((cur) => (cur === panel ? null : panel));

  const railItems = [
    { icon: SlidersHorizontal, title: t("rail.details"), active: activePanel === "details", onClick: () => togglePanel("details") },
    { icon: Sparkles, title: t("rail.ai"), active: activePanel === "ai", onClick: () => togglePanel("ai") },
  ];

  /* ── "..." menyu amallari ── */
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

  // AI'ga uzatiladigan biriktirilgan standartlar — kod + tavsif (barcha
  // toʻplamlardan, klass bilan cheklanmaydi, chunki lesson.standards allaqachon
  // Tafsilotlar panelida shu darsning sinfiga mos ravishda tanlangan).
  const attachedStandards = (lesson?.standards ?? [])
    .map((code) => standardSets.flatMap((s) => s.standards).find((s) => s.id === code))
    .filter((s): s is NonNullable<typeof s> => !!s)
    .map((s) => ({ id: s.id, desc: s.desc }));

  // AI'ga uzatiladigan dars davomiyligi — eng yaqin/birinchi jadval sessiyasidan
  // (barcha sinflar boʻyicha), daqiqada. Jadval yoʻq boʻlsa berilmaydi.
  const firstSession = lesson ? lessonSessions(lesson).sort((a, b) => a.date.localeCompare(b.date) || a.startMin - b.startMin)[0] : undefined;
  const durationMin = firstSession ? firstSession.endMin - firstSession.startMin : undefined;

  return (
    <div className="h-dvh w-full flex flex-col bg-muted overflow-hidden print:h-auto print:overflow-visible">
      {/* ── Top bar ── */}
      <header className="no-print h-14 shrink-0 flex items-center justify-between gap-4 px-4 bg-card border-b border-border">
        <div className="flex items-center gap-3 min-w-0">
          <SectionIcon>
            <FileText className="size-5 text-foreground" />
          </SectionIcon>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2.5 min-w-0">
              <h1
                className="text-base font-semibold text-foreground truncate min-w-0"
                title={(titleDraft ?? lesson?.title)?.trim() || t("untitled")}
              >
                {(titleDraft ?? lesson?.title)?.trim() || t("untitled")}
              </h1>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className={cn(
                      "group shrink-0 inline-flex items-center gap-1 rounded-full pl-2 pr-1.5 py-0.5 text-xs font-semibold transition-colors hover:brightness-95 dark:hover:brightness-125",
                      st.cls
                    )}
                  >
                    <StatusIcon className="size-3.5" />
                    {st.label}
                    <ChevronDown className="size-3 opacity-60 transition-transform group-data-[state=open]:rotate-180" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-44">
                  {STATUS_ORDER.map((key) => {
                    const opt = STATUS[key];
                    const OptIcon = opt.icon;
                    const active = lesson?.status === key;
                    return (
                      <Fragment key={key}>
                        {key === "Draft" && <DropdownMenuSeparator />}
                        <DropdownMenuItem
                          className={cn("gap-2 font-medium", opt.itemCls, active && opt.activeCls)}
                          onSelect={() => changeStatus(key)}
                        >
                          <OptIcon className={cn("size-4", opt.iconCls)} />
                          <span className="flex-1">{opt.label}</span>
                          {active && <Check className="size-4" />}
                        </DropdownMenuItem>
                      </Fragment>
                    );
                  })}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {saving ? (
            <span className="hidden sm:inline-flex items-center gap-1.5 text-xs text-muted-foreground">
              <Loader2 className="size-3.5 animate-spin" />
              {t("saving")}
            </span>
          ) : (
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="hidden sm:inline-flex items-center gap-1.5 text-xs text-muted-foreground cursor-default">
                  <Check className="size-3.5 text-success" />
                  {updatedLabel ?? t("saved")}
                </span>
              </TooltipTrigger>
              {lesson?.updatedAt && (
                <TooltipContent>{t("savedAtTooltip", { time: formatFeedbackFull(lesson.updatedAt) })}</TooltipContent>
              )}
            </Tooltip>
          )}

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
      <div className="flex-1 min-h-0 flex print:h-auto print:block print:overflow-visible">
        {/* Editor pane */}
        <div className="relative flex-1 min-w-0 flex flex-col print:h-auto print:block print:overflow-visible">
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
          <div className="flex-1 min-h-0 scrollbar-hover overflow-y-auto print:h-auto print:overflow-visible">
            <div
              ref={setSheetEl}
              className="a4-print a4-sheet relative bg-card mx-auto my-8 rounded-sm card-elevation p-[16mm]"
              style={{ zoom: `${zoom}%` }}
            >
              <PageBreakMarkers measureEl={sheetEl} label={(page) => t("pageBoundary", { page })} />
              <textarea
                ref={titleRef}
                value={titleDraft ?? lesson?.title ?? ""}
                onChange={(e) => handleTitleChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    editor?.chain().focus("start").run();
                  }
                }}
                placeholder={t("untitled")}
                rows={1}
                className="w-full bg-transparent border-0 outline-none resize-none overflow-hidden text-4xl font-bold text-foreground placeholder:text-muted-foreground/40 mb-5 leading-tight"
              />
              {editor && (
                <BubbleMenu editor={editor} className="no-print">
                  <BubbleToolbar editor={editor} />
                </BubbleMenu>
              )}
              <EditorContent editor={editor} />
            </div>
          </div>
          {/* Zoom boshqaruvi — faqat A4 sahifaning KOʻRINISHINI kattalashtiradi/
              kichraytiradi (CSS `zoom`, chop etishga taʼsir qilmaydi). Ota
              konteyner endi butun muharrir panasi (skroll qiluvchi div EMAS)
              — shu sabab sahifa aylantirilganda oʻrnidan qoʻzgʻalmaydi, doim
              oʻng-pastki burchakda qotib turadi. Bir qatorli pill (Figma/
              Google Docs uslubi): foiz markazda, bosilsa 100%'ga qaytaradi. */}
          <div
            role="group"
            aria-label={t("zoom")}
            className="no-print absolute bottom-6 right-6 flex items-center gap-0.5 rounded-full card-elevation bg-card p-1"
          >
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full"
              aria-label={t("zoomOut")}
              disabled={zoom <= ZOOM_MIN}
              onClick={() => setZoom((z) => Math.max(ZOOM_MIN, z - ZOOM_STEP))}
            >
              <Minus />
            </Button>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  aria-label={t("zoomReset")}
                  disabled={zoom === 100}
                  onClick={() => setZoom(100)}
                  className="h-9 rounded-full px-2.5 text-xs font-semibold tabular-nums"
                >
                  {zoom}%
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">{t("zoomReset")}</TooltipContent>
            </Tooltip>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full"
              aria-label={t("zoomIn")}
              disabled={zoom >= ZOOM_MAX}
              onClick={() => setZoom((z) => Math.min(ZOOM_MAX, z + ZOOM_STEP))}
            >
              <Plus />
            </Button>
          </div>
        </div>

        {/* Desktop: yon panel doim DOM'da, kenglik animatsiya bilan ochiladi.
            Mobil (<768px)'da bu yondashuv A4 varaqni ezib qoʻyadi — shuning
            uchun pastda `Sheet` (toʻliq ekranli drawer) ishlatiladi. */}
        {!isMobile && (
          <AnimatePresence initial={false}>
            {activePanel === "ai" && lesson && (
              <motion.aside
                key="ai-panel"
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: aiPanelWidth, opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                transition={{ duration: PANEL_DURATION, ease: PANEL_EASE }}
                className="no-print shrink-0 bg-card border-l border-border overflow-hidden"
              >
                <div className="h-full" style={{ width: aiPanelWidth }}>
                  <AiAssistantPanel
                    lessonContext={{
                      title: lesson.title,
                      classes: lessonClassIds(lesson).map((id) => liveClasses.find((c) => c.id === id)?.name ?? id).join(", "),
                      unit: units.find((u) => u.id === lesson.unitId)?.title,
                      content: editor?.getHTML(),
                      standards: attachedStandards,
                      durationMin,
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
                animate={{ width: detailsPanelWidth, opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                transition={{ duration: PANEL_DURATION, ease: PANEL_EASE }}
                className="no-print shrink-0 bg-card border-l border-border overflow-hidden"
              >
                <div className="h-full" style={{ width: detailsPanelWidth }}>
                  <DetailsPanel
                    lesson={lesson}
                    units={units}
                    onClose={() => setActivePanel(null)}
                    onSetClasses={(classIds) => setLessonClasses(lessonId, classIds)}
                    onSetUnitForClass={(classId, unitId) => setUnitForClass(lessonId, classId, unitId)}
                    onAddScheduleForClass={(classId, date, s, e) => addScheduleForClass(lessonId, classId, date, s, e)}
                    onRemoveScheduleForClass={(classId, idx) => removeScheduleForClass(lessonId, classId, idx)}
                    onSetStandards={(standards) => updateLesson(lessonId, { standards })}
                  />
                </div>
              </motion.aside>
            )}
          </AnimatePresence>
        )}

        {isMobile && lesson && (
          <>
            <Sheet open={activePanel === "ai"} onOpenChange={(open) => !open && setActivePanel(null)}>
              <SheetContent side="right" showCloseButton={false} className="no-print w-full sm:max-w-full p-0 gap-0">
                <SheetTitle className="sr-only">{t("rail.ai")}</SheetTitle>
                <AiAssistantPanel
                  lessonContext={{
                    title: lesson.title,
                    classes: lessonClassIds(lesson).map((id) => liveClasses.find((c) => c.id === id)?.name ?? id).join(", "),
                    unit: units.find((u) => u.id === lesson.unitId)?.title,
                    content: editor?.getHTML(),
                    standards: attachedStandards,
                    durationMin,
                  }}
                  classIds={lessonClassIds(lesson)}
                  lessonId={lesson.id}
                  onClose={() => setActivePanel(null)}
                  onInsert={(html) => editor?.chain().focus().insertContent(html).run()}
                />
              </SheetContent>
            </Sheet>

            <Sheet open={activePanel === "details"} onOpenChange={(open) => !open && setActivePanel(null)}>
              <SheetContent side="right" showCloseButton={false} className="no-print w-full sm:max-w-full p-0 gap-0">
                <SheetTitle className="sr-only">{t("rail.details")}</SheetTitle>
                <DetailsPanel
                  lesson={lesson}
                  units={units}
                  onClose={() => setActivePanel(null)}
                  onSetClasses={(classIds) => setLessonClasses(lessonId, classIds)}
                  onSetUnitForClass={(classId, unitId) => setUnitForClass(lessonId, classId, unitId)}
                  onAddScheduleForClass={(classId, date, s, e) => addScheduleForClass(lessonId, classId, date, s, e)}
                  onRemoveScheduleForClass={(classId, idx) => removeScheduleForClass(lessonId, classId, idx)}
                  onSetStandards={(standards) => updateLesson(lessonId, { standards })}
                />
              </SheetContent>
            </Sheet>
          </>
        )}

        {/* Icon rail */}
        <nav className="no-print w-14 shrink-0 bg-card border-l border-border flex flex-col items-center gap-1.5 py-4">
          {railItems.map(({ icon: Icon, title, active, onClick }) => (
            <Button
              key={title}
              variant="ghost"
              size="icon-lg"
              aria-label={title}
              onClick={onClick}
              className={cn(
                "rounded-full",
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

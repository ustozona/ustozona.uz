"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { createPortal } from "react-dom";
import { toast } from "sonner";
import {
  X, FileCheck2, Presentation, Check, Tag, Star,
  ChevronRight, ChevronDown, Loader2, ClipboardCheck, Clapperboard, FileText, Zap, Info,
  Minus, ChevronUp, CalendarClock, Plus, MoreHorizontal, Copy, Trash2, SlidersHorizontal,
  CircleAlert, CheckCircle2, PenLine, CircleDashed, Calendar, Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useGradesStore } from "@/store/useGradesStore";
import {
  useAssignmentEditorStore, isDraftDirty, type EditorSession,
} from "@/store/useAssignmentEditorStore";
import { useLiveClasses } from "@/hooks/useLiveClasses";
import { getSetIdForSessionAction } from "@/server/actions/assess-sessions";
import {
  TOPIC_COLOR_HEX, classColor, assignmentGroupKey, mapTopicIdToClass,
  type Assignment, type AssignmentKind, type ClassData, NO_TOPIC_ID,
} from "@/lib/grades-data";
import { CLASS_COLOR_HEX } from "@/lib/class-colors";
import { MONTHS_UZ_SHORT, DAYS_UZ_SUN } from "@/lib/localization";
import { todayKey, dateKeyToDate } from "@/lib/date-keys";
import { ClassSwatch } from "@/components/ClassSwatch";
import { SectionIcon } from "@/components/ui/section-icon";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogFooter,
  AlertDialogTitle, AlertDialogDescription, AlertDialogCancel, AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { DateKeyPicker } from "@/components/ui/date-key-picker";
import { Separator } from "@/components/ui/separator";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from "@/components/ui/empty";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { EditorSidePanelHeader } from "@/components/ui/editor-side-panel";
import { useIsMobile } from "@/hooks/use-mobile";
import { useResponsivePanelWidth } from "@/hooks/useResponsivePanelWidth";
import TestWorkspaceOverlay from "./TestWorkspaceOverlay";

const NO_TOPIC_VALUE = "__no_topic__";

/* Topshiriq holati — dars muharriridagi holat chipi bilan bir tilda, LEKIN
   qoʻlda tanlanmaydi: u sana va baholardan HISOBLANADI. Qoʻlda oʻzgartirish
   maʼlumotga zid holat yaratardi ("Tugallandi", lekin yarim sinf baholanmagan).
   Toifalar `LessonEditor.STATUS_META` bilan bir xil tonlarda. */
const STATUS_META = {
  draft: { icon: PenLine, cls: "bg-muted text-muted-foreground" },
  undated: { icon: CircleAlert, cls: "bg-warning/10 text-warning" },
  planned: { icon: CalendarClock, cls: "bg-info/10 text-info" },
  grading: { icon: CircleDashed, cls: "bg-muted text-muted-foreground" },
  done: { icon: CheckCircle2, cls: "bg-success/10 text-success" },
} as const;

type AssignmentStatus = keyof typeof STATUS_META;

/* Tafsilotlar qatori — dars muharriridagi `DetailsPanel` tili bilan bir xil
   (`text-label` yorliq USTIDA, `rounded-xl` karta, `size-9` DOIRA ikonka).
   Yangi til oʻylab topilmadi: ikkala muharrir bir xil koʻrinsin. */
const FieldRow = ({
  label,
  icon,
  iconStyle,
  action,
  children,
}: {
  label: string;
  icon: ReactNode;
  iconStyle?: React.CSSProperties;
  action?: ReactNode;
  children: ReactNode;
}) => (
  <div className="flex flex-col">
    <h3 className="text-label mb-2.5">{label}</h3>
    <div className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3">
      <span
        className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground"
        style={iconStyle}
      >
        {icon}
      </span>
      <div className="min-w-0 flex-1 text-sm font-medium text-foreground">{children}</div>
      {action}
    </div>
  </div>
);

/**
 * Topshiriq muharriri — toʻliq ekran overlay (docs/ost-loyihalar-arxitektura.md
 * B5, EMStudio R200/R203–R210). Jurnal ham, Topshiriqlar sahifasi ham shuni
 * ochadi: yaratish ham, tahrirlash ham bitta muharrirda.
 *
 * ── SANA REJIMI ──────────────────────────────────────────────────────────
 * Ikkita sana maydoni oʻrniga bitta sana + rejim (R211): `dueDate` boʻsh
 * boʻlsa "Oʻtkaziladi" (shu kuni sinfda oʻtadi), toʻla boʻlsa "Muddat"
 * (oʻquvchi shu kungacha topshiradi, `dueDate === date`). `date` har doim
 * toʻla — jurnal yil filtri va ustun tartibi shunga tayanadi.
 *
 * ── KOʻP SINF ────────────────────────────────────────────────────────────
 * Bitta topshiriq bir nechta sinfda boʻlishi mumkin (xuddi bir dars rejasi
 * kabi). Amalga oshirish `Topic.groupId` naqshi bilan bir xil: har sinfda
 * ALOHIDA nusxa, umumiy `groupId`. Sarlavha/yoʻriqnoma/toifa/ball umumiy
 * (tahrir hammasiga tegadi), SANA esa har sinfda oʻzi — bir nazorat ishi
 * 5-A da dushanba, 5-B da chorshanba oʻtishi mumkin.
 *
 * ── SESSIYA GLOBAL ───────────────────────────────────────────────────────
 * Holat `useAssignmentEditorStore`da (localStorage) — muharrir
 * `dashboard/layout.tsx` darajasida chiziladi, shuning uchun sahifa
 * almashinuvi qoralamani oʻldirmaydi (Gmail "compose" naqshi). Kichraytirilsa
 * pastda yorliq qoladi; ✕ bosilsa "Qoralama sifatida saqlash / Oʻchirish"
 * soʻraladi.
 *
 * `session.kind === "draft"` — QORALAMA rejimi: DB'ga hech narsa yozilmaydi.
 * Tur kartalari (Test/Taqdimot/...) faqat TANLAYDI — DB yozuvi faqat
 * "Yaratish" bosilganda (`handleCreate`). `manualCreate` faqat tugma
 * yoqiq/oʻchiqligini belgilaydi: `true` boʻlsa tursiz ham (`kind: "manual"`,
 * mazmunsiz baho ustuni) yaratish mumkin; `false` boʻlsa avval tur
 * tanlanishi shart (Topshiriqlar sahifasidan ochilganda).
 */
export default function AssignmentEditorOverlay({
  session,
}: {
  session: EditorSession;
}) {
  const t = useTranslations("AssignmentsPage");
  const classId = session.classId;
  const manualCreate = session.kind === "draft" && session.manualCreate;
  const classDataMap = useGradesStore((s) => s.classDataMap);
  const updateClass = useGradesStore((s) => s.updateClass);
  const setClassDataMap = useGradesStore((s) => s.setClassDataMap);
  const liveClasses = useLiveClasses();
  const isMobile = useIsMobile();
  const detailsPanelWidth = useResponsivePanelWidth(300, 0.25);
  const classData = classDataMap[classId] as ClassData | undefined;

  /* Sessiya holati — global store'da (sahifa almashinuvidan omon chiqadi). */
  const minimized = useAssignmentEditorStore((s) => s.minimized);
  const setMinimized = useAssignmentEditorStore((s) => s.minimize);
  const restore = useAssignmentEditorStore((s) => s.restore);
  const closeSession = useAssignmentEditorStore((s) => s.close);
  const patchDraft = useAssignmentEditorStore((s) => s.patchDraft);
  const openEdit = useAssignmentEditorStore((s) => s.openEdit);

  const [panelOpen, setPanelOpen] = useState(true);
  const [openingQuiz, setOpeningQuiz] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  /* Karta bosilganda ENDI hech narsa yaratilmaydi — faqat tur tanlanadi.
     Haqiqiy yozuv faqat "Yaratish" bosilganda (handleCreate). */
  const [selectedKind, setSelectedKind] = useState<Extract<AssignmentKind, "test" | "deck"> | null>(null);
  /* ✕ bosilganda: qoralama boʻsh boʻlmasa "saqlaymizmi?" soʻraladi (Gmail). */
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const [testWorkspace, setTestWorkspace] = useState<{
    autoOpenNewSet?: boolean;
    autoOpenSetId?: string;
    autoOpenTitle?: string;
  } | null>(null);

  const isDraft = session.kind === "draft";
  const payload = session.kind === "draft" ? session.payload : null;
  const draft = payload?.assignment;
  const draftClassIds = payload?.classIds ?? [];
  const draftDates = payload?.dates ?? {};
  const modeTouched = payload?.modeTouched ?? false;

  /* Tahrir rejimida manba — store (avtosaqlash). Topshiriq oʻchirilgan
     boʻlsa `current` topilmaydi; overlay quyida oʻzini yopadi. */
  const stored =
    session.kind === "edit"
      ? classData?.assignments.find((a) => a.id === session.assignmentId)
      : undefined;
  const assignment = stored;
  const current = (assignment ?? draft)!;
  const isDeck = current.kind === "deck";
  const Icon = isDeck ? Presentation : FileCheck2;
  const groupKey = assignmentGroupKey(current);
  const isDue = !!current.dueDate;
  const topics = classData?.topics ?? [];
  const currentTopic = topics.find((topic) => topic.id === current.topicId);

  /* Guruh aʼzolari — tahrir rejimida store'dan jonli (sinf id → nusxa). */
  const members = useMemo(() => {
    const map: Record<string, Assignment> = {};
    if (isDraft) return map;
    for (const [cid, cd] of Object.entries(classDataMap)) {
      const found = cd.assignments.find((a) => assignmentGroupKey(a) === groupKey);
      if (found) map[cid] = found;
    }
    return map;
  }, [classDataMap, groupKey, isDraft]);

  const selectedIds = isDraft ? draftClassIds : Object.keys(members);
  const selectedClasses = liveClasses.filter((c) => selectedIds.includes(c.id));

  /* Holat — sanadan va baholardan hisoblanadi (qoʻlda tanlanmaydi). */
  const status: AssignmentStatus = useMemo(() => {
    if (isDraft) return "draft";
    const dates = Object.values(members).map((m) => m.date).filter(Boolean) as string[];
    if (!dates.length) return "undated";
    if ([...dates].sort()[0] > todayKey()) return "planned";
    let total = 0;
    let graded = 0;
    for (const [cid, m] of Object.entries(members)) {
      const cd = classDataMap[cid];
      if (!cd) continue;
      total += cd.students.length;
      graded += cd.students.filter((s) => {
        const g = cd.grades.find((x) => x.studentId === s.id && x.assignmentId === m.id);
        return g && (g.score !== null || g.missing);
      }).length;
    }
    return total > 0 && graded >= total ? "done" : "grading";
  }, [isDraft, members, classDataMap]);

  const statusMeta = STATUS_META[status];
  const StatusIcon = statusMeta.icon;

  const dateOf = (cid: string) =>
    isDraft ? (draftDates[cid] ?? todayKey()) : (members[cid]?.date ?? "");

  /* Toifa oʻzgarganda sana rejimini toifaning maqsadidan taxmin qilamiz:
     formativ (uy vazifasi) → muddatli, summativ (nazorat) → oʻtkaziladi.
     Oʻqituvchi tanlagichga bir marta tegsa — aralashmaymiz. */
  useEffect(() => {
    if (!isDraft || modeTouched) return;
    const shouldBeDue = (currentTopic?.purpose ?? "summative") === "formative";
    patchDraft((p) => {
      const want = shouldBeDue ? (p.dates[classId] ?? p.assignment.date ?? todayKey()) : undefined;
      return (p.assignment.dueDate ?? undefined) === want
        ? p
        : { ...p, assignment: { ...p.assignment, dueDate: want } };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTopic?.purpose, isDraft, modeTouched]);

  async function handleOpenQuiz() {
    if (!current.sourceSessionId || openingQuiz) return;
    setOpeningQuiz(true);
    const setId = await getSetIdForSessionAction(current.sourceSessionId);
    setOpeningQuiz(false);
    if (setId) setTestWorkspace({ autoOpenSetId: setId });
  }

  /** Test QORALAMA sifatida allaqachon yaratilgan, lekin savollari yoʻq —
      qurish faqat shu tugma bosilganda, avtomatik emas. */
  function handleStartQuiz() {
    setTestWorkspace({ autoOpenNewSet: true, autoOpenTitle: current.title.trim() || undefined });
  }

  /** Umumiy maydonlar (sarlavha/yoʻriqnoma/toifa/ball) — butun guruhga. */
  function patch(next: Partial<Assignment>) {
    if (isDraft) {
      patchDraft((p) => ({ ...p, assignment: { ...p.assignment, ...next } }));
      return;
    }
    const srcTopic = "topicId" in next ? topics.find((tp) => tp.id === next.topicId) : undefined;
    setClassDataMap((prev) => {
      const out = { ...prev };
      for (const [cid, cd] of Object.entries(out)) {
        if (!cd.assignments.some((a) => assignmentGroupKey(a) === groupKey)) continue;
        out[cid] = {
          ...cd,
          assignments: cd.assignments.map((a) => {
            if (assignmentGroupKey(a) !== groupKey) return a;
            const merged: Assignment = { ...a, ...next };
            // Toifa har sinfda alohida qator — koʻchirilmaydi, qayta topiladi.
            if ("topicId" in next && cid !== classId) {
              merged.topicId = mapTopicIdToClass(srcTopic, cd);
            }
            return merged;
          }),
        };
      }
      return out;
    });
  }

  /** Sana — HAR SINFDA oʻzi. Muddat rejimida `dueDate` bilan birga yuradi. */
  function setDateFor(cid: string, value: string) {
    if (isDraft) {
      patchDraft((p) => ({
        ...p,
        dates: { ...p.dates, [cid]: value },
        assignment:
          cid === classId
            ? { ...p.assignment, date: value, ...(isDue ? { dueDate: value } : {}) }
            : p.assignment,
      }));
      return;
    }
    updateClass(cid, (cd) => ({
      ...cd,
      assignments: cd.assignments.map((a) =>
        assignmentGroupKey(a) === groupKey
          ? { ...a, date: value, ...(a.dueDate ? { dueDate: value } : {}) }
          : a
      ),
    }));
  }

  /** Rejim butun guruhga umumiy — topshiriqning tabiati sinfga qarab oʻzgarmaydi. */
  function setDueMode(due: boolean) {
    if (isDraft) {
      patchDraft((p) => ({
        ...p,
        modeTouched: true,
        assignment: {
          ...p.assignment,
          dueDate: due ? (p.dates[classId] ?? p.assignment.date) : undefined,
        },
      }));
      return;
    }
    setClassDataMap((prev) => {
      const out = { ...prev };
      for (const [cid, cd] of Object.entries(out)) {
        if (!cd.assignments.some((a) => assignmentGroupKey(a) === groupKey)) continue;
        out[cid] = {
          ...cd,
          assignments: cd.assignments.map((a) =>
            assignmentGroupKey(a) === groupKey
              ? { ...a, dueDate: due ? a.date : undefined }
              : a
          ),
        };
      }
      return out;
    });
  }

  /** Sinfni qoʻshish/olib tashlash. Ochilgan sinf doim ichida qoladi. */
  function toggleClass(cid: string) {
    if (cid === classId) return;
    const on = selectedIds.includes(cid);

    if (isDraft) {
      patchDraft((p) => ({
        ...p,
        classIds: on ? p.classIds.filter((x) => x !== cid) : [...p.classIds, cid],
        dates: on
          ? p.dates
          : { ...p.dates, [cid]: p.dates[cid] ?? p.dates[classId] ?? todayKey() },
      }));
      return;
    }

    const snapshot = classDataMap;
    setClassDataMap((prev) => {
      const out = { ...prev };
      const cd = out[cid];
      if (!cd) return prev;
      if (on) {
        const dropped = new Set(
          cd.assignments.filter((a) => assignmentGroupKey(a) === groupKey).map((a) => a.id)
        );
        out[cid] = {
          ...cd,
          assignments: cd.assignments.filter((a) => !dropped.has(a.id)),
          grades: cd.grades.filter((g) => !dropped.has(g.assignmentId)),
        };
      } else {
        out[cid] = {
          ...cd,
          assignments: [
            ...cd.assignments,
            {
              ...current,
              id: crypto.randomUUID(),
              groupId: groupKey,
              topicId: mapTopicIdToClass(currentTopic, cd),
            },
          ],
        };
        // Yolgʻiz topshiriq endi guruhga aylandi — asl nusxaga ham kalit beriladi.
        const own = out[classId];
        if (own) {
          out[classId] = {
            ...own,
            assignments: own.assignments.map((a) =>
              a.id === current.id ? { ...a, groupId: groupKey } : a
            ),
          };
        }
      }
      return out;
    });

    if (on) {
      toast.success(t("toastClassRemoved"), {
        description: liveClasses.find((c) => c.id === cid)?.name,
        action: { label: t("undo"), onClick: () => setClassDataMap(snapshot) },
      });
    }
  }

  /** Tanlangan har bir sinfga nusxa yaratadi; ochilgan sinfnikini qaytaradi. */
  function createAcrossClasses(kind: AssignmentKind, prepend: boolean): Assignment | null {
    if (!draft) return null;
    const gid = crypto.randomUUID();
    const multi = draftClassIds.length > 1;
    const srcTopic = topics.find((tp) => tp.id === draft.topicId);
    const title = draft.title.trim() || t("untitledDeck");

    const copies = draftClassIds
      .filter((cid) => classDataMap[cid])
      .map((cid) => {
        const date = draftDates[cid] ?? todayKey();
        const copy: Assignment = {
          ...draft,
          kind,
          title,
          date,
          dueDate: isDue ? date : undefined,
          id: cid === classId ? draft.id : crypto.randomUUID(),
          topicId: cid === classId ? draft.topicId : mapTopicIdToClass(srcTopic, classDataMap[cid]),
          ...(multi ? { groupId: gid } : {}),
        };
        return { cid, copy };
      });

    setClassDataMap((prev) => {
      const out = { ...prev };
      for (const { cid, copy } of copies) {
        const cd = out[cid];
        if (!cd) continue;
        out[cid] = {
          ...cd,
          assignments: prepend ? [copy, ...cd.assignments] : [...cd.assignments, copy],
        };
      }
      return out;
    });

    return copies.find((c) => c.cid === classId)?.copy ?? null;
  }

  /* Yagona "Yaratish" — kartalar endi faqat tur tanlaydi (selectedKind),
     haqiqiy yozuv shu yerda amalga oshadi. Sarlavha boʻsh boʻlsa CTA'ni
     bloklamaymiz (modal-ux qoidasi) — sarlavha standart nom bilan toʻladi. */
  function handleCreate() {
    if (selectedKind === "test") {
      // Test yozuvi bizda emas, `publishSessionToGrades` orqali — savol
      // toʻplami yaratilib, natija jurnalga ANIQ bosilganda koʻchadi.
      // Shuning uchun "Yaratish" shu yerda ham xuddi kartani bosgandek —
      // qurish oynasini ochadi, boʻsh yozuv hosil qilmaydi.
      handleStartQuiz();
      return;
    }
    if (selectedKind === "deck") {
      const created = createAcrossClasses("deck", true);
      if (!created) return;
      // Taqdimot yaratildi — sessiya darhol TAHRIRga oʻtadi (mazmun ustida ishlanadi).
      openEdit(classId, created.id);
      return;
    }
    const created = createAcrossClasses("manual", false);
    if (!created) return;
    closeSession();
    toast.success(t("assignmentCreated"), { description: created.title });
  }

  /* ✕ — qoralamada boʻsh boʻlmasa Gmail kabi soʻraymiz, boʻsh boʻlsa
     shundoq yopamiz. Tahrirda avtosaqlash bor, soʻrashning maʼnosi yoʻq. */
  function handleCloseRequest() {
    if (isDraft && payload && isDraftDirty(payload)) {
      setConfirmDiscard(true);
      return;
    }
    closeSession();
  }

  function handleSaveAsDraft() {
    setConfirmDiscard(false);
    setMinimized();
    toast.success(t("draftKeptTitle"), { description: t("draftKeptDescription") });
  }

  /* ── "⋯" menyu amallari — ilgari uch joyga sochilgan edi (R204). ── */
  function handleDuplicate() {
    const copy: Assignment = {
      ...current,
      id: crypto.randomUUID(),
      groupId: undefined,
      title: t("copySuffix", { title: current.title }),
    };
    updateClass(classId, (cd) => ({ ...cd, assignments: [copy, ...cd.assignments] }));
    toast.success(t("toastDuplicated"), { description: copy.title });
    closeSession();
  }

  /** Oʻchirish butun guruhga tegadi — topshiriq qaysi sinfda boʻlsa hammasidan. */
  function handleDelete() {
    const snapshot = classDataMap;
    setClassDataMap((prev) => {
      const out = { ...prev };
      for (const [cid, cd] of Object.entries(out)) {
        const dropped = new Set(
          cd.assignments.filter((a) => assignmentGroupKey(a) === groupKey).map((a) => a.id)
        );
        if (!dropped.size) continue;
        out[cid] = {
          ...cd,
          assignments: cd.assignments.filter((a) => !dropped.has(a.id)),
          grades: cd.grades.filter((g) => !dropped.has(g.assignmentId)),
        };
      }
      return out;
    });
    toast.success(t("toastDeleted"), {
      description: current.title,
      action: { label: t("undo"), onClick: () => setClassDataMap(snapshot) },
    });
    closeSession();
  }

  /* Karta ichidagi boshqaruvlar ramkasiz — ramka kartaning oʻzida. */
  const bareControl =
    "h-auto w-full justify-between gap-1.5 border-none bg-transparent p-0 text-sm font-medium text-foreground shadow-none hover:bg-transparent focus-visible:ring-0 [&>svg]:opacity-40";

  const contentTypes: {
    key: string;
    icon: typeof ClipboardCheck;
    title: string;
    desc: string;
    color: string;
    kind?: Extract<AssignmentKind, "test" | "deck">;
  }[] = [
    { key: "assessment", icon: ClipboardCheck, title: t("kindTest"), desc: t("kindTestDesc"), color: "#22c55e", kind: "test" },
    { key: "presentation", icon: Presentation, title: t("kindDeck"), desc: t("kindDeckDesc"), color: "#fb923c", kind: "deck" },
    { key: "video", icon: Clapperboard, title: t("contentVideo"), desc: t("contentVideoDesc"), color: "#f43f5e" },
    { key: "passage", icon: FileText, title: t("contentPassage"), desc: t("contentPassageDesc"), color: "#3b82f6" },
    { key: "flashcards", icon: Zap, title: t("contentFlashcards"), desc: t("contentFlashcardsDesc"), color: "#a855f7" },
  ];

  return createPortal(
    <>
      <div
        className={cn(
          "fixed inset-0 z-40 flex flex-col bg-card animate-in fade-in-0 duration-fast",
          minimized && "hidden"
        )}
      >
        {/* Sarlavha */}
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border px-5 py-4">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <SectionIcon>
              <Icon />
            </SectionIcon>
            <h1 className="min-w-0 truncate text-lg font-semibold text-foreground">
              {current.title || t("untitledDeck")}
            </h1>
            <Tooltip>
              <TooltipTrigger asChild>
                <span
                  className={cn(
                    "inline-flex shrink-0 cursor-default items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold",
                    statusMeta.cls
                  )}
                >
                  <StatusIcon className="size-3.5" />
                  {t(`status_${status}`)}
                </span>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-56">
                {t(`statusHint_${status}`)}
              </TooltipContent>
            </Tooltip>
            {!isDraft && (
              <Badge variant="outline" className="hidden shrink-0 gap-1 text-muted-foreground sm:inline-flex">
                <Check className="size-3" />
                {t("autosaved")}
              </Badge>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            {isDraft && (
              <Button
                onClick={handleCreate}
                disabled={!manualCreate && !selectedKind}
                className="mr-1.5 gap-1.5 font-semibold"
              >
                <Plus className="size-4" />
                {t("create")}
              </Button>
            )}
            {!isDraft && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" aria-label={t("more")}>
                    <MoreHorizontal className="size-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem className="gap-2" onSelect={handleDuplicate}>
                    <Copy className="size-4" />
                    {t("duplicate")}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    variant="destructive"
                    className="gap-2"
                    onSelect={() => setConfirmDelete(true)}
                  >
                    <Trash2 className="size-4" />
                    {t("delete")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            <button
              type="button"
              onClick={setMinimized}
              className="flex size-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <Minus className="size-4" />
              <span className="sr-only">{t("minimize")}</span>
            </button>
            <button
              type="button"
              onClick={handleCloseRequest}
              className="flex size-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <X className="size-4" />
              <span className="sr-only">{t("close")}</span>
            </button>
          </div>
        </div>

        {/* Tana: chap mazmun · yigʻiladigan Tafsilotlar paneli · ikonka reyi
            — dars muharriridagi (LessonEditor) tuzilishning aynan oʻzi. */}
        <div className="flex min-h-0 flex-1 flex-col md:flex-row">
          <div className="min-h-0 flex-1 overflow-y-auto scrollbar-thin p-6">
            <div className="mx-auto flex max-w-2xl flex-col gap-6">
              <div className="flex flex-col gap-1.5">
                <span className="text-label text-muted-foreground">{t("titleLabel")}</span>
                <Input
                  value={current.title}
                  onChange={(e) => patch({ title: e.target.value })}
                  placeholder={t("untitledDeck")}
                  className="h-auto rounded-xl bg-muted/40 px-4 py-3 text-base font-semibold shadow-none"
                />
              </div>

              {isDraft ? (
                <div className="flex flex-col gap-2.5">
                  <span className="text-label text-muted-foreground">{t("chooseContentLabel")}</span>
                  {(() => {
                    const selected = contentTypes.find((ct) => ct.kind === selectedKind);
                    if (selected) {
                      // Test uchun karta bosiladi — qurish oynasi (overlay,
                      // sahifa emas) shu yerdan ochiladi. Taqdimotda hali
                      // ochiladigan alohida muharrir yoʻq — statik qoladi.
                      const openable = selected.kind === "test";
                      return (
                        <div
                          role={openable ? "button" : undefined}
                          tabIndex={openable ? 0 : undefined}
                          onClick={openable ? handleStartQuiz : undefined}
                          onKeyDown={
                            openable
                              ? (e) => {
                                  if (e.key !== "Enter" && e.key !== " ") return;
                                  e.preventDefault();
                                  handleStartQuiz();
                                }
                              : undefined
                          }
                          className={cn(
                            "flex w-full items-center gap-3 rounded-xl border border-border p-3.5 text-left transition-colors",
                            openable && "cursor-pointer hover:bg-muted/50"
                          )}
                        >
                          <span
                            className="flex size-10 shrink-0 items-center justify-center rounded-lg text-white"
                            style={{ backgroundColor: selected.color }}
                          >
                            <selected.icon className="size-5" />
                          </span>
                          <div className="min-w-0 flex-1">
                            <h4 className="truncate text-sm font-semibold text-foreground">{selected.title}</h4>
                            <p className="text-xs text-muted-foreground">
                              {openable ? t("startQuizDescription") : selected.desc}
                            </p>
                          </div>
                          {openable && <ChevronRight className="size-5 shrink-0 text-muted-foreground" />}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedKind(null);
                            }}
                            title={t("attachRemove")}
                            className="flex size-8 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                          >
                            <X className="size-4" />
                            <span className="sr-only">{t("attachRemove")}</span>
                          </button>
                        </div>
                      );
                    }
                    // Kartaga aylanmagan holat — kompakt ikonka reyi (Google
                    // Classroom "Attach" naqshi): bosilganda faqat tur
                    // TANLANADI, karta ustiga chiqadi; haqiqiy yaratish
                    // "Yaratish" tugmasi bilan (handleCreate).
                    return (
                      <div className="flex flex-wrap items-start gap-1">
                        {contentTypes.map((ct) => (
                          <button
                            key={ct.key}
                            type="button"
                            disabled={!ct.kind}
                            title={ct.kind ? undefined : t("attachSoon")}
                            onClick={() => setSelectedKind(ct.kind!)}
                            className="flex w-20 flex-col items-center gap-1.5 rounded-lg px-1 py-2 text-center transition-colors enabled:hover:bg-muted/50 disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            <span
                              className="flex size-11 shrink-0 items-center justify-center rounded-full text-white"
                              style={{ backgroundColor: ct.color }}
                            >
                              <ct.icon className="size-5" />
                            </span>
                            <span className="text-xs font-medium text-foreground">{ct.title}</span>
                          </button>
                        ))}
                      </div>
                    );
                  })()}
                </div>
              ) : !isDeck && current.sourceSessionId ? (
                <button
                  type="button"
                  onClick={handleOpenQuiz}
                  disabled={openingQuiz}
                  className="flex w-full items-center gap-3 rounded-xl border border-border p-4 text-left transition-colors hover:bg-muted/50 disabled:cursor-wait"
                >
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <FileCheck2 className="size-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <h4 className="truncate text-sm font-semibold text-foreground">{current.title}</h4>
                    <p className="text-xs text-muted-foreground">{t("kindTest")}</p>
                  </div>
                  {openingQuiz ? (
                    <Loader2 className="size-5 shrink-0 animate-spin text-muted-foreground" />
                  ) : (
                    <ChevronRight className="size-5 shrink-0 text-muted-foreground" />
                  )}
                </button>
              ) : (
                <Empty className="rounded-xl border border-dashed border-border">
                  <EmptyHeader>
                    <EmptyMedia variant="icon"><Icon /></EmptyMedia>
                    <EmptyTitle>
                      {isDeck ? t("deckEditorSoonTitle") : t("testEditorSoonTitle")}
                    </EmptyTitle>
                    <EmptyDescription>{t("editorSoonDescription")}</EmptyDescription>
                  </EmptyHeader>
                </Empty>
              )}
            </div>
          </div>

          <aside
            className={cn(
              "shrink-0 overflow-hidden border-t border-border bg-card md:border-l md:border-t-0",
              "md:transition-[width] md:duration-200 md:ease-out",
              !panelOpen && "hidden md:block"
            )}
            style={isMobile ? undefined : { width: panelOpen ? detailsPanelWidth : 0 }}
          >
            <div
              className="flex h-full flex-col"
              style={isMobile ? undefined : { width: detailsPanelWidth }}
            >
              <EditorSidePanelHeader
                icon={<SlidersHorizontal />}
                title={t("detailsLabel")}
                onClose={() => setPanelOpen(false)}
                closeLabel={t("close")}
              />
              <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto scrollbar-thin px-5 py-5">
              {/* SINFLAR — koʻp tanlov (dars muharriridagi naqsh). */}
              <div className="flex flex-col">
                <h3 className="text-label mb-2.5">{t("classesLabel")}</h3>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      className="flex w-full items-center justify-between gap-2 rounded-xl border border-border bg-card px-4 py-3 text-left text-sm transition-colors hover:bg-accent/40"
                    >
                      <span className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
                        {selectedClasses.length > 3 ? (
                          <>
                            <span className="flex items-center -space-x-1.5">
                              {selectedClasses.slice(0, 4).map((c) => (
                                <ClassSwatch
                                  key={c.id}
                                  hex={CLASS_COLOR_HEX[classColor(c)]}
                                  className="size-5 ring-2 ring-card"
                                />
                              ))}
                            </span>
                            <span className="text-sm font-medium text-foreground">
                              {t("classCount", { count: selectedClasses.length })}
                            </span>
                          </>
                        ) : (
                          selectedClasses.map((c) => (
                            <span
                              key={c.id}
                              className="inline-flex min-w-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium"
                              style={{
                                backgroundColor: `color-mix(in srgb, ${CLASS_COLOR_HEX[classColor(c)]} 12%, transparent)`,
                                color: `color-mix(in srgb, ${CLASS_COLOR_HEX[classColor(c)]} 55%, var(--foreground))`,
                              }}
                            >
                              <ClassSwatch hex={CLASS_COLOR_HEX[classColor(c)]} className="size-2.5" />
                              <span className="truncate">{c.name}</span>
                            </span>
                          ))
                        )}
                      </span>
                      <ChevronDown className="size-4 shrink-0 opacity-40" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="start"
                    className="max-h-[280px] w-[var(--radix-dropdown-menu-trigger-width)] overflow-y-auto"
                  >
                    {liveClasses.map((c) => {
                      const hex = CLASS_COLOR_HEX[classColor(c)];
                      const on = selectedIds.includes(c.id);
                      const locked = c.id === classId;
                      return (
                        <DropdownMenuItem
                          key={c.id}
                          disabled={locked}
                          title={locked ? t("classLockedHint") : undefined}
                          onSelect={(e) => { e.preventDefault(); toggleClass(c.id); }}
                          className="gap-2.5"
                        >
                          <span
                            className={cn(
                              "flex size-4 shrink-0 items-center justify-center rounded border",
                              on ? "border-transparent" : "border-border"
                            )}
                            style={on ? { backgroundColor: hex } : undefined}
                          >
                            {on && <Check className="size-3 text-white" />}
                          </span>
                          <ClassSwatch hex={hex} className="size-2.5" />
                          <span className="truncate">{c.name}</span>
                        </DropdownMenuItem>
                      );
                    })}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <FieldRow
                label={t("topicLabel")}
                icon={<Tag className="size-4" />}
                iconStyle={
                  currentTopic
                    ? {
                        backgroundColor: `color-mix(in srgb, ${TOPIC_COLOR_HEX[currentTopic.color]} 15%, transparent)`,
                        color: TOPIC_COLOR_HEX[currentTopic.color],
                      }
                    : undefined
                }
              >
                <Select
                  value={current.topicId ?? NO_TOPIC_VALUE}
                  onValueChange={(v) => patch({ topicId: v === NO_TOPIC_VALUE ? NO_TOPIC_ID : v })}
                >
                  <SelectTrigger className={bareControl}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {topics.map((topic) => (
                      <SelectItem key={topic.id} value={topic.id}>
                        {topic.name}
                      </SelectItem>
                    ))}
                    <SelectItem value={NO_TOPIC_VALUE}>{t("noTopic")}</SelectItem>
                  </SelectContent>
                </Select>
              </FieldRow>

              <Separator />

              {/* SANA — bitta maydon, ikki rejim (R211). Koʻp sinfda har
                  sinfning oʻz sanasi boʻladi, rejim esa umumiy. */}
              <div className="flex flex-col">
                <ToggleGroup
                  type="single"
                  variant="outline"
                  className="mb-2.5 w-full"
                  value={isDue ? "due" : "event"}
                  onValueChange={(v) => {
                    if (v) setDueMode(v === "due");
                  }}
                >
                  <ToggleGroupItem value="event" className="flex-1 gap-1.5">
                    <Calendar className="size-4" />
                    {t("modeEvent")}
                  </ToggleGroupItem>
                  <ToggleGroupItem value="due" className="flex-1 gap-1.5">
                    <Clock className="size-4" />
                    {t("modeDue")}
                  </ToggleGroupItem>
                </ToggleGroup>

                {/* Sana kartalari — dars muharriridagi JADVAL bilan bir xil: bir
                    sanada boʻlgan sinflar BITTA kartada guruhlanadi (chapda
                    oy/kun bloki, oʻngda hafta kuni + sinf chiplari). Sanasi
                    yoʻq sinf uchun punktir "Sana qoʻshish" tugmasi. */}
                {(() => {
                  type Item = { classId: string; name: string; hex: string };
                  const withoutDate = selectedClasses.filter((c) => !dateOf(c.id));
                  const groups: { key: string; items: Item[] }[] = [];
                  selectedClasses.forEach((c) => {
                    const key = dateOf(c.id);
                    if (!key) return;
                    let g = groups.find((x) => x.key === key);
                    if (!g) { g = { key, items: [] }; groups.push(g); }
                    g.items.push({ classId: c.id, name: c.name, hex: CLASS_COLOR_HEX[classColor(c)] });
                  });
                  groups.sort((a, b) => a.key.localeCompare(b.key));

                  return (
                    <div className="flex flex-col gap-1.5">
                      {groups.map((g) => {
                        const d = dateKeyToDate(g.key);
                        return (
                          <div
                            key={g.key}
                            className="flex items-stretch gap-3 overflow-hidden rounded-xl border border-border bg-card"
                          >
                            <div className="flex shrink-0 flex-col items-center justify-center bg-muted/50 px-3 py-2">
                              <span className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                                {MONTHS_UZ_SHORT[d.getMonth()]}
                              </span>
                              <span className="text-lg font-bold leading-none text-foreground">
                                {d.getDate()}
                              </span>
                            </div>
                            <div className="flex min-w-0 flex-1 flex-col justify-center gap-1.5 py-2 pr-2">
                              <DateKeyPicker
                                value={g.key}
                                onChange={(v) => g.items.forEach((it) => setDateFor(it.classId, v))}
                                formatLabel={(k) => DAYS_UZ_SUN[dateKeyToDate(k).getDay()]}
                                className="h-auto w-fit min-w-0 justify-start border-none bg-transparent p-0 text-sm font-medium text-foreground shadow-none hover:bg-transparent focus-visible:ring-0 [&_svg]:hidden"
                                ariaLabel={isDue ? t("dueDateLabel") : t("dateLabel")}
                              />
                              {selectedClasses.length > 1 && (
                                <div className="flex flex-wrap items-center gap-1.5">
                                  {g.items.map((it) => (
                                    <span
                                      key={it.classId}
                                      className="inline-flex min-w-0 shrink items-center gap-1.5 rounded-full py-0.5 pl-2 pr-1 text-xs font-medium"
                                      style={{
                                        backgroundColor: `color-mix(in srgb, ${it.hex} 12%, transparent)`,
                                        color: `color-mix(in srgb, ${it.hex} 55%, var(--foreground))`,
                                      }}
                                    >
                                      <ClassSwatch hex={it.hex} className="size-2 shrink-0" />
                                      <span className="truncate">{it.name}</span>
                                      <button
                                        type="button"
                                        onClick={() => setDateFor(it.classId, "")}
                                        aria-label={t("clearDate")}
                                        className="shrink-0 opacity-60 transition-opacity hover:opacity-100"
                                      >
                                        <X className="size-3" />
                                      </button>
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                            {selectedClasses.length === 1 && (
                              <button
                                type="button"
                                onClick={() => setDateFor(g.items[0].classId, "")}
                                aria-label={t("clearDate")}
                                className="shrink-0 self-center pr-2 text-muted-foreground/40 transition-colors hover:text-destructive"
                              >
                                <X className="size-4" />
                              </button>
                            )}
                          </div>
                        );
                      })}
                      {withoutDate.map((c) => (
                        <DateKeyPicker
                          key={c.id}
                          value=""
                          onChange={(v) => setDateFor(c.id, v)}
                          formatLabel={() =>
                            selectedClasses.length > 1 ? `${c.name} — ${t("addDate")}` : t("addDate")
                          }
                          className="w-full justify-center gap-2 rounded-lg border border-dashed border-border bg-transparent py-2.5 text-sm font-normal text-muted-foreground shadow-none hover:bg-accent/40 hover:text-foreground"
                          ariaLabel={`${c.name} — ${t("addDate")}`}
                        />
                      ))}
                    </div>
                  );
                })()}
              </div>

              <FieldRow
                label={t("maxScoreLabel")}
                icon={<Star className="size-4" />}
                action={
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button type="button" className="shrink-0 text-muted-foreground/60 hover:text-foreground">
                        <Info className="size-3.5" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-56">
                      {t("maxScoreTooltip")}
                    </TooltipContent>
                  </Tooltip>
                }
              >
                <Input
                  type="number"
                  min={1}
                  value={current.maxScore}
                  onChange={(e) => patch({ maxScore: Number(e.target.value) || 0 })}
                  className={bareControl}
                />
              </FieldRow>
              </div>
            </div>
          </aside>

          {/* Ikonka reyi — hozircha bitta band (Tafsilotlar). "Baholash"
              paneli qoʻshilganda (R210) shu yerga ikkinchi ikonka tushadi. */}
          <nav className="flex w-full shrink-0 flex-row items-center justify-center gap-1.5 border-t border-border bg-card py-2 md:w-14 md:flex-col md:justify-start md:border-l md:border-t-0 md:py-4">
            <Button
              variant="ghost"
              size="icon-lg"
              aria-label={t("detailsLabel")}
              onClick={() => setPanelOpen((o) => !o)}
              className={cn(
                "rounded-full",
                panelOpen &&
                  "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground"
              )}
            >
              <SlidersHorizontal className="size-5" />
            </Button>
          </nav>
        </div>

        {testWorkspace && (
          <TestWorkspaceOverlay
            classId={classId}
            className={classData?.info.name ?? ""}
            autoOpenNewSet={testWorkspace.autoOpenNewSet}
            autoOpenSetId={testWorkspace.autoOpenSetId}
            autoOpenTitle={testWorkspace.autoOpenTitle}
            onClose={() => setTestWorkspace(null)}
          />
        )}
      </div>

      {/* Kichraytirilgan yorliq — Windows vazifalar panelidagidek: bosilsa
          overlay oʻsha holatida (qoralama saqlanib) qayta ochiladi. Ikonka
          TOIFA rangida (FieldRow bilan bir til), sarlavha qisqarganda
          toʻlig'i tooltipda koʻrinadi. */}
      {minimized && (
        <div className="fixed bottom-4 right-4 z-40 flex items-center gap-1 rounded-xl border border-border bg-card p-1.5 card-elevation animate-in fade-in-0 slide-in-from-bottom-2 duration-fast">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={restore}
                className="flex min-w-0 items-center gap-2.5 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-muted"
              >
                <span
                  className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground"
                  style={
                    currentTopic
                      ? {
                          backgroundColor: `color-mix(in srgb, ${TOPIC_COLOR_HEX[currentTopic.color]} 15%, transparent)`,
                          color: TOPIC_COLOR_HEX[currentTopic.color],
                        }
                      : undefined
                  }
                >
                  <Icon className="size-4" />
                </span>
                <span className="max-w-48 truncate text-sm font-medium text-foreground">
                  {current.title || t("untitledDeck")}
                </span>
                <ChevronUp className="size-4 shrink-0 text-muted-foreground" />
                <span className="sr-only">{t("restore")}</span>
              </button>
            </TooltipTrigger>
            <TooltipContent side="top" align="end" className="max-w-64">
              <p className="font-semibold">{current.title || t("untitledDeck")}</p>
              <p className="text-background/70">
                {[currentTopic?.name, t(`status_${status}`)].filter(Boolean).join(" · ")}
              </p>
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={handleCloseRequest}
                className="flex size-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-destructive hover:text-white"
              >
                <X className="size-3.5" />
                <span className="sr-only">{t("discardDraft")}</span>
              </button>
            </TooltipTrigger>
            <TooltipContent side="top">{t("discardDraft")}</TooltipContent>
          </Tooltip>
        </div>
      )}

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("deleteDialogTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {selectedClasses.length > 1
                ? t("deleteDialogDescriptionMulti", {
                    title: current.title,
                    count: selectedClasses.length,
                  })
                : t("deleteDialogDescription", { title: current.title })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={handleDelete}
            >
              {t("delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ✕ bosilgan qoralama — Gmail'dagi "Save draft / Discard" tanlovi.
          Kichraytirilgan holatda qoralama allaqachon yorliqda turibdi,
          shuning uchun "saqlash" tugmasi koʻrsatilmaydi. */}
      <AlertDialog open={confirmDiscard} onOpenChange={setConfirmDiscard}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("discardDialogTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("discardDialogDescription", {
                title: current.title.trim() || t("untitledDeck"),
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={closeSession}
            >
              {t("discardDraft")}
            </AlertDialogAction>
            {!minimized && (
              <AlertDialogAction onClick={handleSaveAsDraft}>
                {t("saveAsDraft")}
              </AlertDialogAction>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>,
    document.body
  );
}

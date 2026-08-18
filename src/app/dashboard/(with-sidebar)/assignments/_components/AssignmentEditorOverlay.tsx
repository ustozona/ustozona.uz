"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { createPortal } from "react-dom";
import { toast } from "sonner";
import {
  X, FileCheck2, Presentation, Check, Tag, Star, Library, CloudOff,
  ChevronRight, ChevronDown, Loader2, ClipboardCheck, Info, Users,
  Plus, MoreHorizontal, Copy, Trash2, SlidersHorizontal,
  Calendar, Clock, Lock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useGradesStore } from "@/store/useGradesStore";
import {
  useAssignmentEditorStore, isDraftDirty, type EditorSession,
} from "@/store/useAssignmentEditorStore";
import { useLiveClasses } from "@/hooks/useLiveClasses";
import { getSetIdForSessionAction } from "@/server/actions/assess-sessions";
import { getSetAction, getSetMetaAction } from "@/server/actions/assess";
import type { SetMeta } from "@/server/dal/assess/sets";
import type { ActivitySetRow } from "@/server/db/schema";
import {
  TOPIC_COLOR_HEX, classColor, assignmentGroupKey, mapTopicIdToClass,
  buildScoreSuggestions,
  type Assignment, type AssignmentKind, type ClassData, NO_TOPIC_ID,
} from "@/lib/grades-data";
import { CLASS_COLOR_HEX } from "@/lib/class-colors";
import { MONTHS_UZ_SHORT, DAYS_UZ_SUN } from "@/lib/localization";
import { todayKey, dateKeyToDate } from "@/lib/date-keys";
import { ClassSwatch } from "@/components/ClassSwatch";
import { SectionIcon } from "@/components/ui/section-icon";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { AssignmentStatusChip } from "@/components/AssignmentStatusChip";
import { type StatusInfo } from "@/lib/assignment-status";
import { useSyncFailing } from "@/store/useSyncHealthStore";
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
import SetBuilderOverlay from "./test/SetBuilderOverlay";
import SessionPanelModal from "./test/SessionPanelModal";
import AttachTestDialog from "./AttachTestDialog";
import { MaterialKindPicker } from "@/components/materials/MaterialKindPicker";

const NO_TOPIC_VALUE = "__no_topic__";

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
 * `session.kind === "draft"` — QORALAMA rejimi: `assignments` ga hech narsa
 * yozilmaydi, yozuv faqat "Yaratish" bosilganda (`handleCreate`).
 *
 * ── MAZMUN ILOVA, TUR EMAS (R213) ────────────────────────────────────────
 * Topshiriq — JURNAL USTUNI; test/taqdimot esa unga biriktiriladigan mazmun.
 * Shuning uchun `kind` tanlanmaydi, HISOBLANADI: `setId` bor → "test",
 * yoʻq → "manual" (mazmunsiz ustun — qogʻozdagi ish, ogʻzaki soʻrov uchun
 * toʻlaqonli holat, nuqson emas). Buning ikki amaliy oqibati:
 *
 *  1. Mazmun boʻlimi qoralamada ham, TAHRIRDA ham chiziladi. Ilgari u faqat
 *     qoralamada bor edi: yaratilgandan keyin test biriktirish yoʻli umuman
 *     yoʻq edi va mazmunsiz ustunga "Test muharriri tez orada" deb yozilardi
 *     (u aslida test emas edi).
 *  2. "Test" tugmasi turni belgilamaydi — toʻplam muharririni ochadi.
 *     `kind`/`setId` faqat toʻplam SAQLANGANDA yoziladi, shuning uchun
 *     "test deb belgilangan, lekin orqasida hech nima yoʻq" holati
 *     tugʻilmaydi. Qoralama tashlansa toʻplam yetim qoladi — bu ataylab:
 *     u Topshiriqlar sahifasidagi "Tayyorlangan testlar" roʻyxatida turadi
 *     va qayta ishlatiladi.
 *
 * Yaratish qoidasi ikkala eshikda BIR XIL (jurnal ham, Topshiriqlar sahifasi
 * ham): mazmun ixtiyoriy, "Yaratish" hech qachon oʻchiq turmaydi.
 */
export default function AssignmentEditorOverlay({
  session,
}: {
  session: EditorSession;
}) {
  const t = useTranslations("AssignmentsPage");
  const classId = session.classId;
  const classDataMap = useGradesStore((s) => s.classDataMap);
  const updateClass = useGradesStore((s) => s.updateClass);
  const setClassDataMap = useGradesStore((s) => s.setClassDataMap);
  const liveClasses = useLiveClasses();
  const syncFailing = useSyncFailing("grades");
  const isMobile = useIsMobile();
  const detailsPanelWidth = useResponsivePanelWidth(300, 0.25);
  const classData = classDataMap[classId] as ClassData | undefined;

  /* Sessiya holati — global store'da (sahifa almashinuvidan omon chiqadi). */
  const parkSession = useAssignmentEditorStore((s) => s.park);
  const closeSession = useAssignmentEditorStore((s) => s.close);
  const patchDraft = useAssignmentEditorStore((s) => s.patchDraft);

  const [panelOpen, setPanelOpen] = useState(true);
  const [openingQuiz, setOpeningQuiz] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  /* Biriktirilgan toʻplam pasporti (nom · savol soni · maks. ball).
     Toʻplamning butun qoralamasi kerak emas — shuning uchun yengil amal. */
  const [setMeta, setSetMeta] = useState<SetMeta | null>(null);
  /* Mavjud testni tanlash oynasi — toʻplam muharrirdan tashqarida ham
     tugʻiladi (bank, oldingi ishlar), ularni ulash yoʻli kerak. */
  const [attachOpen, setAttachOpen] = useState(false);
  /* Savol muharriri va sessiya paneli TOʻGʻRIDAN-TOʻGʻRI ochiladi.
     Ilgari orada "Testlar (5-A)" roʻyxati turardi — sidebar'dan olib
     tashlangan `/dashboard/baholash` sahifasining qoldigʻi. U uchinchi
     toʻliq-ekran qavatini qoʻshardi va faqat savol muharriri yopilganda
     koʻrinardi ("qayerdaman?" ekrani). Sinf testlari roʻyxatining uyi —
     Topshiriqlar sahifasi. */
  const [builder, setBuilder] = useState<{ setId?: string } | null>(null);
  const [sessionSet, setSessionSet] = useState<ActivitySetRow | null>(null);
  const [sessionLoading, setSessionLoading] = useState(false);

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
  /* Biriktirilgan toʻplam — mazmun kartasining va maks. ball qulfining
     yagona sharti (R215/R216). `sourceSessionId` esa ESKI, sessiyadan
     tugʻilgan ustunlar uchun: ular biriktirilmagan, nashr qilingan. */
  const attachedSetId = current.setId;
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

  /* Maks. ball takliflari — butun jurnaldan (bitta sinf emas): oʻqituvchi
     odatda hamma sinfda bir xil maxraj bilan ishlaydi. */
  const scoreSuggestions = useMemo(
    () =>
      buildScoreSuggestions(
        Object.values(classDataMap).flatMap((cd) => cd.assignments)
      ),
    [classDataMap]
  );

  /* Holat — sanadan va baholardan hisoblanadi (qoʻlda tanlanmaydi).

     Koʻp sinfda maxraj faqat SANASI KELGAN sinflardan yigʻiladi: nazorat
     5-A da dushanba, 5-B da jumada boʻlsa, dushanbada 5-B ning oʻquvchilari
     "baholanmagan" deb sanalishi notoʻgʻri edi (ilgari eng erta sana
     olinardi va butun topshiriq "Baholanmoqda" boʻlib qolardi). */
  const status: StatusInfo = useMemo(() => {
    if (isDraft) return { kind: "draft" };
    const dated = Object.entries(members).filter(([, m]) => m.date);
    if (!dated.length) return { kind: "undated" };

    const today = todayKey();
    const started = dated.filter(([, m]) => m.date! <= today);
    if (!started.length) return { kind: "planned" };

    let total = 0;
    let graded = 0;
    for (const [cid, m] of started) {
      const cd = classDataMap[cid];
      if (!cd) continue;
      total += cd.students.length;
      graded += cd.students.filter((s) => {
        const g = cd.grades.find((x) => x.studentId === s.id && x.assignmentId === m.id);
        return g && (g.score !== null || g.missing);
      }).length;
    }
    if (total === 0) return { kind: "planned" };

    /* Bugun boshlangan va hali hech nima kiritilmagan — bu "baholanmoqda"
       emas. Dars kunning istalgan soatida boʻlishi mumkin, biz esa faqat
       sanani bilamiz; "0/25" oʻrniga halol "Bugun" deymiz. */
    if (graded === 0 && started.every(([, m]) => m.date === today)) {
      return { kind: "today" };
    }

    // Kelgusi sinf qolgan boʻlsa "Tugallandi" deb boʻlmaydi.
    const allStarted = started.length === dated.length;
    return graded >= total && allStarted
      ? { kind: "done", graded, total }
      : { kind: "grading", graded, total };
  }, [isDraft, members, classDataMap]);

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

  /* Biriktirilgan toʻplam pasporti. Toʻplam oʻchirilgan boʻlsa `null`
     qaytadi — karta oʻzini "topilmadi" holatida chizadi, halqa esa
     `on delete set null` bilan serverda allaqachon uzilgan. */
  useEffect(() => {
    if (!attachedSetId) {
      setSetMeta(null);
      return;
    }
    let alive = true;
    getSetMetaAction(attachedSetId)
      .then((meta) => alive && setSetMeta(meta))
      .catch(() => alive && setSetMeta(null));
    return () => {
      alive = false;
    };
  }, [attachedSetId]);

  /* R216 — test biriktirilgan boʻlsa maks. ball SAVOLLAR SONIdan olinadi.
     Jonli yoʻlda `publish.ts` uni baribir qayta hisoblaydi, qogʻoz yoʻlida
     esa hech kim: oʻqituvchi "8" yozadi (8/10 demoqchi), tizim standart
     100 maxraji bilan 8% deb oʻqirdi. */
  useEffect(() => {
    if (!attachedSetId || !setMeta || setMeta.maxScore <= 0) return;
    if (current.maxScore === setMeta.maxScore) return;
    patch({ maxScore: setMeta.maxScore });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attachedSetId, setMeta, current.maxScore]);

  /** Eski, sessiyadan nashr qilingan ustun — toʻplamini sessiya panelida
      ochadi (`sourceSessionId` → `setId` → qator). */
  async function handleOpenQuiz() {
    if (!current.sourceSessionId || openingQuiz) return;
    setOpeningQuiz(true);
    const setId = await getSetIdForSessionAction(current.sourceSessionId);
    if (setId) await openSessionPanel(setId);
    setOpeningQuiz(false);
  }

  /** Sessiya paneli toʻliq qator talab qiladi (`classId`, `items`),
      topshiriqda esa faqat `setId` bor — shuning uchun oldin olib kelamiz. */
  async function openSessionPanel(setId: string) {
    setSessionLoading(true);
    try {
      const row = await getSetAction(setId);
      if (row) setSessionSet(row);
      else toast.error(t("setMissing"));
    } catch {
      toast.error(t("setMissing"));
    } finally {
      setSessionLoading(false);
    }
  }

  /** Yangi test tuzish — savol muharriri darhol ochiladi. `kind`/`setId`
      shu yerda EMAS, toʻplam saqlanganda yoziladi (`handleSetSaved`): aks
      holda "test deb belgilangan, lekin orqasida hech nima yoʻq" holati
      tugʻilardi. */
  function handleAttachTest() {
    setAttachOpen(false);
    setBuilder({});
  }

  /** Mavjud toʻplam tanlandi — halqa darhol bogʻlanadi. */
  function handlePickExistingSet(set: { id: string; title: string }) {
    setAttachOpen(false);
    handleSetSaved(set);
    toast.success(t("attachedTitle"), { description: set.title });
  }

  /** Biriktirilgan testning savollarini tahrirlash. */
  function handleEditAttachedTest() {
    if (!attachedSetId) return;
    setBuilder({ setId: attachedSetId });
  }

  /** Sessiya paneli — testni jonli/mustaqil/qogʻoz yoʻli bilan oʻtkazish. */
  function handleRunSession() {
    if (!attachedSetId || sessionLoading) return;
    void openSessionPanel(attachedSetId);
  }

  /** Toʻplam saqlandi — endi halqa haqiqiy. Sarlavha hali boʻsh boʻlsa
      toʻplam nomini olamiz: oʻqituvchi bir nomni ikki marta yozmasin.
      Xabar avtosaqlashda ham keladi, shuning uchun oʻzgarish boʻlmasa
      tegmaymiz — aks holda har ikki soniyada bekorga sync yuborilardi. */
  function handleSetSaved(set: { id: string; title: string }) {
    const needsTitle = !current.title.trim();
    if (current.setId === set.id && current.kind === "test" && !needsTitle) return;
    patch({
      kind: "test",
      setId: set.id,
      ...(needsTitle ? { title: set.title } : {}),
    });
  }

  /* ── MAKS. BALL — OQIBATLI MAYDON ────────────────────────────────────
     Maks. ball oʻzgarsa katakdagi XOM ball oʻzgarmaydi, lekin foiz qayta
     hisoblanadi: 10 savollik testda "8" — 80%, maks. ball 100 boʻlsa oʻsha
     "8" endi 8%. Jurnalga qarab buni sezib boʻlmaydi, chunki koʻrinadigan
     raqam oʻsha-oʻsha. Canvas/PowerSchool shu sabab "Saqlash" tugmasi
     qoʻyadi; biz avtosaqlashni saqlaymiz (global sessiya arxitekturasi),
     lekin OQIBATNI aytamiz — tugma faqat "qoʻllaymizmi?" deb soʻrardi,
     nechta baho qayta hisoblanishini aytmasdi. */
  const gradedCount = useMemo(() => {
    if (isDraft) return 0;
    let n = 0;
    for (const [cid, m] of Object.entries(members)) {
      const cd = classDataMap[cid];
      if (!cd) continue;
      n += cd.grades.filter((g) => g.assignmentId === m.id && g.score !== null).length;
    }
    return n;
  }, [isDraft, members, classDataMap]);

  /** Tahrir boshlanishidagi surat — "Bekor qilish" shu holatga qaytaradi. */
  const maxScoreUndo = useRef<{ map: typeof classDataMap; value: number } | null>(null);

  function announceMaxScore(before: typeof classDataMap, previous: number) {
    if (gradedCount === 0 || previous === current.maxScore) return;
    toast.warning(t("maxScoreRecalculated", { count: gradedCount }), {
      description: t("maxScoreRecalculatedHint", { from: previous, to: current.maxScore }),
      action: { label: t("undo"), onClick: () => setClassDataMap(before) },
    });
  }

  /** Chip bilan tanlash — bir bosish, shuning uchun darhol xabar beriladi. */
  function pickMaxScore(next: number) {
    if (next === current.maxScore) return;
    const before = classDataMap;
    const previous = current.maxScore;
    patch({ maxScore: next });
    if (isDraft || gradedCount === 0) return;
    toast.warning(t("maxScoreRecalculated", { count: gradedCount }), {
      description: t("maxScoreRecalculatedHint", { from: previous, to: next }),
      action: { label: t("undo"), onClick: () => setClassDataMap(before) },
    });
  }

  /** Ajratish — faqat HALQA uziladi: toʻplam ham, baholar ham qolaveradi
      (R215). Ustun oddiy baho ustuniga aylanadi, maks. ball yana ochiladi. */
  function handleDetachTest() {
    patch({ kind: "manual", setId: undefined });
    toast.success(t("detachedTitle"), { description: t("detachedDescription") });
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
  function createAcrossClasses(kind: AssignmentKind): Assignment | null {
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
        out[cid] = { ...cd, assignments: [...cd.assignments, copy] };
      }
      return out;
    });

    return copies.find((c) => c.cid === classId)?.copy ?? null;
  }

  /* Yagona "Yaratish" — mazmun bor-yoʻqligidan qatʼi nazar jurnal ustuni
     TUGʻILADI (R214). Ilgari "Test" tanlangan boʻlsa hech nima yaratilmasdi:
     oʻqituvchi savollarni yozardi, jurnal esa boʻsh qolardi va ish yoʻqolgandek
     koʻrinardi. Sarlavha boʻsh boʻlsa ham bloklamaymiz (modal-ux qoidasi) —
     standart nom bilan toʻladi. */
  function handleCreate() {
    const created = createAcrossClasses(current.kind ?? "manual");
    if (!created) return;
    closeSession();
    toast.success(t("assignmentCreated"), { description: created.title });
  }

  /* ✕ — HECH NIMA SOʻRAMAYDI, chunki hech nima yoʻqolmaydi.
     Qoralama "parkka" oʻtadi va Topshiriqlar roʻyxatida karta boʻlib
     turadi; tahrirda esa avtosaqlash bor, sessiyani saqlashning maʼnosi
     yoʻq. Ilgari bu yerda "Qoralama sifatida saqlash / Oʻchirish" dialogi
     chiqardi, uning "saqlash" tugmasi esa aynan kichraytirish tugmasini
     takrorlardi — bitta amal ikki joyda edi. */
  function handleCloseRequest() {
    if (isDraft && payload && isDraftDirty(payload)) {
      parkSession();
      toast.success(t("draftKeptTitle"), { description: t("draftKeptDescription") });
      return;
    }
    closeSession();
  }

  /** Qoralamani butunlay tashlash — ⋯ menyusidagi yagona yoʻqotuvchi amal. */
  function handleDiscardDraft() {
    closeSession();
    toast.success(t("draftDiscarded"));
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

  /* ── MAZMUN BOʻLIMI ─────────────────────────────────────────────────
     Toʻrt holat, ikkala rejimda ham bir xil chiziladi. Tartib muhim:
     biriktirilgan toʻplam eng aniq belgi, `sourceSessionId` esa eski
     (sessiyadan nashr qilingan) ustunlar uchun zaxira. */
  function renderContent() {
    if (attachedSetId) {
      return (
        <div className="flex items-center gap-3 rounded-xl border border-border p-3.5">
          <button
            type="button"
            onClick={handleEditAttachedTest}
            className="flex min-w-0 flex-1 items-center gap-3 text-left"
          >
            <span
              className="flex size-10 shrink-0 items-center justify-center rounded-lg text-white"
              style={{ backgroundColor: "#22c55e" }}
            >
              <ClipboardCheck className="size-5" />
            </span>
            <div className="min-w-0 flex-1">
              <h4 className="truncate text-sm font-semibold text-foreground">
                {setMeta?.title ?? (current.title || t("kindTest"))}
              </h4>
              <p className="truncate text-xs text-muted-foreground">
                {setMeta
                  ? `${t("kindTest")} · ${t("questionCount", { count: setMeta.itemCount })}`
                  : t("loadingLabel")}
              </p>
            </div>
          </button>
          <Button
            variant="outline"
            size="sm"
            className="shrink-0 gap-1.5"
            disabled={sessionLoading}
            onClick={handleRunSession}
          >
            {sessionLoading ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Users className="size-3.5" />
            )}
            <span className="hidden sm:inline">{t("runSession")}</span>
          </Button>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={handleDetachTest}
                className="flex size-8 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <X className="size-4" />
                <span className="sr-only">{t("detachTest")}</span>
              </button>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-56">
              {t("detachTestHint")}
            </TooltipContent>
          </Tooltip>
        </div>
      );
    }

    if (!isDeck && current.sourceSessionId) {
      return (
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
      );
    }

    if (isDeck) {
      return (
        <Empty className="rounded-xl border border-dashed border-border">
          <EmptyHeader>
            <EmptyMedia variant="icon"><Presentation /></EmptyMedia>
            <EmptyTitle>{t("deckEditorSoonTitle")}</EmptyTitle>
            <EmptyDescription>{t("editorSoonDescription")}</EmptyDescription>
          </EmptyHeader>
        </Empty>
      );
    }

    /* Mazmunsiz — bu NUQSON EMAS, toʻlaqonli holat: qogʻozdagi ish,
       ogʻzaki soʻrov, sinfdan tashqarida oʻtgan ish. Ilgari bu yerda
       "Test muharriri tez orada" yozilardi va ustun buzuq testdek
       koʻrinardi. */
    return (
      <div className="flex flex-col gap-4 rounded-xl border border-dashed border-border p-5">
        <div className="flex items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
            <FileCheck2 className="size-5" />
          </span>
          <div className="min-w-0 flex-1">
            <h4 className="text-sm font-semibold text-foreground">{t("noContentTitle")}</h4>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              {t("noContentDescription")}
            </p>
          </div>
        </div>
        {/* Shakl tanlovi — Wayground naqshi. Tayyor boʻlmagan turlar ham
            koʻrinadi (soʻniq): ilgari ular haqida faqat kulrang matn
            yozilardi, endi oʻqituvchi nima kelayotganini KOʻRADI. */}
        <MaterialKindPicker onPick={(kind) => kind === "test" && handleAttachTest()} />

        {/* Ikki yoʻl ochiq turadi: koʻpincha yangi test tuziladi, lekin
            bankdan olingan yoki ilgari tuzilgan toʻplam ham shu ustunga
            ulanishi kerak — ilgari ikkinchi yoʻl umuman yoʻq edi.
            Kutubxona yoʻli endi shaklga bogʻliq emas, shuning uchun
            tanlov qatoridan pastda alohida turadi. */}
        <Button variant="ghost" className="gap-2 self-start" onClick={() => setAttachOpen(true)}>
          <Library className="size-4" />
          {t("attachExisting")}
        </Button>
      </div>
    );
  }

  return createPortal(
    <>
      <div
        className="fixed inset-0 z-40 flex flex-col bg-card animate-in fade-in-0 duration-fast"
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
            {/* Holat chipi — roʻyxat qatoridagi bilan bitta komponent. */}
            <AssignmentStatusChip status={status} />
            {/* ⚠️ Bu yerda ilgari doimiy «Saqlandi» nishoni turardi. U holat
                emas, konstanta edi: sinxronizatsiya XATO berganda ham
                «Saqlandi» deb turaverardi. Sukunat = saqlangan (Notion
                naqshi), gapiriladigan yagona holat — muammo. */}
            {syncFailing && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="inline-flex shrink-0 cursor-default items-center gap-1.5 rounded-full bg-warning/10 px-2.5 py-1 text-xs font-semibold text-warning">
                    <CloudOff className="size-3.5" />
                    <span className="hidden sm:inline">{t("syncFailing")}</span>
                  </span>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-56">
                  {t("syncFailingHint")}
                </TooltipContent>
              </Tooltip>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            {isDraft && (
              <Button onClick={handleCreate} className="mr-1.5 gap-1.5 font-semibold">
                <Plus className="size-4" />
                {t("create")}
              </Button>
            )}
            {/* "⋯" — YOʻQOTUVCHI amallarning yagona uyi. Qoralamada u
                bitta bandli: `✕` endi hech nimani oʻchirmagani uchun
                "bu qoralama kerak emas" deyish yoʻli shu yerda. */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" aria-label={t("more")}>
                  <MoreHorizontal className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                {isDraft ? (
                  <DropdownMenuItem
                    variant="destructive"
                    className="gap-2"
                    onSelect={handleDiscardDraft}
                  >
                    <Trash2 className="size-4" />
                    {t("deleteDraft")}
                  </DropdownMenuItem>
                ) : (
                  <>
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
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
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

              {/* YOʻRIQNOMA (R203) — maydon tipda, bazada, sync'da va oltita
                  tilda tayyor edi, lekin hech qayerda chizilmasdi. Referensda
                  (EMStudio/Classroom) u sarlavhadan keyingi eng katta maydon:
                  oʻqituvchi "nima qilinsin"ni aynan shu yerda yozadi. */}
              <div className="flex flex-col gap-1.5">
                <span className="text-label text-muted-foreground">{t("instructionsLabel")}</span>
                <Textarea
                  value={current.instructions ?? ""}
                  onChange={(e) => patch({ instructions: e.target.value })}
                  placeholder={t("instructionsPlaceholder")}
                  className="min-h-24 rounded-xl bg-muted/40 px-4 py-3 text-sm shadow-none"
                />
              </div>

              {/* MAZMUN — qoralamada ham, tahrirda ham. */}
              <div className="flex flex-col gap-2.5">
                <span className="text-label text-muted-foreground">{t("contentLabel")}</span>
                {renderContent()}
              </div>
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

              {/* MAKS. BALL — test biriktirilgan boʻlsa QULF (R216): maxraj
                  savollar sonidan olinadi, aks holda qogʻozdagi "8/10" tizimda
                  8% boʻlib oʻqilardi. */}
              <FieldRow
                label={t("maxScoreLabel")}
                icon={<Star className="size-4" />}
                action={
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button type="button" className="shrink-0 text-muted-foreground/60 hover:text-foreground">
                        {attachedSetId ? <Lock className="size-3.5" /> : <Info className="size-3.5" />}
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-56">
                      {attachedSetId ? t("maxScoreLockedTooltip") : t("maxScoreTooltip")}
                    </TooltipContent>
                  </Tooltip>
                }
              >
                {attachedSetId ? (
                  <span className="text-sm font-medium text-muted-foreground">{current.maxScore}</span>
                ) : (
                  /* Xabar har bosishda emas, tahrir TUGAGANDA (blur) —
                     "1", "10", "100" deb yozilayotganda uch marta
                     ogohlantirish shovqin boʻlardi. */
                  <Input
                    type="number"
                    min={1}
                    value={current.maxScore}
                    onFocus={() => {
                      maxScoreUndo.current = { map: classDataMap, value: current.maxScore };
                    }}
                    onChange={(e) => patch({ maxScore: Number(e.target.value) || 0 })}
                    onBlur={() => {
                      const snap = maxScoreUndo.current;
                      maxScoreUndo.current = null;
                      if (snap) announceMaxScore(snap.map, snap.value);
                    }}
                    className={bareControl}
                  />
                )}
              </FieldRow>

              {/* Tez tanlash (R207) — oʻqituvchining oʻz jurnalidan olingan
                  maxrajlar. Qulflangan holatda koʻrsatilmaydi: bosilsa ham
                  ishlamaydigan tugma faqat chalgʻitardi. */}
              {!attachedSetId && scoreSuggestions.length > 0 && (
                <div className="-mt-3 flex flex-wrap items-center gap-1.5">
                  {scoreSuggestions.map((score) => (
                    <button
                      key={score}
                      type="button"
                      onClick={() => pickMaxScore(score)}
                      aria-pressed={current.maxScore === score}
                      className={cn(
                        "rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
                        current.maxScore === score
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border text-muted-foreground hover:bg-muted hover:text-foreground"
                      )}
                    >
                      {score}
                    </button>
                  ))}
                </div>
              )}
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

        {attachOpen && (
          <AttachTestDialog
            classId={classId}
            assignmentId={current.id}
            onPick={handlePickExistingSet}
            onCreateNew={handleAttachTest}
            onClose={() => setAttachOpen(false)}
          />
        )}

        {/* Savol muharriri — muharrir ustida, oraliq ekransiz. */}
        {builder && (
          <SetBuilderOverlay
            classId={classId}
            setId={builder.setId}
            initialTitle={builder.setId ? undefined : current.title.trim() || undefined}
            onSaved={(set) => handleSetSaved(set)}
            onClose={() => setBuilder(null)}
          />
        )}

        {sessionSet && (
          <SessionPanelModal
            set={sessionSet}
            classId={classId}
            onClose={() => setSessionSet(null)}
          />
        )}
      </div>


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

    </>,
    document.body
  );
}

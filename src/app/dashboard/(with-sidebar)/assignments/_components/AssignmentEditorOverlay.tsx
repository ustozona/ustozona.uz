"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode, type CSSProperties } from "react";
import { useTranslations } from "next-intl";
import { createPortal } from "react-dom";
import { toast } from "sonner";
import {
  X,
  FileCheck2,
  Check,
  Tag,
  Star,
  CloudOff,
  ChevronRight,
  ChevronDown,
  Info,
  Plus,
  MoreHorizontal,
  Copy,
  Trash2,
  SlidersHorizontal,
  PanelLeftClose,
  PanelLeftOpen,
  Lock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useGradesStore } from "@/store/useGradesStore";
import {
  useAssignmentEditorStore,
  isDraftDirty,
  type EditorSession,
} from "@/store/useAssignmentEditorStore";
import { useLiveClasses } from "@/hooks/useLiveClasses";
import { getSetMetaAction } from "@/server/actions/assess";
import type { SetMeta } from "@/server/dal/assess/sets";
import { useLaunchFlow } from "@/components/launch/useLaunchFlow";
import { WorkPlanCard } from "@/components/work-plan/WorkPlanCard";
import {
  QuickCreatePanel,
  type BuilderInit,
  type QuickTopic,
} from "./quick-create/QuickCreatePanel";
import { newQuestion, type DraftQuestion } from "./test/builder/types";
import { BackButton } from "@/components/ui/back-button";
import type { LaunchIntent } from "@/lib/launch-types";
import {
  TOPIC_COLOR_HEX,
  classColor,
  assignmentGroupKey,
  mapTopicIdToClass,
  buildScoreSuggestions,
  type Assignment,
  type AssignmentKind,
  type ClassData,
  NO_TOPIC_ID,
} from "@/lib/grades-data";
import { CLASS_COLOR_HEX, type ClassColor } from "@/lib/class-colors";
import { MONTHS_UZ_SHORT, DAYS_UZ_SUN } from "@/lib/localization";
import { todayKey, dateKeyToDate } from "@/lib/date-keys";
import { ClassSwatch, ClassSwatchStack } from "@/components/ClassSwatch";
import { ClassChip } from "@/components/ClassChip";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { AssignmentStatusChip } from "@/components/AssignmentStatusChip";
import { type StatusInfo } from "@/lib/assignment-status";
import { useSyncFailing } from "@/store/useSyncHealthStore";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { DateKeyPicker } from "@/components/ui/date-key-picker";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { EditorSidePanelHeader } from "@/components/ui/editor-side-panel";
import { useResponsivePanelWidth } from "@/hooks/useResponsivePanelWidth";
import StandardTagPicker from "./StandardTagPicker";
import SetBuilderOverlay from "./test/SetBuilderOverlay";
import AttachTestDialog from "./AttachTestDialog";
import { AssignmentSequence } from "./AssignmentSequence";

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
    <h3 className="text-label mb-2">{label}</h3>
    <div className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3">
      <span
        className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground"
        style={iconStyle}
      >
        {icon}
      </span>
      <div className="min-w-0 flex-1 text-sm font-medium text-foreground">
        {children}
      </div>
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
  const tl = useTranslations("LaunchHub");
  const tw = useTranslations("WorkPlan");
  const classId = session.classId;
  const classDataMap = useGradesStore((s) => s.classDataMap);
  const updateClass = useGradesStore((s) => s.updateClass);
  const setClassDataMap = useGradesStore((s) => s.setClassDataMap);
  const liveClasses = useLiveClasses();
  const syncFailing = useSyncFailing("grades");
  const detailsPanelWidth = useResponsivePanelWidth(300, 0.25);
  const classData = classDataMap[classId] as ClassData | undefined;

  /* Sessiya holati — global store'da (sahifa almashinuvidan omon chiqadi). */
  const parkSession = useAssignmentEditorStore((s) => s.park);
  const closeSession = useAssignmentEditorStore((s) => s.close);
  const patchDraft = useAssignmentEditorStore((s) => s.patchDraft);

  const [panelOpen, setPanelOpen] = useState(true);
  const [toolsOpen, setToolsOpen] = useState(true);
  const [toolsWidth, setToolsWidth] = useState(310);
  const [customDetailsWidth, setCustomDetailsWidth] = useState<number | null>(null);
  const workspaceRef = useRef<HTMLDivElement>(null);
  const [workspaceWidth, setWorkspaceWidth] = useState(0);
  const detailsWidth = customDetailsWidth ?? detailsPanelWidth;
  const toolsPanelWidth = toolsOpen ? toolsWidth : 56;
  const detailsWidthShown = panelOpen ? detailsWidth : 0;
  const resizeStart = useRef<{ side: "tools" | "details"; x: number; width: number } | null>(null);

  useEffect(() => {
    const workspace = workspaceRef.current;
    if (!workspace) return;
    const observer = new ResizeObserver(() => setWorkspaceWidth(workspace.clientWidth));
    observer.observe(workspace);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!workspaceWidth || workspaceWidth < 1024) return;
    const available = workspaceWidth - 56 - 16 - 320;
    const nextTools = toolsOpen ? Math.min(toolsWidth, Math.max(210, available - (panelOpen ? 240 : 0))) : 56;
    const nextDetails = panelOpen ? Math.min(detailsWidth, Math.max(240, available - nextTools)) : 0;
    if (toolsOpen && nextTools !== toolsWidth) setToolsWidth(nextTools);
    if (panelOpen && nextDetails !== detailsWidth) setCustomDetailsWidth(nextDetails);
  }, [workspaceWidth, toolsOpen, panelOpen, toolsWidth, detailsWidth]);

  function resizeLimit(side: "tools" | "details", next: number) {
    const available = (workspaceWidth || window.innerWidth) - 56 - 16 - 320;
    const other = side === "tools" ? detailsWidthShown : toolsPanelWidth;
    const minimum = side === "tools" ? 210 : 240;
    return Math.max(minimum, Math.min(next, Math.max(minimum, available - other)));
  }

  function startResize(side: "tools" | "details", event: React.PointerEvent<HTMLDivElement>) {
    if (event.button !== 0) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    resizeStart.current = { side, x: event.clientX, width: side === "tools" ? toolsWidth : detailsWidth };
    event.preventDefault();
  }

  function moveResize(event: React.PointerEvent<HTMLDivElement>) {
    const start = resizeStart.current;
    if (!start) return;
    const delta = (event.clientX - start.x) * (start.side === "tools" ? 1 : -1);
    const next = resizeLimit(start.side, start.width + delta);
    if (start.side === "tools") setToolsWidth(next);
    else setCustomDetailsWidth(next);
  }

  function keyboardResize(side: "tools" | "details", event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    const delta = (event.key === "ArrowRight" ? 24 : -24) * (side === "tools" ? 1 : -1);
    if (side === "tools") setToolsWidth((width) => resizeLimit(side, width + delta));
    else setCustomDetailsWidth(resizeLimit(side, detailsWidth + delta));
  }
  const [confirmDelete, setConfirmDelete] = useState(false);
  /* Biriktirilgan toʻplam pasporti (nom · savol soni · maks. ball).
     Toʻplamning butun qoralamasi kerak emas — shuning uchun yengil amal. */
  const [setMeta, setSetMeta] = useState<SetMeta | null>(null);
  const metaRequest = useRef(0);
  /* Mavjud testni tanlash oynasi — toʻplam muharrirdan tashqarida ham
     tugʻiladi (bank, oldingi ishlar), ularni ulash yoʻli kerak. */
  const [attachOpen, setAttachOpen] = useState(false);
  const [sequenceRevision, setSequenceRevision] = useState(0);
  const [paletteOpen, setPaletteOpen] = useState(false);
  /** Tezkor yaratish mavzusi. `null` — ish rejadagi joriy mavzu turadi;
      «Olish» (ish reja kartasi) yoki qoʻlda yozish uni belgilaydi. */
  const [quickTopic, setQuickTopic] = useState<QuickTopic | null>(null);
  /* Savol muharriri va sessiya paneli TOʻGʻRIDAN-TOʻGʻRI ochiladi.
     Ilgari orada "Testlar (5-A)" roʻyxati turardi — sidebar'dan olib
     tashlangan `/dashboard/baholash` sahifasining qoldigʻi. U uchinchi
     toʻliq-ekran qavatini qoʻshardi va faqat savol muharriri yopilganda
     koʻrinardi ("qayerdaman?" ekrani). Sinf testlari roʻyxatining uyi —
     Topshiriqlar sahifasi. */
  const [builder, setBuilder] = useState<{
    setId?: string;
    /** Yangi toʻplamning birinchi elementi — taqdimot slayd bilan boshlanadi. */
    firstShape?: "mcq" | "slide";
    /** Tezkor yaratishdan tayyor qoralama (AI yoki shablon). */
    initialQuestions?: DraftQuestion[];
    /** Qoralamaning oʻz nomi — topshiriq sarlavhasi boʻsh boʻlsa ishlatiladi. */
    initialTitle?: string;
    startWithBank?: boolean;
    initialIndex?: number;
  } | null>(null);
  /* Testni oʻquvchilarga berish — Topshiriqlar sahifasidagi bilan AYNAN
     bir oqim («Darsda oʻtkazish» / «Uyga berish» → natija ekrani →
     «Jurnalga»). Ilgari bu yerda alohida «Sessiya» modali ochilardi. */
  const launchFlow = useLaunchFlow({ sameTab: true });

  const isDraft = session.kind === "draft";
  const payload = session.kind === "draft" ? session.payload : null;
  const draft = payload?.assignment;
  const draftClassIds = payload?.classIds ?? [];
  const draftDates = payload?.dates ?? {};

  /* Tahrir rejimida manba — store (avtosaqlash). Topshiriq oʻchirilgan
     boʻlsa `current` topilmaydi; overlay quyida oʻzini yopadi. */
  const stored =
    session.kind === "edit"
      ? classData?.assignments.find((a) => a.id === session.assignmentId)
      : undefined;
  const assignment = stored;
  const current = (assignment ?? draft)!;

  /* Biriktirilgan toʻplam — mazmun kartasining va maks. ball qulfining
     yagona sharti (R215/R216). `sourceSessionId` esa ESKI, sessiyadan
     tugʻilgan ustunlar uchun: ular biriktirilmagan, nashr qilingan. */
  const attachedSetId = current.setId;
  const groupKey = assignmentGroupKey(current);
  const isDue = !!current.dueDate;
  const topics = classData?.topics ?? [];
  const currentTopic = topics.find((topic) => topic.id === current.topicId);

  /* Guruh aʼzolari — tahrir rejimida store'dan jonli (sinf id → nusxa). */
  const members = useMemo(() => {
    const map: Record<string, Assignment> = {};
    if (isDraft) return map;
    for (const [cid, cd] of Object.entries(classDataMap)) {
      const found = cd.assignments.find(
        (a) => assignmentGroupKey(a) === groupKey,
      );
      if (found) map[cid] = found;
    }
    return map;
  }, [classDataMap, groupKey, isDraft]);

  const selectedIds = isDraft ? draftClassIds : Object.keys(members);
  const selectedClasses = liveClasses.filter((c) => selectedIds.includes(c.id));

  /* Hech sinf tanlanmagan holat uchun barqaror zaxira: har renderda yangi
     massiv yasalsa StandardTagPicker'ning useMemo'si bekorga qayta ishlaydi. */
  const fallbackClassIds = useMemo(() => [classId], [classId]);

  /* Maks. ball takliflari — butun jurnaldan (bitta sinf emas): oʻqituvchi
     odatda hamma sinfda bir xil maxraj bilan ishlaydi. */
  const scoreSuggestions = useMemo(
    () =>
      buildScoreSuggestions(
        Object.values(classDataMap).flatMap((cd) => cd.assignments),
      ),
    [classDataMap],
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
        const g = cd.grades.find(
          (x) => x.studentId === s.id && x.assignmentId === m.id,
        );
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

  /* Biriktirilgan toʻplam pasporti. Toʻplam oʻchirilgan boʻlsa `null`
     qaytadi — karta oʻzini "topilmadi" holatida chizadi, halqa esa
     `on delete set null` bilan serverda allaqachon uzilgan. */
  useEffect(() => {
    const request = ++metaRequest.current;
    if (!attachedSetId) {
      setSetMeta(null);
      return;
    }
    getSetMetaAction(attachedSetId)
      .then((meta) => request === metaRequest.current && setSetMeta(meta))
      .catch(() => request === metaRequest.current && setSetMeta(null));
    return () => {
      metaRequest.current++;
    };
  }, [attachedSetId]);

  /* R216 — test biriktirilgan boʻlsa maks. ball SAVOLLAR SONIdan olinadi.
     Jonli yoʻlda `publish.ts` uni baribir qayta hisoblaydi, qogʻoz yoʻlida
     esa hech kim: oʻqituvchi "8" yozadi (8/10 demoqchi), tizim standart
     100 maxraji bilan 8% deb oʻqirdi. */
  useEffect(() => {
    if (!attachedSetId || setMeta?.id !== attachedSetId || setMeta.maxScore <= 0) return;
    if (current.maxScore === setMeta.maxScore) return;
    patch({ maxScore: setMeta.maxScore });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attachedSetId, setMeta, current.maxScore]);

  /** Eski, sessiyadan nashr qilingan ustun — oʻsha sessiyaning natija
      ekrani ochiladi (qayta yozish, ochiq javoblar shu yerda). */
  function handleOpenQuiz() {
    if (!current.sourceSessionId) return;
    launchFlow.openRun(current.sourceSessionId);
  }

  /** Yangi test tuzish — savol muharriri darhol ochiladi. `kind`/`setId`
      shu yerda EMAS, toʻplam saqlanganda yoziladi (`handleSetSaved`): aks
      holda "test deb belgilangan, lekin orqasida hech nima yoʻq" holati
      tugʻilardi. */
  function handleAttachTest() {
    setAttachOpen(false);
    setBuilder(attachedSetId
      ? { setId: attachedSetId, initialQuestions: [newQuestion("mcq")] }
      : {});
  }

  function handlePickBankQuestions() {
    setAttachOpen(false);
    setBuilder({ setId: attachedSetId, startWithBank: true });
  }

  /** Yangi taqdimot — xuddi shu toʻplam muharriri, faqat birinchi element
      slayd (R276: taqdimot = toʻplam + slaydlar, alohida muharrir yoʻq). */
  function handleAttachDeck() {
    setAttachOpen(false);
    setBuilder(attachedSetId
      ? { setId: attachedSetId, initialQuestions: [newQuestion("slide")] }
      : { firstShape: "slide" });
  }

  /** Tezkor yaratish natijasi (AI yoki shablon) — toʻplam muharriri shu
      qoralama bilan ochiladi. Jim avtosaqlash uni 2 soniyada yozadi va
      `handleSetSaved` orqali topshiriqqa ulaydi — oʻqituvchi koʻrib chiqadi. */
  function handleQuickBuild(init: BuilderInit) {
    setAttachOpen(false);
    setBuilder({
      setId: attachedSetId,
      firstShape: init.firstShape,
      initialQuestions: init.questions,
      initialTitle: init.title,
    });
  }

  /** Mavjud toʻplam tanlandi — halqa darhol bogʻlanadi. */
  function handlePickExistingSet(set: { id: string; title: string; containerKind: string }) {
    setAttachOpen(false);
    handleSetSaved(set);
    toast.success(t("attachedTitle"), { description: set.title });
  }

  /** Biriktirilgan testning savollarini tahrirlash. */
  function handleEditAttachedTest(index?: number) {
    if (!attachedSetId) return;
    setBuilder({ setId: attachedSetId, initialIndex: index });
  }

  /** «Darsda oʻtkazish» / «Uyga berish» — Topshiriqlar roʻyxatidagi
      tugmalar bilan bir xil oyna. Topshiriqning muddati bor boʻlsa uy
      vazifasi standarti — shu sana. */
  function handleRun(intent: LaunchIntent) {
    if (!attachedSetId) return;
    launchFlow.openLaunch(classId, {
      setId: attachedSetId,
      title: setMeta?.title ?? current.title,
      intent,
      dueDate: current.dueDate,
    });
  }

  /** Toʻplam saqlandi — endi halqa haqiqiy. Sarlavha hali boʻsh boʻlsa
      toʻplam nomini olamiz: oʻqituvchi bir nomni ikki marta yozmasin.
      Xabar avtosaqlashda ham keladi, shuning uchun oʻzgarish boʻlmasa
      tegmaymiz — aks holda har ikki soniyada bekorga sync yuborilardi. */
  function handleSetSaved(set: {
    id: string;
    title: string;
    containerKind?: string;
  }) {
    const request = ++metaRequest.current;
    setSequenceRevision((value) => value + 1);
    getSetMetaAction(set.id)
      .then((meta) => request === metaRequest.current && setSetMeta(meta))
      .catch(() => request === metaRequest.current && setSetMeta(null));
    const needsTitle = !current.title.trim();
    /* Tur toʻplamdan HISOBLANADI: slaydi bor toʻplam — taqdimot. */
    const kind = set.containerKind === "deck" ? "deck" : "test";
    if (current.setId === set.id && current.kind === kind && !needsTitle)
      return;
    patch({
      kind,
      setId: set.id,
      ...(needsTitle ? { title: set.title } : {}),
    });
  }

  /* ── MAKS. BALL — OQIBATLI MAYDON ────────────────────────────────────
     Maks. ball oʻzgarsa katakdagi XOM ball oʻzgarmaydi, lekin foiz qayta
     hisoblanadi: 10 savollik testda "8" — 80%, maks. ball 100 boʻlsa oʻsha
     "8" endi 8%. Jurnalga qarab buni sezib boʻlmaydi, chunki koʻrinadigan
     raqam oʻsha-oʻsha. Taʼlim-boshqaruv tizimlari shu sabab "Saqlash" tugmasi
     qoʻyadi; biz avtosaqlashni saqlaymiz (global sessiya arxitekturasi),
     lekin OQIBATNI aytamiz — tugma faqat "qoʻllaymizmi?" deb soʻrardi,
     nechta baho qayta hisoblanishini aytmasdi. */
  const gradedCount = useMemo(() => {
    if (isDraft) return 0;
    let n = 0;
    for (const [cid, m] of Object.entries(members)) {
      const cd = classDataMap[cid];
      if (!cd) continue;
      n += cd.grades.filter(
        (g) => g.assignmentId === m.id && g.score !== null,
      ).length;
    }
    return n;
  }, [isDraft, members, classDataMap]);
  const scoreLocked = Boolean(attachedSetId && (gradedCount > 0 || setMeta?.id !== attachedSetId || setMeta.maxScore > 0));

  /** Tahrir boshlanishidagi surat — "Bekor qilish" shu holatga qaytaradi. */
  const maxScoreUndo = useRef<{
    map: typeof classDataMap;
    value: number;
  } | null>(null);

  function announceMaxScore(before: typeof classDataMap, previous: number) {
    if (gradedCount === 0 || previous === current.maxScore) return;
    toast.warning(t("maxScoreRecalculated", { count: gradedCount }), {
      description: t("maxScoreRecalculatedHint", {
        from: previous,
        to: current.maxScore,
      }),
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
    toast.success(t("detachedTitle"), {
      description: t("detachedDescription"),
    });
  }

  /** Umumiy maydonlar (sarlavha/yoʻriqnoma/toifa/ball) — butun guruhga. */
  function patch(next: Partial<Assignment>) {
    if (isDraft) {
      patchDraft((p) => ({ ...p, assignment: { ...p.assignment, ...next } }));
      return;
    }
    const srcTopic =
      "topicId" in next
        ? topics.find((tp) => tp.id === next.topicId)
        : undefined;
    setClassDataMap((prev) => {
      const out = { ...prev };
      for (const [cid, cd] of Object.entries(out)) {
        if (!cd.assignments.some((a) => assignmentGroupKey(a) === groupKey))
          continue;
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
            ? {
                ...p.assignment,
                date: value,
                ...(isDue ? { dueDate: value } : {}),
              }
            : p.assignment,
      }));
      return;
    }
    updateClass(cid, (cd) => ({
      ...cd,
      assignments: cd.assignments.map((a) =>
        assignmentGroupKey(a) === groupKey
          ? { ...a, date: value, ...(a.dueDate ? { dueDate: value } : {}) }
          : a,
      ),
    }));
  }

  /** Sinfni qoʻshish/olib tashlash. Ochilgan sinf doim ichida qoladi. */
  function toggleClass(cid: string) {
    if (cid === classId) return;
    const on = selectedIds.includes(cid);

    if (isDraft) {
      patchDraft((p) => ({
        ...p,
        classIds: on
          ? p.classIds.filter((x) => x !== cid)
          : [...p.classIds, cid],
        dates: on
          ? p.dates
          : {
              ...p.dates,
              [cid]: p.dates[cid] ?? p.dates[classId] ?? todayKey(),
            },
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
          cd.assignments
            .filter((a) => assignmentGroupKey(a) === groupKey)
            .map((a) => a.id),
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
              a.id === current.id ? { ...a, groupId: groupKey } : a,
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
          topicId:
            cid === classId
              ? draft.topicId
              : mapTopicIdToClass(srcTopic, classDataMap[cid]),
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
      toast.success(t("draftKeptTitle"), {
        description: t("draftKeptDescription"),
      });
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
    updateClass(classId, (cd) => ({
      ...cd,
      assignments: [copy, ...cd.assignments],
    }));
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
          cd.assignments
            .filter((a) => assignmentGroupKey(a) === groupKey)
            .map((a) => a.id),
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

  function renderContent() {
    if (attachedSetId) {
      return (
        <div className="flex flex-col gap-4">
          <AssignmentSequence
            setId={attachedSetId}
            revision={sequenceRevision}
            onEdit={handleEditAttachedTest}
            onBank={handlePickBankQuestions}
            onRun={handleRun}
            onChanged={handleSetSaved}
            hasGrades={gradedCount > 0}
            editing={Boolean(builder)}
          />
          <Button variant="ghost" size="sm" className="self-start text-muted-foreground" onClick={handleDetachTest}>
            <X className="size-4" /> {t("detachTest")}
          </Button>
        </div>
      );
    }
    if (current.sourceSessionId) {
      return (
        <button type="button" onClick={handleOpenQuiz} className="flex items-center gap-3 rounded-xl border border-border p-4 text-left hover:bg-muted/50">
          <FileCheck2 className="size-5 text-primary" />
          <span className="min-w-0 flex-1 truncate text-sm font-medium">{current.title} · {tl("viewResults")}</span>
          <ChevronRight className="size-4 text-muted-foreground" />
        </button>
      );
    }
    return <p className="rounded-xl border border-dashed border-border bg-muted/20 px-5 py-10 text-center text-sm text-muted-foreground">{t("sequenceEmpty")}</p>;
  }

  return createPortal(
    <>
      <div className="fixed inset-0 z-40 flex flex-col bg-card animate-in fade-in-0 duration-fast">
        {/* Sarlavha */}
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border px-5 py-4">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            {/* «← Orqaga» — ostidagi sahifaga qaytadi (qoralama saqlanadi). */}
            <BackButton onClick={handleCloseRequest} />
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
                  <span className="inline-flex shrink-0 cursor-default items-center gap-1.5 rounded-full bg-warning/10 px-3 py-1 text-xs font-semibold text-warning">
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
              <Button
                onClick={handleCreate}
                className="mr-1.5 gap-1.5 font-semibold"
              >
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
                    <DropdownMenuItem
                      className="gap-2"
                      onSelect={handleDuplicate}
                    >
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

        {/* Vositalar · materiallar ketma-ketligi · tafsilotlar. */}
        <div ref={workspaceRef} className="flex min-h-0 flex-1 flex-col overflow-y-auto lg:flex-row lg:overflow-hidden">
          <aside
            className="shrink-0 border-b border-border bg-muted/10 p-4 lg:w-[var(--tools-width)] lg:overflow-y-auto lg:border-b-0 lg:p-0"
            style={{ "--tools-width": `${toolsPanelWidth}px` } as CSSProperties}
          >
            <button type="button" className="flex w-full items-center justify-between text-sm font-semibold lg:hidden" onClick={() => setPaletteOpen((open) => !open)} aria-expanded={paletteOpen}>
              {t("sequenceTools")}
              <ChevronDown className={cn("size-4 transition-transform", paletteOpen && "rotate-180")} />
            </button>
            {!toolsOpen && (
              <button type="button" className="hidden size-14 items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground lg:flex" onClick={() => setToolsOpen(true)} aria-label={t("expandTools")} title={t("expandTools")}>
                <PanelLeftOpen className="size-5" />
              </button>
            )}
            <div className={cn("mt-4 lg:m-0 lg:p-4", !paletteOpen && "hidden lg:block", !toolsOpen && "lg:hidden")}>
              <div className="mb-4 hidden items-center justify-between gap-2 lg:flex">
                <h2 className="min-w-0 truncate text-sm font-semibold text-foreground">{t("sequenceTools")}</h2>
                <button type="button" className="flex size-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground" onClick={() => setToolsOpen(false)} aria-label={t("collapseTools")} title={t("collapseTools")}>
                  <PanelLeftClose className="size-4" />
                </button>
              </div>
              {isDraft && (
                <details className="mb-4 rounded-xl border border-border bg-card p-3">
                  <summary className="cursor-pointer text-sm font-medium text-foreground">{t("sequencePlan")}</summary>
                  <div className="mt-3">
                    <WorkPlanCard
                      classId={classId}
                      onPick={(row) => {
                        patch({ title: row.lesson.title });
                        setQuickTopic({ text: row.lesson.title, lessonId: row.lesson.id });
                        if (row.date && row.date >= todayKey()) setDateFor(classId, row.date);
                        toast.success(tw("picked"));
                      }}
                    />
                  </div>
                </details>
              )}
              <QuickCreatePanel
                compact
                classId={classId}
                isDraft={isDraft}
                hasContent={!!attachedSetId}
                topic={quickTopic}
                fallbackTitle={current.title}
                onTopicChange={setQuickTopic}
                onOpenBuilder={handleQuickBuild}
                onManual={(kind) => kind === "deck" ? handleAttachDeck() : handleAttachTest()}
                onAttachExisting={() => setAttachOpen(true)}
                onPickBank={handlePickBankQuestions}
              />
            </div>
          </aside>
          {toolsOpen && (
            <div role="separator" aria-orientation="vertical" aria-label={t("resizeTools")} aria-valuemin={210} aria-valuemax={Math.max(210, workspaceWidth - 56 - 16 - 320 - detailsWidthShown)} aria-valuenow={toolsWidth} tabIndex={0} onPointerDown={(event) => startResize("tools", event)} onPointerMove={moveResize} onPointerUp={() => { resizeStart.current = null; }} onPointerCancel={() => { resizeStart.current = null; }} onLostPointerCapture={() => { resizeStart.current = null; }} onKeyDown={(event) => keyboardResize("tools", event)} className="group relative hidden w-2 shrink-0 cursor-col-resize touch-none items-center justify-center border-x border-border/70 hover:bg-primary/10 focus-visible:outline-2 focus-visible:outline-primary lg:flex">
              <span className="h-9 w-0.5 rounded-full bg-border group-hover:bg-primary group-focus-visible:bg-primary" />
            </div>
          )}
          <div className="min-w-0 flex-1 p-4 lg:min-h-0 lg:overflow-y-auto lg:scrollbar-thin lg:p-6">
            <div className="mx-auto flex max-w-2xl flex-col gap-6">
              <div className="flex flex-col gap-1.5">
                <span className="text-label text-muted-foreground">
                  {t("titleLabel")}
                </span>
                <Input
                  value={current.title}
                  onChange={(e) => patch({ title: e.target.value })}
                  placeholder={t("untitledDeck")}
                  className="h-auto rounded-xl bg-muted/40 px-4 py-3 text-base font-semibold shadow-none"
                />
              </div>

              {/* Materiallar markazda tartib bilan ko'rinadi, yaratish
                  vositalari chapda, topshiriq tafsilotlari o'ngda. */}
              <div className="flex flex-col gap-3">{renderContent()}</div>

              {/* YOʻRIQNOMA (R203) — maydon tipda, bazada, sync'da va oltita
                  tilda tayyor edi, lekin hech qayerda chizilmasdi. Referensda
                  (EMStudio/Classroom) u sarlavhadan keyingi eng katta maydon:
                  oʻqituvchi "nima qilinsin"ni aynan shu yerda yozadi. */}
              <div className="flex flex-col gap-1.5">
                <span className="text-label text-muted-foreground">
                  {t("instructionsLabel")}
                </span>
                <Textarea
                  value={current.instructions ?? ""}
                  onChange={(e) => patch({ instructions: e.target.value })}
                  placeholder={t("instructionsPlaceholder")}
                  className="min-h-24 rounded-xl bg-muted/40 px-4 py-3 text-sm shadow-none"
                />
              </div>

              {/* Standart teglash — oʻzlashtirish zanjirining oʻrta boʻgʻini
                  (spec §13.5: asosiy kirish nuqtasi aynan muharrir ichida). */}
              <StandardTagPicker
                classIds={selectedIds.length ? selectedIds : fallbackClassIds}
                value={current.standardIds ?? []}
                onChange={(next) => patch({ standardIds: next.length ? next : undefined })}
              />
            </div>
          </div>

          {panelOpen && (
            <div role="separator" aria-orientation="vertical" aria-label={t("resizeDetails")} aria-valuemin={240} aria-valuemax={Math.max(240, workspaceWidth - 56 - 16 - 320 - toolsPanelWidth)} aria-valuenow={detailsWidth} tabIndex={0} onPointerDown={(event) => startResize("details", event)} onPointerMove={moveResize} onPointerUp={() => { resizeStart.current = null; }} onPointerCancel={() => { resizeStart.current = null; }} onLostPointerCapture={() => { resizeStart.current = null; }} onKeyDown={(event) => keyboardResize("details", event)} className="group relative hidden w-2 shrink-0 cursor-col-resize touch-none items-center justify-center border-x border-border/70 hover:bg-primary/10 focus-visible:outline-2 focus-visible:outline-primary lg:flex">
              <span className="h-9 w-0.5 rounded-full bg-border group-hover:bg-primary group-focus-visible:bg-primary" />
            </div>
          )}
          <aside
            className={cn(
              "shrink-0 overflow-hidden border-t border-border bg-card lg:w-[var(--panel-width)] lg:border-l lg:border-t-0",
              !panelOpen && "hidden lg:block",
            )}
            style={{ "--panel-width": `${detailsWidthShown}px` } as CSSProperties}
          >
            <div
              className="flex flex-col lg:h-full lg:w-full"
            >
              <EditorSidePanelHeader
                icon={<SlidersHorizontal />}
                title={t("detailsLabel")}
                onClose={() => setPanelOpen(false)}
                closeLabel={t("close")}
              />
              <div className="flex flex-col gap-5 px-5 py-5 lg:min-h-0 lg:flex-1 lg:overflow-y-auto lg:scrollbar-thin">
                <div className="rounded-xl bg-muted/50 p-3 text-xs text-muted-foreground">
                  <p className="mb-2 font-semibold text-foreground">{t("detailsOverviewTitle")}</p>
                  <p>{t("detailsOverviewClasses", { count: selectedClasses.length })}</p>
                  <p>{t("detailsOverviewDates", { count: selectedClasses.filter((c) => Boolean(dateOf(c.id))).length })}</p>
                  <p>{attachedSetId && setMeta?.id === attachedSetId
                    ? t("detailsOverviewItems", { count: setMeta.itemCount })
                    : t("detailsOverviewManual")}</p>
                </div>
                {/* SINFLAR — koʻp tanlov (dars muharriridagi naqsh). */}
                <div className="flex flex-col">
                  <h3 className="text-label mb-2">{t("classesLabel")}</h3>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        type="button"
                        className="flex w-full items-center justify-between gap-2 rounded-xl border border-border bg-card px-4 py-3 text-left text-sm transition-colors hover:bg-accent/40"
                      >
                        <span className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
                          {selectedClasses.length > 3 ? (
                            <>
                              <ClassSwatchStack
                                hexes={selectedClasses.map(
                                  (c) => CLASS_COLOR_HEX[classColor(c)],
                                )}
                                max={4} />
                              <span className="text-sm font-medium text-foreground">
                                {t("classCount", {
                                  count: selectedClasses.length,
                                })}
                              </span>
                            </>
                          ) : (
                            selectedClasses.map((c) => (
                              <ClassChip
                                key={c.id}
                                color={classColor(c)}
                                name={c.name}
                              />
                            ))
                          )}
                        </span>
                        <ChevronDown className="size-4 shrink-0 opacity-40" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="start"
                      className="max-h-[280px] w-[var(--radix-dropdown-menu-trigger-width)] scrollbar-hover overflow-y-auto"
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
                            onSelect={(e) => {
                              e.preventDefault();
                              toggleClass(c.id);
                            }}
                            className="gap-2"
                          >
                            <span
                              className={cn(
                                "flex size-4 shrink-0 items-center justify-center rounded border",
                                on ? "border-transparent" : "border-border",
                              )}
                              style={on ? { backgroundColor: hex } : undefined}
                            >
                              {on && <Check className="size-3 text-white" />}
                            </span>
                            <ClassSwatch hex={hex} />
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
                    onValueChange={(v) =>
                      patch({ topicId: v === NO_TOPIC_VALUE ? NO_TOPIC_ID : v })
                    }
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
                      <SelectItem value={NO_TOPIC_VALUE}>
                        {t("noTopic")}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </FieldRow>

                {/* SANA — bitta maydon. Koʻp sinfda har sinfning oʻz sanasi
                  boʻladi (R211). Soʻngmuddat rejimi olib tashlandi: jurnalda
                  topshiriq DARS kunida turadi, alohida topshirish muddati
                  tushunchasi ortiqcha edi. */}
                <div className="flex flex-col">
                  <h3 className="text-label mb-2">{t("dateLabel")}</h3>

                  {/* Sana kartalari — dars muharriridagi JADVAL bilan bir xil: bir
                    sanada boʻlgan sinflar BITTA kartada guruhlanadi (chapda
                    oy/kun bloki, oʻngda hafta kuni + sinf chiplari). Sanasi
                    yoʻq sinf uchun punktir "Sana qoʻshish" tugmasi. */}
                  {(() => {
                    type Item = {
                      classId: string;
                      name: string;
                      color: ClassColor;
                      hex: string;
                    };
                    const withoutDate = selectedClasses.filter(
                      (c) => !dateOf(c.id),
                    );
                    const groups: { key: string; items: Item[] }[] = [];
                    selectedClasses.forEach((c) => {
                      const key = dateOf(c.id);
                      if (!key) return;
                      let g = groups.find((x) => x.key === key);
                      if (!g) {
                        g = { key, items: [] };
                        groups.push(g);
                      }
                      g.items.push({
                        classId: c.id,
                        name: c.name,
                        color: classColor(c),
                        hex: CLASS_COLOR_HEX[classColor(c)],
                      });
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
                                <span className="text-micro font-bold uppercase tracking-wide text-muted-foreground">
                                  {MONTHS_UZ_SHORT[d.getMonth()]}
                                </span>
                                <span className="text-lg font-bold leading-none text-foreground">
                                  {d.getDate()}
                                </span>
                              </div>
                              <div className="flex min-w-0 flex-1 flex-col justify-center gap-1.5 py-2 pr-2">
                                <DateKeyPicker
                                  value={g.key}
                                  onChange={(v) =>
                                    g.items.forEach((it) =>
                                      setDateFor(it.classId, v),
                                    )
                                  }
                                  formatLabel={(k) =>
                                    DAYS_UZ_SUN[dateKeyToDate(k).getDay()]
                                  }
                                  className="h-auto w-fit min-w-0 justify-start border-none bg-transparent p-0 text-sm font-medium text-foreground shadow-none hover:bg-transparent focus-visible:ring-0 [&_svg]:hidden"
                                  ariaLabel={
                                    isDue ? t("dueDateLabel") : t("dateLabel")
                                  }
                                />
                                {selectedClasses.length > 1 && (
                                  <div className="flex flex-wrap items-center gap-1.5">
                                    {g.items.map((it) => (
                                      <ClassChip
                                        key={it.classId}
                                        color={it.color}
                                        name={it.name}
                                        onRemove={() =>
                                          setDateFor(it.classId, "")
                                        }
                                        removeLabel={t("clearDate")}
                                        className="shrink"
                                      />
                                    ))}
                                  </div>
                                )}
                              </div>
                              {selectedClasses.length === 1 && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    setDateFor(g.items[0].classId, "")
                                  }
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
                              selectedClasses.length > 1
                                ? `${c.name} — ${t("addDate")}`
                                : t("addDate")
                            }
                            className="w-full justify-center gap-2 rounded-lg border border-dashed border-border bg-transparent py-2 text-sm font-normal text-muted-foreground shadow-none hover:bg-accent/40 hover:text-foreground"
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
                        <button
                          type="button"
                          className="shrink-0 text-muted-foreground/60 hover:text-foreground"
                        >
                          {scoreLocked ? (
                            <Lock className="size-3.5" />
                          ) : (
                            <Info className="size-3.5" />
                          )}
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-56">
                        {scoreLocked
                          ? t("maxScoreLockedTooltip")
                          : t("maxScoreTooltip")}
                      </TooltipContent>
                    </Tooltip>
                  }
                >
                  {scoreLocked ? (
                    <span className="text-sm font-medium text-muted-foreground">
                      {current.maxScore}
                    </span>
                  ) : (
                    /* Xabar har bosishda emas, tahrir TUGAGANDA (blur) —
                     "1", "10", "100" deb yozilayotganda uch marta
                     ogohlantirish shovqin boʻlardi. */
                    <Input
                      type="number"
                      min={1}
                      value={current.maxScore}
                      onFocus={() => {
                        maxScoreUndo.current = {
                          map: classDataMap,
                          value: current.maxScore,
                        };
                      }}
                      onChange={(e) =>
                        patch({ maxScore: Number(e.target.value) || 0 })
                      }
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
                {!scoreLocked && scoreSuggestions.length > 0 && (
                  <div className="-mt-3 flex flex-wrap items-center gap-1.5">
                    {scoreSuggestions.map((score) => (
                      <button
                        key={score}
                        type="button"
                        onClick={() => pickMaxScore(score)}
                        aria-pressed={current.maxScore === score}
                        className={cn(
                          "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                          current.maxScore === score
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border text-muted-foreground hover:bg-muted hover:text-foreground",
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
          <nav className="flex w-full shrink-0 flex-row items-center justify-center gap-1.5 border-t border-border bg-card py-2 lg:w-14 lg:flex-col lg:justify-start lg:border-l lg:border-t-0 lg:py-4">
            <Button
              variant="ghost"
              size="icon-lg"
              aria-label={t("detailsLabel")}
              onClick={() => setPanelOpen((o) => !o)}
              className={cn(
                "rounded-full",
                panelOpen &&
                  "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
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
            onPickBank={handlePickBankQuestions}
            onClose={() => setAttachOpen(false)}
          />
        )}

        {/* Savol muharriri — muharrir ustida, oraliq ekransiz. */}
        {builder && (
          <SetBuilderOverlay
            classId={classId}
            setId={builder.setId}
            firstShape={builder.firstShape}
            initialQuestions={builder.initialQuestions}
            startWithBank={builder.startWithBank}
            initialIndex={builder.initialIndex}
            initialTitle={
              builder.setId
                ? undefined
                : current.title.trim() || builder.initialTitle || undefined
            }
            onSaved={(set, copiedFromUsedSet) => {
              // Oʻtkazilgan testning baholari va manba sessiyasi avvalgi
              // toʻplamga bogʻlangan: nusxani shu ustunga avtomatik ulamaymiz.
              if (!copiedFromUsedSet) handleSetSaved(set);
            }}
            onClose={() => setBuilder(null)}
          />
        )}

        {/* Oʻtkazish oynasi va natija ekrani — muharrir ustida. */}
        {launchFlow.element}
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
    document.body,
  );
}

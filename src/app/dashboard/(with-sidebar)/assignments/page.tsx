"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  Archive, ClipboardList, Plus, FileCheck2, Copy, Trash2, Tag, Library, Columns3,
  PenLine, MoreHorizontal, RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { useGradesStore } from "@/store/useGradesStore";
import { useClassIdParam } from "@/hooks/useClassIdParam";
import { panelHeaderClass, panelCardContentClass } from "@/components/DashboardPage";
import { useLiveClasses, useLiveClassesHydrated } from "@/hooks/useLiveClasses";
import {
  TOPIC_COLOR_HEX, assignmentGroupKey, classColor,
  type Assignment, type TopicColor,
} from "@/lib/grades-data";
import { CLASS_COLOR_HEX, classTints } from "@/lib/class-colors";
import { MATERIAL_KINDS } from "@/lib/material-kinds";
import { ClassSwatch, ClassSwatchStack } from "@/components/ClassSwatch";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { SectionIcon } from "@/components/ui/section-icon";
import { CardTitle } from "@/components/ui/card";
import { TypographyMuted } from "@/components/ui/typography";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger, ContextMenuSeparator,
} from "@/components/ui/context-menu";
import {
  AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogFooter,
  AlertDialogTitle, AlertDialogDescription, AlertDialogCancel, AlertDialogAction,
} from "@/components/ui/alert-dialog";
import {
  Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription, EmptyContent,
} from "@/components/ui/empty";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { AssignmentStatusChip } from "@/components/AssignmentStatusChip";
import { assignmentStatusFrom, gradedCountByAssignment } from "@/lib/assignment-status";
import { MONTHS_UZ } from "@/lib/localization";
import { todayKey } from "@/lib/date-keys";
import { Illustration } from "@/components/ui/illustration";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  useAssignmentEditorStore, makeDraftPayload,
} from "@/store/useAssignmentEditorStore";
import {
  deleteSetAction, getSetDraftAction, listSetsWithPublishStateAction, setSetArchivedAction,
} from "@/server/actions/assess";
import type { DraftQuestion } from "./_components/test/builder/types";
import SetBuilderOverlay from "./_components/test/SetBuilderOverlay";
import TestBankOverlay from "./_components/TestBankOverlay";
import { useLaunchFlow } from "@/components/launch/useLaunchFlow";
import { ActiveRuns, useClassRuns } from "@/components/launch/ActiveRuns";
import { RUN_INTENTS, RunButtons, useRunIntentLabels } from "@/components/launch/RunButtons";
import { LAUNCH_INTENTS } from "@/components/launch/launch-modes";
import type { LaunchIntent } from "@/lib/launch-types";
import {
  IMPORT_PARAMS, LessonLabSyncDialog, importStatusFromParams, type ImportStatus,
} from "@/components/launch/LessonLabSyncDialog";
import { useTourRequest } from "@/components/tour/tour-request";
import { TourDemoBanner } from "@/components/tour/TourDemoBanner";
import {
  makeAssignmentsTourDemoClassData, makeAssignmentsTourDemoClasses, ASSIGNMENTS_TOUR_DEMO_CLASS_ID,
} from "@/components/tour/assignments-tour-demo";
import { LessonStudio } from "./_components/studio/LessonStudio";
import { AssignmentsTopBar, type AssignmentsView } from "./_components/studio/AssignmentsTopBar";

/** Oxirgi tanlangan koʻrinish — faqat shu brauzer uchun qulaylik. */
const VIEW_KEY = "ustozona-assignments-view";

/** "Other" (Toifasiz) chelagi uchun sentinel — DB qatori emas, faqat guruhlash kaliti. */
const OTHER_GROUP = "__other__";

/** Toifa rangining yumshoq (shaffofga aralashgan) yuzasi — akkordeon chegarasi,
    sarlavha foni va karta ikonkasi UCHALASI shu bitta joydan chaqiradi
    (foiz turlicha boʻlishi mumkin, lekin formula bitta manbada). */
const topicTint = (hex: string, pct: number) => `color-mix(in srgb, ${hex} ${pct}%, transparent)`;

/** `yyyy-mm-dd` → "14-sentabr". Oy nomi TOʻLIQ: qisqartma ("14-sen")
    oʻzbek imlosida qabul qilinmagan va sentabr/oktabrni chalkashtirardi. */
function shortDate(key: string): string {
  const [y, m, d] = key.split("-").map(Number);
  if (!y || !m || !d) return key;
  return `${d}-${MONTHS_UZ[(m - 1) % 12].toLowerCase()}`;
}

export default function AssignmentsPage() {
  const t = useTranslations("AssignmentsPage");
  const tb = useTranslations("TestBank");
  const tMaterial = useTranslations("MaterialKinds");
  const tl = useTranslations("LaunchHub");
  const runText = useRunIntentLabels();
  const searchParams = useSearchParams();
  const openId = searchParams.get("assignment");

  const classDataMap = useGradesStore((s) => s.classDataMap);
  const updateClass = useGradesStore((s) => s.updateClass);
  // Yon menyudan «toza» kirilganda (URL'da `?classId=` yoʻq) oxirgi
  // tanlangan sinfdan davom etadi — har safar qaytadan tanlash shart emas.
  const [selectedClassId, handleSelectClass] = useClassIdParam({ fallbackToStore: true });
  const [deleteTarget, setDeleteTarget] = useState<Assignment | null>(null);
  /* Muharrir GLOBAL (AssignmentEditorHost) — sahifa faqat sessiya ochadi. */
  const openDraft = useAssignmentEditorStore((s) => s.openDraft);
  const openEdit = useAssignmentEditorStore((s) => s.openEdit);

  /** Boʻsh hisobda "topshiriqlar" turʼi ishga tushsa, panel namunaviy sinf
      va topshiriqlar bilan toʻldiriladi (faqat vizual — [[lessons-tour-demo]]
      bilan bir xil naqsh). Yaratish/oʻchirish kabi yozuv amallari baribir
      HAQIQIY `selectedClassId`ga bogʻlangani uchun demo rejimda oʻzidan
      oʻzi xavfsiz — hech narsa yozilmaydi. */
  const tourActive = useTourRequest((s) => s.activeTourId === "assignments");
  const isDemoMode = tourActive && Object.keys(classDataMap).length === 0;
  const demoClassData = useMemo(
    () => (isDemoMode ? makeAssignmentsTourDemoClassData() : null),
    [isDemoMode]
  );
  const effectiveClassId = isDemoMode ? ASSIGNMENTS_TOUR_DEMO_CLASS_ID : selectedClassId;

  /* ── SINFLAR (yuqori qator) va KOʻRINISH ─────────────────────────────
     Sinflar chap ustundan yuqori qatorga koʻchdi — chap ustun endi Dars
     studiyasining rejasi (docs/dars-studiyasi-spec.md §3). Saqlangan
     sinf arxivlangan/oʻchirilgan boʻlsa — birinchi faol sinf tanlanadi,
     aks holda sahifa «sinf tanlanmagan» boʻlib qolardi. */
  const liveClasses = useLiveClasses();
  const classesHydrated = useLiveClassesHydrated();
  const barClasses = isDemoMode ? makeAssignmentsTourDemoClasses() : liveClasses;
  useEffect(() => {
    if (isDemoMode || !classesHydrated || !liveClasses.length) return;
    if (!selectedClassId || !liveClasses.some((c) => c.id === selectedClassId)) {
      handleSelectClass(liveClasses[0].id);
    }
  }, [isDemoMode, classesHydrated, liveClasses, selectedClassId, handleSelectClass]);

  const [storedView, setStoredView] = useState<AssignmentsView>("studio");
  useEffect(() => {
    try {
      if (localStorage.getItem(VIEW_KEY) === "all") setStoredView("all");
    } catch {
      /* saqlanmasa — standart koʻrinish */
    }
  }, []);
  const changeView = (v: AssignmentsView) => {
    setStoredView(v);
    try {
      localStorage.setItem(VIEW_KEY, v);
    } catch {
      /* saqlanmasa ham ishlaydi */
    }
  };
  // Tanishtiruv turi roʻyxat elementlariga ishora qiladi — u vaqtda roʻyxat koʻrinadi.
  const view: AssignmentsView = tourActive ? "all" : storedView;
  const classData = isDemoMode ? demoClassData! : (effectiveClassId ? classDataMap[effectiveClassId] : undefined);

  /* ── TUZILGAN, LEKIN HALI JURNALGA CHIQMAGAN TESTLAR ──────────────
     Toʻplam (mazmun) va topshiriq (jurnaldagi baho ustuni) — ikki
     boshqa narsa: toʻplam tuzilganda `assignments` ga hech narsa
     yozilmaydi, ustun faqat nashr qilinganda tugʻiladi.

     Chegara toʻgʻri, lekin oʻqituvchiga koʻrinmasdi: u shu sahifada
     «Yaratish → Test» qilib test tuzardi va sahifa boʻsh qolaverardi
     — ish yoʻqolgandek koʻrinardi. Endi bunday testlar alohida guruh
     boʻlib turadi va bosilsa oʻz muharririda ochiladi.

     Topshiriq YARATILMAYDI: publish `sourceSessionId` boʻyicha
     izlagani uchun oldindan yaratilgan ustun nashrda IKKINCHI marta
     qoʻshilardi — bitta test ikkita baho ustuni boʻlib chiqardi. */
  const [pendingSets, setPendingSets] = useState<
    { id: string; title: string; itemCount: number; hasSessions: boolean; archived: boolean }[]
  >([]);
  /* Toʻplam amallari — savol muharriri, oʻchirish. Ilgari "Testlar (5-A)"
     oraliq overlay'ida edi; u sidebar'dan olib tashlangan
     `/dashboard/baholash` sahifasining qoldigʻi bo'lib, ortiqcha
     toʻliq-ekran qavati qoʻshardi. Roʻyxatning uyi — shu sahifa. */
  const [builderSetId, setBuilderSetId] = useState<string | null>(null);
  const [builderCopy, setBuilderCopy] = useState<{ title: string; questions: DraftQuestion[] } | null>(null);
  const [deleteSet, setDeleteSet] = useState<{ id: string; title: string } | null>(null);
  /* Test banki — LessonLab bazasidan tayyor test tanlash. Ayni shu
     sahifada, chunki bank testi ham «tayyorlangan test» boʻlib tushadi:
     yaratish yoʻli boshqa, natija bir xil. */
  const [bankOpen, setBankOpen] = useState(false);
  /* Bankdan test olinganda roʻyxat qayta soʻralishi kerak, lekin oyna
     OCHIQ qoladi (oʻqituvchi ketma-ket bir nechta test beradi). Shuning
     uchun signal `bankOpen` emas, alohida hisoblagich — aks holda
     yangilanish faqat oyna yopilganda boʻlardi. */
  const [bankVersion, setBankVersion] = useState(0);

  /* ── OʻTKAZISH MARKAZI (docs/topshiriq-boshlash-markazi.md) ─────────
     Test → «Darsda oʻtkazish» (jonli dars / oʻyin / mustaqil / qogʻoz /
     karta / pult) yoki «Uyga berish» → natija ekrani → «Jurnalga». «Hozir ochiq» — sinfning ochiq
     va natijasi kutilayotgan ishlari, sahifa tepasida: oʻqituvchi uy
     vazifasini berib ketib, ertaga «qayerda edi?» deb qidirmasin.

     Ilgari bu yerda «Sessiya» modali turardi (holat inglizcha, jurnalga
     koʻchirish alohida toifa tanlab, `alert()` bilan) — oʻrnini shu oqim
     egalladi. `/baholash` ish maydoni ham shu yerga koʻchdi (arxivlandi). */
  const { runs, refresh: refreshRuns } = useClassRuns(isDemoMode ? null : selectedClassId);
  const launchFlow = useLaunchFlow({
    onChanged: () => {
      refreshRuns();
      // Jurnalga yozilgan test «Tayyor testlar» dan ustunga oʻtadi.
      setBankVersion((v) => v + 1);
    },
    onOpenBank: () => setBankOpen(true),
    onCreateNew: () => handleCreateClick(),
  });

  /* LessonLab'dan olish — `?import=…` bilan qaytilsa (OAuth) oyna
     natija bilan ochiladi va parametrlar URL'dan tozalanadi: manzil
     ulashilsa yoki yangilansa xabar qayta chiqmasin. */
  const [llOpen, setLlOpen] = useState(false);
  const [importStatus, setImportStatus] = useState<ImportStatus | null>(null);
  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    const status = importStatusFromParams(sp);
    if (!status) return;
    setImportStatus(status);
    setLlOpen(true);
    for (const key of IMPORT_PARAMS) sp.delete(key);
    const qs = sp.toString();
    window.history.replaceState(null, "", window.location.pathname + (qs ? `?${qs}` : ""));
  }, []);

  /* Roʻyxat QACHON yangilanadi.

     Sinf almashgani yetarli emas: aynan muammoli oqimda oʻqituvchi
     testni SHU SAHIFADAGI muharrir ichida tuzadi. Muharrir yopilgach
     (`session === null`) roʻyxat qayta soʻraladi — aks holda yangi
     test faqat sahifani yangilagandan keyin koʻrinardi, yaʼni xato
     yarim tuzatilgan boʻlardi.

     Test ish maydoni yopilgani ham hisobga olinadi: u yerda test
     tahrirlanishi, oʻchirilishi yoki nashr qilinishi mumkin. */
  const editorSession = useAssignmentEditorStore((s) => s.session);
  const restoreSession = useAssignmentEditorStore((s) => s.restore);
  const closeSession = useAssignmentEditorStore((s) => s.close);

  /* Tugallanmagan qoralama — muharrir yopilganda u yoʻqolmaydi, shu
     roʻyxatda karta boʻlib turadi (qoralama-kartochka naqshi).
     Ilgari uning oʻrniga ekran burchagida suzuvchi yorliq bor edi va
     kichraytirish tugmasi kerak boʻlardi. */
  const draftCard =
    editorSession?.kind === "draft" && editorSession.classId === selectedClassId
      ? {
          title: editorSession.payload.assignment.title.trim(),
          topicId: editorSession.payload.assignment.topicId,
        }
      : null;

  useEffect(() => {
    if (!selectedClassId) {
      setPendingSets([]);
      return;
    }
    let alive = true;
    listSetsWithPublishStateAction(selectedClassId)
      .then((rows) => {
        if (!alive) return;
        setPendingSets(
          rows
            .filter((r) => r.assignmentId === null)
            .map((r) => ({ id: r.set.id, title: r.set.title, itemCount: r.set.items.length,
              hasSessions: r.hasSessions, archived: r.set.config.archived === true }))
        );
      })
      .catch(() => {
        // Roʻyxat yordamchi maʼlumot — kelmasa sahifa oddiy holicha
        // ishlayveradi, xato koʻrsatib chalgʻitmaymiz.
        if (alive) setPendingSets([]);
      });
    return () => {
      alive = false;
    };
  }, [selectedClassId, editorSession, builderSetId, bankVersion]);

  /** Testni sinfga berish — «Qanday oʻtkazamiz?» oynasi. */
  /** «Darsda oʻtkazish» / «Uyga berish» — test va niyat allaqachon
      maʼlum, oyna toʻgʻri keyingi savoldan ochiladi. */
  function launchSet(
    set: { id: string; title: string },
    intent: LaunchIntent,
    dueDate?: string | null,
  ) {
    if (!selectedClassId) return;
    launchFlow.openLaunch(selectedClassId, {
      setId: set.id,
      title: set.title,
      intent,
      dueDate: dueDate ?? undefined,
    });
  }

  function handleDeleteSetConfirm() {
    if (!deleteSet) return;
    const removed = deleteSet;
    setDeleteSet(null);
    setPendingSets((prev) => prev.filter((s) => s.id !== removed.id));
    deleteSetAction(removed.id)
      .then(() => toast.success(t("toastDeleted"), { description: removed.title }))
      // Server rad etsa roʻyxat haqiqatdan chetga chiqmasin.
      .catch((error) => {
        toast.error(t("deleteSetFailed"), { description: error instanceof Error ? error.message : undefined });
        setBankVersion((v) => v + 1);
      });
  }

  async function toggleSetArchive(id: string, archived: boolean) {
    setPendingSets((prev) => prev.map((set) => set.id === id ? { ...set, archived } : set));
    try {
      await setSetArchivedAction(id, archived);
      toast.success(archived ? t("testArchived") : t("testRestored"));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("deleteSetFailed"));
      setBankVersion((v) => v + 1);
    }
  }

  async function copySetForEditing(set: { id: string; title: string }) {
    try {
      const draft = await getSetDraftAction(set.id);
      if (!draft) throw new Error(t("setMissing"));
      setBuilderCopy({
        title: t("copySuffix", { title: set.title }),
        questions: draft.questions.map((q) => ({
          ...q, key: crypto.randomUUID(), activityId: undefined,
          options: q.options.map((o) => ({ ...o, id: crypto.randomUUID() })),
          pairs: q.pairs.map((p) => ({ ...p, id: crypto.randomUUID() })),
        })),
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("setMissing"));
    }
  }

  /* Roʻyxat SINFNING BARCHA topshirigʻini qamraydi — mazmunlisini ham,
     mazmunsiz baho ustunini ham. Ilgari `kind` boʻyicha filtr bor edi:
     shu sahifadan yaratilgan mazmunsiz topshiriq darhol koʻzdan gʻoyib
     boʻlardi, shuning uchun yaratishda tur majburiy qilingandi. Filtr
     ketgach, ikkala eshikda yaratish qoidasi bir xil boʻldi. */
  /* Serverdagi holat 1.5s debounce bilan yangilanadi, shuning uchun endigina
     biriktirilgan toʻplam bir zumga "yetim" boʻlib koʻrinishi mumkin. Jonli
     store shuni darhol tuzatadi. */
  const linkedSetIds = useMemo(
    () => new Set((classData?.assignments ?? []).map((a) => a.setId).filter(Boolean) as string[]),
    [classData]
  );
  const orphanSets = useMemo(
    () => pendingSets.filter((s) => !linkedSetIds.has(s.id) && !s.archived),
    [pendingSets, linkedSetIds]
  );
  const archivedSets = useMemo(
    () => pendingSets.filter((s) => !linkedSetIds.has(s.id) && s.archived),
    [pendingSets, linkedSetIds]
  );

  const groups = useMemo(() => {
    if (!classData) return [];
    const byTopic = new Map<string, Assignment[]>();
    for (const a of classData.assignments) {
      const key = a.topicId ?? OTHER_GROUP;
      if (!byTopic.has(key)) byTopic.set(key, []);
      byTopic.get(key)!.push(a);
    }
    // Toifalar topshiriqsiz ham koʻrsatiladi (Canvas Assignment Groups
    // naqshi) — jurnaldagi toifa mavjudligi shu yerda ham sezilib turishi
    // kerak, boʻsh toifa "yoʻqolib qolmasin".
    const named = classData.topics.map((topic) => ({
      id: topic.id,
      name: topic.name,
      color: topic.color as TopicColor | null,
      items: byTopic.get(topic.id) ?? [],
    }));
    const other = byTopic.get(OTHER_GROUP);
    return other ? [...named, { id: OTHER_GROUP, name: t("otherGroup"), color: null, items: other }] : named;
  }, [classData, t]);

  const totalCount = groups.reduce((sum, g) => sum + g.items.length, 0);

  /* Qatordagi holat uchun baho sanogʻi — BITTA oʻtishda. Har topshiriq uchun
     `grades` ni qayta kezish oʻnta ustunda kvadrat ish boʻlardi. */
  const gradedCounts = useMemo(
    () => gradedCountByAssignment(classData?.grades ?? []),
    [classData]
  );
  const studentCount = classData?.students.length ?? 0;
  const today = todayKey();

  /* ── KOʻP-SINF GURUHI ROʻYXATDA KOʻRINADI (R212/R223) ──────────────
     «Bitta topshiriq, koʻp sinf» kodda allaqachon bor edi (muharrirda
     sinf qoʻshiladi), lekin roʻyxatda hech qanday belgisi yoʻq edi:
     oʻqituvchi bu imkoniyat borligini bilmasdi va 5-A, 5-B, 5-D uchun
     bir xil nazorat ishini uch marta qoʻlda yaratardi. Bugungi haqiqiy
     takroriy ish aynan shu — yillar orasidagi qayta ishlatish emas.

     Guruh bir oʻtishda yigʻiladi: har qator uchun butun `classDataMap`
     ni kezish kvadrat ish boʻlardi.

     ⚠️ Arxivlangan sinflar hisobga olinmaydi — «oʻchirilgan» sinf
     `archivedAt` bilan yashiringan, lekin `classDataMap` da qolaveradi
     (yumshoq oʻchirish). Filtrsiz oʻqilsa bitiruvchi guruh ham
     «3 sinf» hisobiga kirib ketardi. */
  const groupClasses = useMemo(() => {
    const byKey = new Map<string, string[]>();
    for (const [cid, cd] of Object.entries(classDataMap)) {
      if (cd.info.archivedAt) continue;
      for (const a of cd.assignments) {
        const key = assignmentGroupKey(a);
        const list = byKey.get(key);
        if (list) list.push(cid);
        else byKey.set(key, [cid]);
      }
    }
    return byKey;
  }, [classDataMap]);

  /** Guruhdagi sinflar — nom + rang, joriy sinf birinchi. */
  const groupMembers = (a: Assignment) => {
    const ids = groupClasses.get(assignmentGroupKey(a)) ?? [];
    if (ids.length < 2) return [];
    return ids
      .map((cid) => classDataMap[cid]?.info)
      .filter((info): info is NonNullable<typeof info> => Boolean(info))
      .map((info) => ({
        id: info.id,
        name: info.name,
        hex: CLASS_COLOR_HEX[classColor(info)],
      }))
      .sort((x, y) =>
        x.id === selectedClassId ? -1 : y.id === selectedClassId ? 1 : x.name.localeCompare(y.name)
      );
  };

  const openEditor = (id: string) => {
    if (selectedClassId) openEdit(selectedClassId, id);
  };

  /* Yaratish qoidasi jurnaldagi bilan BIR XIL — mazmun ixtiyoriy. Ilgari bu
     sahifada tur tanlanmaguncha "Yaratish" oʻchiq turardi (sababi ekranda
     yozilmagan holda), chunki roʻyxat faqat test/taqdimotni koʻrsatardi.
     Endi roʻyxat barcha topshiriqni qamraydi — cheklovning asosi qolmadi. */
  const handleCreateClick = (topicId?: string) => {
    if (!selectedClassId || !classData) return;
    const result = openDraft(
      selectedClassId,
      makeDraftPayload(selectedClassId, topicId ?? classData.topics[0]?.id ?? null)
    );
    // Tugallanmagan qoralama ustiga yozilmaydi — u tiklanadi va shu
    // aytiladi, aks holda "nega mening eski matnim turibdi?" savoli chiqardi.
    if (result === "restored") toast.info(t("draftRestored"));
  };

  /* `?assignment=<id>` — tashqi havola uchun kirish nuqtasi. Sessiyaga
     koʻchirib, paramni URL'dan tozalaymiz (GradesView'dagi `?topics=1`
     naqshi): manba endi store, URL ikkinchi haqiqat boʻlib qolmasin. */
  useEffect(() => {
    if (!openId || !selectedClassId) return;
    if (!classData?.assignments.some((a) => a.id === openId)) return;
    openEdit(selectedClassId, openId);
    const sp = new URLSearchParams(window.location.search);
    sp.delete("assignment");
    const qs = sp.toString();
    window.history.replaceState(null, "", window.location.pathname + (qs ? `?${qs}` : ""));
  }, [openId, selectedClassId, classData, openEdit]);

  function handleDuplicate(a: Assignment) {
    if (!selectedClassId) return;
    const copy: Assignment = { ...a, id: crypto.randomUUID(), title: t("copySuffix", { title: a.title }) };
    updateClass(selectedClassId, (cd) => ({ ...cd, assignments: [copy, ...cd.assignments] }));
    toast.success(t("toastDuplicated"));
  }

  function handleDeleteConfirm() {
    if (!deleteTarget || !selectedClassId) return;
    const removed = deleteTarget;
    const removedGrades = classData?.grades.filter((g) => g.assignmentId === removed.id) ?? [];
    const classId = selectedClassId;
    updateClass(selectedClassId, (cd) => ({
      ...cd,
      assignments: cd.assignments.filter((a) => a.id !== removed.id),
      grades: cd.grades.filter((g) => g.assignmentId !== removed.id),
    }));
    setDeleteTarget(null);
    // Muharrir shu topshiriqni ochib turgan boʻlsa, Host oʻzi yopadi.
    toast.success(t("toastDeleted"), {
      description: removed.title,
      action: {
        label: t("undo"),
        onClick: () =>
          updateClass(classId, (cd) => ({
            ...cd, assignments: [removed, ...cd.assignments], grades: [...cd.grades, ...removedGrades],
          })),
      },
    });
  }

  const noClass = !effectiveClassId;
  const openRunsCount = runs.length;

  return (
    <div className="flex flex-col flex-1 min-w-0 gap-4 p-4 md:p-6 max-lg:min-h-full lg:h-full lg:min-h-0">
      <TourDemoBanner tourId="assignments" active={isDemoMode} />
      {barClasses.length > 0 && (
        <AssignmentsTopBar
          classes={barClasses}
          selectedId={effectiveClassId}
          onSelect={handleSelectClass}
          view={view}
          onView={changeView}
          openRuns={openRunsCount}
        />
      )}
      {view === "studio" && !isDemoMode && selectedClassId ? (
        <LessonStudio
          key={selectedClassId}
          classId={selectedClassId}
          onLaunch={(preset) => launchFlow.openLaunch(selectedClassId, preset)}
          onOpenBank={() => setBankOpen(true)}
          onSetsChanged={() => setBankVersion((v) => v + 1)}
        />
      ) : (
        <div data-tour="assignments-list" className="flex min-w-0 min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-border bg-card max-lg:min-h-[60svh]">
          {noClass ? (
            <Empty className="h-full border-0">
              <EmptyHeader>
                <EmptyMedia><Illustration name="29" className="h-32 text-black dark:text-white" /></EmptyMedia>
                <EmptyTitle>{t("noClassTitle")}</EmptyTitle>
                <EmptyDescription>{t("noClassDescription")}</EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <>
              <div className={panelHeaderClass + " items-center justify-between gap-3"}>
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <SectionIcon>
                    <ClipboardList />
                  </SectionIcon>
                  <CardTitle className="min-w-0 shrink truncate">{t("title")}</CardTitle>
                  <TypographyMuted className="hidden shrink-0 text-sm md:inline">
                    ({totalCount})
                  </TypographyMuted>
                </div>
                <div data-tour="assignments-create" className="flex shrink-0 items-center gap-2">
                  {/* Bank «Yaratish» dan OLDIN turadi: tayyor test tanlash
                      noldan tuzishdan tezroq va koʻpincha aynan shu kerak. */}
                  <Button
                    variant="outline"
                    onClick={() => setBankOpen(true)}
                    className="gap-1.5 font-semibold shadow-none"
                  >
                    <Library className="size-4" />
                    <span className="hidden sm:inline">{tb("openButton")}</span>
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleCreateClick()}
                    className="gap-1.5 font-semibold shadow-none"
                  >
                    <Plus className="size-4" />
                    <span className="hidden sm:inline">{t("createButton")}</span>
                  </Button>
                  {/* Sarlavhada «Boshlash» YOʻQ: «nimani?» degan savol
                      qoldirardi. Testni berish — har test qatorida
                      («Darsda oʻtkazish» / «Uyga berish»). */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" aria-label={t("actionsMenu")} className="text-muted-foreground">
                        <MoreHorizontal className="size-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem className="gap-2" onSelect={() => setLlOpen(true)}>
                        <RefreshCw className="size-4" />
                        {tl("llMenu")}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              <div className={panelCardContentClass}>
                {/* Boʻsh holat — toifa ham, tayyor test ham yoʻq. `groups`
                    endi BOʻSH toifalarni ham qamraydi, shuning uchun shart
                    `totalCount` emas: toifasi bor sinf boʻsh koʻrinmasin. */}
                {groups.length === 0 && orphanSets.length === 0 && archivedSets.length === 0 && !draftCard && runs.length === 0 ? (
                  <Empty className="h-full border-0">
                    <EmptyHeader>
                      <EmptyMedia><Illustration name="29" className="h-32 text-black dark:text-white" /></EmptyMedia>
                      <EmptyTitle>{t("emptyTitle")}</EmptyTitle>
                      <EmptyDescription>{t("emptyDescription")}</EmptyDescription>
                    </EmptyHeader>
                    <EmptyContent>
                      <Button onClick={() => handleCreateClick()} className="gap-2">
                        <Plus className="size-4" /> {t("createButton")}
                      </Button>
                    </EmptyContent>
                  </Empty>
                ) : (
                  <ScrollArea className="h-full w-full">
                    <div className="flex flex-col gap-6 p-5">
                      {/* Ochiq va natijasi kutilayotgan ishlar — ENG tepada:
                          bular hozir davom etayotgan dars va uy vazifalari. */}
                      <ActiveRuns runs={runs} onOpen={launchFlow.openRun} />

                      {/* Tugallanmagan qoralama — eng tepada, chunki u
                          oʻqituvchining yarim qolgan ishi. */}
                      {draftCard && (
                        <ContextMenu>
                          <ContextMenuTrigger asChild>
                            <button
                              type="button"
                              onClick={restoreSession}
                              className="list-card flex w-full items-center gap-3 border-dashed py-3 pl-4 pr-4 text-left"
                            >
                              <div className="list-card-icon flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                                <PenLine className="size-4" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <h4 className="truncate text-sm font-medium text-foreground">
                                  {draftCard.title || t("untitledDeck")}
                                </h4>
                                <TypographyMuted className="truncate text-xs">
                                  {t("draftCardHint")}
                                </TypographyMuted>
                              </div>
                              <Badge size="sm" variant="outline" className="shrink-0 text-muted-foreground">
                                {t("status_draft")}
                              </Badge>
                            </button>
                          </ContextMenuTrigger>
                          <ContextMenuContent>
                            <ContextMenuItem
                              variant="destructive"
                              className="gap-2"
                              onSelect={() => {
                                closeSession();
                                toast.success(t("draftDiscarded"));
                              }}
                            >
                              <Trash2 className="size-4" />
                              {t("deleteDraft")}
                            </ContextMenuItem>
                          </ContextMenuContent>
                        </ContextMenu>
                      )}

                      {/* Tayyor testlar talabga koʻra dastlab yopiq;
                          ustoz istasa ochib, bankdan oladi yoki boshqaradi. */}
                      {orphanSets.length > 0 && (
                        <Accordion type="single" collapsible className="rounded-xl border">
                          <AccordionItem value="ready-tests" className="border-0">
                          <AccordionTrigger className="px-4 py-3 hover:no-underline">
                          <span className="flex items-center gap-2">
                            <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                              <FileCheck2 className="size-3.5" />
                            </div>
                            <span className="text-sm font-semibold text-foreground">
                              {t("orphanSetsTitle")}
                            </span>
                            <TypographyMuted className="text-xs">
                              {orphanSets.length}
                            </TypographyMuted>
                          </span>
                          </AccordionTrigger>
                          <AccordionContent className="px-4 pb-4">
                          <div className="flex flex-col gap-3">
                            <TypographyMuted className="text-xs">{t("orphanSetsDescription")}</TypographyMuted>
                            <Button variant="outline" size="sm" className="w-fit gap-2" onClick={() => setBankOpen(true)}>
                              <Library className="size-4" /> {t("browseBank")}
                            </Button>
                          {/* Karta bosilsa savollar muharriri ochiladi;
                              sessiya va oʻchirish — oʻng-tugma menyusida
                              (topshiriq kartalari bilan bir til). */}
                          <div className="flex flex-col gap-2">
                            {orphanSets.map((set) => (
                              <ContextMenu key={set.id}>
                                <ContextMenuTrigger asChild>
                                  <div className="list-card group flex items-center gap-2 pr-2">
                                    <button
                                      type="button"
                                      onClick={() => set.hasSessions ? void copySetForEditing(set) : setBuilderSetId(set.id)}
                                      className="flex min-w-0 flex-1 items-center gap-3 py-3 pl-4 text-left"
                                    >
                                      <div className="list-card-icon flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                                        <FileCheck2 className="size-4" />
                                      </div>
                                      <div className="min-w-0 flex-1">
                                        <h4 className="truncate text-sm font-medium text-foreground">
                                          {set.title}
                                        </h4>
                                        {set.hasSessions && <p className="text-xs text-muted-foreground">{t("usedSetHint")}</p>}
                                      </div>
                                    </button>
                                    <Badge size="sm"
                                      variant="outline"
                                      className="hidden shrink-0 text-muted-foreground sm:inline-flex"
                                    >
                                      {t("questionCount", { count: set.itemCount })}
                                    </Badge>
                                    {set.hasSessions && <Badge size="sm" variant="outline" className="shrink-0">{t("usedSetBadge")}</Badge>}
                                    {/* KOʻRINADIGAN asosiy amal — test tayyor,
                                        keyingi qadam uni oʻquvchilarga berish. */}
                                    <RunButtons labels="sm" onRun={(intent) => launchSet(set, intent)} />
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          aria-label={t("actionsMenu")}
                                          className="size-8 shrink-0 text-muted-foreground"
                                        >
                                          <MoreHorizontal className="size-4" />
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end">
                                        <DropdownMenuItem className="gap-2" onSelect={() => set.hasSessions ? void copySetForEditing(set) : setBuilderSetId(set.id)}>
                                          <PenLine className="size-4" /> {set.hasSessions ? t("copyToEdit") : t("edit")}
                                        </DropdownMenuItem>
                                        {RUN_INTENTS.map((intent) => {
                                          const Icon = LAUNCH_INTENTS[intent].icon;
                                          return (
                                            <DropdownMenuItem
                                              key={intent}
                                              className="gap-2"
                                              onSelect={() => launchSet(set, intent)}
                                            >
                                              <Icon className="size-4" />
                                              {runText[intent].label}
                                            </DropdownMenuItem>
                                          );
                                        })}
                                        <DropdownMenuSeparator />
                                        {!set.hasSessions && <DropdownMenuItem
                                          variant="destructive"
                                          className="gap-2"
                                          onSelect={() => setDeleteSet({ id: set.id, title: set.title })}
                                        >
                                          <Trash2 className="size-4" />
                                          {t("delete")}
                                        </DropdownMenuItem>}
                                        <DropdownMenuItem className="gap-2" onSelect={() => void toggleSetArchive(set.id, true)}>
                                          <Archive className="size-4" /> {t("archiveTest")}
                                        </DropdownMenuItem>
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  </div>
                                </ContextMenuTrigger>
                                <ContextMenuContent>
                                  <ContextMenuItem className="gap-2" onSelect={() => set.hasSessions ? void copySetForEditing(set) : setBuilderSetId(set.id)}>
                                    <PenLine className="size-4" /> {set.hasSessions ? t("copyToEdit") : t("edit")}
                                  </ContextMenuItem>
                                  {RUN_INTENTS.map((intent) => {
                                    const Icon = LAUNCH_INTENTS[intent].icon;
                                    return (
                                      <ContextMenuItem
                                        key={intent}
                                        className="gap-2"
                                        onSelect={() => launchSet(set, intent)}
                                      >
                                        <Icon className="size-4" />
                                        {runText[intent].label}
                                      </ContextMenuItem>
                                    );
                                  })}
                                  <ContextMenuSeparator />
                                  {!set.hasSessions && <ContextMenuItem
                                    variant="destructive"
                                    className="gap-2"
                                    onSelect={() => setDeleteSet({ id: set.id, title: set.title })}
                                  >
                                    <Trash2 className="size-4" />
                                    {t("delete")}
                                  </ContextMenuItem>}
                                  <ContextMenuItem className="gap-2" onSelect={() => void toggleSetArchive(set.id, true)}>
                                    <Archive className="size-4" /> {t("archiveTest")}
                                  </ContextMenuItem>
                                </ContextMenuContent>
                              </ContextMenu>
                            ))}
                          </div>
                          </div>
                          </AccordionContent>
                          </AccordionItem>
                        </Accordion>
                      )}

                      {archivedSets.length > 0 && (
                        <Accordion type="single" collapsible className="rounded-xl border">
                          <AccordionItem value="archive" className="border-0">
                            <AccordionTrigger className="px-4 py-3 hover:no-underline">
                              <span className="flex items-center gap-2 text-sm font-semibold">
                                <Archive className="size-4" /> {t("archivedTests")} ({archivedSets.length})
                              </span>
                            </AccordionTrigger>
                            <AccordionContent className="flex flex-col gap-2 px-4 pb-4">
                              {archivedSets.map((set) => (
                                <div key={set.id} className="list-card flex items-center justify-between gap-3 p-3">
                                  <span className="min-w-0 truncate text-sm">{set.title}</span>
                                  <Button variant="outline" size="sm" onClick={() => void toggleSetArchive(set.id, false)}>
                                    {t("restoreTest")}
                                  </Button>
                                </div>
                              ))}
                            </AccordionContent>
                          </AccordionItem>
                        </Accordion>
                      )}

                    <Accordion
                      type="multiple"
                      defaultValue={groups.map((g) => g.id)}
                      className="flex flex-col gap-3"
                    >
                      {groups.map((group) => (
                        /* Toifa = RANGLI LENTALI panel: sarlavha toifa rangining
                           ochiq yuzasida turadi, chegara ham shu rangdan. Ilgari
                           sarlavha erkin qator edi va uzun roʻyxatda qaysi
                           topshiriq qaysi toifaga tegishli ekani koʻrinmasdi. */
                        <AccordionItem
                          key={group.id}
                          value={group.id}
                          /* `last:border-b` — primitivning `last:border-b-0`
                             defaulti oxirgi toifani pastki chegarasiz qoldirardi
                             (u roʻyxat-ajratkich uchun, panel uchun emas). */
                          className="overflow-hidden rounded-xl border last:border-b"
                          style={
                            group.color
                              ? { borderColor: topicTint(TOPIC_COLOR_HEX[group.color], 35) }
                              : undefined
                          }
                        >
                          {/* `justify-start` MAJBURIY: AccordionTrigger'ning
                              standart `justify-between`i ikonka/nom/sonni
                              butun kenglikka tarqatib, sarlavhani ekran
                              oʻrtasiga tashlab yuborardi — roʻyxat vertikal
                              skanerlanmasdi. Chevron `mr-auto` bilan chetga
                              suriladi. */}
                          <AccordionTrigger
                            className={cn(
                              "items-center justify-start gap-2 rounded-none px-4 py-3 hover:no-underline [&[data-state=open]>svg]:rotate-180",
                              !group.color && "bg-muted/50 text-muted-foreground",
                            )}
                            style={
                              group.color
                                ? {
                                    backgroundColor: topicTint(TOPIC_COLOR_HEX[group.color], 12),
                                    color: TOPIC_COLOR_HEX[group.color],
                                  }
                                : undefined
                            }
                          >
                            {/* Ikonka-quti — TOʻQ toifa rangi + oq ikonka
                                (kartadagi bilan bir xil retsept). */}
                            <div
                              className={cn(
                                "flex size-8 shrink-0 items-center justify-center rounded-full",
                                group.color ? "text-white" : "bg-muted-foreground/20 text-muted-foreground",
                              )}
                              style={group.color ? { backgroundColor: TOPIC_COLOR_HEX[group.color] } : undefined}
                            >
                              <Tag className="size-4" />
                            </div>
                            {/* Sarlavha `text-foreground` — toifa rangining oʻzida
                                yozilsa ochiq ranglarda (sariq, lime) oʻqilmasdi. */}
                            <span className="text-[15px] font-semibold text-foreground">{group.name}</span>
                            <TypographyMuted className="text-xs">{group.items.length}</TypographyMuted>
                            {/* Chevron'ni chetga suruvchi boʻshliq. */}
                            <span className="mr-auto" />
                            {group.items.length === 0 && (
                              <span
                                role="button"
                                tabIndex={0}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCreateClick(group.id !== OTHER_GROUP ? group.id : undefined);
                                }}
                                onKeyDown={(e) => {
                                  if (e.key !== "Enter" && e.key !== " ") return;
                                  e.stopPropagation();
                                  e.preventDefault();
                                  handleCreateClick(group.id !== OTHER_GROUP ? group.id : undefined);
                                }}
                                className="flex h-7 shrink-0 items-center gap-1 rounded-md px-2 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
                              >
                                <Plus className="size-3.5" />
                                {t("createButton")}
                              </span>
                            )}
                          </AccordionTrigger>
                          {group.items.length > 0 && (
                            <AccordionContent className="bg-card p-3">
                              {/* BITTA ustun, chapga tekis — Classroom/Canvas
                                  roʻyxati naqshi. Uch ustunli karta gridida
                                  koʻz vertikal skanerlay olmasdi va qatorga
                                  holat/sana sigʻmasdi. */}
                              <div className="flex flex-col gap-2">
                                {group.items.map((a) => {
                                  /* Mazmun turi — ikonkasi, rangi va nomi YAGONA
                                     registrdan (`MATERIAL_KINDS`): oʻqituvchi
                                     muharrirdagi shakl tanlovida koʻrgan yashil
                                     «Test» belgisini roʻyxatda ham tanisin.
                                     Mazmunsiz topshiriq registrda YOʻQ — u
                                     material emas, jurnaldagi baho ustuni
                                     (qogʻozdagi ish, ogʻzaki soʻrov), shuning
                                     uchun neytral qoladi. */
                                  const isDeck = a.kind === "deck";
                                  const isTest = a.kind === "test" || Boolean(a.setId);
                                  const kindMeta = isDeck
                                    ? MATERIAL_KINDS.deck
                                    : isTest
                                      ? MATERIAL_KINDS.test
                                      : null;
                                  const Icon = kindMeta?.icon ?? Columns3;
                                  const kindTints = kindMeta ? classTints(kindMeta.color) : null;
                                  const kindLabel = kindMeta ? tMaterial(kindMeta.labelKey) : t("kindManual");
                                  /* Holat sanadan va baholardan hisoblanadi —
                                     muharrir sarlavhasidagi chip bilan bitta
                                     komponent, bitta mantiq. */
                                  const status = assignmentStatusFrom(
                                    a.date,
                                    studentCount,
                                    gradedCounts.get(a.id) ?? 0,
                                    today
                                  );
                                  /* Ikkinchi qator — sana. Muddatli topshiriqda
                                     rejim aytiladi ("Soʻngmuddat"), oʻtkaziladigan
                                     ishda faqat sana: prefiks maʼlumot
                                     qoʻshmaydi. Sanasiz boʻlsa chip aytadi. */
                                  const meta = a.dueDate
                                    ? `${t("modeDue")} · ${shortDate(a.dueDate)}`
                                    : a.date
                                      ? shortDate(a.date)
                                      : null;
                                  const members = groupMembers(a);
                                  return (
                                    <ContextMenu key={a.id}>
                                      <ContextMenuTrigger asChild>
                                        {/* `--card-accent` — hover/tanlov rangi
                                            TOIFAdan keladi (Mavzular sahifasida
                                            sinf rangidan kelgani kabi). Berilmasa
                                            `.list-card` neytral `--primary`ga
                                            tushib qolardi. */}
                                        <div
                                          className="list-card group flex items-center gap-2 pr-2"
                                          style={
                                            group.color
                                              ? { ["--card-accent" as string]: TOPIC_COLOR_HEX[group.color] }
                                              : undefined
                                          }
                                        >
                                          <button
                                            type="button"
                                            onClick={() => openEditor(a.id)}
                                            className="flex min-w-0 flex-1 items-center gap-3 py-3 pl-4 text-left"
                                          >
                                            {/* Ikonka toifa rangini oladi — YENGIL yuza
                                                (15%) + toʻyingan siyoh. Toʻq yuza faqat
                                                akkordeon sarlavhasida: qatorlarda ham
                                                takrorlansa roʻyxat rang shovqiniga
                                                aylanardi. */}
                                            <div
                                              className={cn(
                                                "list-card-icon flex size-9 shrink-0 items-center justify-center rounded-full",
                                                !group.color && "bg-muted text-muted-foreground",
                                              )}
                                              style={
                                                group.color
                                                  ? {
                                                      backgroundColor: topicTint(TOPIC_COLOR_HEX[group.color], 15),
                                                      color: TOPIC_COLOR_HEX[group.color],
                                                    }
                                                  : undefined
                                              }
                                            >
                                              <Icon className="size-4" />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                              <h4 className="truncate text-sm font-medium text-foreground">
                                                {a.title}
                                              </h4>
                                              {meta && (
                                                <TypographyMuted className="truncate text-xs">
                                                  {meta}
                                                </TypographyMuted>
                                              )}
                                            </div>
                                          </button>
                                          {/* Koʻp-sinf belgisi — sinf ranglari
                                              doira boʻlib (ClassSwatch
                                              standarti), tooltipda nomlar. */}
                                          {members.length > 1 && (
                                            <Tooltip>
                                              <TooltipTrigger asChild>
                                                <span className="hidden shrink-0 cursor-default items-center gap-1.5 rounded-full bg-muted px-2 py-1 sm:inline-flex">
                                                  <ClassSwatchStack
                                                    hexes={members.map((m) => m.hex)} />
                                                  <span className="text-micro font-semibold text-muted-foreground">
                                                    {members.length}
                                                  </span>
                                                </span>
                                              </TooltipTrigger>
                                              <TooltipContent side="bottom" className="max-w-56">
                                                {t("groupClassesHint", {
                                                  classes: members.map((m) => m.name).join(", "),
                                                })}
                                              </TooltipContent>
                                            </Tooltip>
                                          )}
                                          {/* Tur belgisi — registrdagi rang + ikonka
                                              (`MaterialKindTile` bilan bir oilada),
                                              shakli `AssignmentStatusChip` bilan
                                              AYNAN bir xil (rounded-full pill,
                                              gap-1.5, text-xs) — ikkalasi yonma-yon
                                              turadi, ikki xil "pill tili" gapirmasin.
                                              Registrda yoʻq «Baho ustuni» neytral
                                              `bg-muted` boʻlib qoladi. */}
                                          <span
                                            className={cn(
                                              "hidden shrink-0 items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold sm:inline-flex",
                                              !kindTints && "bg-muted text-muted-foreground",
                                            )}
                                            style={kindTints ? { ...kindTints.badge, ...kindTints.textStrong } : undefined}
                                          >
                                            <Icon className="size-3.5" />
                                            {kindLabel}
                                          </span>
                                          <AssignmentStatusChip status={status} />
                                          {/* Test biriktirilgan ustun — uni oʻquvchilarga
                                              berish shu yerdan, muharrirni ochmasdan.
                                              Muddati bor boʻlsa uy vazifasi standarti
                                              shu sana boʻladi. */}
                                          {a.setId && (
                                            <RunButtons
                                              labels="md"
                                              onRun={(intent) =>
                                                launchSet({ id: a.setId!, title: a.title }, intent, a.dueDate)
                                              }
                                            />
                                          )}
                                          {/* Amal endi KOʻRINADI. Oʻng-tugma
                                              menyusi yagona yoʻl boʻlib
                                              qolgan edi — sichqonchasiz yoki
                                              bilmagan oʻqituvchi uchun amal
                                              mavjud emasdek edi. */}
                                          <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                              <Button
                                                variant="ghost"
                                                size="icon"
                                                aria-label={t("actionsMenu")}
                                                className="size-8 shrink-0 text-muted-foreground"
                                              >
                                                <MoreHorizontal className="size-4" />
                                              </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                              <DropdownMenuItem className="gap-2" onSelect={() => openEditor(a.id)}>
                                                <PenLine className="size-4" /> {t("edit")}
                                              </DropdownMenuItem>
                                              {a.setId &&
                                                RUN_INTENTS.map((intent) => {
                                                  const Icon = LAUNCH_INTENTS[intent].icon;
                                                  return (
                                                    <DropdownMenuItem
                                                      key={intent}
                                                      className="gap-2"
                                                      onSelect={() =>
                                                        launchSet({ id: a.setId!, title: a.title }, intent, a.dueDate)
                                                      }
                                                    >
                                                      <Icon className="size-4" />
                                                      {runText[intent].label}
                                                    </DropdownMenuItem>
                                                  );
                                                })}
                                              <DropdownMenuItem
                                                className="gap-2"
                                                onSelect={() => handleDuplicate(a)}
                                              >
                                                <Copy className="size-4" />
                                                {t("duplicate")}
                                              </DropdownMenuItem>
                                              <DropdownMenuSeparator />
                                              <DropdownMenuItem
                                                variant="destructive"
                                                className="gap-2"
                                                onSelect={() => setDeleteTarget(a)}
                                              >
                                                <Trash2 className="size-4" />
                                                {t("delete")}
                                              </DropdownMenuItem>
                                            </DropdownMenuContent>
                                          </DropdownMenu>
                                        </div>
                                      </ContextMenuTrigger>
                                      <ContextMenuContent>
                                        <ContextMenuItem className="gap-2" onSelect={() => openEditor(a.id)}>
                                          <PenLine className="size-4" /> {t("edit")}
                                        </ContextMenuItem>
                                        {a.setId &&
                                          RUN_INTENTS.map((intent) => {
                                            const Icon = LAUNCH_INTENTS[intent].icon;
                                            return (
                                              <ContextMenuItem
                                                key={intent}
                                                className="gap-2"
                                                onSelect={() =>
                                                  launchSet({ id: a.setId!, title: a.title }, intent, a.dueDate)
                                                }
                                              >
                                                <Icon className="size-4" />
                                                {runText[intent].label}
                                              </ContextMenuItem>
                                            );
                                          })}
                                        <ContextMenuItem className="gap-2" onSelect={() => handleDuplicate(a)}>
                                          <Copy className="size-4" />
                                          {t("duplicate")}
                                        </ContextMenuItem>
                                        <ContextMenuSeparator />
                                        <ContextMenuItem
                                          variant="destructive"
                                          className="gap-2"
                                          onSelect={() => setDeleteTarget(a)}
                                        >
                                          <Trash2 className="size-4" />
                                          {t("delete")}
                                        </ContextMenuItem>
                                      </ContextMenuContent>
                                    </ContextMenu>
                                  );
                                })}
                              </div>
                            </AccordionContent>
                          )}
                        </AccordionItem>
                      ))}
                    </Accordion>
                    </div>
                  </ScrollArea>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* LessonLab test banki — tayyor testni shu sinfga berish. */}
      {bankOpen && selectedClassId && (
        <TestBankOverlay
          classId={selectedClassId}
          className={classData?.info.name ?? ""}
          onClose={() => setBankOpen(false)}
          onAssigned={() => setBankVersion((v) => v + 1)}
          onRun={(setId, title) => {
            setBankOpen(false);
            launchFlow.openLaunch(selectedClassId, { setId, title, intent: "class" });
          }}
          onCreate={() => { setBankOpen(false); setBuilderCopy({ title: "", questions: [] }); }}
        />
      )}

      {/* Savol muharriri va sessiya paneli — oraliq ekransiz. */}
      {builderSetId && selectedClassId && (
        <SetBuilderOverlay
          classId={selectedClassId}
          setId={builderSetId}
          onSaved={() => setBankVersion((v) => v + 1)}
          onClose={() => setBuilderSetId(null)}
        />
      )}
      {builderCopy && selectedClassId && (
        <SetBuilderOverlay
          classId={selectedClassId}
          initialTitle={builderCopy.title}
          initialQuestions={builderCopy.questions.length ? builderCopy.questions : undefined}
          onSaved={() => setBankVersion((v) => v + 1)}
          onClose={() => setBuilderCopy(null)}
        />
      )}

      {/* Oʻtkazish oynasi, natija ekrani va pult rejimi. */}
      {launchFlow.element}

      {llOpen && (
        <LessonLabSyncDialog
          classId={selectedClassId}
          hasClasses={Object.keys(classDataMap).length > 0}
          status={importStatus}
          onClose={() => {
            setLlOpen(false);
            setImportStatus(null);
          }}
          onSynced={() => setBankVersion((v) => v + 1)}
        />
      )}

      <AlertDialog open={!!deleteSet} onOpenChange={(open) => { if (!open) setDeleteSet(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("deleteSetDialogTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("deleteSetDialogDescription", { title: deleteSet?.title ?? "" })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={handleDeleteSetConfirm}
            >
              {t("delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("deleteDialogTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("deleteDialogDescription", { title: deleteTarget?.title ?? "" })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={handleDeleteConfirm}
            >
              {t("delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  ClipboardList, Plus, Presentation, FileCheck2, Copy, Trash2, Tag, Library, Columns3, Users,
  PenLine, MoreHorizontal,
} from "lucide-react";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { useGradesStore } from "@/store/useGradesStore";
import { useClassIdParam } from "@/hooks/useClassIdParam";
import ClassListPanel from "@/components/ClassListPanel";
import { DashboardColumns, DashboardColumn, panelHeaderClass, panelCardContentClass } from "@/components/DashboardPage";
import {
  TOPIC_COLOR_HEX, assignmentGroupKey, classColor,
  type Assignment, type TopicColor,
} from "@/lib/grades-data";
import { CLASS_COLOR_HEX } from "@/lib/class-colors";
import { ClassSwatch } from "@/components/ClassSwatch";
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
import { MONTHS_UZ_SHORT } from "@/lib/localization";
import { todayKey } from "@/lib/date-keys";
import { Illustration } from "@/components/ui/illustration";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  useAssignmentEditorStore, makeDraftPayload,
} from "@/store/useAssignmentEditorStore";
import {
  deleteSetAction, getSetAction, listSetsWithPublishStateAction,
} from "@/server/actions/assess";
import type { ActivitySetRow } from "@/server/db/schema";
import SetBuilderOverlay from "./_components/test/SetBuilderOverlay";
import SessionPanelModal from "./_components/test/SessionPanelModal";
import TestBankOverlay from "./_components/TestBankOverlay";

/** "Other" (Toifasiz) chelagi uchun sentinel — DB qatori emas, faqat guruhlash kaliti. */
const OTHER_GROUP = "__other__";

/** `yyyy-mm-dd` → "14-sen". Qatorda joy tor — hafta kuni chipda emas, tooltipda. */
function shortDate(key: string): string {
  const [y, m, d] = key.split("-").map(Number);
  if (!y || !m || !d) return key;
  return `${d}-${MONTHS_UZ_SHORT[(m - 1) % 12]}`;
}

export default function AssignmentsPage() {
  const t = useTranslations("AssignmentsPage");
  const tb = useTranslations("TestBank");
  const searchParams = useSearchParams();
  const openId = searchParams.get("assignment");

  const classDataMap = useGradesStore((s) => s.classDataMap);
  const updateClass = useGradesStore((s) => s.updateClass);
  const [selectedClassId, handleSelectClass] = useClassIdParam();
  const [deleteTarget, setDeleteTarget] = useState<Assignment | null>(null);
  /* Muharrir GLOBAL (AssignmentEditorHost) — sahifa faqat sessiya ochadi. */
  const openDraft = useAssignmentEditorStore((s) => s.openDraft);
  const openEdit = useAssignmentEditorStore((s) => s.openEdit);

  const classData = selectedClassId ? classDataMap[selectedClassId] : undefined;

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
    { id: string; title: string; itemCount: number }[]
  >([]);
  /* Toʻplam amallari — savol muharriri, sessiya paneli, oʻchirish. Ilgari
     uchalasi ham "Testlar (5-A)" oraliq overlay'ida edi; u sidebar'dan
     olib tashlangan `/dashboard/baholash` sahifasining qoldigʻi bo'lib,
     ortiqcha toʻliq-ekran qavati qoʻshardi. Roʻyxatning uyi — shu sahifa. */
  const [builderSetId, setBuilderSetId] = useState<string | null>(null);
  const [sessionSet, setSessionSet] = useState<ActivitySetRow | null>(null);
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
     roʻyxatda karta boʻlib turadi (Google Classroom "Draft" naqshi).
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
            .map((r) => ({ id: r.set.id, title: r.set.title, itemCount: r.set.items.length }))
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
  }, [selectedClassId, editorSession, builderSetId, sessionSet, bankVersion]);

  /** Toʻplamning sessiya paneli — panel toʻliq qator talab qiladi. */
  async function openSetSession(setId: string) {
    const row = await getSetAction(setId).catch(() => null);
    if (row) setSessionSet(row);
    else toast.error(t("setMissing"));
  }

  function handleDeleteSetConfirm() {
    if (!deleteSet) return;
    const removed = deleteSet;
    setDeleteSet(null);
    setPendingSets((prev) => prev.filter((s) => s.id !== removed.id));
    deleteSetAction(removed.id)
      .then(() => toast.success(t("toastDeleted"), { description: removed.title }))
      // Server rad etsa roʻyxat haqiqatdan chetga chiqmasin.
      .catch(() => {
        toast.error(t("deleteSetFailed"));
        setBankVersion((v) => v + 1);
      });
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
    () => pendingSets.filter((s) => !linkedSetIds.has(s.id)),
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
          updateClass(selectedClassId, (cd) => ({ ...cd, assignments: [removed, ...cd.assignments] })),
      },
    });
  }

  const noClass = !selectedClassId;
  const columnsTemplate = "minmax(0,1fr) minmax(0,3fr)";

  return (
    <div className="flex flex-col flex-1 min-w-0 h-full min-h-0">
      <DashboardColumns template={columnsTemplate} className="h-full overflow-hidden p-4 md:p-6">
        <DashboardColumn hideBelow="lg">
          <ClassListPanel
            page="assignments"
            selectedClassId={selectedClassId ?? ""}
            onSelect={handleSelectClass}
          />
        </DashboardColumn>

        <div className="flex min-w-0 min-h-0 h-full flex-col overflow-hidden rounded-xl border border-border bg-card">
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
                <div className="flex min-w-0 flex-1 items-center gap-2.5">
                  <SectionIcon>
                    <ClipboardList />
                  </SectionIcon>
                  <CardTitle className="min-w-0 shrink truncate">{t("title")}</CardTitle>
                  <TypographyMuted className="hidden shrink-0 text-sm md:inline">
                    ({totalCount})
                  </TypographyMuted>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {/* Bank «Yaratish» dan OLDIN turadi: tayyor test tanlash
                      noldan tuzishdan tezroq va koʻpincha aynan shu kerak. */}
                  <Button
                    variant="outline"
                    onClick={() => setBankOpen(true)}
                    className="gap-1.5 font-semibold"
                  >
                    <Library className="size-4" />
                    <span className="hidden sm:inline">{tb("openButton")}</span>
                  </Button>
                  <Button onClick={() => handleCreateClick()} className="gap-1.5 font-semibold">
                    <Plus className="size-4" />
                    {t("createButton")}
                  </Button>
                </div>
              </div>

              <div className={panelCardContentClass}>
                {/* Boʻsh holat — toifa ham, tayyor test ham yoʻq. `groups`
                    endi BOʻSH toifalarni ham qamraydi, shuning uchun shart
                    `totalCount` emas: toifasi bor sinf boʻsh koʻrinmasin. */}
                {groups.length === 0 && orphanSets.length === 0 && !draftCard ? (
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
                      {/* Tugallanmagan qoralama — eng tepada, chunki u
                          oʻqituvchining yarim qolgan ishi. */}
                      {draftCard && (
                        <ContextMenu>
                          <ContextMenuTrigger asChild>
                            <button
                              type="button"
                              onClick={restoreSession}
                              className="list-card flex w-full items-center gap-3 border-dashed py-3 pl-4 pr-3.5 text-left"
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
                              <Badge variant="outline" className="shrink-0 text-[10px] text-muted-foreground">
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

                      {/* Tuzilgan, lekin hali jurnalga chiqmagan testlar —
                          eng tepada, chunki oʻqituvchi aynan ularni
                          qidirib keladi (endigina tuzgan). */}
                      {orphanSets.length > 0 && (
                        <div className="flex flex-col gap-2.5">
                          <div className="flex items-center gap-2">
                            <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                              <FileCheck2 className="size-3.5" />
                            </div>
                            <h3 className="text-sm font-semibold text-foreground">
                              {t("orphanSetsTitle")}
                            </h3>
                            <TypographyMuted className="text-xs">
                              {orphanSets.length}
                            </TypographyMuted>
                          </div>
                          <TypographyMuted className="text-xs">
                            {t("orphanSetsDescription")}
                          </TypographyMuted>
                          {/* Karta bosilsa savollar muharriri ochiladi;
                              sessiya va oʻchirish — oʻng-tugma menyusida
                              (topshiriq kartalari bilan bir til). */}
                          <div className="flex flex-col gap-2">
                            {orphanSets.map((set) => (
                              <ContextMenu key={set.id}>
                                <ContextMenuTrigger asChild>
                                  <div className="list-card group flex items-center gap-2 pr-2.5">
                                    <button
                                      type="button"
                                      onClick={() => setBuilderSetId(set.id)}
                                      className="flex min-w-0 flex-1 items-center gap-3 py-3 pl-4 text-left"
                                    >
                                      <div className="list-card-icon flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                                        <FileCheck2 className="size-4" />
                                      </div>
                                      <div className="min-w-0 flex-1">
                                        <h4 className="truncate text-sm font-medium text-foreground">
                                          {set.title}
                                        </h4>
                                      </div>
                                    </button>
                                    <Badge
                                      variant="outline"
                                      className="shrink-0 text-[10px] text-muted-foreground"
                                    >
                                      {t("questionCount", { count: set.itemCount })}
                                    </Badge>
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          aria-label={t("actionsMenu")}
                                          className="size-8 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100 data-[state=open]:opacity-100"
                                        >
                                          <MoreHorizontal className="size-4" />
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end">
                                        <DropdownMenuItem
                                          className="gap-2"
                                          onSelect={() => void openSetSession(set.id)}
                                        >
                                          <Users className="size-4" />
                                          {t("runSession")}
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem
                                          variant="destructive"
                                          className="gap-2"
                                          onSelect={() => setDeleteSet({ id: set.id, title: set.title })}
                                        >
                                          <Trash2 className="size-4" />
                                          {t("delete")}
                                        </DropdownMenuItem>
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  </div>
                                </ContextMenuTrigger>
                                <ContextMenuContent>
                                  <ContextMenuItem
                                    className="gap-2"
                                    onSelect={() => void openSetSession(set.id)}
                                  >
                                    <Users className="size-4" />
                                    {t("runSession")}
                                  </ContextMenuItem>
                                  <ContextMenuSeparator />
                                  <ContextMenuItem
                                    variant="destructive"
                                    className="gap-2"
                                    onSelect={() => setDeleteSet({ id: set.id, title: set.title })}
                                  >
                                    <Trash2 className="size-4" />
                                    {t("delete")}
                                  </ContextMenuItem>
                                </ContextMenuContent>
                              </ContextMenu>
                            ))}
                          </div>
                        </div>
                      )}

                    <Accordion
                      type="multiple"
                      defaultValue={groups.map((g) => g.id)}
                      className="flex flex-col gap-3"
                    >
                      {groups.map((group) => (
                        <AccordionItem key={group.id} value={group.id} className="border-b-0">
                          {/* `justify-start` MAJBURIY: AccordionTrigger'ning
                              standart `justify-between`i ikonka/nom/sonni
                              butun kenglikka tarqatib, sarlavhani ekran
                              oʻrtasiga tashlab yuborardi — roʻyxat vertikal
                              skanerlanmasdi. Chevron `mr-auto` bilan chetga
                              suriladi. */}
                          <AccordionTrigger className="items-center justify-start gap-3 rounded-lg px-2 py-3 hover:bg-muted/40 hover:no-underline [&[data-state=open]>svg]:rotate-180">
                            <div
                              className={
                                group.color
                                  ? "flex size-8 shrink-0 items-center justify-center rounded-lg"
                                  : "flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground"
                              }
                              style={
                                group.color
                                  ? {
                                      backgroundColor: `color-mix(in srgb, ${TOPIC_COLOR_HEX[group.color]} 15%, transparent)`,
                                      color: TOPIC_COLOR_HEX[group.color],
                                    }
                                  : undefined
                              }
                            >
                              <Tag className="size-4" />
                            </div>
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
                            <AccordionContent className="px-2 pb-3">
                              {/* BITTA ustun, chapga tekis — Classroom/Canvas
                                  roʻyxati naqshi. Uch ustunli karta gridida
                                  koʻz vertikal skanerlay olmasdi va qatorga
                                  holat/sana sigʻmasdi. */}
                              <div className="flex flex-col gap-2">
                                {group.items.map((a) => {
                                  // Mazmun turi — kartaning ikonkasi va yorligʻi.
                                  // Mazmunsiz topshiriq ham toʻlaqonli: u jurnaldagi
                                  // baho ustuni (qogʻozdagi ish, ogʻzaki soʻrov).
                                  const isDeck = a.kind === "deck";
                                  const isTest = a.kind === "test" || Boolean(a.setId);
                                  const Icon = isDeck ? Presentation : isTest ? FileCheck2 : Columns3;
                                  const kindLabel = isDeck
                                    ? t("kindDeck")
                                    : isTest
                                      ? t("kindTest")
                                      : t("kindManual");
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
                                        <div className="list-card group flex items-center gap-2 pr-2.5">
                                          <button
                                            type="button"
                                            onClick={() => openEditor(a.id)}
                                            className="flex min-w-0 flex-1 items-center gap-3 py-3 pl-4 text-left"
                                          >
                                            <div className="list-card-icon flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
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
                                                  <span className="flex items-center -space-x-1">
                                                    {members.slice(0, 3).map((m) => (
                                                      <ClassSwatch
                                                        key={m.id}
                                                        hex={m.hex}
                                                        className="size-2.5 ring-1 ring-card"
                                                      />
                                                    ))}
                                                  </span>
                                                  <span className="text-[10px] font-semibold text-muted-foreground">
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
                                          <Badge
                                            variant="outline"
                                            className="hidden shrink-0 text-[10px] text-muted-foreground sm:inline-flex"
                                          >
                                            {kindLabel}
                                          </Badge>
                                          <AssignmentStatusChip status={status} />
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
                                                className="size-8 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100 data-[state=open]:opacity-100"
                                              >
                                                <MoreHorizontal className="size-4" />
                                              </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
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
      </DashboardColumns>

      {/* LessonLab test banki — tayyor testni shu sinfga berish. */}
      {bankOpen && selectedClassId && (
        <TestBankOverlay
          classId={selectedClassId}
          className={classData?.info.name ?? ""}
          onClose={() => setBankOpen(false)}
          onAssigned={() => setBankVersion((v) => v + 1)}
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

      {/* Sessiya sinfsiz boshlanmaydi — roʻyxat ham, baho ham sinfdan
          keladi. Bu yerda sinf doim tanlangan (toʻplamlar roʻyxati
          shundan yuklanadi), shart faqat tipni toraytiradi. */}
      {sessionSet && selectedClassId && (
        <SessionPanelModal
          set={sessionSet}
          classId={selectedClassId}
          onClose={() => setSessionSet(null)}
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

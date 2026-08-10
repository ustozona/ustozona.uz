"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { ClipboardList, Plus, Presentation, FileCheck2, Copy, Trash2, Tag, Library } from "lucide-react";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { useGradesStore } from "@/store/useGradesStore";
import { useClassIdParam } from "@/hooks/useClassIdParam";
import ClassListPanel from "@/components/ClassListPanel";
import { DashboardColumns, DashboardColumn, panelHeaderClass, panelCardContentClass } from "@/components/DashboardPage";
import { TOPIC_COLOR_HEX, type Assignment, type TopicColor } from "@/lib/grades-data";
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
import { Illustration } from "@/components/ui/illustration";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  useAssignmentEditorStore, makeDraftPayload,
} from "@/store/useAssignmentEditorStore";
import { listSetsWithPublishStateAction } from "@/server/actions/assess";
import TestWorkspaceOverlay from "./_components/TestWorkspaceOverlay";
import TestBankOverlay from "./_components/TestBankOverlay";

/** "Other" (Toifasiz) chelagi uchun sentinel — DB qatori emas, faqat guruhlash kaliti. */
const OTHER_GROUP = "__other__";

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
  const [testWorkspaceSetId, setTestWorkspaceSetId] = useState<string | null>(null);
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
  }, [selectedClassId, editorSession, testWorkspaceSetId, bankVersion]);

  const groups = useMemo(() => {
    if (!classData) return [];
    const byTopic = new Map<string, Assignment[]>();
    for (const a of classData.assignments) {
      if (a.kind !== "test" && a.kind !== "deck") continue;
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

  const openEditor = (id: string) => {
    if (selectedClassId) openEdit(selectedClassId, id);
  };

  /* Topshiriqlar sahifasidan yaratish — mazmun MAJBURIY (test/taqdimot):
     `manualCreate: false` "Yaratish" tugmasini tur tanlanmaguncha oʻchiq
     qiladi (AssignmentEditorOverlay). */
  const handleCreateClick = (topicId?: string) => {
    if (!selectedClassId || !classData) return;
    openDraft(
      selectedClassId,
      false,
      makeDraftPayload(selectedClassId, topicId ?? classData.topics[0]?.id ?? null)
    );
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
                {groups.length === 0 && pendingSets.length === 0 ? (
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
                      {/* Tuzilgan, lekin hali jurnalga chiqmagan testlar —
                          eng tepada, chunki oʻqituvchi aynan ularni
                          qidirib keladi (endigina tuzgan). */}
                      {pendingSets.length > 0 && (
                        <div className="flex flex-col gap-2.5">
                          <div className="flex items-center gap-2">
                            <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                              <FileCheck2 className="size-3.5" />
                            </div>
                            <h3 className="text-sm font-semibold text-foreground">
                              Tayyorlangan testlar
                            </h3>
                            <TypographyMuted className="text-xs">
                              {pendingSets.length}
                            </TypographyMuted>
                          </div>
                          <TypographyMuted className="text-xs">
                            Bular hali jurnalda emas. Sessiya oʻtkazib natijani
                            koʻchirganingizdan keyin baho ustuni paydo boʻladi.
                          </TypographyMuted>
                          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
                            {pendingSets.map((set) => (
                              <button
                                key={set.id}
                                type="button"
                                onClick={() => setTestWorkspaceSetId(set.id)}
                                className="list-card group flex items-center gap-3 p-3.5 text-left"
                              >
                                <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                                  <FileCheck2 className="size-4" />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <h4 className="truncate text-sm font-medium text-foreground">
                                    {set.title}
                                  </h4>
                                </div>
                                <Badge
                                  variant="outline"
                                  className="shrink-0 text-[10px] text-muted-foreground"
                                >
                                  {set.itemCount} savol
                                </Badge>
                              </button>
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
                          <AccordionTrigger className="items-center gap-3 rounded-lg px-2 py-3 hover:bg-muted/40 hover:no-underline [&[data-state=open]>svg]:rotate-180">
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
                                className="ml-auto flex h-7 items-center gap-1 rounded-md px-2 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
                              >
                                <Plus className="size-3.5" />
                                {t("createButton")}
                              </span>
                            )}
                          </AccordionTrigger>
                          {group.items.length > 0 && (
                            <AccordionContent className="px-2 pb-3">
                              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
                                {group.items.map((a) => {
                                  const isDeck = a.kind === "deck";
                                  const Icon = isDeck ? Presentation : FileCheck2;
                                  return (
                                    <ContextMenu key={a.id}>
                                      <ContextMenuTrigger asChild>
                                        <button
                                          type="button"
                                          onClick={() => openEditor(a.id)}
                                          className="list-card group flex items-center gap-3 p-3.5 text-left"
                                        >
                                          <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                                            <Icon className="size-4" />
                                          </div>
                                          <div className="min-w-0 flex-1">
                                            <h4 className="truncate text-sm font-medium text-foreground">
                                              {a.title}
                                            </h4>
                                          </div>
                                          <Badge variant="outline" className="shrink-0 text-[10px] text-muted-foreground">
                                            {isDeck ? t("kindDeck") : t("kindTest")}
                                          </Badge>
                                        </button>
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

      {/* Test bosilganda oʻz ish maydonida ochiladi — muharrir ham,
          sessiya paneli ham oʻsha yerda (BaholashView). */}
      {testWorkspaceSetId && selectedClassId && (
        <TestWorkspaceOverlay
          classId={selectedClassId}
          className={classData?.info.name ?? ""}
          autoOpenSetId={testWorkspaceSetId}
          onClose={() => setTestWorkspaceSetId(null)}
        />
      )}

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

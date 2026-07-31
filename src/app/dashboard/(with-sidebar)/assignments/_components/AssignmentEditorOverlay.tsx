"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { createPortal } from "react-dom";
import {
  X, FileCheck2, Presentation, Check, GraduationCap, Tag, CalendarDays, Star, Users,
  ChevronRight, Loader2, ClipboardCheck, Clapperboard, FileText, Zap, Info,
} from "lucide-react";
import { useGradesStore } from "@/store/useGradesStore";
import { getSetIdForSessionAction } from "@/server/actions/assess-sessions";
import { TOPIC_COLOR_HEX, type Assignment, type ClassData, NO_TOPIC_ID } from "@/lib/grades-data";
import { SectionIcon } from "@/components/ui/section-icon";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { DateKeyPicker } from "@/components/ui/date-key-picker";
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from "@/components/ui/empty";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import TestWorkspaceOverlay from "./TestWorkspaceOverlay";

const NO_TOPIC_VALUE = "__no_topic__";

function blankDraft(): Assignment {
  return {
    id: crypto.randomUUID(),
    title: "",
    maxScore: 100,
    topicId: null,
    date: new Date().toISOString().slice(0, 10),
    kind: "manual",
    instructions: "",
  };
}

/**
 * Topshiriq muharriri — toʻliq ekran overlay, `?assignment=<id>` bilan
 * boshqariladi (docs/ost-loyihalar-arxitektura.md B5, EMStudio R200 referens
 * maketi).
 *
 * `assignment` berilmasa — QORALAMA (draft) rejimi: metadata faqat mahalliy
 * holatda tahrirlanadi, DB'ga hech narsa yozilmaydi. "Ilova" oʻrnida kontent
 * turi tanlagichi chiqadi; foydalanuvchi turni tanlagandagina haqiqiy qator
 * yaratiladi ("boʻsh test qatori ochilmaydi" invariantini saqlaydi).
 */
export default function AssignmentEditorOverlay({
  classId,
  assignment,
  onClose,
  onCreated,
}: {
  classId: string;
  assignment?: Assignment;
  onClose: () => void;
  onCreated?: (id: string) => void;
}) {
  const t = useTranslations("AssignmentsPage");
  const classData = useGradesStore((s) => s.classDataMap[classId]) as ClassData | undefined;
  const updateClass = useGradesStore((s) => s.updateClass);
  const [openingQuiz, setOpeningQuiz] = useState(false);
  const [draft, setDraft] = useState<Assignment>(() => assignment ?? blankDraft());
  const [testWorkspace, setTestWorkspace] = useState<{
    autoOpenNewSet?: boolean;
    autoOpenSetId?: string;
    autoOpenTitle?: string;
  } | null>(null);

  const isDraft = !assignment;
  const current = assignment ?? draft;
  const isDeck = current.kind === "deck";
  const Icon = isDeck ? Presentation : FileCheck2;

  async function handleOpenQuiz() {
    if (!current.sourceSessionId || openingQuiz) return;
    setOpeningQuiz(true);
    const setId = await getSetIdForSessionAction(current.sourceSessionId);
    setOpeningQuiz(false);
    if (setId) {
      setTestWorkspace({ autoOpenSetId: setId });
    }
  }

  function patch(next: Partial<Assignment>) {
    if (isDraft) {
      setDraft((prev) => ({ ...prev, ...next }));
      return;
    }
    updateClass(classId, (cd) => ({
      ...cd,
      assignments: cd.assignments.map((a) =>
        a.id === current.id ? { ...a, ...next } : a
      ),
    }));
  }

  function handlePickAssessment() {
    setTestWorkspace({ autoOpenNewSet: true, autoOpenTitle: current.title.trim() || undefined });
  }

  function handlePickPresentation() {
    const created: Assignment = {
      ...draft,
      kind: "deck",
      title: draft.title || t("untitledDeck"),
    };
    updateClass(classId, (cd) => ({
      ...cd,
      assignments: [created, ...cd.assignments],
    }));
    onCreated?.(created.id);
  }

  const topics = classData?.topics ?? [];
  const currentTopic = topics.find((topic) => topic.id === current.topicId);
  const triggerClass =
    "h-auto w-full justify-between gap-1.5 border-none bg-transparent p-0 text-sm font-semibold text-foreground shadow-none hover:bg-transparent focus-visible:ring-0 [&>svg]:opacity-40";

  const contentTypes: {
    key: string;
    icon: typeof ClipboardCheck;
    title: string;
    desc: string;
    color: string;
    onSelect?: () => void;
  }[] = [
    { key: "assessment", icon: ClipboardCheck, title: t("kindTest"), desc: t("kindTestDesc"), color: "#22c55e", onSelect: handlePickAssessment },
    { key: "presentation", icon: Presentation, title: t("kindDeck"), desc: t("kindDeckDesc"), color: "#fb923c", onSelect: handlePickPresentation },
    { key: "video", icon: Clapperboard, title: t("contentVideo"), desc: t("contentVideoDesc"), color: "#f43f5e" },
    { key: "passage", icon: FileText, title: t("contentPassage"), desc: t("contentPassageDesc"), color: "#3b82f6" },
    { key: "flashcards", icon: Zap, title: t("contentFlashcards"), desc: t("contentFlashcardsDesc"), color: "#a855f7" },
  ];

  return createPortal(
    <div className="fixed inset-0 z-40 flex flex-col bg-card animate-in fade-in-0 duration-fast">
      {/* Sarlavha */}
      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border px-5 py-4">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <SectionIcon>
            <Icon />
          </SectionIcon>
          <h1 className="min-w-0 truncate text-lg font-semibold text-foreground">
            {current.title || t("untitledDeck")}
          </h1>
          {!isDraft && (
            <Badge variant="outline" className="shrink-0 gap-1 text-muted-foreground">
              <Check className="size-3" />
              {t("autosaved")}
            </Badge>
          )}
        </div>
        <button
          type="button"
          onClick={onClose}
          className="flex size-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <X className="size-4" />
          <span className="sr-only">{t("close")}</span>
        </button>
      </div>

      {/* Tana: chap mazmun, oʻng tafsilotlar */}
      <div className="grid min-h-0 flex-1 grid-cols-1 md:grid-cols-[1fr_320px]">
        <div className="min-h-0 overflow-y-auto scrollbar-thin p-6">
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
                <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                  {contentTypes.map((ct) => (
                    <button
                      key={ct.key}
                      type="button"
                      disabled={!ct.onSelect}
                      title={ct.onSelect ? undefined : t("attachSoon")}
                      onClick={ct.onSelect}
                      className="flex flex-col items-start gap-2.5 rounded-xl border border-border p-4 text-left transition-colors enabled:hover:bg-muted/50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <span
                        className="flex size-10 shrink-0 items-center justify-center rounded-lg text-white"
                        style={{ backgroundColor: ct.color }}
                      >
                        <ct.icon className="size-5" />
                      </span>
                      <div className="min-w-0">
                        <h4 className="text-sm font-semibold text-foreground">{ct.title}</h4>
                        <p className="text-xs leading-snug text-muted-foreground">{ct.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
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

        <div className="min-h-0 overflow-y-auto border-t border-border p-5 md:border-l md:border-t-0">
          <div className="flex flex-col gap-3">
            <span className="text-label text-muted-foreground">{t("detailsLabel")}</span>

            <div className="flex items-center gap-3 rounded-xl border border-border bg-card px-3.5 py-2.5">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                <GraduationCap className="size-4" />
              </span>
              <div className="min-w-0 flex-1">
                <span className="block text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  {t("classLabel")}
                </span>
                <span className="block truncate text-sm font-semibold text-foreground">
                  {classData?.info.name ?? "—"}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-xl border border-border bg-card px-3.5 py-2.5">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                <Users className="size-4" />
              </span>
              <div className="min-w-0 flex-1">
                <span className="block text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  {t("assignToLabel")}
                </span>
                <span className="block truncate text-sm font-semibold text-foreground">
                  {t("assignToAll")}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-xl border border-border bg-card px-3.5 py-2.5">
              <span
                className="flex size-8 shrink-0 items-center justify-center rounded-lg"
                style={
                  currentTopic
                    ? {
                        backgroundColor: `color-mix(in srgb, ${TOPIC_COLOR_HEX[currentTopic.color]} 15%, transparent)`,
                        color: TOPIC_COLOR_HEX[currentTopic.color],
                      }
                    : undefined
                }
              >
                <Tag className={currentTopic ? "size-4" : "size-4 text-muted-foreground"} />
              </span>
              <div className="min-w-0 flex-1">
                <span className="block text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  {t("topicLabel")}
                </span>
                <Select
                  value={current.topicId ?? NO_TOPIC_VALUE}
                  onValueChange={(v) => patch({ topicId: v === NO_TOPIC_VALUE ? NO_TOPIC_ID : v })}
                >
                  <SelectTrigger className={triggerClass}>
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
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-xl border border-border bg-card px-3.5 py-2.5">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                <CalendarDays className="size-4" />
              </span>
              <div className="min-w-0 flex-1">
                <span className="block text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  {t("dateLabel")}
                </span>
                <DateKeyPicker
                  value={current.date ?? ""}
                  onChange={(v) => patch({ date: v })}
                  className="h-auto w-full border-none bg-transparent p-0 text-sm font-semibold shadow-none [&_svg]:hidden"
                  ariaLabel={t("dateLabel")}
                />
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-xl border border-border bg-card px-3.5 py-2.5">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                <Star className="size-4" />
              </span>
              <div className="min-w-0 flex-1">
                <span className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  {t("maxScoreLabel")}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button type="button" className="inline-flex text-muted-foreground/70 hover:text-foreground">
                        <Info className="size-3" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-56 normal-case tracking-normal">
                      {t("maxScoreTooltip")}
                    </TooltipContent>
                  </Tooltip>
                </span>
                <Input
                  type="number"
                  min={1}
                  value={current.maxScore}
                  onChange={(e) => patch({ maxScore: Number(e.target.value) || 0 })}
                  className={triggerClass}
                />
              </div>
            </div>
          </div>
        </div>
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
    </div>,
    document.body
  );
}

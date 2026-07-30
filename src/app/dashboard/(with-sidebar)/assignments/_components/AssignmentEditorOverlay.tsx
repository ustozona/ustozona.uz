"use client";

import { useTranslations } from "next-intl";
import { X, FileCheck2, Presentation, Check } from "lucide-react";
import { useGradesStore } from "@/store/useGradesStore";
import { type Assignment, type ClassData, NO_TOPIC_ID } from "@/lib/grades-data";
import { SectionIcon } from "@/components/ui/section-icon";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { DateKeyPicker } from "@/components/ui/date-key-picker";
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from "@/components/ui/empty";

const NO_TOPIC_VALUE = "__no_topic__";
const MAX_SCORE_PRESETS = [10, 20, 50, 100];

/**
 * Topshiriq muharriri — toʻliq ekran overlay, `?assignment=<id>` bilan
 * boshqariladi (docs/ost-loyihalar-arxitektura.md B5, EMStudio R200 referens
 * maketi). V1 — faqat QOBIQ: metadata (sarlavha/yoʻriqnoma/sinf/toifa/
 * sana/ball) tahrirlanadi va darhol saqlanadi; savol/slayd mazmuni muharriri
 * hali yoʻq ("tez orada" bloki shu oʻrinni bildiradi).
 */
export default function AssignmentEditorOverlay({
  classId,
  assignment,
  onClose,
}: {
  classId: string;
  assignment: Assignment;
  onClose: () => void;
}) {
  const t = useTranslations("AssignmentsPage");
  const classData = useGradesStore((s) => s.classDataMap[classId]) as ClassData | undefined;
  const updateClass = useGradesStore((s) => s.updateClass);

  const isDeck = assignment.kind === "deck";
  const Icon = isDeck ? Presentation : FileCheck2;

  function patch(next: Partial<Assignment>) {
    updateClass(classId, (cd) => ({
      ...cd,
      assignments: cd.assignments.map((a) =>
        a.id === assignment.id ? { ...a, ...next } : a
      ),
    }));
  }

  const topics = classData?.topics ?? [];

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-card animate-in fade-in-0 duration-fast">
      {/* Sarlavha */}
      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border px-5 py-4">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <SectionIcon>
            <Icon />
          </SectionIcon>
          <Input
            value={assignment.title}
            onChange={(e) => patch({ title: e.target.value })}
            className="h-9 max-w-md border-none bg-transparent px-0 text-lg font-semibold shadow-none focus-visible:ring-0"
          />
          <Badge variant="outline" className="shrink-0 gap-1 text-muted-foreground">
            <Check className="size-3" />
            {t("autosaved")}
          </Badge>
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
              <span className="text-label text-muted-foreground">{t("instructionsLabel")}</span>
              <Textarea
                value={assignment.instructions ?? ""}
                onChange={(e) => patch({ instructions: e.target.value })}
                placeholder={t("instructionsPlaceholder")}
                className="min-h-32 resize-none bg-card"
              />
            </div>

            <Empty className="rounded-xl border border-dashed border-border">
              <EmptyHeader>
                <EmptyMedia variant="icon"><Icon /></EmptyMedia>
                <EmptyTitle>
                  {isDeck ? t("deckEditorSoonTitle") : t("testEditorSoonTitle")}
                </EmptyTitle>
                <EmptyDescription>{t("editorSoonDescription")}</EmptyDescription>
              </EmptyHeader>
            </Empty>
          </div>
        </div>

        <div className="min-h-0 overflow-y-auto border-t border-border p-5 md:border-l md:border-t-0">
          <div className="flex flex-col gap-4">
            <span className="text-label text-muted-foreground">{t("detailsLabel")}</span>

            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-muted-foreground">{t("classLabel")}</span>
              <div className="flex h-9 items-center rounded-lg border border-border bg-muted/30 px-3 text-sm">
                {classData?.info.name ?? "—"}
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-muted-foreground">{t("topicLabel")}</span>
              <Select
                value={assignment.topicId ?? NO_TOPIC_VALUE}
                onValueChange={(v) => patch({ topicId: v === NO_TOPIC_VALUE ? NO_TOPIC_ID : v })}
              >
                <SelectTrigger className="h-9 w-full">
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

            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-muted-foreground">{t("dateLabel")}</span>
              <DateKeyPicker
                value={assignment.date ?? ""}
                onChange={(v) => patch({ date: v })}
                className="h-9 w-full rounded-lg bg-card text-sm shadow-none"
                ariaLabel={t("dateLabel")}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-muted-foreground">{t("maxScoreLabel")}</span>
              <Select
                value={String(assignment.maxScore)}
                onValueChange={(v) => patch({ maxScore: Number(v) })}
              >
                <SelectTrigger className="h-9 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MAX_SCORE_PRESETS.map((s) => (
                    <SelectItem key={s} value={String(s)}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

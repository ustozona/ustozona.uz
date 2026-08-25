"use client";
// Standartlar jurnali — sinf boʻyicha parametrlangan umumiy koʻrinish.
// Standalone /standards (ClassListPanel bilan) va sinf-detali StandardsSection
// ikkalasi shu komponentni ishlatadi (DRY). Qoʻshish oqimi AddStandardsModal (2 tab).

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Target, Plus, Search, ChevronRight, CheckCircle2, Circle, Trash2, BookOpen, Star } from "lucide-react";
import { SectionIcon } from "@/components/ui/section-icon";
import { CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription, EmptyContent } from "@/components/ui/empty";
import { Illustration } from "@/components/ui/illustration";
import {
  AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogFooter,
  AlertDialogTitle, AlertDialogDescription, AlertDialogCancel, AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { TypographyMuted } from "@/components/ui/typography";
import AddStandardModal from "./AddStandardModal";
import AddStandardsModal from "./AddStandardsModal";
import { useStandardsStore, type StandardSet } from "@/store/useStandardsStore";
import { useLessonStore } from "@/store/useLessonStore";
import { lessonCoverage } from "@/lib/standards-coverage";
import { panelHeaderClass } from "@/components/DashboardPage";
import { cn } from "@/lib/utils";
import { useLiveClasses } from "@/hooks/useLiveClasses";
import type { StandardItem } from "@/lib/standards-data";

/** Jonli sinf nomi xaritasi (id → nom). */
function useClassNameMap(): Map<string, string> {
  const liveClasses = useLiveClasses();
  return useMemo(() => new Map(liveClasses.map((c) => [c.id, c.name])), [liveClasses]);
}

export default function StandardsView({
  classId,
  demoMode,
  demoSets,
}: {
  classId: string;
  /** Tur demo rejimida haqiqiy toʻplamlar oʻrniga koʻrsatiladigan namunaviy standartlar. */
  demoMode?: boolean;
  demoSets?: StandardSet[];
}) {
  const t = useTranslations("StandardsView");
  const classNames = useClassNameMap();
  const sets = useStandardsStore((s) => s.sets);
  const removeSet = useStandardsStore((s) => s.removeSet);
  const addStandards = useStandardsStore((s) => s.addStandards);
  const removeStandard = useStandardsStore((s) => s.removeStandard);

  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [addToSetId, setAddToSetId] = useState<string | null>(null);

  // Tanlangan sinfga tegishli papkalar (demo rejimda — namunaviy toʻplam).
  const classSets = useMemo(
    () => (demoMode ? (demoSets ?? []) : sets.filter((s) => s.classIds.includes(classId))),
    [demoMode, demoSets, sets, classId],
  );

  // Qidiruv: har papkaning standartlarini filtrlaymiz; moslik boʻlmasa papka yashiriladi.
  const q = query.trim().toLowerCase();
  const visibleSets = useMemo(() => {
    if (!q) return classSets.map((s) => ({ set: s, items: s.standards }));
    return classSets
      .map((s) => ({
        set: s,
        items: s.standards.filter(
          (st) => st.id.toLowerCase().includes(q) || st.desc.toLowerCase().includes(q),
        ),
      }))
      .filter((x) => x.items.length > 0);
  }, [classSets, q]);

  const addToSet = addToSetId ? sets.find((s) => s.id === addToSetId) ?? null : null;

  return (
    <div className="flex-1 min-w-0 min-h-0 flex flex-col">
      <div className="bg-card rounded-xl border border-border flex flex-col overflow-hidden min-w-0 min-h-0 h-full">
        {/* Header + toolbar */}
        <div className={cn(panelHeaderClass, "items-center justify-between gap-3 min-h-16")}>
          <div className="flex items-center gap-3 min-w-0">
            <SectionIcon>
              <Target className="size-[18px]" aria-hidden />
            </SectionIcon>
            <CardTitle>{t("title")}</CardTitle>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="outline"
              size="icon"
              className="size-9 shadow-none"
              aria-label={t("search")}
              aria-pressed={searchOpen}
              disabled={classSets.length === 0}
              onClick={() => {
                setSearchOpen((v) => !v);
                if (searchOpen) setQuery("");
              }}
            >
              <Search className="size-4" aria-hidden />
            </Button>
            {classSets.length > 0 && (
              <Button data-tour="standards-add" className="h-9 gap-1.5" onClick={() => !demoMode && setAddOpen(true)}>
                <Plus className="size-4" aria-hidden />
                {t("addStandard")}
              </Button>
            )}
          </div>
        </div>

        {/* Qidiruv qatori (toggle) */}
        {searchOpen && (
          <div className="px-5 py-3 border-b border-border">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" aria-hidden />
              <Input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t("searchPlaceholder")}
                className="pl-9"
              />
            </div>
          </div>
        )}

        {/* Content */}
        <div data-tour="standards-list" className="flex-1 min-h-0 scrollbar-hover overflow-y-auto">
          {classSets.length === 0 ? (
            <div className="flex h-full items-center justify-center px-5 py-10">
              <Empty>
                <EmptyHeader>
                  <EmptyMedia><Illustration name="2" className="h-32 text-black dark:text-white" /></EmptyMedia>
                  <EmptyTitle>
                    {t("emptyTitleFor", { className: classNames.get(classId) ?? t("classFallback") })}
                  </EmptyTitle>
                  <EmptyDescription>
                    {t("emptyDescription")}
                  </EmptyDescription>
                </EmptyHeader>
                <EmptyContent>
                  <Button className="gap-1.5" onClick={() => setAddOpen(true)}>
                    <Plus className="size-4" aria-hidden />
                    {t("addStandard")}
                  </Button>
                </EmptyContent>
              </Empty>
            </div>
          ) : visibleSets.length === 0 ? (
            <div className="flex h-full items-center justify-center px-5 py-16">
              <Empty>
                <EmptyHeader>
                  <EmptyMedia variant="icon"><Search aria-hidden /></EmptyMedia>
                  <EmptyTitle>{t("noResultsTitle")}</EmptyTitle>
                  <EmptyDescription>{t("noResultsDescription")}</EmptyDescription>
                </EmptyHeader>
              </Empty>
            </div>
          ) : (
            <div className="px-5 py-5 space-y-3">
              {visibleSets.map(({ set, items }) => (
                <SetCard
                  key={set.id}
                  set={set}
                  items={items}
                  classId={classId}
                  onAddStandard={() => setAddToSetId(set.id)}
                  onRemoveSet={() => removeSet(set.id)}
                  onRemove={(code) => removeStandard(set.id, code)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <AddStandardsModal
        open={addOpen}
        onOpenChange={setAddOpen}
        classId={classId}
      />

      <AddStandardModal
        open={addToSet !== null}
        onOpenChange={(o) => !o && setAddToSetId(null)}
        existingCodes={addToSet?.standards.map((s) => s.id) ?? []}
        onAdd={(items) => addToSetId && addStandards(addToSetId, items)}
      />
    </div>
  );
}

function SetCard({
  set,
  items,
  classId,
  onAddStandard,
  onRemoveSet,
  onRemove,
}: {
  set: StandardSet;
  items: StandardItem[];
  classId: string;
  onAddStandard: () => void;
  onRemoveSet: () => void;
  onRemove: (code: string) => void;
}) {
  const t = useTranslations("StandardsView");
  const classNames = useClassNameMap();
  // Qamrov = FAQAT darsga biriktirilib, dars tugallangandan keyin (v3 §9 Q4).
  // Qoʻlda belgilash olib tashlandi — yagona manba dars-standart bogʻlanishi.
  const lessons = useLessonStore((s) => s.lessons);
  const isCovered = (s: StandardItem) => lessonCoverage(lessons, classId, s.id).taught;

  const total = set.standards.length;
  const covered = set.standards.filter(isCovered).length;

  // Ogʻirlikli qamrov (v3 §9 Q1): bazaviy standart x2 ogʻirlik.
  const weight = (s: StandardItem) => (s.foundational ? 2 : 1);
  const weightSum = set.standards.reduce((a, s) => a + weight(s), 0);
  const weightCovered = set.standards.reduce((a, s) => a + (isCovered(s) ? weight(s) : 0), 0);
  const coveragePct = weightSum ? Math.round((weightCovered / weightSum) * 100) : 0;

  return (
    <Collapsible defaultOpen className="rounded-xl border border-border overflow-hidden">
      <div className="flex items-center gap-2 p-4 hover:bg-muted/50 transition-colors">
        <CollapsibleTrigger className="group/set flex flex-1 items-center gap-3 text-left min-w-0 cursor-pointer">
          <div className="size-12 rounded-lg shrink-0 bg-muted flex items-center justify-center">
            <ChevronRight className="size-6 text-muted-foreground transition-transform duration-fast group-data-[state=open]/set:rotate-90" aria-hidden />
          </div>
          <div className="flex-1 min-w-0 space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="heading-small truncate">{set.name}</span>
              <Badge variant="secondary" className="shadow-none shrink-0">{set.subject}</Badge>
              {set.source === "custom" ? (
                <Badge variant="outline" className="shadow-none shrink-0 text-muted-foreground">{t("custom")}</Badge>
              ) : set.frameworkCode ? (
                <Badge variant="outline" className="shadow-none shrink-0 gap-1 text-muted-foreground font-mono">
                  {set.frameworkCode}
                </Badge>
              ) : null}
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              {set.classIds.map((id) => (
                <Badge key={id} variant="outline" className="shadow-none text-muted-foreground">
                  {classNames.get(id) ?? id}
                </Badge>
              ))}
              <TypographyMuted className="text-caption">
                {t("setStats", { total, covered })}
              </TypographyMuted>
            </div>
          </div>
        </CollapsibleTrigger>

        <Tooltip>
          <TooltipTrigger asChild>
            <Badge variant="outline" className={cn("shadow-none shrink-0 tabular-nums gap-1", coveragePillClass(coveragePct))}>
              <CheckCircle2 className="size-3" aria-hidden />
              {coveragePct}%
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            {t("coverageTooltip", { covered, total })}
          </TooltipContent>
        </Tooltip>
        <Button
          variant="outline"
          size="sm"
          className="h-8 shadow-none gap-1 shrink-0"
          onClick={onAddStandard}
        >
          <Plus className="size-4" aria-hidden />
          {t("addStandardShort")}
        </Button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="size-8 shrink-0 text-muted-foreground hover:text-destructive"
              aria-label={t("deleteSetAria")}
            >
              <Trash2 className="size-4" aria-hidden />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t("deleteSetTitle")}</AlertDialogTitle>
              <AlertDialogDescription>
                {t("deleteSetDescription", { name: set.name, total })}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
              <AlertDialogAction className="bg-destructive text-white hover:bg-destructive/90" onClick={onRemoveSet}>
                {t("delete")}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      <CollapsibleContent>
        {total === 0 ? (
          <div className="px-4 py-8 text-center border-t border-border space-y-3">
            <TypographyMuted>{t("noStandardsYet")}</TypographyMuted>
            <div>
              <Button variant="outline" size="sm" className="h-8 shadow-none gap-1" onClick={onAddStandard}>
                <Plus className="size-4" aria-hidden />
                {t("addStandard")}
              </Button>
            </div>
          </div>
        ) : items.length === 0 ? (
          <div className="px-4 py-8 text-center border-t border-border">
            <TypographyMuted>{t("noResultsInSet")}</TypographyMuted>
          </div>
        ) : (
          <ul className="divide-y divide-border border-t border-border">
            {items.map((std) => (
              <StandardRow key={std.id} std={std} classId={classId} onRemove={onRemove} />
            ))}
          </ul>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
}

function StandardRow({
  std,
  classId,
  onRemove,
}: {
  std: StandardItem;
  classId: string;
  onRemove: (code: string) => void;
}) {
  const t = useTranslations("StandardsView");
  // Standart darsga FAQAT dars muharririda biriktiriladi (`lesson.standards`).
  // Bu yerda qoʻlda belgilash yoʻq — biriktirilgan mavzu koʻrsatiladi, xolos.
  const lessons = useLessonStore((s) => s.lessons);
  const lessonCov = useMemo(() => lessonCoverage(lessons, classId, std.id), [lessons, classId, std.id]);
  const covered = lessonCov.taught;

  return (
    <li className="group/row flex items-start gap-3 p-4">
      {/* Coverage (oʻqitildi) — faqat darsdan avtomatik, read-only. */}
      {covered ? (
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="shrink-0 mt-0.5 size-7 rounded-full bg-success/10 flex items-center justify-center cursor-default">
              <CheckCircle2 className="size-4 text-success" aria-hidden />
            </span>
          </TooltipTrigger>
          <TooltipContent>
            {t("autoTaughtTooltip", {
              lessons: lessonCov.lessons.filter((l) => l.completed).map((l) => l.title).join(", "),
            })}
          </TooltipContent>
        </Tooltip>
      ) : (
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="shrink-0 mt-0.5 size-7 rounded-full flex items-center justify-center cursor-default">
              <Circle className="size-4 text-muted-foreground/40" aria-hidden />
            </span>
          </TooltipTrigger>
          <TooltipContent>{t("notCoveredTitle")}</TooltipContent>
        </Tooltip>
      )}

      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-mono text-xs font-bold text-foreground">{std.id}</span>
          {std.foundational && (
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 dark:bg-amber-950 px-1.5 py-0.5 text-amber-700 dark:text-amber-300">
                  <Star className="size-3 fill-current" aria-hidden />
                  <span className="text-caption font-medium">{t("foundational")}</span>
                </span>
              </TooltipTrigger>
              <TooltipContent>{t("foundationalTooltip")}</TooltipContent>
            </Tooltip>
          )}
        </div>
        <p className="text-body text-foreground/90 leading-relaxed">{std.desc}</p>

        {/* Biriktirilgan mavzu — yagona manba: dars muharriri. */}
        <div className="flex items-center gap-2 flex-wrap pt-0.5">
          {lessonCov.lessons.length > 0 ? (
            lessonCov.lessons.map((l) => (
              <Badge
                key={l.id}
                variant="outline"
                className={cn(
                  "shadow-none gap-1",
                  l.completed ? "border-success/30 text-success" : "text-muted-foreground",
                )}
              >
                <BookOpen className="size-3" aria-hidden />
                {l.title}
              </Badge>
            ))
          ) : (
            <Badge variant="outline" className="shadow-none text-muted-foreground">
              {t("notLinked")}
            </Badge>
          )}
        </div>
      </div>

      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="size-8 shrink-0 self-center text-muted-foreground hover:text-destructive opacity-0 group-hover/row:opacity-100 focus-visible:opacity-100 transition-opacity"
            aria-label={t("deleteStandardAria")}
          >
            <Trash2 className="size-4" aria-hidden />
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("deleteStandardTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("deleteStandardDescription")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-white hover:bg-destructive/90" onClick={() => onRemove(std.id)}>
              {t("delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </li>
  );
}

/** Qamrov foiziga qarab pill rangi (reference: amber; toʻliq → success). */
function coveragePillClass(pct: number): string {
  return pct >= 100 ? "border-success/30 text-success" : "border-warning/30 text-warning-foreground";
}

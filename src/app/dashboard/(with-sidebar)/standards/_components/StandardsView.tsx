"use client";
// Standartlar jurnali — sinf boʻyicha parametrlangan umumiy koʻrinish.
// Standalone /standards (ClassListPanel bilan) va sinf-detali StandardsSection
// ikkalasi shu komponentni ishlatadi (DRY). Qoʻshish oqimi AddStandardsModal (2 tab).

import { useMemo, useState } from "react";
import { Target, Plus, Search, ChevronRight, CheckCircle2, Circle, FileText, Trash2, BookOpen, Star, Scale, History, AlertTriangle } from "lucide-react";
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
import { TypographyMuted } from "@/components/ui/typography";
import AddStandardModal from "./AddStandardModal";
import CJModal from "./CJModal";
import AddStandardsModal from "./AddStandardsModal";
import { useStandardsStore, type StandardSet } from "@/store/useStandardsStore";
import { useLessonStore } from "@/store/useLessonStore";
import { lessonCoverage } from "@/lib/standards-coverage";
import { panelHeaderClass } from "@/components/DashboardPage";
import { cn } from "@/lib/utils";
import { CLASSES } from "@/lib/grades-data";
import { classStandardMastery, classStandardMisconceptions, setMasterySummary, type ClassStandardMastery } from "@/lib/standards-mastery";
import type { StandardItem } from "@/lib/standards-data";

const CLASS_NAME = new Map(CLASSES.map((c) => [c.id, c.name]));

export default function StandardsView({ classId }: { classId: string }) {
  const sets = useStandardsStore((s) => s.sets);
  const removeSet = useStandardsStore((s) => s.removeSet);
  const addStandards = useStandardsStore((s) => s.addStandards);
  const removeStandard = useStandardsStore((s) => s.removeStandard);
  const toggleCovered = useStandardsStore((s) => s.toggleCovered);

  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [addToSetId, setAddToSetId] = useState<string | null>(null);

  // Tanlangan sinfga tegishli papkalar.
  const classSets = useMemo(
    () => sets.filter((s) => s.classIds.includes(classId)),
    [sets, classId],
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
      <div className="bg-card rounded-xl card-elevation flex flex-col overflow-hidden min-w-0 min-h-0 h-full">
        {/* Header + toolbar */}
        <div className={cn(panelHeaderClass, "items-center justify-between gap-3 min-h-[4.5rem]")}>
          <div className="flex items-center gap-3 min-w-0">
            <SectionIcon>
              <Target className="size-[18px]" aria-hidden />
            </SectionIcon>
            <CardTitle>Standartlar</CardTitle>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="outline"
              size="icon"
              className="size-9 shadow-none"
              aria-label="Qidirish"
              aria-pressed={searchOpen}
              disabled={classSets.length === 0}
              onClick={() => {
                setSearchOpen((v) => !v);
                if (searchOpen) setQuery("");
              }}
            >
              <Search className="size-4" aria-hidden />
            </Button>
            <Button className="h-9 gap-1.5" onClick={() => setAddOpen(true)}>
              <Plus className="size-4" aria-hidden />
              Standart qoʻshish
            </Button>
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
                placeholder="Kod yoki taʼrif boʻyicha qidirish…"
                className="pl-9"
              />
            </div>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 min-h-0 overflow-y-auto">
          {classSets.length === 0 ? (
            <div className="flex h-full items-center justify-center px-5 py-10">
              <Empty>
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <BookOpen aria-hidden />
                  </EmptyMedia>
                  <EmptyTitle>
                    {CLASS_NAME.get(classId) ?? "Sinf"} uchun toʻplam yoʻq
                  </EmptyTitle>
                  <EmptyDescription>
                    Tayyor toʻplamdan tanlang yoki oʻzingiz yarating (Excel/CSV import ham bor).
                  </EmptyDescription>
                </EmptyHeader>
                <EmptyContent>
                  <Button className="gap-1.5" onClick={() => setAddOpen(true)}>
                    <Plus className="size-4" aria-hidden />
                    Standart qoʻshish
                  </Button>
                </EmptyContent>
              </Empty>
            </div>
          ) : visibleSets.length === 0 ? (
            <div className="px-5 py-16 text-center">
              <TypographyMuted>Hech narsa topilmadi.</TypographyMuted>
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
                  onToggle={(code) => toggleCovered(set.id, code)}
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
  onToggle,
  onRemove,
}: {
  set: StandardSet;
  items: StandardItem[];
  classId: string;
  onAddStandard: () => void;
  onRemoveSet: () => void;
  onToggle: (code: string) => void;
  onRemove: (code: string) => void;
}) {
  // Qamrov = qoʻlda (std.covered) YOKI darsdan avtomatik (v3 §9 Q4).
  const lessons = useLessonStore((s) => s.lessons);
  const isCovered = (s: StandardItem) => s.covered || lessonCoverage(lessons, classId, s.id).taught;

  const total = set.standards.length;
  const covered = set.standards.filter(isCovered).length;

  // Ogʻirlikli qamrov (v3 §9 Q1): bazaviy standart x2 ogʻirlik.
  const weight = (s: StandardItem) => (s.foundational ? 2 : 1);
  const weightSum = set.standards.reduce((a, s) => a + weight(s), 0);
  const weightCovered = set.standards.reduce((a, s) => a + (isCovered(s) ? weight(s) : 0), 0);
  const coveragePct = weightSum ? Math.round((weightCovered / weightSum) * 100) : 0;

  // Toʻplam darajasidagi oʻzlashtirish xulosasi (dalildan).
  const summary = useMemo(
    () => setMasterySummary(classId, set.standards.map((s) => s.id)),
    [classId, set.standards],
  );

  return (
    <Collapsible defaultOpen className="rounded-xl border border-border overflow-hidden">
      <div className="flex items-center gap-2 p-4 hover:bg-muted/50 transition-colors">
        <CollapsibleTrigger className="group/set flex flex-1 items-center gap-3 text-left min-w-0 cursor-pointer">
          <div className="size-12 rounded-lg shrink-0 bg-muted flex items-center justify-center">
            <ChevronRight className="size-6 text-muted-foreground transition-transform duration-200 group-data-[state=open]/set:rotate-90" aria-hidden />
          </div>
          <div className="flex-1 min-w-0 space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="heading-small truncate">{set.name}</span>
              <Badge variant="secondary" className="shadow-none shrink-0">{set.subject}</Badge>
              {set.source === "custom" ? (
                <Badge variant="outline" className="shadow-none shrink-0 text-muted-foreground">Custom</Badge>
              ) : set.frameworkCode ? (
                <Badge variant="outline" className="shadow-none shrink-0 gap-1 text-muted-foreground font-mono">
                  {set.frameworkCode}
                </Badge>
              ) : null}
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              {set.classIds.map((id) => (
                <Badge key={id} variant="outline" className="shadow-none text-muted-foreground">
                  {CLASS_NAME.get(id) ?? id}
                </Badge>
              ))}
              <TypographyMuted className="text-caption">
                · {total} standart · {covered} oʻqitildi
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
            Ogʻirlikli qamrov: {covered}/{total} standart oʻqitildi (bazaviy standart ×2 ogʻirlik)
          </TooltipContent>
        </Tooltip>
        {summary.tested && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge variant="outline" className={cn("shadow-none shrink-0 tabular-nums gap-1", masteryChipClass(summary.avgSecurePct))}>
                <Target className="size-3" aria-hidden />
                {summary.avgSecurePct}%
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              Oʻzlashtirish: {summary.testedStandards} ta dalili bor standart boʻyicha oʻrtacha mustahkamlik
            </TooltipContent>
          </Tooltip>
        )}
        <Button
          variant="outline"
          size="sm"
          className="h-8 shadow-none gap-1 shrink-0"
          onClick={onAddStandard}
        >
          <Plus className="size-4" aria-hidden />
          Standart
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="size-8 shrink-0 text-muted-foreground hover:text-destructive"
          aria-label="Toʻplamni oʻchirish"
          onClick={onRemoveSet}
        >
          <Trash2 className="size-4" aria-hidden />
        </Button>
      </div>

      <CollapsibleContent>
        {total === 0 ? (
          <div className="px-4 py-8 text-center border-t border-border space-y-3">
            <TypographyMuted>Bu toʻplamda hali standart yoʻq.</TypographyMuted>
            <div>
              <Button variant="outline" size="sm" className="h-8 shadow-none gap-1" onClick={onAddStandard}>
                <Plus className="size-4" aria-hidden />
                Standart qoʻshish
              </Button>
            </div>
          </div>
        ) : items.length === 0 ? (
          <div className="px-4 py-8 text-center border-t border-border">
            <TypographyMuted>Hech narsa topilmadi.</TypographyMuted>
          </div>
        ) : (
          <ul className="divide-y divide-border border-t border-border">
            {items.map((std) => (
              <StandardRow key={std.id} std={std} classId={classId} onToggle={onToggle} onRemove={onRemove} />
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
  onToggle,
  onRemove,
}: {
  std: StandardItem;
  classId: string;
  onToggle: (code: string) => void;
  onRemove: (code: string) => void;
}) {
  const subjective = std.assessType === "subjective";
  // Oʻzlashtirish (Mastery) — dalil-engine'dan, sinf darajasida (v3 §9 Q3).
  const m = useMemo(() => classStandardMastery(classId, std.id), [classId, std.id]);
  // Keng tarqalgan tushunmovchiliklar (misconception diagnostikasi).
  const misconceptions = useMemo(() => classStandardMisconceptions(classId, std.id), [classId, std.id]);
  // Qamrov darsdan avtomatik (v3 §9 Q4): tugallangan dars standartni bogʻlasa → oʻqitildi.
  const lessons = useLessonStore((s) => s.lessons);
  const lessonCov = useMemo(() => lessonCoverage(lessons, classId, std.id), [lessons, classId, std.id]);
  const covered = std.covered || lessonCov.taught;
  const [cjOpen, setCjOpen] = useState(false);

  return (
    <li className="group/row flex items-start gap-3 p-4">
      {/* Coverage (oʻqitildi) — darsdan avtomatik (read-only) yoki qoʻlda toggle. */}
      {lessonCov.taught ? (
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="shrink-0 mt-0.5 size-7 rounded-full bg-success/10 flex items-center justify-center cursor-default">
              <CheckCircle2 className="size-4 text-success" aria-hidden />
            </span>
          </TooltipTrigger>
          <TooltipContent>
            Darsdan avtomatik oʻqitildi: {lessonCov.lessons.map((l) => l.title).join(", ")}
          </TooltipContent>
        </Tooltip>
      ) : (
        <button
          type="button"
          onClick={() => onToggle(std.id)}
          aria-label={std.covered ? "Oʻtilmagan deb belgilash" : "Oʻqitildi deb belgilash"}
          className="shrink-0 mt-0.5 rounded-full transition-transform hover:scale-110 cursor-pointer"
          title={std.covered ? "Oʻqitildi (qoʻlda)" : "Hali oʻqitilmagan"}
        >
          {std.covered ? (
            <span className="size-7 rounded-full bg-success/10 flex items-center justify-center">
              <CheckCircle2 className="size-4 text-success" aria-hidden />
            </span>
          ) : (
            <span className="size-7 rounded-full flex items-center justify-center">
              <Circle className="size-4 text-muted-foreground/40" aria-hidden />
            </span>
          )}
        </button>
      )}

      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-mono text-xs font-bold text-foreground">{std.id}</span>
          {std.foundational && (
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 dark:bg-amber-950 px-1.5 py-0.5 text-amber-700 dark:text-amber-300">
                  <Star className="size-3 fill-current" aria-hidden />
                  <span className="text-caption font-medium">Bazaviy</span>
                </span>
              </TooltipTrigger>
              <TooltipContent>Poydevor standart — qamrovga koʻproq ogʻirlik beradi</TooltipContent>
            </Tooltip>
          )}
        </div>
        <p className="text-body text-foreground/90 leading-relaxed">{std.desc}</p>

        {/* Coverage ⇄ Mastery yonma-yon (v3 §9 Q3). */}
        <div className="flex items-center gap-2 flex-wrap pt-0.5">
          {covered ? (
            <Badge variant="outline" className="shadow-none border-success/30 text-success gap-1">
              {lessonCov.taught ? <BookOpen className="size-3" aria-hidden /> : <CheckCircle2 className="size-3" aria-hidden />}
              {lessonCov.taught ? "Oʻqitildi · Darsdan" : "Oʻqitildi"}
            </Badge>
          ) : (
            <Badge variant="outline" className="shadow-none text-muted-foreground">Oʻtilmagan</Badge>
          )}

          {subjective ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={() => setCjOpen(true)}
                  className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-0.5 text-caption font-medium text-muted-foreground hover:border-primary hover:text-primary transition-colors cursor-pointer"
                >
                  <Scale className="size-3" aria-hidden />
                  Subʼektiv · CJ baholash
                </button>
              </TooltipTrigger>
              <TooltipContent>Quiz emas — Comparative Judgement (qiyosiy baholash) bilan baholanadi. Ochish uchun bosing.</TooltipContent>
            </Tooltip>
          ) : m.tested ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="inline-flex items-center gap-1.5">
                  <Badge variant="outline" className={cn("shadow-none tabular-nums gap-1", masteryChipClass(m.masteredPct))}>
                    <Target className="size-3" aria-hidden />
                    Oʻzlashtirish {m.masteredPct}%
                  </Badge>
                  <MasteryBar m={m} />
                </span>
              </TooltipTrigger>
              <TooltipContent className="space-y-1">
                <p className="font-medium">{m.total} oʻquvchi baholangan</p>
                <p><span className="text-success">●</span> {m.secure} mustahkam (≥80%)</p>
                <p><span className="text-warning-foreground">●</span> {m.developing} shakllanmoqda (50–80%)</p>
                <p><span className="text-destructive">●</span> {m.beginning} boshlangʻich (&lt;50%)</p>
              </TooltipContent>
            </Tooltip>
          ) : (
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge variant="outline" className="shadow-none text-muted-foreground gap-1">
                  <Target className="size-3" aria-hidden />
                  Baholanmagan
                </Badge>
              </TooltipTrigger>
              <TooltipContent>Bu standart boʻyicha hali quiz dalili yoʻq</TooltipContent>
            </Tooltip>
          )}

          {/* Retrieval/decay signali (v3 §9 Q5) — faqat dalil bor standartlarda. */}
          {!subjective && m.tested && m.retrievalDue && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge variant="outline" className="shadow-none gap-1 border-warning/30 text-warning-foreground">
                  <History className="size-3" aria-hidden />
                  Takrorlash kerak
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                Oxirgi baholangani {m.daysSinceAssessed} kun oldin — uzoq muddatli xotira uchun takroriy baholash tavsiya etiladi
              </TooltipContent>
            </Tooltip>
          )}
        </div>

        {/* Misconception diagnostikasi — keng tarqalgan tushunmovchiliklar (dalildan). */}
        {!subjective && misconceptions.length > 0 && (
          <div className="mt-2 rounded-lg border border-warning/30 bg-warning/5 px-3 py-2 space-y-1.5">
            <div className="flex items-center gap-1.5">
              <AlertTriangle className="size-3.5 text-warning-foreground shrink-0" aria-hidden />
              <span className="text-caption font-medium text-warning-foreground">Keng tarqalgan tushunmovchiliklar</span>
            </div>
            <ul className="space-y-1">
              {misconceptions.map((mc) => (
                <li key={mc.misconception.id} className="flex items-start gap-2 text-caption text-foreground/80">
                  <Badge variant="outline" className="shadow-none shrink-0 tabular-nums border-warning/30 text-warning-foreground">
                    {mc.count} oʻquvchi
                  </Badge>
                  <span className="leading-relaxed">
                    {mc.misconception.label}
                    {mc.misconception.remediationRef && (
                      <span className="text-muted-foreground"> · {mc.misconception.remediationRef}</span>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {std.file && (
        <div
          className="shrink-0 self-center hidden sm:flex items-center gap-1.5 max-w-[180px] rounded-md border border-border bg-card px-2.5 py-1.5"
          title={std.file}
        >
          <FileText className="size-3.5 text-muted-foreground shrink-0" aria-hidden />
          <span className="text-caption text-muted-foreground truncate">{std.file}</span>
        </div>
      )}

      <Button
        variant="ghost"
        size="icon"
        className="size-8 shrink-0 self-center text-muted-foreground hover:text-destructive opacity-0 group-hover/row:opacity-100 focus-visible:opacity-100 transition-opacity"
        aria-label="Standartni oʻchirish"
        onClick={() => onRemove(std.id)}
      >
        <Trash2 className="size-4" aria-hidden />
      </Button>

      {subjective && (
        <CJModal open={cjOpen} onOpenChange={setCjOpen} standardId={std.id} standardDesc={std.desc} />
      )}
    </li>
  );
}

/** Oʻzlashtirish taqsimoti — 3 segmentli mini-bar (mustahkam/shakllanmoqda/boshlangʻich). */
function MasteryBar({ m }: { m: ClassStandardMastery }) {
  if (m.total === 0) return null;
  const seg = (n: number, cls: string) =>
    n > 0 ? <span className={cls} style={{ flexGrow: n }} aria-hidden /> : null;
  return (
    <span className="hidden sm:flex h-1.5 w-16 overflow-hidden rounded-full bg-muted">
      {seg(m.secure, "bg-success")}
      {seg(m.developing, "bg-warning")}
      {seg(m.beginning, "bg-destructive")}
    </span>
  );
}

/** Qamrov foiziga qarab pill rangi (reference: amber; toʻliq → success). */
function coveragePillClass(pct: number): string {
  return pct >= 100 ? "border-success/30 text-success" : "border-warning/30 text-warning-foreground";
}

/** Oʻzlashtirish % chip rangi. */
function masteryChipClass(pct: number): string {
  if (pct >= 80) return "border-success/30 text-success";
  if (pct >= 50) return "border-warning/30 text-warning-foreground";
  return "border-destructive/30 text-destructive";
}

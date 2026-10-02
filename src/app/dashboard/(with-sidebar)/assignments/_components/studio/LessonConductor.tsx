"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight, CircleDashed, Flag, Pause, Play, RotateCcw, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeaderBar } from "@/components/ui/dialog";
import { classTints } from "@/lib/class-colors";
import { useLessonStore } from "@/store/useLessonStore";
import { todayKey } from "@/lib/date-keys";
import { isTaught, type Lesson } from "@/lib/lessons-data";
import { blockReady, type LessonStudio, type StudioBlock } from "@/lib/lesson-studio";
import { BLOCK_META, METHOD_META } from "./studio-meta";
import { useGameLabel } from "./StudioAdviceColumn";

/* ════════════════════════════════════════════════════════════════════
   DARS PULTI — «▶ Darsni boshlash».

   Ssenariy bloklari ketma-ket: chapda butun dars, markazda joriy blok,
   tepada bosqich taymeri. Har blok mavjud yoʻl bilan ochiladi (Doska
   taqdimoti, jonli dars, QR-kartalar, oʻyin) — pult oʻqituvchining
   noutbukida qoladi, proyektorga Doska chiqadi.

   Bu — Doskaning toʻliq «Dars rejimi»dan oldingi oraliq bosqich
   (docs/dars-studiyasi-spec.md §8): bloklar Doska ekranlariga birma-bir
   mos keladigan qilib saqlangan, keyingi bosqichda shu roʻyxat
   Doskaning oʻzida ochiladi.

   «Darsni yakunlash» — refleksiya (keyingi darsning AI rejasiga kiradi)
   va «Oʻtildi» belgisi (Darslar sahifasidagi bilan bitta amal).
   ════════════════════════════════════════════════════════════════════ */

const pad = (n: number) => String(n).padStart(2, "0");
const mmss = (sec: number) => `${sec < 0 ? "−" : ""}${pad(Math.floor(Math.abs(sec) / 60))}:${pad(Math.abs(sec) % 60)}`;

export function LessonConductor({
  lesson,
  classId,
  className,
  studio,
  onRun,
  onClose,
}: {
  lesson: Lesson;
  classId: string;
  className: string;
  studio: LessonStudio;
  onRun: (block: StudioBlock) => void;
  onClose: () => void;
}) {
  const t = useTranslations("LessonStudio");
  const gameLabel = useGameLabel();
  const updateLesson = useLessonStore((s) => s.updateLesson);
  const setTaught = useLessonStore((s) => s.setTaught);

  const steps = useMemo(
    () => studio.stages.flatMap((stage, si) => stage.blocks.map((block) => ({ stage, si, block }))),
    [studio],
  );
  const [index, setIndex] = useState(0);
  const step = steps[Math.min(index, steps.length - 1)];

  /* Bosqich taymeri — bosqich almashganda qayta oʻrnatiladi, oʻzi boshlanmaydi. */
  const [remaining, setRemaining] = useState(() => (step?.stage.minutes ?? 0) * 60);
  const [running, setRunning] = useState(false);
  const stageId = step?.stage.id;
  useEffect(() => {
    setRemaining((step?.stage.minutes ?? 0) * 60);
    setRunning(false);
    // Faqat bosqich almashganda — bitta bosqich ichidagi bloklar taymerni tiklamaydi.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stageId]);
  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => setRemaining((r) => r - 1), 1000);
    return () => window.clearInterval(id);
  }, [running]);

  /* Umumiy dars vaqti — pult ochilgandan beri. */
  const [startedAt] = useState(() => Date.now());
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);
  const elapsed = Math.floor((now - startedAt) / 1000);

  // Strelkalar — oldingi/keyingi blok (proyektor oldida sichqonchasiz).
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.target instanceof HTMLElement && /^(INPUT|TEXTAREA)$/.test(e.target.tagName)) return;
      if (e.key === "ArrowRight") setIndex((i) => Math.min(steps.length - 1, i + 1));
      if (e.key === "ArrowLeft") setIndex((i) => Math.max(0, i - 1));
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [steps.length]);

  const [finishOpen, setFinishOpen] = useState(false);
  const [reflection, setReflection] = useState(lesson.reflection ?? "");
  const [markTaught, setMarkTaught] = useState(!isTaught(lesson, classId));

  function finish() {
    const text = reflection.trim();
    if (text !== (lesson.reflection ?? "")) updateLesson(lesson.id, { reflection: text || undefined });
    if (markTaught && !isTaught(lesson, classId)) setTaught(lesson.id, todayKey(), classId);
    toast.success(t("conductor.finished"));
    setFinishOpen(false);
    onClose();
  }

  if (!step) return null;
  const meta = BLOCK_META[step.block.kind];
  const Icon = meta.icon;
  const tints = classTints(meta.color);
  const ready = blockReady(step.block);
  const MethodIcon = step.block.method ? METHOD_META[step.block.method].icon : null;

  return createPortal(
    <div className="fixed inset-0 z-40 flex flex-col bg-background animate-in fade-in-0 duration-fast">
      {/* Sarlavha */}
      <div className="flex shrink-0 items-center gap-3 border-b border-border bg-card px-4 py-3 md:px-6">
        <Button variant="ghost" size="icon" onClick={onClose} aria-label={t("conductor.close")}>
          <X className="size-4" />
        </Button>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-foreground">{lesson.title || t("untitledLesson")}</p>
          <p className="truncate text-caption text-muted-foreground">
            {[className, t("conductor.elapsed", { time: mmss(elapsed) })].filter(Boolean).join(" · ")}
          </p>
        </div>
        <Button variant="outline" className="gap-1.5 shadow-none" onClick={() => setFinishOpen(true)}>
          <Flag className="size-4" /> <span className="hidden sm:inline">{t("conductor.finish")}</span>
        </Button>
      </div>

      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        {/* Butun dars */}
        <nav className="shrink-0 overflow-x-auto border-b border-border bg-card lg:w-72 lg:overflow-y-auto lg:border-b-0 lg:border-r">
          <ol className="flex gap-2 p-3 lg:flex-col">
            {steps.map((s, i) => {
              const m = BLOCK_META[s.block.kind];
              const StepIcon = m.icon;
              const showStage = i === 0 || steps[i - 1].stage.id !== s.stage.id;
              return (
                <li key={s.block.id} className="shrink-0 lg:shrink">
                  {showStage && (
                    <p className="mb-1 hidden text-label text-muted-foreground lg:block">
                      {s.si + 1} · {s.stage.name} · {t("minutes", { count: s.stage.minutes })}
                    </p>
                  )}
                  <button
                    type="button"
                    onClick={() => setIndex(i)}
                    aria-current={i === index ? "step" : undefined}
                    className={cn(
                      "flex w-44 items-center gap-2 rounded-lg border px-3 py-2 text-left transition-colors lg:w-full",
                      i === index ? "border-foreground/40 bg-muted" : "border-transparent hover:bg-muted/50",
                    )}
                  >
                    <StepIcon className="size-4 shrink-0 text-muted-foreground" />
                    <span className="min-w-0 flex-1 truncate text-sm text-foreground">{s.block.title || t(`kind.${s.block.kind}`)}</span>
                    {!blockReady(s.block) && <CircleDashed className="size-3.5 shrink-0 text-muted-foreground" />}
                  </button>
                </li>
              );
            })}
          </ol>
        </nav>

        {/* Joriy blok */}
        <main className="flex min-h-0 flex-1 flex-col overflow-y-auto">
          <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 p-4 md:p-8">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-label text-muted-foreground">{t("conductor.stage", { n: step.si + 1, total: studio.stages.length })}</p>
                <h2 className="truncate text-headline text-foreground">{step.stage.name}</h2>
                <p className="text-caption text-muted-foreground">{step.stage.goal}</p>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "rounded-xl border border-border px-4 py-2 font-mono text-3xl font-semibold tabular-nums",
                    remaining < 0 ? "text-destructive" : remaining <= 60 ? "text-warning" : "text-foreground",
                  )}
                  aria-live="off"
                >
                  {mmss(remaining)}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  className="shadow-none"
                  aria-label={running ? t("conductor.pause") : t("conductor.startTimer")}
                  onClick={() => setRunning((r) => !r)}
                >
                  {running ? <Pause className="size-4" /> : <Play className="size-4" />}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={t("conductor.resetTimer")}
                  onClick={() => {
                    setRemaining(step.stage.minutes * 60);
                    setRunning(false);
                  }}
                >
                  <RotateCcw className="size-4" />
                </Button>
              </div>
            </div>

            <section className="flex flex-col gap-5 rounded-2xl border border-border bg-card p-5 md:p-8">
              <div className="flex items-start gap-4">
                <span className="flex size-12 shrink-0 items-center justify-center rounded-xl" style={tints.gradientTile}>
                  <Icon className="size-6 text-white" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-label text-muted-foreground">{t(`kind.${step.block.kind}`)}</p>
                  <h3 className="text-title text-foreground">{step.block.title || t(`kind.${step.block.kind}`)}</h3>
                  {step.block.brief && <p className="mt-2 text-reading text-foreground">{step.block.brief}</p>}
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {MethodIcon && step.block.kind === "check" && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-tag text-foreground">
                        <MethodIcon className="size-3" /> {t(`method.${step.block.method}`)}
                      </span>
                    )}
                    {step.block.game && (
                      <span className="rounded-full bg-muted px-2 py-0.5 text-tag text-foreground">{gameLabel(step.block.game)}</span>
                    )}
                    {step.block.setTitle && (
                      <span className="rounded-full bg-muted px-2 py-0.5 text-tag text-muted-foreground">{step.block.setTitle}</span>
                    )}
                  </div>
                </div>
              </div>

              {(step.stage.teacher || step.stage.students) && (
                <div className="grid gap-3 md:grid-cols-2">
                  {step.stage.teacher && (
                    <div className="rounded-lg bg-muted/50 p-3">
                      <p className="text-label text-muted-foreground">{t("plan.teacherDoes")}</p>
                      <p className="mt-1 text-body text-foreground">{step.stage.teacher}</p>
                    </div>
                  )}
                  {step.stage.students && (
                    <div className="rounded-lg bg-muted/50 p-3">
                      <p className="text-label text-muted-foreground">{t("plan.studentsDo")}</p>
                      <p className="mt-1 text-body text-foreground">{step.stage.students}</p>
                    </div>
                  )}
                </div>
              )}

              {ready ? (
                <Button size="lg" className="w-full gap-2 sm:w-auto sm:self-start" onClick={() => onRun(step.block)}>
                  <Play className="size-4" /> {t(`conductor.run.${step.block.kind}`)}
                </Button>
              ) : (
                <p className="rounded-lg border border-dashed border-border px-3 py-2 text-caption text-muted-foreground">
                  {t("conductor.notReady")}
                </p>
              )}
            </section>

            <div className="mt-auto flex items-center justify-between gap-3">
              <Button variant="outline" className="gap-1.5 shadow-none" disabled={index === 0} onClick={() => setIndex((i) => Math.max(0, i - 1))}>
                <ChevronLeft className="size-4" /> {t("conductor.prev")}
              </Button>
              <span className="text-caption tabular-nums text-muted-foreground">{index + 1} / {steps.length}</span>
              {index < steps.length - 1 ? (
                <Button className="gap-1.5" onClick={() => setIndex((i) => Math.min(steps.length - 1, i + 1))}>
                  {t("conductor.next")} <ChevronRight className="size-4" />
                </Button>
              ) : (
                <Button className="gap-1.5" onClick={() => setFinishOpen(true)}>
                  <Flag className="size-4" /> {t("conductor.finish")}
                </Button>
              )}
            </div>
          </div>
        </main>
      </div>

      <Dialog open={finishOpen} onOpenChange={setFinishOpen}>
        <DialogContent showCloseButton={false} className="flex flex-col gap-0 overflow-hidden p-0 sm:max-w-lg">
          <DialogHeaderBar icon={<Flag aria-hidden />} title={t("conductor.finishTitle")} description={lesson.title} />
          <div className="flex flex-col gap-4 px-6 py-5">
            <label className="flex flex-col gap-1.5 text-caption text-muted-foreground">
              {t("conductor.reflection")}
              <Textarea
                value={reflection}
                onChange={(e) => setReflection(e.target.value)}
                placeholder={t("conductor.reflectionPlaceholder")}
                rows={3}
                maxLength={600}
              />
            </label>
            <p className="text-caption text-muted-foreground">{t("conductor.reflectionHint")}</p>
            {!isTaught(lesson, classId) && (
              <label className="flex items-center gap-2 text-sm text-foreground">
                <Checkbox checked={markTaught} onCheckedChange={(v) => setMarkTaught(v === true)} />
                {t("conductor.markTaught")}
              </label>
            )}
          </div>
          <div className="flex justify-end gap-2 border-t border-border px-6 py-4">
            <Button variant="outline" className="shadow-none" onClick={() => setFinishOpen(false)}>{t("cancel")}</Button>
            <Button onClick={finish}>{t("conductor.finishConfirm")}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>,
    document.body,
  );
}

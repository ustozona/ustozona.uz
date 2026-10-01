"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { ArrowDown, ArrowUp, ChevronDown, ChevronLeft, ChevronRight, ClipboardCheck, Copy, Loader2, Presentation, RefreshCw, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { RunButtons } from "@/components/launch/RunButtons";
import { SlideView } from "@/components/slides/SlideView";
import { slideLayoutOf } from "@/lib/slide-layouts";
import { stageThemeVars } from "@/lib/stage-themes";
import type { LaunchIntent } from "@/lib/launch-types";
import { changeSetSequenceAction, getSetDraftAction, reorderSetDraftAction, type SetDraft } from "@/server/actions/assess";
import { SHAPE_LABEL } from "./test/builder/types";

export function AssignmentSequence({
  setId,
  revision,
  onEdit,
  onBank,
  onRun,
  onChanged,
  hasGrades,
  editing,
}: {
  setId: string;
  revision: number;
  onEdit: (index?: number) => void;
  onBank: () => void;
  onRun: (intent: LaunchIntent) => void;
  onChanged: (set: SetDraft["set"]) => void;
  hasGrades: boolean;
  editing: boolean;
}) {
  const t = useTranslations("AssignmentsPage");
  const [draft, setDraft] = useState<SetDraft | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [retry, setRetry] = useState(0);
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [pending, setPending] = useState(false);
  const [removeIndex, setRemoveIndex] = useState<number | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setFailed(false);
    setDraft(null);
    getSetDraftAction(setId)
      .then((value) => {
        if (!active) return;
        setDraft(value);
        setFailed(!value);
        setLoading(false);
      })
      .catch(() => {
        if (!active) return;
        setDraft(null);
        setFailed(true);
        setLoading(false);
      });
    return () => { active = false; };
  }, [setId, revision, retry]);

  const mcqCount = draft?.questions.filter((q) => q.shape === "mcq").length ?? 0;

  async function changeSequence(kind: "up" | "down" | "copy" | "remove", index: number) {
    if (!draft || draft.hasSessions || hasGrades || editing || pending) return;
    const questions = [...draft.questions];
    if (kind === "up" || kind === "down") {
      const target = index + (kind === "up" ? -1 : 1);
      if (target < 0 || target >= questions.length) return;
      [questions[index], questions[target]] = [questions[target], questions[index]];
      setOpenIndex(target);
    } else if (kind === "copy") {
      setOpenIndex(index + 1);
    } else {
      if (questions.length <= 1) return;
      setOpenIndex(null);
    }

    setPending(true);
    try {
      if (kind === "up" || kind === "down") {
        const orderedActivityIds = questions.map((question) => question.activityId);
        if (orderedActivityIds.some((id) => !id)) {
          handleSaveError("invalid");
          return;
        }
        const result = await reorderSetDraftAction({
          setId,
          expectedActivityIds: draft.set.items.map((item) => item.activityId),
          expectedUpdatedAt: new Date(draft.set.updatedAt).toISOString(),
          orderedActivityIds: orderedActivityIds as string[],
        });
        if (!result.ok) {
          handleSaveError(result.reason);
          return;
        }
        setDraft({ ...draft, set: result.set, questions });
        onChanged(result.set);
        toast.success(t("sequenceSaved"));
        return;
      }
      const result = await changeSetSequenceAction({
        setId,
        expectedActivityIds: draft.set.items.map((item) => item.activityId),
        expectedUpdatedAt: new Date(draft.set.updatedAt).toISOString(),
        kind,
        activityId: draft.questions[index].activityId ?? "",
      });
      if (!result.ok) {
        handleSaveError(result.reason);
        return;
      }
      setDraft(null);
      setLoading(true);
      onChanged(result.set);
      toast.success(t(kind === "remove" ? "sequenceRemoved" : "sequenceSaved"));
    } catch {
      toast.error(t("sequenceSaveError"));
    } finally {
      setPending(false);
    }
  }

  function handleSaveError(reason: "already_used" | "stale" | "invalid" | "failed") {
    if (reason === "stale" || reason === "already_used") {
      setDraft(null);
      setLoading(true);
      setRetry((n) => n + 1);
    }
    toast.error(reason === "already_used" ? t("sequenceUsed") : reason === "stale" ? t("sequenceStale") : t("sequenceSaveError"));
  }

  return (
    <section className="flex flex-col gap-4" aria-label={t("sequenceTitle")}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-foreground">{t("sequenceTitle")}</h2>
          <p className="text-xs text-muted-foreground">
            {draft ? t("sequenceCount", { count: draft.questions.length }) : t("loadingLabel")}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" disabled={pending} onClick={onBank}>{t("composerBank")}</Button>
          <Button variant="outline" size="sm" disabled={pending} onClick={() => onEdit()}>{t("composerEditOrder")}</Button>
        </div>
      </div>

      {loading && !draft && <p className="py-8 text-center text-sm text-muted-foreground">{t("loadingLabel")}</p>}
      {failed && (
        <div className="rounded-xl border border-border p-4 text-sm text-muted-foreground">
          <p>{t("sequenceLoadError")}</p>
          <Button variant="outline" size="sm" className="mt-3 gap-2" onClick={() => { setLoading(true); setRetry((n) => n + 1); }}>
            <RefreshCw className="size-4" />{t("sequenceRetry")}
          </Button>
        </div>
      )}
      {draft && (
        <div className="flex flex-col gap-2">
          {(draft.hasSessions || hasGrades) && <p className="rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground">{t(draft.hasSessions ? "sequenceUsed" : "sequenceGraded")}</p>}
          {editing && <p className="rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground">{t("sequenceEditorOpen")}</p>}
          {draft.questions.map((item, index) => {
            const expanded = openIndex === index;
            const isSlide = item.shape === "slide";
            return (
              <div key={item.activityId ?? index} className="overflow-hidden rounded-xl border border-border bg-card">
                <button
                  type="button"
                  aria-expanded={expanded}
                  onClick={() => setOpenIndex(expanded ? null : index)}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-muted/40"
                >
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-xs font-semibold text-primary">{index + 1}</span>
                  {isSlide ? <Presentation className="size-4 shrink-0 text-muted-foreground" /> : <ClipboardCheck className="size-4 shrink-0 text-muted-foreground" />}
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-foreground">{item.title || item.stem || SHAPE_LABEL[item.shape]}</span>
                    <span className="text-xs text-muted-foreground">{SHAPE_LABEL[item.shape]}</span>
                  </span>
                  <ChevronDown className={`size-4 shrink-0 text-muted-foreground transition-transform ${expanded ? "rotate-180" : ""}`} />
                </button>
                {expanded && (
                  <div className="border-t border-border bg-muted/20 px-4 py-4 text-sm">
                    {isSlide ? (
                      <div className="quiz-stage stage-font" style={stageThemeVars(item.slideBg ?? (draft.set.config as { stageTheme?: string } | null)?.stageTheme ?? "")}>
                        <SlideView slide={{
                          layout: slideLayoutOf(item.slideLayout),
                          title: item.slideHeading ?? item.title,
                          body: item.stem,
                          imageUrl: item.imageUrl,
                          videoUrl: item.videoUrl,
                        }} />
                      </div>
                    ) : item.stem ? <p className="whitespace-pre-wrap text-foreground">{item.stem}</p> : null}
                    {!isSlide && item.options.length > 0 && (
                      <div className="mt-3 grid gap-2 sm:grid-cols-2">
                        {item.options.filter((o) => o.text.trim()).map((option, n) => (
                          <div key={option.id} className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground">
                            <span className="mr-2 font-semibold text-muted-foreground">{String.fromCharCode(65 + n)}</span>{option.text}
                          </div>
                        ))}
                      </div>
                    )}
                    {item.pairs.length > 0 && (
                      <div className="mt-3 space-y-2">{item.pairs.map((pair) => (
                        <div key={pair.id} className="rounded-lg border border-border bg-card px-3 py-2">{pair.left} → {pair.right}</div>
                      ))}</div>
                    )}
                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      <Button variant="outline" size="sm" disabled={index === 0} onClick={() => setOpenIndex(index - 1)}>
                        <ChevronLeft className="size-4" />{t("sequencePrevious")}
                      </Button>
                      <Button variant="outline" size="sm" disabled={index === draft.questions.length - 1} onClick={() => setOpenIndex(index + 1)}>
                        {t("sequenceNext")}<ChevronRight className="size-4" />
                      </Button>
                      <Button variant="ghost" size="sm" disabled={pending} onClick={() => onEdit(index)}>{t("sequenceEdit")}</Button>
                    </div>
                  </div>
                )}
              <div className="flex shrink-0 items-center gap-1 border-t border-border px-2 py-1.5" aria-label={t("sequenceActions", { index: index + 1 })}>
                <Button variant="ghost" size="icon-sm" disabled={pending || editing || !!draft.hasSessions || hasGrades || index === 0} aria-label={t("sequenceMoveUp")} onClick={() => void changeSequence("up", index)}><ArrowUp className="size-4" /></Button>
                <Button variant="ghost" size="icon-sm" disabled={pending || editing || !!draft.hasSessions || hasGrades || index === draft.questions.length - 1} aria-label={t("sequenceMoveDown")} onClick={() => void changeSequence("down", index)}><ArrowDown className="size-4" /></Button>
                <Button variant="ghost" size="icon-sm" disabled={pending || editing || !!draft.hasSessions || hasGrades} aria-label={t("sequenceCopy")} onClick={() => void changeSequence("copy", index)}><Copy className="size-4" /></Button>
                <Button variant="ghost" size="icon-sm" disabled={pending || editing || !!draft.hasSessions || hasGrades || draft.questions.length <= 1} aria-label={t("sequenceDelete")} onClick={() => setRemoveIndex(index)}><Trash2 className="size-4" /></Button>
                {pending && <Loader2 className="ml-auto size-4 animate-spin text-muted-foreground" aria-label={t("loadingLabel")} />}
              </div>
              </div>
            );
          })}
        </div>
      )}
      <div className="rounded-xl border border-border bg-muted/30 p-4">
        <p className="mb-3 text-xs text-muted-foreground">{mcqCount ? t("sequenceDelivery", { count: mcqCount }) : t("sequenceNoMcq")}</p>
        <div className="flex flex-wrap gap-2" aria-busy={pending}>
          {pending ? <Loader2 className="size-4 animate-spin text-muted-foreground" /> : <RunButtons onRun={onRun} />}
        </div>
        <p className="mt-2 text-xs text-muted-foreground">{t("sequenceClassSameTab")}</p>
      </div>
      <AlertDialog open={removeIndex !== null} onOpenChange={(open) => !open && setRemoveIndex(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("sequenceDeleteTitle")}</AlertDialogTitle>
            <AlertDialogDescription>{t("sequenceDeleteHint")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-white hover:bg-destructive/90" onClick={() => { if (removeIndex !== null) void changeSequence("remove", removeIndex); setRemoveIndex(null); }}>{t("sequenceDelete")}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}

"use client";

import { Check, Info, Presentation } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import type { LaunchSetInfo } from "@/lib/launch-types";
import type { SetDraft } from "@/server/actions/assess";
import { LAUNCH_GROUPS, LAUNCH_MODES, launchModeIssue } from "./launch-modes";

/** Oʻqituvchi boshlashdan oldin tarkib va mavjud usullarni oʻqiydi.
    Bu koʻrik hech qanday sessiya ochmaydi yoki natija yozmaydi. */
export function ClassPreflight({
  info,
  draft,
  className,
  loading,
  error,
  onRetry,
  onBack,
}: {
  info: LaunchSetInfo;
  draft: SetDraft | null;
  className: string;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  onBack: () => void;
}) {
  const t = useTranslations("LaunchHub");
  const serialAvailable = typeof navigator !== "undefined" && "serial" in navigator;
  const partialCount = Math.max(0, info.gradedTotal - info.mcqCount);

  return (
    <div className="flex flex-col gap-5">
      <div className="rounded-xl border border-border bg-muted/30 p-4">
        <p className="text-sm font-semibold text-foreground">{info.title}</p>
        <p className="mt-1 text-caption text-muted-foreground">
          {className} · {t("questions", { count: info.itemCount })}
        </p>
        {info.purpose === "formative" && (
          <p className="mt-2 text-caption text-warning">{t("formativeNote")}</p>
        )}
      </div>

      <section>
        <h3 className="text-label mb-2 text-muted-foreground">{t("preflightMaterials")}</h3>
        {loading ? <div className="flex items-center gap-2 text-sm text-muted-foreground"><Spinner className="size-4" />{t("loading")}</div> : null}
        {error ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>{error}</span><Button size="sm" variant="outline" onClick={onRetry}>{t("retry")}</Button>
          </div>
        ) : null}
        {draft ? (
          <ol className="flex flex-col gap-1.5">
            {draft.questions.map((item, index) => (
              <li key={item.activityId ?? index} className="flex items-start gap-3 rounded-lg border border-border bg-card px-3 py-2">
                <span className="shrink-0 text-caption font-semibold tabular-nums text-muted-foreground">{index + 1}.</span>
                <span className="min-w-0 flex-1 truncate text-sm text-foreground">
                  {item.title || item.slideHeading || item.stem || t(item.shape === "slide" ? "preflightSlide" : "preflightQuestion")}
                </span>
                {item.shape === "slide" && <Presentation aria-label={t("preflightSlide")} className="size-4 shrink-0 text-muted-foreground" />}
              </li>
            ))}
          </ol>
        ) : null}
      </section>

      <section>
        <h3 className="text-label mb-2 text-muted-foreground">{t("preflightCompatibility")}</h3>
        <div className="grid gap-2 sm:grid-cols-2">
          {LAUNCH_GROUPS.flatMap((group) => group.modes).map((mode) => {
            const issue = launchModeIssue(mode, info, serialAvailable);
            const offline = mode === "paper" || mode === "cards" || mode === "pult";
            const review = offline && (partialCount > 0 || (info.content.maxOptions ?? 0) > 4 || info.content.incompatibleMcq > 0);
            const Icon = LAUNCH_MODES[mode].icon;
            return (
              <div key={mode} className="flex items-start gap-2 rounded-lg border border-border bg-card p-3">
                <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium text-foreground">{t(`mode_${mode}`)}</span>
                  <span className="block text-caption text-muted-foreground">{issue ? t(issue) : t(review ? "preflightReview" : "preflightReady")}</span>
                </span>
                {issue || review ? <Info className="size-4 shrink-0 text-warning" /> : <Check className="size-4 shrink-0 text-success" />}
              </div>
            );
          })}
        </div>
        {partialCount > 0 && info.mcqCount > 0 && (
          <p className="mt-3 rounded-lg bg-warning/10 px-3 py-2 text-caption text-foreground">
            {t("preflightPartial", { count: partialCount, mcq: info.mcqCount })}
          </p>
        )}
        {(info.content.maxOptions ?? 0) > 4 && (
          <p className="mt-2 rounded-lg bg-warning/10 px-3 py-2 text-caption text-foreground">{t("preflightOptions")}</p>
        )}
        {info.content.incompatibleMcq > 0 && (
          <p className="mt-2 rounded-lg bg-warning/10 px-3 py-2 text-caption text-foreground">{t("preflightAnswers")}</p>
        )}
      </section>
      <div><Button onClick={onBack}>{t("preflightChooseMode")}</Button></div>
    </div>
  );
}

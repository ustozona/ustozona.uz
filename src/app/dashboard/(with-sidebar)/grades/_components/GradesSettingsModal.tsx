"use client";

import { useTranslations } from "next-intl";
import { Info, Settings2, X } from "lucide-react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { IconButton } from "@/components/ui/icon-button";
import { SectionIcon } from "@/components/ui/section-icon";
import { CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import ScaleControls from "@/components/grade-scale/ScaleControls";
import { useClassStore, journalScaleFor } from "@/store/useClassStore";
import { SaveFooter, useDraft } from "@/app/dashboard/settings/_components/SettingsShared";

/** Kichik ⓘ ikona + tooltip. */
function InfoHint({ children }: { children: React.ReactNode }) {
  const t = useTranslations("GradesSettingsModal");
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          aria-label={t("explain")}
          className="text-muted-foreground/60 transition-colors hover:text-foreground"
        >
          <Info className="size-3.5" />
        </button>
      </TooltipTrigger>
      <TooltipContent className="max-w-[260px] text-pretty">{children}</TooltipContent>
    </Tooltip>
  );
}

/** Boʻlim sarlavhasi (BAHOLASH SHKALASI). */
function SectionTitle({
  children,
  hint,
}: {
  children: React.ReactNode;
  hint?: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <h3 className="text-label font-semibold uppercase tracking-wide text-muted-foreground">
        {children}
      </h3>
      {hint && <InfoHint>{hint}</InfoHint>}
    </div>
  );
}

/** Switch qatori — chapda nom+izoh, oʻngda toggle. */
function SwitchRow({
  title,
  desc,
  checked,
  onChange,
}: {
  title: string;
  desc: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-3">
      <span className="flex flex-col">
        <span className="text-sm font-medium text-foreground">{title}</span>
        <span className="text-caption leading-snug">{desc}</span>
      </span>
      <Switch checked={checked} onCheckedChange={onChange} />
    </label>
  );
}

/**
 * Jurnal sozlamalari modali (docs/grades-scale-model.md).
 * Ikki boʻlim: (1) Baholash shkalasi, (2) Jadval koʻrinishi. Shkala faqat
 * koʻrinishni oʻzgartiradi — bahoni emas.
 */
export default function GradesSettingsModal({
  classId,
  classDisplayName,
  showWeights,
  onShowWeightsChange,
  showTrend,
  onShowTrendChange,
}: {
  /** Joriy sinf — sinf darajasidagi shkala bekor qilish shu klass uchun. */
  classId: string;
  classDisplayName: string;
  showWeights: boolean;
  onShowWeightsChange: (v: boolean) => void;
  showTrend: boolean;
  onShowTrendChange: (v: boolean) => void;
}) {
  // Shkala — explicit Save (Sozlamalar > Jurnal bilan bir xil semantika);
  // jadval koʻrinishi togglelari view-pref sifatida darhol qoʻllanadi.
  const journalScale = useClassStore((s) => s.journalScale);
  const setJournalScale = useClassStore((s) => s.setJournalScale);
  // Sinf darajasidagi bekor qilish (C3): shu sinf uchun standartdan boshqa
  // shkala oʻrnatilganmi — `journalScaleByClass[classId]` mavjudligidan.
  const overridden = useClassStore((s) => s.journalScaleByClass[classId] !== undefined);
  const setJournalScaleForClass = useClassStore((s) => s.setJournalScaleForClass);
  const clearJournalScaleForClass = useClassStore((s) => s.clearJournalScaleForClass);
  const effectiveScale = useClassStore((s) => journalScaleFor(s, classId));

  function commit(next: typeof journalScale) {
    if (overridden) setJournalScaleForClass(classId, next);
    else setJournalScale(next);
  }
  const { draft, setDraft, dirty, save, reset } = useDraft(
    overridden ? effectiveScale : journalScale,
    commit
  );
  const t = useTranslations("GradesSettingsModal");

  return (
    <Dialog>
      <Tooltip>
        <TooltipTrigger asChild>
          <DialogTrigger asChild>
            <IconButton
              aria-label={t("title")}
              className="size-9"
              inactiveVariant="outline"
            >
              <Settings2 className="size-4 text-muted-foreground" />
            </IconButton>
          </DialogTrigger>
        </TooltipTrigger>
        <TooltipContent>{t("title")}</TooltipContent>
      </Tooltip>

      <DialogContent
        showCloseButton={false}
        className="max-w-md gap-0 overflow-hidden p-0 bg-card"
      >
        {/* Standart header — ikona + sarlavha + size-9 yopish tugmasi */}
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border px-5 py-4">
          <div className="flex items-center gap-3">
            <SectionIcon>
              <Settings2 />
            </SectionIcon>
            <div className="flex flex-col">
              <DialogTitle asChild>
                <CardTitle>{t("title")}</CardTitle>
              </DialogTitle>
              <DialogDescription className="text-caption">
                {t("description")}
              </DialogDescription>
            </div>
          </div>
          <DialogClose className="flex size-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none">
            <X className="size-4" />
            <span className="sr-only">{t("close")}</span>
          </DialogClose>
        </div>

        <div className="flex max-h-[70vh] flex-col gap-6 overflow-y-auto scrollbar-thin p-6">
          {/* ── Baholash mezoni ───────────────────────────────── */}
          <section className="space-y-4">
            <SectionTitle hint={t("scaleHint")}>
              {t("scaleSectionTitle")}
            </SectionTitle>

            <SwitchRow
              title={t("perClassScaleTitle", { className: classDisplayName })}
              desc={t("perClassScaleDesc")}
              checked={overridden}
              onChange={(v) => {
                if (v) setJournalScaleForClass(classId, journalScale);
                else clearJournalScaleForClass(classId);
              }}
            />

            <ScaleControls
              value={draft}
              onChange={(p) => setDraft({ ...draft, ...p })}
              scopeLabel={overridden ? t("scopeThisClass", { className: classDisplayName }) : t("scopeAllClasses")}
            />

            {effectiveScale.kind !== "percent" && (
              <SwitchRow
                title={t("showPercentTitle")}
                desc={t("showPercentDesc")}
                checked={effectiveScale.showPercent}
                onChange={(v) => commit({ ...effectiveScale, showPercent: v })}
              />
            )}
          </section>

          <Separator />

          {/* ── Jadval koʻrinishi ───────────────────────────────── */}
          <section className="space-y-4">
            <SectionTitle>{t("tableViewSectionTitle")}</SectionTitle>

            <SwitchRow
              title={t("showWeightsTitle")}
              desc={t("showWeightsDesc")}
              checked={showWeights}
              onChange={onShowWeightsChange}
            />

            <SwitchRow
              title={t("statusColumnFieldLabel")}
              desc={t("trendHintPart")}
              checked={showTrend}
              onChange={onShowTrendChange}
            />
          </section>
        </div>

        <DialogFooter className="flex-row items-center justify-between gap-3 border-t border-border bg-muted/20 px-6 py-3 sm:justify-between">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="shrink-0"
            onClick={() => setJournalScale(draft)}
          >
            {t("applyToAllClasses")}
          </Button>
          <span className="flex shrink-0 items-center gap-2">
            <SaveFooter dirty={dirty} onSave={save} onReset={reset} />
          </span>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

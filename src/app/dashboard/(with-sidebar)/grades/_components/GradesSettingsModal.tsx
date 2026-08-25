"use client";

import { useTranslations } from "next-intl";
import { Info, Settings2, X } from "lucide-react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { IconButton } from "@/components/ui/icon-button";
import { SectionIcon } from "@/components/ui/section-icon";
import { CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import ScaleControls from "@/components/grade-scale/ScaleControls";
import { useClassStore } from "@/store/useClassStore";
import { SaveFooter, useDraft } from "@/app/dashboard/settings/_components/SettingsShared";

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
      <span className="flex items-center gap-1.5">
        <span className="text-sm font-medium text-foreground">{title}</span>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={(e) => e.preventDefault()}
              className="text-muted-foreground/60 transition-colors hover:text-foreground"
            >
              <Info className="size-3.5" />
            </button>
          </TooltipTrigger>
          <TooltipContent className="max-w-[240px] text-pretty">{desc}</TooltipContent>
        </Tooltip>
      </span>
      <Switch checked={checked} onCheckedChange={onChange} />
    </label>
  );
}

/**
 * Jurnal sozlamalari modali (docs/grades-scale-model.md).
 * Ikki boʻlim: (1) Baholash shkalasi, (2) Jadval koʻrinishi. Shkala faqat
 * koʻrinishni oʻzgartiradi — bahoni emas. Barcha sinflar uchun bitta shkala.
 */
export default function GradesSettingsModal() {
  // Shkala — explicit Save (Sozlamalar > Jurnal bilan bir xil semantika);
  // jadval koʻrinishi togglelari view-pref sifatida darhol qoʻllanadi.
  const journalScale = useClassStore((s) => s.journalScale);
  const setJournalScale = useClassStore((s) => s.setJournalScale);

  const { draft, setDraft, dirty, save, reset } = useDraft(journalScale, setJournalScale);
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
        className="max-w-sm gap-0 overflow-hidden p-0 bg-card"
      >
        {/* Standart header — ikona + sarlavha + size-9 yopish tugmasi */}
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border px-5 py-4">
          <div className="flex items-center gap-3">
            <SectionIcon>
              <Settings2 />
            </SectionIcon>
            <DialogTitle asChild>
              <CardTitle>{t("title")}</CardTitle>
            </DialogTitle>
          </div>
          <DialogClose className="flex size-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none">
            <X className="size-4" />
            <span className="sr-only">{t("close")}</span>
          </DialogClose>
        </div>

        <div className="flex max-h-[70vh] flex-col gap-5 scrollbar-hover overflow-y-auto scrollbar-thin p-6">
          <ScaleControls
            value={draft}
            onChange={(p) => setDraft({ ...draft, ...p })}
          />

          {draft.kind !== "percent" && (
            <SwitchRow
              title={t("showPercentTitle")}
              desc={t("showPercentDesc")}
              checked={draft.showPercent}
              onChange={(v) => setDraft({ ...draft, showPercent: v })}
            />
          )}
        </div>

        <DialogFooter className="flex-row items-center justify-end gap-3 border-t border-border bg-muted/20 px-6 py-3">
          <SaveFooter dirty={dirty} onSave={save} onReset={reset} />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

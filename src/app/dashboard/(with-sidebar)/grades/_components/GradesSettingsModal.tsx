"use client";

import { Info, Settings2, X } from "lucide-react";
import {
  Dialog,
  DialogTrigger,
  DialogClose,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { IconButton } from "@/components/ui/icon-button";
import { SectionIcon } from "@/components/ui/section-icon";
import { CardTitle } from "@/components/ui/card";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import ScaleControls from "@/components/grade-scale/ScaleControls";

const segmentClass = "grid w-full grid-cols-2 gap-1 rounded-lg bg-muted p-1";
const segmentItem =
  "rounded-md text-sm data-[state=on]:bg-card data-[state=on]:shadow-sm";

/** Kichik ⓘ ikona + tooltip. */
function InfoHint({ children }: { children: React.ReactNode }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          aria-label="Tushuntirish"
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

/** Maydon yorligʻi (sarlavhadan past daraja). */
function FieldLabel({
  children,
  hint,
}: {
  children: React.ReactNode;
  hint?: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-sm font-medium text-foreground">{children}</span>
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
  showWeights,
  onShowWeightsChange,
  showFormative,
  onShowFormativeChange,
}: {
  showWeights: boolean;
  onShowWeightsChange: (v: boolean) => void;
  showFormative: boolean;
  onShowFormativeChange: (v: boolean) => void;
}) {
  return (
    <Dialog>
      <Tooltip>
        <TooltipTrigger asChild>
          <DialogTrigger asChild>
            <IconButton
              aria-label="Jurnal sozlamalari"
              className="size-9"
              inactiveVariant="outline"
            >
              <Settings2 className="size-4 text-muted-foreground" />
            </IconButton>
          </DialogTrigger>
        </TooltipTrigger>
        <TooltipContent>Jurnal sozlamalari</TooltipContent>
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
                <CardTitle>Jurnal sozlamalari</CardTitle>
              </DialogTitle>
              <DialogDescription className="text-caption">
                Baholash mezoni va jadval koʻrinishi
              </DialogDescription>
            </div>
          </div>
          <DialogClose className="flex size-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none">
            <X className="size-4" />
            <span className="sr-only">Yopish</span>
          </DialogClose>
        </div>

        <div className="flex max-h-[70vh] flex-col gap-6 overflow-y-auto scrollbar-thin p-6">
          {/* ── Baholash mezoni ───────────────────────────────── */}
          <section className="space-y-4">
            <SectionTitle hint="Faqat koʻrinishni oʻzgartiradi — baholar ichkarida foizda saqlanadi. Yonidagi raqam: 78% shu mezonda qanday koʻrinishini koʻrsatadi (5-ballikda «4», IB'da «6»).">
              Baholash mezoni
            </SectionTitle>
            <ScaleControls />
          </section>

          <Separator />

          {/* ── Jadval koʻrinishi ───────────────────────────────── */}
          <section className="space-y-4">
            <SectionTitle>Jadval koʻrinishi</SectionTitle>

            <SwitchRow
              title="Vaznli foizni koʻrsatish"
              desc="Har topshiriq ustida uning toifasi vazniga nisbatan hissasi."
              checked={showWeights}
              onChange={onShowWeightsChange}
            />

            <div className="space-y-1.5">
              <FieldLabel
                hint={
                  <>
                    <span className="font-medium text-foreground">Trend</span> — oʻquvchining
                    oʻsish/pasayish yoʻnalishi (↗↘).{" "}
                    <span className="font-medium text-foreground">Formativ signal</span> —
                    mashqlardagi diagnostik foiz (yakuniy bahoga taʼsir qilmaydi).
                  </>
                }
              >
                Holat ustunida koʻrsatilsin
              </FieldLabel>
              <ToggleGroup
                type="single"
                value={showFormative ? "formative" : "trend"}
                onValueChange={(v) => v && onShowFormativeChange(v === "formative")}
                className={segmentClass}
              >
                <ToggleGroupItem value="trend" className={segmentItem}>Trend ↗↘</ToggleGroupItem>
                <ToggleGroupItem value="formative" className={segmentItem}>Formativ signal</ToggleGroupItem>
              </ToggleGroup>
            </div>
          </section>
        </div>

        <DialogFooter className="border-t border-border bg-muted/20 p-4">
          <DialogClose asChild>
            <Button size="sm">Yopish</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

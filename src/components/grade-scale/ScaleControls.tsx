"use client";

import * as React from "react";
import { Users } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useClassStore } from "@/store/useClassStore";
import { GRADING_SCALE_PRESETS } from "@/lib/grades-data";
import { gradeBadgeClass } from "@/lib/score-colors";
import {
  formatByScaleKind,
  scoreLabel,
  getScaleBoundaries,
  type JournalScaleKind,
  type LabelStyle,
} from "@/lib/grade-scale";

/** Har shkala uchun qisqa tushuntirish — tanlovdan keyin koʻrsatiladi. */
const SCALE_HINTS: Record<string, string> = {
  five: "Oʻzbekiston maktab standarti: 5 (aʼlo), 4 (yaxshi), 3 (qoniqarli), 2 (qoniqarsiz).",
  ten: "1 dan 10 gacha baholanadi; 10 — eng yuqori natija.",
  percent: "Aniq foiz bilan, 0–100% oraligʻida.",
  pass_fail: "Ikkilik natija: Bajardi yoki Bajarmadi.",
  letter_plus: "AQSh harf tizimi: A+ dan F gacha.",
  letter_basic: "Soddalashtirilgan harf tizimi: A dan F gacha.",
  ib7: "Xalqaro bakalavriat (IB) mezoni: 1–7, 7 — eng yuqori.",
  gcse: "Britaniya GCSE mezoni: 9–1, 9 — eng yuqori.",
  german6: "Germaniya mezoni: 1 (aʼlo) dan 6 (yiqilish) gacha.",
  french20: "Fransiya mezoni: 0 dan 20 gacha.",
};

const segmentClass = "grid w-full grid-cols-2 gap-1 rounded-lg bg-muted p-1";
const segmentItem = "rounded-md text-sm data-[state=on]:bg-card data-[state=on]:shadow-sm";

/** Ochiq roʻyxatdagi shkala bandi — nom + 78% namunasi. */
function ScaleItem({ kind, label }: { kind: JournalScaleKind; label: string }) {
  return (
    <SelectItem value={kind}>
      <span className="flex w-full items-center justify-between gap-3">
        <span>{label}</span>
        <span className="text-caption tabular-nums text-muted-foreground">
          {formatByScaleKind(78, kind)}
        </span>
      </span>
    </SelectItem>
  );
}

/** Toggle qatori — chapda nom+izoh, oʻngda toggle. */
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

/** Chegara jadvali — "nega 84% emas 85%" savoliga koʻrinadigan javob. */
function BoundaryTable({ boundaries }: { boundaries: { min: number; label: string }[] }) {
  return (
    <div className="overflow-hidden rounded-lg border border-border">
      <div className="flex items-center justify-between gap-3 border-b border-border bg-muted/40 px-3 py-1.5">
        <span className="text-label text-muted-foreground">Foiz oraligʻi</span>
        <span className="text-label text-muted-foreground">Baho</span>
      </div>
      {boundaries.map((b, i) => {
        const next = boundaries[i - 1];
        const range = next ? `${b.min}–${next.min - 1}%` : `${b.min}–100%`;
        return (
          <div
            key={b.min}
            className={cn(
              "flex items-center justify-between gap-3 bg-card px-3 py-1.5",
              i !== 0 && "border-t border-border"
            )}
          >
            <span className="text-caption tabular-nums text-muted-foreground">{range}</span>
            <span
              className={cn(
                "inline-flex min-w-8 items-center justify-center rounded-md border px-1.5 py-0.5 text-xs font-medium tabular-nums",
                gradeBadgeClass(b.min)
              )}
            >
              {b.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

/**
 * Jurnal baholash shkalasi boshqaruvi (docs/grades-scale-model.md) — yagona
 * manba, Sozlamalar sahifasi (JournalSection) va Jurnal toolbar modali
 * (GradesSettingsModal) shu komponentni ishlatadi. Faqat koʻrinishni
 * oʻzgartiradi — baholar ichkarida foizda saqlanadi.
 */
export default function ScaleControls() {
  const journalScale = useClassStore((s) => s.journalScale);
  const setJournalScale = useClassStore((s) => s.setJournalScale);

  const uzPresets = GRADING_SCALE_PRESETS.filter((p) => p.group === "uz");
  const intlPresets = GRADING_SCALE_PRESETS.filter((p) => p.group === "intl");
  const currentLabel = GRADING_SCALE_PRESETS.find((p) => p.kind === journalScale.kind)?.label ?? "";
  const currentHint = SCALE_HINTS[journalScale.kind];
  const isFive = journalScale.kind === "five";
  const boundaries = getScaleBoundaries(journalScale.kind, journalScale.labelStyle);

  const lab = scoreLabel(78, journalScale);
  const percentExample = lab === "78%" ? "78%" : `${lab} (78%)`;

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Select
          value={journalScale.kind}
          onValueChange={(v) => setJournalScale({ kind: v as JournalScaleKind })}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Baholash mezonini tanlang">{currentLabel}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>Oʻzbekiston / umumiy</SelectLabel>
              {uzPresets.map((p) => (
                <ScaleItem key={p.kind} kind={p.kind as JournalScaleKind} label={p.label} />
              ))}
            </SelectGroup>
            <SelectGroup>
              <SelectLabel>Xalqaro dasturlar</SelectLabel>
              {intlPresets.map((p) => (
                <ScaleItem key={p.kind} kind={p.kind as JournalScaleKind} label={p.label} />
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
        {currentHint && (
          <p className="text-caption leading-snug text-muted-foreground">{currentHint}</p>
        )}
        <Badge variant="secondary" className="gap-1 font-normal text-muted-foreground">
          <Users className="size-3" />
          Barcha sinflar uchun faol
        </Badge>
      </div>

      {/* Chegara jadvali — tier-asosli shkalalarda. */}
      {boundaries && <BoundaryTable boundaries={boundaries} />}

      {/* Yorliq uslubi — faqat 5-ballikda */}
      {isFive && (
        <div className="space-y-1.5">
          <span className="text-sm font-medium text-foreground">Bahoning aks etish shakli</span>
          <ToggleGroup
            type="single"
            value={journalScale.labelStyle}
            onValueChange={(v) => v && setJournalScale({ labelStyle: v as LabelStyle })}
            className={segmentClass}
          >
            <ToggleGroupItem value="number" className={segmentItem}>Raqamli (4)</ToggleGroupItem>
            <ToggleGroupItem value="word" className={segmentItem}>Matnli (Yaxshi)</ToggleGroupItem>
          </ToggleGroup>
        </div>
      )}

      {/* Foizni koʻrsatish — foiz shkalasida maʼnosiz, yashiriladi */}
      {journalScale.kind !== "percent" && (
        <SwitchRow
          title="Foizni ham aks ettirish"
          desc={`Jurnalda baho yonida uning aniq foizi ham koʻrsatiladi, masalan: ${percentExample}`}
          checked={journalScale.showPercent}
          onChange={(c) => setJournalScale({ showPercent: c })}
        />
      )}
    </div>
  );
}

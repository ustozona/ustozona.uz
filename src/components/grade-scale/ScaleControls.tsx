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
import { Badge } from "@/components/ui/badge";
import { GRADING_SCALE_PRESETS } from "@/lib/grades-data";
import {
  formatByScaleKind,
  type JournalScale,
  type JournalScaleKind,
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

/**
 * Jurnal baholash shkalasi boshqaruvi (docs/grades-scale-model.md) — yagona
 * manba, Sozlamalar sahifasi (JournalSection) va Jurnal toolbar modali
 * (GradesSettingsModal) shu komponentni ishlatadi. Controlled: draft holatini
 * host boshqaradi (explicit Save), store'ga bevosita yozmaydi. Faqat
 * koʻrinishni oʻzgartiradi — baholar ichkarida foizda saqlanadi.
 */
export default function ScaleControls({
  value,
  onChange,
  scopeLabel = "Barcha sinflar uchun faol",
}: {
  value: JournalScale;
  onChange: (patch: Partial<JournalScale>) => void;
  /** Amal doirasi yorligʻi — sinf darajasida bekor qilinganda oʻzgaradi (C3). */
  scopeLabel?: string;
}) {
  const journalScale = value;
  const setJournalScale = onChange;

  const uzPresets = GRADING_SCALE_PRESETS.filter((p) => p.group === "uz");
  const intlPresets = GRADING_SCALE_PRESETS.filter((p) => p.group === "intl");
  const currentLabel = GRADING_SCALE_PRESETS.find((p) => p.kind === journalScale.kind)?.label ?? "";
  const currentHint = SCALE_HINTS[journalScale.kind];

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
          {scopeLabel}
        </Badge>
      </div>
    </div>
  );
}

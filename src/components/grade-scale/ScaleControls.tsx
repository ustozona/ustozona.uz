"use client";

import * as React from "react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { GRADING_SCALE_PRESETS } from "@/lib/grades-data";
import { type JournalScale, type JournalScaleKind } from "@/lib/grade-scale";

/** Ochiq roʻyxatdagi shkala bandi — faqat nom. */
function ScaleItem({ kind, label }: { kind: JournalScaleKind; label: string }) {
  return <SelectItem value={kind}>{label}</SelectItem>;
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
}: {
  value: JournalScale;
  onChange: (patch: Partial<JournalScale>) => void;
}) {
  const journalScale = value;
  const setJournalScale = onChange;

  const uzPresets = GRADING_SCALE_PRESETS.filter((p) => p.group === "uz");
  const intlPresets = GRADING_SCALE_PRESETS.filter((p) => p.group === "intl");
  const currentLabel = GRADING_SCALE_PRESETS.find((p) => p.kind === journalScale.kind)?.label ?? "";

  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-sm font-medium text-foreground">Baholash shkalasi</span>
      <Select
        value={journalScale.kind}
        onValueChange={(v) => setJournalScale({ kind: v as JournalScaleKind })}
      >
        <SelectTrigger className="w-auto min-w-40">
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
    </div>
  );
}

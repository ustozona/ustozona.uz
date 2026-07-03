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
import { cn } from "@/lib/utils";
import { useClassStore } from "@/store/useClassStore";
import { GRADING_SCALE_PRESETS } from "@/lib/grades-data";
import { formatScore, type LabelStyle } from "@/lib/grade-scale";
import { SettingsGroup, SettingRow, SwitchRow } from "./SettingsShared";

export default function JournalSection() {
  const journalScale = useClassStore((s) => s.journalScale);
  const setJournalScale = useClassStore((s) => s.setJournalScale);

  const uz = GRADING_SCALE_PRESETS.filter((p) => p.group === "uz");
  const intl = GRADING_SCALE_PRESETS.filter((p) => p.group === "intl");

  // Yorliq uslubi (raqam/soʻz) faqat 5-ballikka tegishli.
  const isFive = journalScale.kind === "five";
  const example = formatScore(78, journalScale).display;

  return (
    <>
      <SettingsGroup
        title="Baholash shkalasi"
        description="Butun jurnalda ishlatiladigan yagona shkala. Ichki hisob (foiz) oʻzgarmaydi — faqat koʻrinish."
      >
        <SettingRow title="Shkala turi" description={`Namuna: 78% → ${example}`}>
          <Select
            value={journalScale.kind}
            onValueChange={(v) => setJournalScale({ kind: v as typeof journalScale.kind })}
          >
            <SelectTrigger className="w-52" size="sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Oʻzbekiston / umumiy</SelectLabel>
                {uz.map((p) => (
                  <SelectItem key={p.kind} value={p.kind}>
                    {p.label}
                  </SelectItem>
                ))}
              </SelectGroup>
              <SelectGroup>
                <SelectLabel>Xalqaro</SelectLabel>
                {intl.map((p) => (
                  <SelectItem key={p.kind} value={p.kind}>
                    {p.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </SettingRow>

        {isFive && (
          <SettingRow title="Yorliq uslubi" description="5-ballik uchun raqam yoki soʻz koʻrinishi.">
            <div className="flex gap-1 rounded-lg bg-muted p-1">
              {(["number", "word"] as LabelStyle[]).map((style) => (
                <button
                  key={style}
                  type="button"
                  onClick={() => setJournalScale({ labelStyle: style })}
                  className={cn(
                    "rounded-md px-3 py-1 text-xs font-medium transition-colors",
                    journalScale.labelStyle === style
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {style === "number" ? "Raqam (4)" : "Soʻz (Yaxshi)"}
                </button>
              ))}
            </div>
          </SettingRow>
        )}

        <SwitchRow
          title="Foizni koʻrsatish"
          description={`Baho yonida qavsda foiz: masalan "4 (78%)".`}
          checked={journalScale.showPercent}
          onCheckedChange={(v) => setJournalScale({ showPercent: v })}
        />
      </SettingsGroup>
    </>
  );
}

"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Check, ChevronsUpDown } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";
import type { StatPeriod, StatPeriodKind } from "@/lib/class-stats";

const KINDS: StatPeriodKind[] = ["week", "month", "quarter", "year"];

/** Davr tanlagich — granulyarlik (Hafta/Oy/Chorak/Yil) va aniq davr BITTA
    tugma/popover ichida (Stripe/Vercel sana-oraligʻi naqshi) — ikkita
    yonma-yon boshqaruv oʻrniga. Granulyarlik tab'lari popover ichida
    tepada pin qilingan, ostida qidiriladigan roʻyxat (Hafta uchun ~40 element
    boʻlishi mumkin — qidiruv shart). */
export function PeriodSelect({
  kind,
  onKindChange,
  periods,
  value,
  onChange,
}: {
  kind: StatPeriodKind;
  onKindChange: (kind: StatPeriodKind) => void;
  periods: StatPeriod[];
  value: string;
  onChange: (id: string) => void;
}) {
  const t = useTranslations("StatisticsPage");
  const [open, setOpen] = useState(false);
  const kindLabel: Record<StatPeriodKind, string> = {
    week: t("periodKindWeek"),
    month: t("periodKindMonth"),
    quarter: t("periodKindQuarter"),
    year: t("periodKindYear"),
  };
  const current = periods.find((p) => p.id === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="flex h-9 items-center gap-2 rounded-md border border-input bg-transparent px-3 text-sm shadow-xs transition-colors hover:bg-muted"
        >
          <span className="text-muted-foreground">{kindLabel[kind]}</span>
          <span className="font-medium">{current?.label ?? "—"}</span>
          <ChevronsUpDown className="size-3.5 shrink-0 text-muted-foreground" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72 p-0">
        <div className="flex items-center gap-0.5 border-b p-1.5">
          {KINDS.map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => onKindChange(k)}
              className={cn(
                "flex-1 rounded px-2 py-1.5 text-xs font-medium transition-colors",
                kind === k ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {kindLabel[k]}
            </button>
          ))}
        </div>
        <Command>
          <CommandInput placeholder={t("periodSearchPlaceholder")} />
          <CommandList className="max-h-64">
            <CommandEmpty>{t("periodNotFound")}</CommandEmpty>
            <CommandGroup>
              {periods.map((p) => (
                <CommandItem
                  key={p.id}
                  value={p.label}
                  onSelect={() => { onChange(p.id); setOpen(false); }}
                >
                  <span className="truncate">{p.label}</span>
                  {p.id === value && <Check className="ml-auto size-4" />}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

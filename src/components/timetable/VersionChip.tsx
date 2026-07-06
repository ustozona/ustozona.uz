"use client";

import { cn } from "@/lib/utils";
import { fmtDayMonthUz } from "@/lib/academic-calendar";
import {
  resolveVersionForDate,
  sortVersions,
  versionRangeEnd,
  type TimetableVersion,
} from "@/lib/timetable-versions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Check, ChevronDown, PlusIcon, TrashIcon } from "lucide-react";

/* ════════════════════════════════════════════════════════════════════
   VERSIYA TANLAGICH — jadval sahifasi toolbar chipi (A+C gibrid)

   Trigger ixcham: holat NUQTASI (yashil=joriy, koʻk=kelgusi, kulrang=
   arxiv) + faqat sana-diapazon — "Joriy jadval/Arxiv" soʻzlari banner
   bilan takrorlanmasin deb tooltip'ga koʻchdi. Dropdown — vertikal
   TIMELINE (chiziq+nuqtalar, eng yangisi tepada): sana-diapazon, izoh,
   "Joriy/Kelgusi" badge; pastda "Yangi versiya…" va oʻchirish.
   ════════════════════════════════════════════════════════════════════ */

/** Versiya davri matni: "16-sentabrdan" yoki "2-sentabr — 15-sentabr". */
export function versionRangeLabel(versions: TimetableVersion[], v: TimetableVersion): string {
  const end = versionRangeEnd(versions, v.id);
  return end
    ? `${fmtDayMonthUz(v.effectiveFrom)} — ${fmtDayMonthUz(end)}`
    : `${fmtDayMonthUz(v.effectiveFrom)}dan`;
}

export default function VersionChip({
  versions,
  selectedId,
  todayKey,
  onSelect,
  onCreateNew,
  onDeleteSelected,
  variant = "chip",
}: {
  versions: TimetableVersion[];
  selectedId: string | null;
  todayKey: string;
  onSelect: (id: string) => void;
  onCreateNew: () => void;
  onDeleteSelected: () => void;
  /** "chip" — toolbar tugmasi; "subtitle" — sarlavha ostidagi kichik satr. */
  variant?: "chip" | "subtitle";
}) {
  const selected = versions.find((v) => v.id === selectedId) ?? null;
  const currentId = resolveVersionForDate(versions, todayKey)?.id ?? null;

  const stateLabel = !selected
    ? "Jadval versiyalari"
    : selected.effectiveFrom > todayKey
      ? "Kelgusi jadval"
      : selected.id === currentId
        ? "Joriy jadval"
        : "Arxiv jadval";

  const triggerDot = !selected
    ? "bg-muted-foreground/50"
    : selected.effectiveFrom > todayKey
      ? "bg-info"
      : selected.id === currentId
        ? "bg-success"
        : "bg-muted-foreground/50";

  const sorted = sortVersions(versions).reverse();

  // Kelgusi versiya uchun subtitle qatori onboarding ohangida: "kechikish"
  // emas, "hammasi rejadagidek" hissi beriladi.
  const subtitleText = !selected
    ? "Dars jadvali tarixi"
    : selected.effectiveFrom > todayKey
      ? `Dars jadvalingiz ${fmtDayMonthUz(selected.effectiveFrom)}dan amal qiladi`
      : `${stateLabel} · ${versionRangeLabel(versions, selected)}`;

  return (
    <DropdownMenu>
      <Tooltip>
        <TooltipTrigger asChild>
          <DropdownMenuTrigger asChild>
            {variant === "subtitle" ? (
              <button
                type="button"
                aria-label={`${stateLabel} — versiyalar tarixi`}
                className="group/vc -ml-1 flex max-w-full items-center gap-1.5 rounded-md px-1 py-0.5 text-caption text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
              >
                <span className={cn("size-2 shrink-0 rounded-full", triggerDot)} aria-hidden />
                <span className="truncate font-medium">{subtitleText}</span>
                <ChevronDown className="size-3.5 shrink-0 opacity-60 transition-opacity group-hover/vc:opacity-100" />
              </button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                aria-label={`${stateLabel} — versiyalar tarixi`}
                className="gap-2 shadow-none"
              >
                <span className={cn("size-2 shrink-0 rounded-full", triggerDot)} aria-hidden />
                <span className="max-w-44 truncate">
                  {selected ? versionRangeLabel(versions, selected) : "Versiyalar"}
                </span>
                <ChevronDown className="size-3.5 text-muted-foreground" />
              </Button>
            )}
          </DropdownMenuTrigger>
        </TooltipTrigger>
        <TooltipContent>{stateLabel} · versiyalar tarixi</TooltipContent>
      </Tooltip>
      <DropdownMenuContent align="start" className="w-72">
        <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
          Dars jadvali tarixi
        </DropdownMenuLabel>
        {sorted.map((v, i) => {
          const isCurrent = v.id === currentId;
          const isSelected = v.id === selectedId;
          const isFuture = v.effectiveFrom > todayKey;
          const dotCls = isFuture
            ? "bg-info"
            : isCurrent
              ? "bg-success"
              : "border-[1.5px] border-muted-foreground/50 bg-transparent";
          const only = sorted.length === 1;
          return (
            <DropdownMenuItem
              key={v.id}
              onSelect={() => onSelect(v.id)}
              className="items-stretch gap-2.5 py-0"
            >
              {/* Timeline reli: nuqta + vertikal chiziq */}
              <span aria-hidden className="relative flex w-3 shrink-0 justify-center self-stretch">
                {!only && (
                  <span
                    className={cn(
                      "absolute w-px bg-border",
                      i === 0 ? "top-[17px] bottom-0" : i === sorted.length - 1 ? "top-0 h-[17px]" : "inset-y-0",
                    )}
                  />
                )}
                <span className={cn("absolute top-[13px] size-2.5 rounded-full", dotCls)} />
              </span>
              <span className="min-w-0 flex-1 py-2">
                <span className="flex items-center gap-2">
                  <span className="truncate text-sm font-medium">
                    {versionRangeLabel(versions, v)}
                  </span>
                  {isCurrent && (
                    <Badge variant="secondary" className="h-5 px-1.5 text-[10px]">
                      Joriy
                    </Badge>
                  )}
                  {isFuture && (
                    <Badge variant="outline" className="h-5 px-1.5 text-[10px]">
                      Kelgusi
                    </Badge>
                  )}
                </span>
                {v.note && (
                  <span className="block truncate text-xs text-muted-foreground">{v.note}</span>
                )}
              </span>
              <Check
                className={cn("size-4 shrink-0 self-center", !isSelected && "invisible")}
              />
            </DropdownMenuItem>
          );
        })}
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={onCreateNew}>
          <PlusIcon />
          Yangi sanadan dars jadvali tuzish…
        </DropdownMenuItem>
        <DropdownMenuItem
          variant="destructive"
          disabled={versions.length <= 1 || !selected}
          onSelect={onDeleteSelected}
        >
          <TrashIcon />
          Ushbu dars jadvalini oʻchirish
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

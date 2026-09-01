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
import { Check, CheckCircle2, ChevronDown, Circle, Clock, PlusIcon, TrashIcon } from "lucide-react";

/* ════════════════════════════════════════════════════════════════════
   VERSIYA TANLAGICH — jadval sahifasi toolbar chipi (A+C gibrid)

   Trigger ixcham: holat INDIKATORI — endi ikon (kvadrat emas): CheckCircle2
   (yashil, joriy), Clock (sariq, kelgusi — "hali boshlanmagan"), Circle
   (kulrang, arxiv) — + faqat sana-diapazon — "Joriy jadval/Arxiv" soʻzlari
   banner bilan takrorlanmasin deb tooltip'ga koʻchdi. Dropdown — vertikal
   TIMELINE (chiziq+ikonlar, eng yangisi tepada): sana-diapazon, izoh,
   "Joriy/Kelgusi" badge; pastda "Yangi versiya…" va oʻchirish.

   ROʻYXAT QAMROVI — FAQAT FAOL OʻQUV YILI. Bu sohaning universal naqshi:
   Untis'da "Perioden" yil ICHIDAGI boʻlinmalar (yil almashganda tayanch
   davrdan boshqasi umuman oʻchiriladi), Edupage/aSc'da "valid from"
   zanjiri yil konteksti ichida, PowerSchool/Infinite Campus'da esa butun
   jadval strukturasi yilga bogʻlangan va rollover bilan NUSXALANADI.
   Bizda eski versiyalar store'da QOLADI (oʻtgan yil davomatini backfill
   qilishda `resolveVersionForDate` ularni oʻqiydi) — faqat shu roʻyxatdan
   yashiriladi. Ilgari yil boʻyicha GURUHLASH bor edi; 10+ versiyada u
   yordam bermay qoldi.
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
  activeYear,
}: {
  versions: TimetableVersion[];
  selectedId: string | null;
  todayKey: string;
  onSelect: (id: string) => void;
  onCreateNew: () => void;
  onDeleteSelected: () => void;
  /** "chip" — toolbar tugmasi; "subtitle" — sarlavha ostidagi kichik satr. */
  variant?: "chip" | "subtitle";
  /** Faol oʻquv yili — roʻyxat shu yil oynasi bilan KESISHUVCHI versiyalar
      bilan cheklanadi, sarlavha esa yil nomini koʻrsatadi. Berilmasa (yoki
      filtr natijasi boʻsh chiqsa) hammasi koʻrsatiladi. */
  activeYear?: { label: string; range: { start: string; end: string } };
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

  const TriggerIcon = !selected
    ? Circle
    : selected.effectiveFrom > todayKey
      ? Clock
      : selected.id === currentId
        ? CheckCircle2
        : Circle;

  const triggerIconCls = !selected
    ? "text-muted-foreground/50"
    : selected.effectiveFrom > todayKey
      ? "text-warning"
      : selected.id === currentId
        ? "text-success"
        : "text-muted-foreground/50";

  // Faol yil oynasi bilan KESISHUVCHI versiyalar. Ataylab `effectiveFrom`
  // boʻyicha emas: yil boshini qoplab turgan versiya oldingi yil oxirida
  // yaratilgan boʻlishi mumkin — sodda `>= yil.start` filtri uni yoʻqotib,
  // roʻyxatni boʻsh qoldirardi. Versiya oynasi = [effectiveFrom … rangeEnd],
  // rangeEnd null boʻlsa "hozirgacha" (cheksiz).
  const inYear = (v: TimetableVersion) => {
    if (!activeYear) return true;
    // Tanlangan versiya HAR DOIM roʻyxatda: aks holda (masalan yozda, bugun
    // faol yil oynasidan tashqarida boʻlganda) subtitle uni koʻrsatib turgani
    // holda roʻyxatda belgisi ham, oʻzi ham boʻlmasdi — "oʻchirish" esa
    // koʻrinmayotgan versiyaga ishlardi.
    if (v.id === selectedId) return true;
    // Hali boshlanmagan versiya HAR DOIM koʻrinadi: kelgusi yil jadvali
    // koʻpincha oʻsha yil kalendari yaratilishidan OLDIN tuziladi — aks holda
    // foydalanuvchi endigina tuzgan jadvali roʻyxatdan yoʻqolib qolardi.
    if (v.effectiveFrom > todayKey) return true;
    if (v.effectiveFrom > activeYear.range.end) return false;
    const end = versionRangeEnd(versions, v.id);
    return end === null || end >= activeYear.range.start;
  };

  const all = sortVersions(versions).reverse();
  const scoped = all.filter(inYear);
  // Himoya: kalendar sozlanmagan/gʻalati oyna boʻlsa boʻsh dropdown chiqmasin.
  const sorted = scoped.length > 0 ? scoped : all;

  // Bitta versiya bandini render qilish (idx/count — roʻyxat ichidagi tartib;
  // timeline relining uchlari shunga qarab kesiladi).
  const renderItem = (v: TimetableVersion, idx: number, count: number) => {
    const isCurrent = v.id === currentId;
    const isSelected = v.id === selectedId;
    const isFuture = v.effectiveFrom > todayKey;
    const DotIcon = isFuture ? Clock : isCurrent ? CheckCircle2 : Circle;
    const dotCls = isFuture
      ? "text-warning"
      : isCurrent
        ? "text-success"
        : "text-muted-foreground/50";
    const only = count === 1;
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
                idx === 0 ? "top-[17px] bottom-0" : idx === count - 1 ? "top-0 h-[17px]" : "inset-y-0",
              )}
            />
          )}
          <span className="absolute top-[11px] flex size-4 items-center justify-center rounded-full bg-popover">
            <DotIcon className={cn("size-3.5", dotCls)} />
          </span>
        </span>
        <span className="min-w-0 flex-1 py-2">
          <span className="flex items-center gap-2">
            <span className="truncate text-sm font-medium">
              {versionRangeLabel(versions, v)}
            </span>
            {isCurrent && (
              <Badge className="h-5 bg-green-50 px-1.5 text-[10px] text-green-700 dark:bg-green-950 dark:text-green-300">
                Joriy
              </Badge>
            )}
            {isFuture && (
              <Badge className="h-5 bg-amber-50 px-1.5 text-[10px] text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                Kelgusi
              </Badge>
            )}
          </span>
          {v.note && (
            <span className="block truncate text-xs text-muted-foreground">{v.note}</span>
          )}
        </span>
        <Check className={cn("size-4 shrink-0 self-center", !isSelected && "invisible")} />
      </DropdownMenuItem>
    );
  };

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
                <TriggerIcon className={cn("size-3.5 shrink-0", triggerIconCls)} aria-hidden />
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
                <TriggerIcon className={cn("size-3.5 shrink-0", triggerIconCls)} aria-hidden />
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
        <DropdownMenuLabel className="flex items-baseline justify-between gap-2 text-xs font-normal text-muted-foreground">
          <span>Dars jadvali tarixi</span>
          {activeYear && scoped.length > 0 && (
            <span className="shrink-0">{activeYear.label}</span>
          )}
        </DropdownMenuLabel>
        {sorted.map((v, i) => renderItem(v, i, sorted.length))}
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

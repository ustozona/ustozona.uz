"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useTranslations, useMessages } from "next-intl";
import { ArrowUpRight, ChevronDown, ChevronUp, ListFilter, Megaphone } from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TypographyMuted } from "@/components/ui/typography";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent,
  DropdownMenuCheckboxItem, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  groupChangelogByDate,
  fmtChangelogDateUz,
  type ChangelogEntry,
  type ChangelogType,
} from "@/lib/changelog-data";
import { markChangelogSeen } from "@/hooks/useChangelogSeen";
import { TYPE_META, TYPE_ORDER } from "./_components/changelog-meta";

type TypeFilter = ChangelogType | "all";

/** Dastlab koʻrsatiladigan yozuvlar soni — qolgani tugma bilan ochiladi. */
const INITIAL_VISIBLE = 20;
/** Bir sanada shuncha yoki koʻproq kompakt yozuv boʻlsa, ular bitta
    yigʻiladigan qatorga jamlanadi (referens: "N minor updates · hide"). */
const COLLAPSE_THRESHOLD = 2;

function TypePill({ type, label }: { type: ChangelogEntry["type"]; label: string }) {
  const meta = TYPE_META[type];
  return (
    <Badge variant="outline" className={cn("shrink-0 gap-1", meta.pill)}>
      <meta.icon className="size-3" />
      {label}
    </Badge>
  );
}

/** Tegishli sahifaga oʻng chetga tekislangan kichik havola-chip. */
function HrefChip({ href, routeLabels }: { href: string; routeLabels: Record<string, string> }) {
  const label = href.split("/").pop() ?? "";
  return (
    <Link
      href={href}
      className="inline-flex shrink-0 items-center gap-1 rounded-md border border-border px-2 py-0.5 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
    >
      {routeLabels[href] ?? label}
      <ArrowUpRight className="size-3" />
    </Link>
  );
}

function FullEntryRow({
  entry,
  typeLabel,
  routeLabels,
}: {
  entry: ChangelogEntry;
  typeLabel: string;
  routeLabels: Record<string, string>;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0 space-y-1.5">
        <div className="flex flex-wrap items-center gap-2">
          <TypePill type={entry.type} label={typeLabel} />
          <span className="text-sm font-medium text-foreground">{entry.title}</span>
        </div>
        <p className="text-sm leading-relaxed text-muted-foreground">{entry.body}</p>
      </div>
      {entry.href && <HrefChip href={entry.href} routeLabels={routeLabels} />}
    </div>
  );
}

function CompactEntryRow({
  entry,
  typeLabel,
  routeLabels,
}: {
  entry: ChangelogEntry;
  typeLabel: string;
  routeLabels: Record<string, string>;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex min-w-0 items-center gap-2">
        <TypePill type={entry.type} label={typeLabel} />
        <span className="truncate text-sm font-medium text-foreground">{entry.title}</span>
      </div>
      {entry.href && <HrefChip href={entry.href} routeLabels={routeLabels} />}
    </div>
  );
}

/** Guruhlangan yozuvlar uchun subdued qator — bir jumla ichida tur+sarlavha,
    rangli badge yoʻq, faqat turga mos rangli nuqta (guruh oʻzi allaqachon
    "mayda" signalini beradi, lekin tur farqi yoʻqolib ketmasligi kerak). */
function MutedCompactRow({
  entry,
  typeLabel,
  routeLabels,
}: {
  entry: ChangelogEntry;
  typeLabel: string;
  routeLabels: Record<string, string>;
}) {
  const meta = TYPE_META[entry.type];
  return (
    <div className="flex items-center justify-between gap-3">
      <p className="min-w-0 truncate text-sm text-muted-foreground">
        <span className={cn("mr-1.5 inline-block size-1.5 rounded-full align-middle", meta.iconColor.replace("text-", "bg-"))} />
        <span className="font-medium text-foreground">{typeLabel}:</span>{" "}
        {entry.title}
        {!/[.!?]$/.test(entry.title) && "."}
      </p>
      {entry.href && (
        <Link
          href={entry.href}
          className="inline-flex shrink-0 items-center gap-1 rounded-md border border-border px-1.5 py-0.5 text-[11px] text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
        >
          {routeLabels[entry.href] ?? entry.href.split("/").pop()}
          <ArrowUpRight className="size-3" />
        </Link>
      )}
    </div>
  );
}

/** Ketma-ket kompakt yozuvlarni "N ta kichik yangilanish" qatoriga jamlaydi. */
function CompactGroup({
  entries,
  typeLabels,
  routeLabels,
  compactCountLabel,
  hideLabel,
  showLabel,
}: {
  entries: ChangelogEntry[];
  typeLabels: Record<ChangelogEntry["type"], string>;
  routeLabels: Record<string, string>;
  compactCountLabel: string;
  hideLabel: string;
  showLabel: string;
}) {
  // EMStudio uslubi: kompakt guruh dastlab OCHIQ (foydalanuvchi darhol koʻradi),
  // "yashirish" bilan yigʻish mumkin — yigʻilganini eslatish uchun soʻz + ikonka.
  const [open, setOpen] = useState(true);
  if (entries.length < COLLAPSE_THRESHOLD) {
    return (
      <div className="space-y-3">
        {entries.map((e) => (
          <CompactEntryRow key={e.id} entry={e} typeLabel={typeLabels[e.type]} routeLabels={routeLabels} />
        ))}
      </div>
    );
  }
  return (
    <div className="rounded-xl bg-muted/40 px-3.5 py-3">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-2 text-left text-sm text-muted-foreground"
      >
        <span className="inline-flex items-center gap-1.5">
          <span className="size-1.5 rounded-full bg-muted-foreground/50" />
          {compactCountLabel}
        </span>
        <span className="inline-flex items-center gap-1 text-xs transition-colors hover:text-foreground">
          {open ? hideLabel : showLabel}
          {open ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
        </span>
      </button>
      {open && (
        <div className="mt-3 flex flex-col gap-2.5 border-t border-border/70 pt-3">
          {entries.map((e) => (
            <MutedCompactRow key={e.id} entry={e} typeLabel={typeLabels[e.type]} routeLabels={routeLabels} />
          ))}
        </div>
      )}
    </div>
  );
}

/** Yozuvlarni tartibni saqlagan holda bloklarga ajratadi: toʻliq (body bor)
    yozuvlar oʻz holicha, ketma-ket kompakt yozuvlar bitta guruh sifatida. */
type Block =
  | { kind: "full"; entry: ChangelogEntry }
  | { kind: "compact"; entries: ChangelogEntry[] };

/** Tanlangan tildagi tarjima boʻlsa, uz-standart title/body ustidan yozadi
    (`Changelog.entries.<id>`); tarjima yoʻq boʻlsa uz matni koʻrinadi. */
function localizeEntry(
  entry: ChangelogEntry,
  dict?: Record<string, { title?: string; body?: string }>
): ChangelogEntry {
  const tr = dict?.[entry.id];
  if (!tr) return entry;
  return { ...entry, title: tr.title ?? entry.title, body: tr.body ?? entry.body };
}

function toBlocks(items: ChangelogEntry[]): Block[] {
  const blocks: Block[] = [];
  let run: ChangelogEntry[] = [];
  const flush = () => {
    if (run.length) blocks.push({ kind: "compact", entries: run });
    run = [];
  };
  for (const entry of items) {
    if (entry.body) {
      flush();
      blocks.push({ kind: "full", entry });
    } else {
      run.push(entry);
    }
  }
  flush();
  return blocks;
}

export default function ChangelogPage() {
  const t = useTranslations("Changelog");

  const routeLabels: Record<string, string> = useMemo(
    () => ({
      "/dashboard": t("routes.dashboard"),
      "/dashboard/classes": t("routes.classes"),
      "/dashboard/students": t("routes.students"),
      "/dashboard/timetable": t("routes.timetable"),
      "/dashboard/attendance": t("routes.attendance"),
      "/dashboard/behavior": t("routes.behavior"),
      "/dashboard/standards": t("routes.standards"),
      "/dashboard/settings": t("routes.settings"),
      "/dashboard/feedback": t("routes.feedback"),
      "/dashboard/lessons": t("routes.lessons"),
      "/dashboard/statistics": t("routes.statistics"),
      "/dashboard/tasks": t("routes.tasks"),
      "/dashboard/changelog": t("routes.changelog"),
    }),
    [t]
  );

  const typeLabels: Record<ChangelogType, string> = useMemo(
    () => ({
      yangi: t("types.yangi"),
      yaxshilandi: t("types.yaxshilandi"),
      tuzatildi: t("types.tuzatildi"),
    }),
    [t]
  );

  // Sahifa ochildi — hamma yozuv koʻrildi (sidebar badge darhol oʻchadi).
  useEffect(() => {
    markChangelogSeen();
  }, []);

  const messages = useMessages() as { Changelog?: { entries?: Record<string, { title?: string; body?: string }> } };
  const entryTranslations = messages?.Changelog?.entries;

  const groups = useMemo(() => {
    return groupChangelogByDate().map((g) => ({
      date: g.date,
      items: g.items.map((it) => localizeEntry(it, entryTranslations)),
    }));
  }, [entryTranslations]);

  // Tur boʻyicha soni (filtr menyusida koʻrsatish uchun)
  const typeCounts = useMemo(() => {
    const map = { all: 0 } as Record<TypeFilter, number>;
    for (const type of TYPE_ORDER) map[type] = 0;
    for (const g of groups) for (const it of g.items) { map.all++; map[it.type]++; }
    return map;
  }, [groups]);

  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const filterActive = typeFilter !== "all";

  const filteredGroups = useMemo(() => {
    if (!filterActive) return groups;
    return groups
      .map((g) => ({ date: g.date, items: g.items.filter((it) => it.type === typeFilter) }))
      .filter((g) => g.items.length > 0);
  }, [groups, typeFilter, filterActive]);

  // "Oxirgi 30 kunda N ta yangilanish" — effektda hisoblanadi: bugungi sana
  // prerender (build) sanasidan farq qilsa hydration mismatch boʻlmasin.
  const [recentCount, setRecentCount] = useState(0);
  useEffect(() => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 30);
    const key = `${cutoff.getFullYear()}-${String(cutoff.getMonth() + 1).padStart(2, "0")}-${String(cutoff.getDate()).padStart(2, "0")}`;
    setRecentCount(
      filteredGroups.reduce((sum, g) => (g.date >= key ? sum + g.items.length : sum), 0)
    );
  }, [filteredGroups]);

  const [collapsedDates, setCollapsedDates] = useState<Set<string>>(new Set());
  const toggleDate = (date: string) =>
    setCollapsedDates((prev) => {
      const next = new Set(prev);
      if (next.has(date)) next.delete(date);
      else next.add(date);
      return next;
    });

  const [expanded, setExpanded] = useState(false);
  const totalEntries = useMemo(
    () => filteredGroups.reduce((sum, g) => sum + g.items.length, 0),
    [filteredGroups]
  );

  // Dastlab INITIAL_VISIBLE ta yozuv (guruh chegarasini saqlagan holda kesiladi)
  const visibleGroups = useMemo(() => {
    if (expanded || totalEntries <= INITIAL_VISIBLE) return filteredGroups;
    const out: typeof filteredGroups = [];
    let remaining = INITIAL_VISIBLE;
    for (const g of filteredGroups) {
      if (remaining <= 0) break;
      out.push({ date: g.date, items: g.items.slice(0, remaining) });
      remaining -= g.items.length;
    }
    return out;
  }, [filteredGroups, expanded, totalEntries]);

  return (
    <div className="mx-auto flex h-full min-h-0 w-full max-w-3xl flex-col p-4 md:p-6">
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-border bg-card">
        {/* Sarlavha — qotib turadi, faqat pastdagi roʻyxat scroll boʻladi */}
        <div className="shrink-0 border-b border-border p-4 md:p-6">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <Megaphone className="size-4.5 text-primary" />
              </div>
              <h1 className="heading-page text-foreground">{t("title")}</h1>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              {/* Tur boʻyicha filtr — icon-only */}
              <DropdownMenu>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        size="icon"
                        className={cn(
                          "relative size-9 shrink-0 shadow-none",
                          filterActive && "border-primary/40 text-primary"
                        )}
                      >
                        <ListFilter className="size-4" />
                        {filterActive && (
                          <span className="absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-semibold tabular-nums text-primary-foreground">
                            1
                          </span>
                        )}
                      </Button>
                    </DropdownMenuTrigger>
                  </TooltipTrigger>
                  <TooltipContent>{t("filter")}</TooltipContent>
                </Tooltip>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuCheckboxItem
                    checked={typeFilter === "all"}
                    onCheckedChange={() => setTypeFilter("all")}
                  >
                    {t("filterAll")}
                    <span className="ml-auto text-xs text-muted-foreground">{typeCounts.all}</span>
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuSeparator />
                  {TYPE_ORDER.map((type) => (
                    <DropdownMenuCheckboxItem
                      key={type}
                      checked={typeFilter === type}
                      onCheckedChange={() => setTypeFilter(typeFilter === type ? "all" : type)}
                    >
                      {typeLabels[type]}
                      <span className="ml-auto text-xs text-muted-foreground">{typeCounts[type]}</span>
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <TypographyMuted className="mt-1.5 text-sm leading-relaxed">
            {t("description")}
            {recentCount > 0 && (
              <span className="text-muted-foreground/80">
                {" "}
                {t.rich("recentUpdates", {
                  count: recentCount,
                  b: (chunks) => <span className="font-medium text-foreground/80">{chunks}</span>,
                })}
              </span>
            )}
          </TypographyMuted>
        </div>

        <ScrollArea className="min-h-0 flex-1">
          <div className="p-4 md:p-6">
            {visibleGroups.map((group, gi) => (
              <div key={group.date} className="relative flex gap-4">
                {/* Timeline rail: nuqta + vertikal chiziq (VersionChip uslubi) */}
                <div aria-hidden className="relative flex w-4 shrink-0 justify-center">
                  {visibleGroups.length > 1 && (
                    <span
                      className={cn(
                        "absolute w-px bg-border",
                        gi === 0
                          ? "top-3 bottom-0"
                          : gi === visibleGroups.length - 1
                            ? "top-0 h-3"
                            : "inset-y-0"
                      )}
                    />
                  )}
                  <span className="absolute top-1.5 size-2.5 rounded-full border-2 border-primary bg-card" />
                </div>

                <div className={cn("min-w-0 flex-1", gi === visibleGroups.length - 1 ? "pb-0" : "pb-7")}>
                  <button
                    type="button"
                    onClick={() => toggleDate(group.date)}
                    className="flex w-full items-baseline gap-2 text-left"
                  >
                    <span className="text-sm font-semibold text-foreground">
                      {fmtChangelogDateUz(group.date)}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {t("updatesCount", { count: group.items.length })}
                    </span>
                    {collapsedDates.has(group.date) ? (
                      <ChevronDown className="size-3.5 text-muted-foreground" />
                    ) : (
                      <ChevronUp className="size-3.5 text-muted-foreground" />
                    )}
                  </button>
                  {!collapsedDates.has(group.date) && (
                    <div className="mt-2.5 space-y-4">
                      {toBlocks(group.items).map((block, bi) =>
                        block.kind === "full" ? (
                          <FullEntryRow
                            key={block.entry.id}
                            entry={block.entry}
                            typeLabel={typeLabels[block.entry.type]}
                            routeLabels={routeLabels}
                          />
                        ) : (
                          <CompactGroup
                            key={`compact-${bi}`}
                            entries={block.entries}
                            typeLabels={typeLabels}
                            routeLabels={routeLabels}
                            compactCountLabel={t("compactGroup", { count: block.entries.length })}
                            hideLabel={t("compactGroupHide")}
                            showLabel={t("compactGroupShow")}
                          />
                        )
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {!expanded && totalEntries > INITIAL_VISIBLE && (
              <div className="mt-4 flex justify-center">
                <Button variant="ghost" size="sm" onClick={() => setExpanded(true)}>
                  {t("showPrevious")}
                </Button>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}

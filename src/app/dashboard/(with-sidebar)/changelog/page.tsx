"use client";

import { createElement, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useTranslations, useMessages } from "next-intl";
import {
  BookOpen, CalendarDays, FileText, LayoutGrid, ListFilter, Megaphone,
  MessageSquare, Newspaper, NotebookText, Settings, type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ImageZoom } from "@/components/kibo-ui/image-zoom";
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

function TypePill({ type, label }: { type: ChangelogEntry["type"]; label: string }) {
  const meta = TYPE_META[type];
  return (
    <Badge variant="outline" className={cn("shrink-0 gap-1", meta.pill)}>
      <meta.icon className="size-3" />
      {label}
    </Badge>
  );
}

/** Havola tugmasidagi ikonka — yoʻl boshiga qarab. */
const ROUTE_ICONS: [string, LucideIcon][] = [
  ["/help", BookOpen],
  ["/blog", Newspaper],
  ["/dashboard/classes", LayoutGrid],
  ["/dashboard/lessons", NotebookText],
  ["/dashboard/timetable", CalendarDays],
  ["/dashboard/settings", Settings],
  ["/dashboard/feedback", MessageSquare],
];

function RouteIcon({ href, className }: { href: string; className?: string }) {
  return createElement(ROUTE_ICONS.find(([p]) => href.startsWith(p))?.[1] ?? FileText, { className });
}

/** Rasm joyida silliq kattalashadi (Fikr-mulohazadagi bilan bir xil ImageZoom). */
function EntryImage({ image }: { image: { src: string; alt: string } }) {
  return (
    <ImageZoom className="w-full shrink-0 md:w-60">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={image.src} alt={image.alt} loading="lazy" className="w-full rounded-xl border border-border md:rounded-lg" />
    </ImageZoom>
  );
}

/** `cta` yozilmagan boʻlsa — havola turiga qarab harakat nomi (`Changelog.cta.*` kaliti). */
const defaultCtaKey = (href: string) =>
  href.startsWith("/help") ? "help" : href.startsWith("/blog") ? "blog" : "try";

function EntryContent({ entry, typeLabel }: { entry: ChangelogEntry; typeLabel: string }) {
  const t = useTranslations("Changelog.cta");
  return (
    <div className="space-y-2">
      {/* Telefonda chap ustun yoʻq — tur va sana sarlavha ustida */}
      <div className="flex items-center gap-2 md:hidden">
        <TypePill type={entry.type} label={typeLabel} />
        <time dateTime={entry.date} className="text-xs text-muted-foreground">{fmtChangelogDateUz(entry.date)}</time>
      </div>
      
      <div>
        <h2 className="heading-small text-pretty pt-0.5 text-foreground">
          {entry.title}
        </h2>
      </div>
      {/* Telefonda rasm toʻliq kenglikda matn ustida; desktopda matn yonida kichik, bosilsa kattalashadi */}
      <div className={cn(entry.image && "flex flex-col gap-3 md:flex-row-reverse md:items-start md:gap-4")}>
        {entry.image && <EntryImage image={entry.image} />}
        {entry.body && <p className="text-body min-w-0 flex-1 text-pretty leading-relaxed text-muted-foreground">{entry.body}</p>}
      </div>
      {entry.href && (
        <Button asChild variant="ghost" size="sm" className="-ml-2 w-fit gap-1.5 text-muted-foreground hover:text-foreground">
          <Link href={entry.href}>
            <RouteIcon href={entry.href} className="size-4" />
            {entry.cta ?? t(defaultCtaKey(entry.href))}
          </Link>
        </Button>
      )}
    </div>
  );
}

/** Tanlangan tildagi tarjima boʻlsa, uz-standart title/body ustidan yozadi
    (`Changelog.entries.<id>`); tarjima yoʻq boʻlsa uz matni koʻrinadi. */
function localizeEntry(
  entry: ChangelogEntry,
  dict?: Record<string, { title?: string; body?: string; cta?: string }>
): ChangelogEntry {
  const tr = dict?.[entry.id];
  if (!tr) return entry;
  return { ...entry, title: tr.title ?? entry.title, body: tr.body ?? entry.body, cta: tr.cta ?? entry.cta };
}

export default function ChangelogPage() {
  const t = useTranslations("Changelog");

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

  const messages = useMessages() as { Changelog?: { entries?: Record<string, { title?: string; body?: string; cta?: string }> } };
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

  const filteredEntries = useMemo(() => filteredGroups.flatMap((g) => g.items), [filteredGroups]);
  const [expanded, setExpanded] = useState(false);
  const visibleEntries = expanded ? filteredEntries : filteredEntries.slice(0, INITIAL_VISIBLE);

  return (
    <div className="mx-auto flex h-full min-h-0 w-full max-w-5xl flex-col p-4 md:p-6">
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
                          <span className="absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full bg-primary text-micro font-semibold tabular-nums text-primary-foreground">
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
          <div className="p-4 md:p-8">
            {visibleEntries.map((entry, i) => (
              <div key={entry.id} className="flex gap-4 md:gap-0">
                {/* Chap ustun: tur, ostida sana (bir kunning keyingi yozuvlarida sana takrorlanmaydi, nuqta kichik) */}
                <div className="hidden w-32 shrink-0 md:block">
                  <div className="sticky top-0 flex flex-col items-center gap-1 pr-4 pt-0.5 text-center">
                    <TypePill type={entry.type} label={typeLabels[entry.type]} />
                    {visibleEntries[i - 1]?.date !== entry.date && (
                      <time dateTime={entry.date} className="text-xs text-muted-foreground">
                        {fmtChangelogDateUz(entry.date)}
                      </time>
                    )}
                  </div>
                </div>
                {/* Vaqt chizigʻi: uzluksiz vertikal chiziq + sana roʻparasida nuqta */}
                <div aria-hidden className="relative hidden w-px shrink-0 md:block">
                  <span
                    className={cn(
                      "absolute left-0 w-px bg-border",
                      i === 0 ? "top-3" : "top-0",
                      i === visibleEntries.length - 1 ? "h-3" : "bottom-0"
                    )}
                  />
                  <span className={cn(
                      "absolute left-0 top-3 -translate-x-1/2 -translate-y-1/2 rounded-full",
                      visibleEntries[i - 1]?.date === entry.date ? "size-1.5 bg-muted-foreground/60" : "size-2.5 bg-foreground"
                    )} />
                </div>
                <div className={cn("min-w-0 flex-1 pt-0.5 md:pl-8", i < visibleEntries.length - 1 && "pb-8")}>
                  <EntryContent entry={entry} typeLabel={typeLabels[entry.type]} />
                </div>
              </div>
            ))}

            {!expanded && filteredEntries.length > INITIAL_VISIBLE && (
              <div className="flex justify-center pb-8">
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

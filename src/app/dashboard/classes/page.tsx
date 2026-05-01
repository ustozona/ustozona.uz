"use client";

import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { autoClassColor, classTokens, type ClassColor } from "@/lib/class-colors";
import { cn } from "@/lib/utils";

type ClassItem = {
  id: number;
  name: string;
  subject: string;
  students: number;
  lessons: number;
  assignments: number;
  schedule: string;
  /** Optional manual override; if absent, color is auto-derived from id */
  color?: ClassColor;
};

const classes: ClassItem[] = [
  { id: 1, name: "5-A", subject: "Informatika", students: 13, lessons: 18, assignments: 2, schedule: "Ju · 10:35" },
  { id: 2, name: "5-B", subject: "Informatika", students: 14, lessons: 18, assignments: 2, schedule: "Ju · 9:40" },
  { id: 3, name: "5-D", subject: "Informatika", students: 19, lessons: 18, assignments: 2, schedule: "Ju · 8:00" },
  { id: 4, name: "6-A", subject: "Informatika", students: 14, lessons: 12, assignments: 3, schedule: "16:20 — 17:05" },
  { id: 5, name: "6-B", subject: "Informatika", students: 13, lessons: 12, assignments: 3, schedule: "14:40 — 15:25" },
  { id: 6, name: "6-D", subject: "Informatika", students: 17, lessons: 12, assignments: 3, schedule: "15:30 — 16:15" },
  { id: 7, name: "7-A", subject: "Robototexnika", students: 16, lessons: 6, assignments: 3, schedule: "17:10 — 17:55" },
  { id: 8, name: "To'garak (1-guruh)", subject: "Scratch & Algoritmika", students: 15, lessons: 6, assignments: 1, schedule: "Sh · 9:00 — 11:00", color: "orange" },
];

type SortKey = "name" | "students" | "lessons";
type ViewMode = "grid" | "list";

export default function ClassesPage() {
  const [view, setView] = useState<ViewMode>("grid");
  const [search, setSearch] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortMenuOpen, setSortMenuOpen] = useState(false);

  const filteredAndSorted = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = q
      ? classes.filter(
          (c) =>
            c.name.toLowerCase().includes(q) ||
            c.subject.toLowerCase().includes(q)
        )
      : classes;
    const sorted = [...list].sort((a, b) => {
      if (sortKey === "students") return b.students - a.students;
      if (sortKey === "lessons") return b.lessons - a.lessons;
      return a.name.localeCompare(b.name);
    });
    return sorted;
  }, [search, sortKey]);

  const totals = useMemo(
    () => ({
      classes: classes.length,
      students: classes.reduce((s, c) => s + c.students, 0),
      lessons: classes.reduce((s, c) => s + c.lessons, 0),
      assignments: classes.reduce((s, c) => s + c.assignments, 0),
    }),
    []
  );

  return (
    <div className="grid gap-4 p-4 grid-cols-1 xl:grid-cols-4 auto-rows-min h-full min-h-0">
      {/* Main: classes list/grid (col-span-3) */}
      <Card className="col-span-1 xl:col-span-3 rounded-2xl shadow-none min-w-0 flex flex-col gap-0 py-0 xl:max-h-[calc(100dvh-var(--top-header-height)-2rem)]">
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 shrink-0 border-b border-border/60">
          <div className="flex items-center gap-2 min-w-0">
            <div className="h-8 w-8 rounded-lg bg-foreground flex items-center justify-center shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-background">
                <path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z"/>
                <path d="M22 10v6"/>
                <path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5"/>
              </svg>
            </div>
            <div className="min-w-0">
              <h1 className="text-lg font-bold text-foreground tracking-tight truncate">Mening sinflarim</h1>
            </div>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            {/* Edit */}
            <Tooltip>
              <TooltipTrigger className="h-9 w-9 flex items-center justify-center rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
                <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"/>
                  <path d="m15 5 4 4"/>
                </svg>
              </TooltipTrigger>
              <TooltipContent>Tahrirlash</TooltipContent>
            </Tooltip>

            {/* Search */}
            <div className="flex items-center">
              {searchOpen ? (
                <div className="flex items-center gap-1 bg-muted/50 rounded-lg pl-2.5 pr-1 h-9">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground shrink-0">
                    <circle cx="11" cy="11" r="8"/><path d="m21 21-4.34-4.34"/>
                  </svg>
                  <input
                    autoFocus
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onBlur={() => !search && setSearchOpen(false)}
                    placeholder="Sinf yoki fan..."
                    className="bg-transparent outline-none text-sm w-40 h-full"
                  />
                  {search && (
                    <button
                      onClick={() => { setSearch(""); setSearchOpen(false); }}
                      className="h-6 w-6 flex items-center justify-center rounded hover:bg-muted text-muted-foreground"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                    </button>
                  )}
                </div>
              ) : (
                <Tooltip>
                  <TooltipTrigger
                    onClick={() => setSearchOpen(true)}
                    className="h-9 w-9 flex items-center justify-center rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="11" cy="11" r="8"/><path d="m21 21-4.34-4.34"/>
                    </svg>
                  </TooltipTrigger>
                  <TooltipContent>Qidirish</TooltipContent>
                </Tooltip>
              )}
            </div>

            {/* Sort */}
            <div className="relative">
              <button
                onClick={() => setSortMenuOpen((v) => !v)}
                className="flex items-center gap-2 h-9 px-3 rounded-lg border border-border bg-card hover:bg-muted/50 transition-colors text-sm"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground">
                  <path d="m3 16 4 4 4-4"/><path d="M7 20V4"/><path d="M11 4h4"/><path d="M11 8h7"/><path d="M11 12h10"/>
                </svg>
                <span className="text-[13px] text-muted-foreground">Saralash:</span>
                <span className="text-[13px] font-medium text-foreground">
                  {sortKey === "name" ? "Nom" : sortKey === "students" ? "O'quvchi" : "Dars"}
                </span>
              </button>
              {sortMenuOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setSortMenuOpen(false)} />
                  <div className="absolute right-0 top-full mt-1 z-20 w-44 bg-card border border-border rounded-lg shadow-md py-1">
                    {([
                      { key: "name", label: "Nom bo'yicha" },
                      { key: "students", label: "O'quvchilar soni" },
                      { key: "lessons", label: "Darslar soni" },
                    ] as const).map((opt) => (
                      <button
                        key={opt.key}
                        onClick={() => { setSortKey(opt.key); setSortMenuOpen(false); }}
                        className={cn(
                          "w-full text-left px-3 py-1.5 text-sm hover:bg-muted transition-colors flex items-center gap-2",
                          sortKey === opt.key ? "font-semibold text-foreground" : "text-foreground/80"
                        )}
                      >
                        {sortKey === opt.key && (
                          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-foreground"><path d="M20 6 9 17l-5-5"/></svg>
                        )}
                        {sortKey !== opt.key && <span className="w-3" />}
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* New Class */}
            <Button size="sm" className="rounded-lg gap-1.5 h-9 px-3.5 bg-foreground text-background hover:bg-foreground/90">
              <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
              Yangi sinf
            </Button>

            {/* View toggle */}
            <div className="flex items-center bg-muted/50 rounded-lg p-0.5 ml-1">
              <button
                onClick={() => setView("grid")}
                className={cn(
                  "h-8 w-8 flex items-center justify-center rounded-md transition-colors",
                  view === "grid" ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                )}
                aria-label="Grid view"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/>
                </svg>
              </button>
              <button
                onClick={() => setView("list")}
                className={cn(
                  "h-8 w-8 flex items-center justify-center rounded-md transition-colors",
                  view === "list" ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                )}
                aria-label="List view"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="8" x2="21" y1="6" y2="6"/><line x1="8" x2="21" y1="12" y2="12"/><line x1="8" x2="21" y1="18" y2="18"/><line x1="3" x2="3.01" y1="6" y2="6"/><line x1="3" x2="3.01" y1="12" y2="12"/><line x1="3" x2="3.01" y1="18" y2="18"/>
                </svg>
              </button>
            </div>
          </div>
        </div>

        <CardContent className="px-5 py-5 flex-1 overflow-y-auto scrollbar-thin min-h-0">
          {filteredAndSorted.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-sm text-muted-foreground">Sinflar topilmadi</p>
            </div>
          ) : view === "grid" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredAndSorted.map((cls) => (
                <ClassGridCard key={cls.id} cls={cls} />
              ))}
              <AddClassCard />
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {filteredAndSorted.map((cls) => (
                <ClassListRow key={cls.id} cls={cls} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Right: Overview (col-span-1) */}
      <Card className="col-span-1 xl:col-span-1 rounded-2xl shadow-none min-w-0 self-start">
        <div className="flex items-center gap-2 px-5 pt-5 pb-3">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground">
            <line x1="18" x2="18" y1="20" y2="10"/><line x1="12" x2="12" y1="20" y2="4"/><line x1="6" x2="6" y1="20" y2="14"/>
          </svg>
          <h2 className="text-base font-semibold">Umumiy ko'rinish</h2>
        </div>
        <CardContent className="px-3 pb-4 space-y-2">
          <OverviewRow color="rose" label="Jami sinflar" value={totals.classes} icon="cap" />
          <OverviewRow color="emerald" label="Jami o'quvchilar" value={totals.students} icon="users" />
          <OverviewRow color="violet" label="Jami darslar" value={totals.lessons} icon="book" />
          <OverviewRow color="amber" label="Jami vazifalar" value={totals.assignments} icon="clipboard" />
        </CardContent>
      </Card>
    </div>
  );
}

/* ─────────────────────────── Grid Card ─────────────────────────── */

function ClassGridCard({ cls }: { cls: ClassItem }) {
  const color = cls.color ?? autoClassColor(cls.id);
  const t = classTokens(color);
  const progress = Math.round(((cls.lessons - cls.assignments) / Math.max(cls.lessons, 1)) * 100);

  return (
    <div className="group relative rounded-2xl border border-border bg-card overflow-hidden hover:shadow-md hover:border-border transition-all cursor-pointer">
      {/* Top: gradient banner with floating icon */}
      <div className={cn("relative h-32 bg-gradient-to-br overflow-hidden", t.gradient)}>
        {/* Decorative circle top-right */}
        <div className={cn("absolute -right-6 -top-6 h-24 w-24 rounded-full opacity-60", t.iconBg)} />
        {/* Decorative circle bottom-left */}
        <div className={cn("absolute -left-8 -bottom-10 h-24 w-24 rounded-full opacity-30", t.iconBg)} />

        {/* Center icon */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className={cn("h-14 w-14 rounded-2xl flex items-center justify-center backdrop-blur-sm", t.iconBg)}>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={t.iconText}>
              <path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z"/>
              <path d="M22 10v6"/>
              <path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5"/>
            </svg>
          </div>
        </div>

        {/* Hover actions: Edit + Delete */}
        <div className="absolute top-2.5 right-2.5 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            type="button"
            onClick={(e) => e.stopPropagation()}
            className="h-8 w-8 flex items-center justify-center rounded-lg bg-card/90 backdrop-blur-sm border border-border shadow-sm hover:bg-card text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Tahrirlash"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"/>
              <path d="m15 5 4 4"/>
            </svg>
          </button>
          <button
            type="button"
            onClick={(e) => e.stopPropagation()}
            className="h-8 w-8 flex items-center justify-center rounded-lg bg-card/90 backdrop-blur-sm border border-border shadow-sm hover:bg-red-50 text-muted-foreground hover:text-red-600 transition-colors"
            aria-label="O'chirish"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 6h18"/>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/>
              <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
              <line x1="10" x2="10" y1="11" y2="17"/>
              <line x1="14" x2="14" y1="11" y2="17"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Bottom: info */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="min-w-0 flex-1">
            <h3 className="text-base font-bold text-foreground truncate leading-tight">{cls.name}</h3>
            <p className="text-xs text-muted-foreground mt-1 truncate">{cls.schedule}</p>
          </div>
          <ProgressRing value={progress} color={color} />
        </div>

        <div className="grid grid-cols-3 gap-1.5">
          <Stat icon="users" value={cls.students} label="O'quvchi" color={color} />
          <Stat icon="book" value={cls.lessons} label="Dars" color={color} />
          <Stat icon="clipboard" value={cls.assignments} label="Vazifa" color={color} />
        </div>
      </div>
    </div>
  );
}

function ProgressRing({ value, color }: { value: number; color: ClassColor }) {
  const t = classTokens(color);
  const r = 14;
  const c = 2 * Math.PI * r;
  const offset = c - (value / 100) * c;
  return (
    <div className="relative h-9 w-9 shrink-0">
      <svg viewBox="0 0 36 36" className="h-9 w-9 -rotate-90">
        <circle cx="18" cy="18" r={r} fill="none" stroke="currentColor" strokeWidth="3" className="text-muted opacity-50" />
        <circle
          cx="18"
          cy="18"
          r={r}
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          className={t.iconText}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-[9px] font-semibold text-muted-foreground">
        {value}%
      </span>
    </div>
  );
}

function Stat({
  icon,
  value,
  label,
  color,
}: {
  icon: "users" | "book" | "clipboard";
  value: number;
  label: string;
  color: ClassColor;
}) {
  const t = classTokens(color);
  const path =
    icon === "users" ? (
      <>
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </>
    ) : icon === "book" ? (
      <>
        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
        <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
      </>
    ) : (
      <>
        <rect width="8" height="4" x="8" y="2" rx="1" ry="1"/>
        <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
      </>
    );
  return (
    <div className={cn("rounded-lg py-2 px-1.5 flex flex-col items-center gap-0.5 transition-colors", t.badgeBg)}>
      <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={cn(t.badgeText, "opacity-80")}>
        {path}
      </svg>
      <span className={cn("text-[13px] font-bold leading-none mt-0.5", t.badgeText)}>{value}</span>
      <span className={cn("text-[10px] leading-none", t.badgeText, "opacity-70")}>{label}</span>
    </div>
  );
}

/* ─────────────────────────── List Row ─────────────────────────── */

function ClassListRow({ cls }: { cls: ClassItem }) {
  const color = cls.color ?? autoClassColor(cls.id);
  const t = classTokens(color);
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl border border-border hover:bg-muted/30 transition-colors cursor-pointer min-w-0">
      <div className={cn("h-11 w-11 rounded-xl flex items-center justify-center shrink-0 bg-gradient-to-br", t.gradient)}>
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={t.iconText}>
          <path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z"/>
          <path d="M22 10v6"/>
          <path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5"/>
        </svg>
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-foreground truncate">{cls.name}</p>
        <p className="text-xs text-muted-foreground truncate">{cls.schedule} · {cls.subject}</p>
      </div>
      <div className="hidden sm:flex items-center gap-4 text-xs text-muted-foreground shrink-0">
        <span><span className="font-semibold text-foreground">{cls.lessons}</span> dars</span>
        <span><span className="font-semibold text-foreground">{cls.assignments}</span> vazifa</span>
      </div>
      <div className="flex -space-x-1.5 shrink-0">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className={cn("h-7 w-7 rounded-full ring-2 ring-card flex items-center justify-center text-[10px] font-bold", t.badgeBg, t.badgeText)}
          >
            {String.fromCharCode(65 + ((cls.id + i) % 26))}
          </span>
        ))}
        <span className={cn("h-7 px-1.5 rounded-full ring-2 ring-card flex items-center justify-center text-[10px] font-bold", t.badgeBg, t.badgeText)}>
          +{Math.max(cls.students - 3, 0)}
        </span>
      </div>
    </div>
  );
}

/* ─────────────────────────── Add Card ─────────────────────────── */

function AddClassCard() {
  return (
    <button className="rounded-2xl border-2 border-dashed border-border hover:border-foreground/40 hover:bg-muted/30 transition-colors flex flex-col items-center justify-center gap-2 min-h-[260px]">
      <div className="h-11 w-11 rounded-full bg-muted flex items-center justify-center">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
      </div>
      <span className="text-sm text-muted-foreground font-medium">Yangi sinf qo'shish</span>
    </button>
  );
}

/* ─────────────────────────── Overview Row ─────────────────────────── */

function OverviewRow({
  color,
  label,
  value,
  icon,
}: {
  color: ClassColor;
  label: string;
  value: number;
  icon: "cap" | "users" | "book" | "clipboard";
}) {
  const t = classTokens(color);
  const path =
    icon === "cap" ? (
      <>
        <path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z"/>
        <path d="M22 10v6"/>
        <path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5"/>
      </>
    ) : icon === "users" ? (
      <>
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </>
    ) : icon === "book" ? (
      <>
        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
        <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
      </>
    ) : (
      <>
        <rect width="8" height="4" x="8" y="2" rx="1" ry="1"/>
        <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
      </>
    );
  return (
    <div className="flex items-center gap-3 px-2 py-2.5 rounded-xl hover:bg-muted/40 transition-colors">
      <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center shrink-0", t.badgeBg)}>
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={t.badgeText}>
          {path}
        </svg>
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-2xl font-bold text-foreground leading-none">{value}</p>
        <p className="text-xs text-muted-foreground mt-1">{label}</p>
      </div>
    </div>
  );
}

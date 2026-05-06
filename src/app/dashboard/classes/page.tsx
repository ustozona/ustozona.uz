"use client";

import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Clock2Icon, PaletteIcon, XIcon, PlusIcon, ChevronDownIcon } from "lucide-react";
import { IconPlus } from "@tabler/icons-react";
import { autoClassColor, CLASS_COLOR_HEX, type ClassColor } from "@/lib/class-colors";
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
  { id: 8, name: "Toʻgarak (1-guruh)", subject: "Scratch & Algoritmika", students: 15, lessons: 6, assignments: 1, schedule: "Sh · 9:00 — 11:00", color: "orange" },
];

type SortKey = "name" | "students" | "lessons";
type ViewMode = "grid" | "list";

export default function ClassesPage() {
  const [view, setView] = useState<ViewMode>("grid");
  const [search, setSearch] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortMenuOpen, setSortMenuOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

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
    <div className="flex flex-col h-full px-4 py-2 md:p-8 lg:px-12">
      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
        {/* Main: classes grid */}
        <div className="@container bg-card rounded-xl border border-border card-elevation overflow-hidden flex flex-col h-full min-h-0">
          <div className="px-5 pt-5 pb-3 shrink-0 flex items-center justify-between min-h-[4.5rem]">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-muted">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-foreground">
                  <path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z" />
                  <path d="M22 10v6" /><path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5" />
                </svg>
              </div>
              <h2 className="heading-section">Mening sinflarim</h2>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5">
                {/* Search */}
                <div className="flex items-center">
                  {searchOpen ? (
                    <div className="flex items-center gap-1 bg-muted/50 rounded-xl pl-3 pr-1.5 h-11">
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground shrink-0">
                        <circle cx="11" cy="11" r="8" /><path d="m21 21-4.34-4.34" />
                      </svg>
                      <input autoFocus value={search} onChange={(e) => setSearch(e.target.value)} onBlur={() => !search && setSearchOpen(false)} placeholder="Sinf yoki fan..." className="bg-transparent outline-none text-sm w-40 h-full" />
                      {search && (
                        <button onClick={() => { setSearch(""); setSearchOpen(false); }} className="h-7 w-7 flex items-center justify-center rounded-lg hover:bg-muted text-muted-foreground">
                          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                        </button>
                      )}
                    </div>
                  ) : (
                    <button onClick={() => setSearchOpen(true)} className="inline-flex items-center justify-center h-11 w-11 rounded-xl border border-border bg-card card-elevation hover:bg-accent hover:text-accent-foreground transition-all">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.34-4.34" /></svg>
                    </button>
                  )}
                </div>

                {/* Sort */}
                <div className="relative">
                  <button onClick={() => setSortMenuOpen((v) => !v)} className="inline-flex items-center justify-center h-11 px-5 rounded-xl border border-border bg-card card-elevation hover:bg-accent hover:text-accent-foreground transition-all text-sm font-semibold gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12 7-7 7 7" /><path d="M12 19V5" /></svg>
                    <span>Saralash: {sortKey === "name" ? "Nom" : sortKey === "students" ? "O'quvchi" : "Dars"}</span>
                  </button>
                  {sortMenuOpen && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setSortMenuOpen(false)} />
                      <div className="absolute right-0 top-full mt-1 z-20 w-44 bg-card border border-border rounded-xl shadow-md py-1">
                        {([
                          { key: "name", label: "Nom boʻyicha" },
                          { key: "students", label: "Oʻquvchilar soni" },
                          { key: "lessons", label: "Darslar soni" },
                        ] as const).map((opt) => (
                          <button key={opt.key} onClick={() => { setSortKey(opt.key); setSortMenuOpen(false); }}
                            className={cn("w-full text-left px-3 py-1.5 text-sm hover:bg-muted transition-colors flex items-center gap-2", sortKey === opt.key ? "font-semibold text-foreground" : "text-foreground/80")}>
                            {sortKey === opt.key && <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>}
                            {sortKey !== opt.key && <span className="w-3" />}
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>

                {/* New Class */}
                <Button onClick={() => setIsCreateModalOpen(true)} size="default" className="h-11 px-6 rounded-xl font-semibold shadow-lg shadow-primary/20 gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="M12 5v14" /></svg>
                  Yangi sinf
                </Button>
              </div>

              {/* View toggle */}
              <div className="flex items-center gap-1 p-1 h-11 rounded-xl bg-card card-elevation">
                <button onClick={() => setView("grid")}
                  className={cn("h-9 w-9 flex items-center justify-center rounded-lg transition-colors cursor-pointer", view === "grid" ? "text-white hover:text-white/80" : "bg-transparent hover:bg-muted")}
                  style={view === "grid" ? { backgroundColor: "#2e3138" } : undefined}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect width="7" height="7" x="3" y="3" rx="1" /><rect width="7" height="7" x="14" y="3" rx="1" /><rect width="7" height="7" x="14" y="14" rx="1" /><rect width="7" height="7" x="3" y="14" rx="1" />
                  </svg>
                </button>
                <button onClick={() => setView("list")}
                  className={cn("h-9 w-9 flex items-center justify-center rounded-lg transition-colors cursor-pointer", view === "list" ? "text-white hover:text-white/80" : "bg-transparent hover:bg-muted")}
                  style={view === "list" ? { backgroundColor: "#2e3138" } : undefined}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 5h.01" /><path d="M3 12h.01" /><path d="M3 19h.01" /><path d="M8 5h13" /><path d="M8 12h13" /><path d="M8 19h13" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto scrollbar-thin">
            <div className="px-5 pt-1 pb-5">
              {filteredAndSorted.length === 0 ? (
                <div className="py-16 text-center">
                  <p className="text-sm text-muted-foreground">Sinflar topilmadi</p>
                </div>
              ) : view === "grid" ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredAndSorted.map((cls) => (
                    <ClassGridCard key={cls.id} cls={cls} />
                  ))}
                  <AddClassCard onClick={() => setIsCreateModalOpen(true)} />
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {filteredAndSorted.map((cls) => (
                    <ClassListRow key={cls.id} cls={cls} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right: Overview */}
        <div className="hidden lg:block">
          <div className="bg-card rounded-xl border border-border card-elevation flex flex-col h-full overflow-hidden">
            <div className="px-5 pt-6 pb-3 flex items-center gap-2.5 shrink-0 min-h-[4.5rem]">
              <div className="p-2 rounded-lg bg-muted">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-foreground size-5">
                  <path d="M3 3v16a2 2 0 0 0 2 2h16" /><path d="M18 17V9" /><path d="M13 17V5" /><path d="M8 17v-3" />
                </svg>
              </div>
              <h2 className="heading-section">Statistika</h2>
            </div>
            <div className="px-5 pb-5 space-y-3">
              <OverviewRow color="blue" label="Jami sinflar" value={totals.classes} icon="cap" />
              <OverviewRow color="teal" label="Jami o'quvchilar" value={totals.students} icon="users" />
              <OverviewRow color="purple" label="Jami darslar" value={totals.lessons} icon="book" />
              <OverviewRow color="orange" label="Jami vazifalar" value={totals.assignments} icon="clipboard" />
            </div>
          </div>
        </div>
      </div>
      {isCreateModalOpen && <CreateClassModal onClose={() => setIsCreateModalOpen(false)} />}
    </div>
  );
}

/* ─────────────────────────── Grid Card ─────────────────────────── */

function ClassGridCard({ cls }: { cls: ClassItem }) {
  const color = cls.color ?? autoClassColor(cls.id);
  const hex = CLASS_COLOR_HEX[color];
  const progress = Math.round(((cls.lessons - cls.assignments) / Math.max(cls.lessons, 1)) * 100);
  const r = 23.5;
  const c = 2 * Math.PI * r;
  const filled = (progress / 100) * c;
  const remaining = c - filled;

  return (
    <div className="group bg-card rounded-2xl border border-border overflow-hidden shadow-[0_4px_20px_-2px_rgba(0,0,0,0.05)] transition-all duration-200 ease-out hover:scale-[1.02] active:scale-[0.98] hover:border-border/80 hover:shadow-[0_8px_24px_-4px_rgba(0,0,0,0.06)] h-full flex flex-col cursor-pointer">
      <div className="px-4 pt-4">
        <div className="h-36 relative flex items-center justify-center overflow-hidden rounded-xl" style={{ backgroundColor: `rgba(${hexToRgb(hex)}, 0.125)` }}>
          <div className="absolute top-0 right-0 w-24 h-24 rounded-full opacity-20 -mr-6 -mt-6" style={{ backgroundColor: hex }} />
          <div className="absolute bottom-0 left-0 w-16 h-16 rounded-full opacity-10 -ml-4 -mb-4" style={{ backgroundColor: hex }} />
          <div className="p-4 rounded-2xl relative z-10" style={{ backgroundColor: `rgba(${hexToRgb(hex)}, 0.19)` }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: hex }}>
              <path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z" />
              <path d="M22 10v6" /><path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5" />
            </svg>
          </div>
          <div className="absolute top-2 right-2 z-20 hidden md:flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <button type="button" onClick={(e) => e.stopPropagation()} className="p-2 rounded-lg bg-card/80 backdrop-blur-sm text-muted-foreground hover:text-primary hover:bg-card transition-colors cursor-pointer">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z" /><path d="m15 5 4 4" /></svg>
            </button>
            <button type="button" onClick={(e) => e.stopPropagation()} className="p-2 rounded-lg bg-card/80 backdrop-blur-sm text-muted-foreground hover:text-destructive hover:bg-card transition-colors cursor-pointer">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 11v6" /><path d="M14 11v6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" /><path d="M3 6h18" /><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
            </button>
          </div>
        </div>
      </div>
      <div className="px-4 pb-4 pt-4 flex-1 flex flex-col">
        <div className="flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="text-xl font-black leading-tight tracking-tight text-foreground group-hover:text-primary transition-colors line-clamp-1">{cls.name}</h3>
            <p className="text-caption text-muted-foreground line-clamp-1 mt-1">{cls.schedule}</p>
          </div>
          <div className="shrink-0 opacity-20 group-hover:opacity-100 transition-opacity duration-200">
            <div className="relative inline-flex items-center justify-center">
              <svg width="52" height="52" className="transform -rotate-90">
                <circle cx="26" cy="26" r={r} fill="none" stroke="currentColor" strokeWidth="5" className="text-muted/20" />
                <circle cx="26" cy="26" r={r} fill="none" stroke={hex} strokeWidth="5" strokeDasharray={`${filled} ${remaining}`} strokeDashoffset="0" strokeLinecap="round" className="transition-all duration-300" />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-[10px] font-bold">{progress}%</span>
              </div>
            </div>
          </div>
        </div>
        <div className="flex gap-2 mt-auto pt-3">
          <StatBox hex={hex} icon="users" value={cls.students} label="O'quvchi" />
          <StatBox hex={hex} icon="book" value={cls.lessons} label="Dars" />
          <StatBox hex={hex} icon="clipboard" value={cls.assignments} label="Vazifa" />
        </div>
      </div>
    </div>
  );
}

/** Hex rang ni RGB ga aylantirish (inline style uchun) */
function hexToRgb(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `${r}, ${g}, ${b}`;
}

function StatBox({ hex, icon, value, label }: { hex: string; icon: "users" | "book" | "clipboard"; value: number; label: string }) {
  const path = icon === "users" ? (
    <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><path d="M16 3.128a4 4 0 0 1 0 7.744" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><circle cx="9" cy="7" r="4" /></>
  ) : icon === "book" ? (
    <><path d="M12 7v14" /><path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z" /></>
  ) : (
    <><rect width="8" height="4" x="8" y="2" rx="1" ry="1" /><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" /><path d="M12 11h4" /><path d="M12 16h4" /><path d="M8 11h.01" /><path d="M8 16h.01" /></>
  );
  return (
    <div className="flex-1 flex flex-col items-center gap-1 p-2.5 rounded-lg" style={{ backgroundColor: `rgba(${hexToRgb(hex)}, 0.082)` }}>
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: hex }}>{path}</svg>
      <span><span className="text-sm font-semibold text-foreground">{value}</span> <span className="text-[10px] font-normal text-muted-foreground">{label}</span></span>
    </div>
  );
}

/* ─────────────────────────── List Row ─────────────────────────── */

function ClassListRow({ cls }: { cls: ClassItem }) {
  const color = cls.color ?? autoClassColor(cls.id);
  const hex = CLASS_COLOR_HEX[color];
  return (
    <div className="group flex items-center gap-3 p-3 rounded-xl border border-border hover:bg-muted/30 transition-all cursor-pointer min-w-0 hover:scale-[1.005] active:scale-[0.995]">
      <div className="h-11 w-11 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: `rgba(${hexToRgb(hex)}, 0.13)` }}>
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: hex }}>
          <path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z" />
          <path d="M22 10v6" /><path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5" />
        </svg>
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors">{cls.name}</p>
        <p className="text-xs text-muted-foreground truncate">{cls.schedule} · {cls.subject}</p>
      </div>
      <div className="hidden sm:flex items-center gap-4 text-xs text-muted-foreground shrink-0">
        <span><span className="font-semibold text-foreground">{cls.lessons}</span> dars</span>
        <span><span className="font-semibold text-foreground">{cls.assignments}</span> vazifa</span>
      </div>
      <div className="flex -space-x-1.5 shrink-0">
        {[0, 1, 2].map((i) => (
          <span key={i} className="h-7 w-7 rounded-full ring-2 ring-card flex items-center justify-center text-[10px] font-bold"
            style={{ backgroundColor: `rgba(${hexToRgb(hex)}, 0.15)`, color: hex }}>
            {String.fromCharCode(65 + ((cls.id + i) % 26))}
          </span>
        ))}
        <span className="h-7 px-1.5 rounded-full ring-2 ring-card flex items-center justify-center text-[10px] font-bold"
          style={{ backgroundColor: `rgba(${hexToRgb(hex)}, 0.15)`, color: hex }}>
          +{Math.max(cls.students - 3, 0)}
        </span>
      </div>
    </div>
  );
}

/* ─────────────────────────── Add Card ─────────────────────────── */

function AddClassCard({ onClick }: { onClick?: () => void }) {
  return (
    <button onClick={onClick} className="rounded-2xl border-2 border-dashed border-border hover:border-foreground/40 hover:bg-muted/30 transition-colors flex flex-col items-center justify-center gap-2 min-h-[260px]">
      <div className="h-11 w-11 rounded-full bg-muted flex items-center justify-center">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground"><path d="M5 12h14" /><path d="M12 5v14" /></svg>
      </div>
      <span className="text-sm text-muted-foreground font-medium">Yangi sinf qoʻshish</span>
    </button>
  );
}

const OVERVIEW_COLORS: Record<string, string> = {
  blue: "#60a5fa", teal: "#2dd4bf", purple: "#c084fc", orange: "#fb923c",
};

function OverviewRow({ color, label, value, icon }: { color: string; label: string; value: number; icon: "cap" | "users" | "book" | "clipboard" }) {
  const hex = OVERVIEW_COLORS[color] ?? "#94A3B8";
  const path =
    icon === "cap" ? (<><path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z" /><path d="M22 10v6" /><path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5" /></>)
      : icon === "users" ? (<><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></>)
        : icon === "book" ? (<><path d="M12 7v14" /><path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z" /></>)
          : (<><rect width="8" height="4" x="8" y="2" rx="1" ry="1" /><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" /><path d="M12 11h4" /><path d="M12 16h4" /><path d="M8 11h.01" /><path d="M8 16h.01" /></>);
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
      <div className="p-2 rounded-lg" style={{ backgroundColor: `rgba(${hexToRgb(hex)}, 0.125)` }}>
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-5" style={{ color: hex }}>{path}</svg>
      </div>
      <div>
        <div className="text-2xl font-bold">{value} ta</div>
        <div className="text-sm text-muted-foreground">{label}</div>
      </div>
    </div>
  );
}

/* ─────────────────────────── Modal ─────────────────────────── */

function CreateClassModal({ onClose }: { onClose: () => void }) {
  const [className, setClassName] = useState("");
  const [description, setDescription] = useState("");
  const presetHexes = Object.entries(CLASS_COLOR_HEX)
    .filter(([name]) => name !== "gray")
    .map(([, hex]) => hex);
  const [selectedColorHex, setSelectedColorHex] = useState<string>(presetHexes[0]);
  const [isColorPickerOpen, setIsColorPickerOpen] = useState(false);

  type TimeSlot = { id: string; day: string; start: string; end: string };
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);

  const addTimeSlot = () => setTimeSlots([...timeSlots, { id: Math.random().toString(), day: "Dushanba", start: "09:00", end: "10:00" }]);
  const removeTimeSlot = (id: string) => setTimeSlots(timeSlots.filter(s => s.id !== id));
  const updateTimeSlotDay = (id: string, day: string) => setTimeSlots(timeSlots.map(s => s.id === id ? { ...s, day } : s));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-background w-full max-w-[540px] rounded-lg border shadow-lg flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex flex-col gap-2 p-6 pb-0 text-center sm:text-left relative">
          <h2 className="text-lg leading-none font-semibold text-foreground">Yangi sinf yaratish</h2>
          <button onClick={onClose} className="absolute top-4 right-4 cursor-pointer opacity-70 transition-opacity hover:opacity-100 outline-none">
            <XIcon className="size-4" />
            <span className="sr-only">Close</span>
          </button>
        </div>

        <div className="p-6 space-y-4 overflow-y-auto flex-1 scrollbar-thin">
          <Field>
            <FieldLabel htmlFor="name">Sinf nomi <span className="text-destructive">*</span></FieldLabel>
            <div className="flex gap-2 relative">
              <Input id="name" value={className} onChange={(e) => setClassName(e.target.value)} placeholder="Masalan, Algebra 101" className="flex-1 h-9" required />
              <button onClick={() => setIsColorPickerOpen(!isColorPickerOpen)}
                className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-all duration-150 cursor-pointer active:scale-[0.98] size-9 shrink-0 relative border border-border shadow-sm hover:opacity-90"
                style={{ 
                  background: `conic-gradient(${presetHexes.join(", ")}, ${presetHexes[0]})` 
                }}>
                <PaletteIcon className="h-5 w-5 text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]" />
              </button>

              {isColorPickerOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setIsColorPickerOpen(false)} />
                  <div className="absolute right-0 top-full mt-2 z-20 w-[260px] p-3 bg-card border border-border rounded-xl shadow-xl flex flex-wrap gap-2 justify-center">
                    {presetHexes.map(hex => (
                      <button key={hex} onClick={() => { setSelectedColorHex(hex); setIsColorPickerOpen(false); }}
                        className="w-7 h-7 rounded-full transition-transform hover:scale-110 ring-2 ring-transparent hover:ring-border ring-offset-2 ring-offset-card shadow-sm"
                        style={{ backgroundColor: hex }} />
                    ))}
                  </div>
                </>
              )}
            </div>
          </Field>

          <Field>
            <FieldLabel htmlFor="description">Tavsif</FieldLabel>
            <Input id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Masalan, 10-sinflar uchun chuqurlashtirilgan matematika" className="h-9" />
          </Field>

          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">Oʻquv yili:</span>
            <span className="font-medium bg-muted px-2 py-0.5 rounded-full text-foreground">2025-2026-oʻquv yili</span>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm leading-none font-medium select-none">Haftalik jadval</label>
              <Button variant="ghost" size="sm" onClick={addTimeSlot} className="h-8 rounded-md gap-1.5 px-3">
                <PlusIcon className="h-4 w-4 mr-1" /> Vaqt oralig‘ini qo‘shish
              </Button>
            </div>

            <div className="pr-1">
              <div className="space-y-3">
                {timeSlots.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4 text-center border border-dashed rounded-lg">
                    Muntazam jadval yoʻq. Vaqt qoʻshish.
                  </p>
                ) : (
                  timeSlots.map((slot) => (
                    <div key={slot.id} className="flex items-center gap-3 p-4 border rounded-lg bg-muted/30">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="flex items-center justify-between rounded-md border border-border px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 w-[130px] h-9 shrink-0 bg-card shadow-none">
                            <span className="truncate">{slot.day}</span>
                            <ChevronDownIcon className="h-4 w-4 opacity-50" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-[130px]">
                          <DropdownMenuRadioGroup value={slot.day} onValueChange={(val) => updateTimeSlotDay(slot.id, val)}>
                            <DropdownMenuRadioItem value="Dushanba">Dushanba</DropdownMenuRadioItem>
                            <DropdownMenuRadioItem value="Seshanba">Seshanba</DropdownMenuRadioItem>
                            <DropdownMenuRadioItem value="Chorshanba">Chorshanba</DropdownMenuRadioItem>
                            <DropdownMenuRadioItem value="Payshanba">Payshanba</DropdownMenuRadioItem>
                            <DropdownMenuRadioItem value="Juma">Juma</DropdownMenuRadioItem>
                            <DropdownMenuRadioItem value="Shanba">Shanba</DropdownMenuRadioItem>
                            <DropdownMenuRadioItem value="Yakshanba">Yakshanba</DropdownMenuRadioItem>
                          </DropdownMenuRadioGroup>
                        </DropdownMenuContent>
                      </DropdownMenu>

                      <div className="flex items-center gap-2">
                        <div className="relative">
                          <input
                            type="time"
                            lang="en-GB"
                            step="60"
                            value={slot.start}
                            onChange={(e) => setTimeSlots(timeSlots.map(s => s.id === slot.id ? { ...s, start: e.target.value } : s))}
                            className="flex h-9 w-[78px] rounded-md border border-input bg-card pl-2 pr-6 py-1 text-sm shadow-none transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 shrink-0 [&::-webkit-datetime-edit-ampm-field]:hidden [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-datetime-edit-fields-wrapper]:p-0"
                          />
                          <Clock2Icon className="absolute right-1.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
                        </div>
                        
                        <span className="text-muted-foreground text-xs shrink-0 font-medium">dan</span>
                        
                        <div className="relative">
                          <input
                            type="time"
                            lang="en-GB"
                            step="60"
                            value={slot.end}
                            onChange={(e) => setTimeSlots(timeSlots.map(s => s.id === slot.id ? { ...s, end: e.target.value } : s))}
                            className="flex h-9 w-[78px] rounded-md border border-input bg-card pl-2 pr-6 py-1 text-sm shadow-none transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 shrink-0 [&::-webkit-datetime-edit-ampm-field]:hidden [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-datetime-edit-fields-wrapper]:p-0"
                          />
                          <Clock2Icon className="absolute right-1.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
                        </div>

                        <span className="text-muted-foreground text-xs shrink-0 font-medium">gacha</span>
                      </div>

                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeTimeSlot(slot.id)}
                        className="ml-auto text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                      >
                        <XIcon className="h-4 w-4" />
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end p-6 pt-2 border-t mt-auto">
          <Button variant="outline" onClick={onClose} className="h-9 px-4 py-2">Bekor qilish</Button>
          <Button variant="default" className="h-9 px-4 py-2" onClick={onClose}>Sinf yaratish</Button>
        </div>
      </div>
    </div>
  );
}

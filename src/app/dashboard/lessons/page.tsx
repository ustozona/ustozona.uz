"use client";

import { useState, useMemo } from "react";
import { CLASS_COLOR_TOKENS, CLASS_COLOR_HEX } from "@/lib/class-colors";
import { CLASSES, classColor } from "@/lib/grades-data";
import ClassListPanel from "@/components/ClassListPanel";
import { cn } from "@/lib/utils";

type Unit = {
  id: string;
  classId: string;
  number: number;
  title: string;
  description: string;
};

type Lesson = {
  id: string;
  classId: string;
  unitId: string | null;
  number: number;
  title: string;
  status: "Completed" | "Scheduled" | "Unscheduled" | "Draft";
  date?: string;
  time?: string;
  classCount?: number;
};

const UNITS: Unit[] = [
  { id: "u1", classId: "6-a", number: 1, title: "Texnika xavfsizligi va elektron xavfsizlik", description: "Ushbu bo'lim xavfsiz ishlash qoidalari, axborot xavfsizligi asoslari va raq..." },
  { id: "u2", classId: "6-a", number: 2, title: "Texnik ta'minot (Hardware) arxitekturasi", description: "Kompyuterning axboroti qayta ishlashiga mas'ul bo'lgan markaziy qism..." },
  { id: "u3", classId: "6-a", number: 3, title: "Matn muharririda axborotni qayta ishlash", description: "MS Word dasturida yangi hujjat yaratish, hujjatni xotiraga saqlash va t..." },
  { id: "u4", classId: "6-a", number: 4, title: "Global tarmoq va elektron kommunikatsiya", description: "Kompyuter tarmoqlari orqali ma'lumot almashish, internetda to'g'ri qidir..." },
  { id: "u5", classId: "7-b", number: 1, title: "Texnika xavfsizligi va elektron xavfsizlik", description: "Ushbu bo'lim xavfsiz ishlash qoidalari, axborot xavfsizligi asoslari va raq..." },
  { id: "u6", classId: "7-b", number: 2, title: "Texnik ta'minot (Hardware) arxitekturasi", description: "Kompyuterning axboroti qayta ishlashiga mas'ul bo'lgan markaziy qism..." },
  { id: "u7", classId: "7-b", number: 3, title: "Matn muharririda axborotni qayta ishlash", description: "MS Word dasturida yangi hujjat yaratish, hujjatni xotiraga saqlash va t..." },
  { id: "u8", classId: "7-b", number: 4, title: "Global tarmoq va elektron kommunikatsiya", description: "Kompyuter tarmoqlari orqali ma'lumot almashish, internetda to'g'ri qidir..." },
];

const LESSONS: Lesson[] = [
  { id: "l1", classId: "6-a", unitId: "u1", number: 1, title: "Texnika xavfsizligi qoidalari", status: "Completed", date: "Sep 5", time: "10:35 AM", classCount: 1 },
  { id: "l2", classId: "6-a", unitId: "u2", number: 1, title: "Protsessor va xotira qurilmalari", status: "Completed", date: "Sep 12", time: "10:35 AM", classCount: 1 },
  { id: "l3", classId: "6-a", unitId: "u3", number: 1, title: "MS Word dasturida hujjat va matn a...", status: "Completed", date: "Apr 18", time: "1:00 PM", classCount: 2 },
  { id: "l4", classId: "6-a", unitId: "u3", number: 2, title: "MS Word dasturida hujjat va matn amallari 2", status: "Unscheduled", classCount: 1 },
  { id: "l5", classId: "6-a", unitId: "u4", number: 1, title: "Internet va elektron pochta", status: "Draft" },
  { id: "l6", classId: "7-b", unitId: "u5", number: 1, title: "Texnika xavfsizligi qoidalari", status: "Completed", date: "Sep 5", time: "9:00 AM", classCount: 1 },
  { id: "l7", classId: "7-b", unitId: "u6", number: 1, title: "Protsessor va xotira qurilmalari", status: "Completed", date: "Sep 12", time: "9:00 AM", classCount: 1 },
  { id: "l8", classId: "7-b", unitId: "u7", number: 1, title: "MS Word dasturida hujjat va matn a...", status: "Completed", date: "Apr 18", time: "1:00 PM", classCount: 2 },
  { id: "l9", classId: "7-b", unitId: "u7", number: 2, title: "MS Word dasturida hujjat va matn amallari 2", status: "Unscheduled", classCount: 1 },
];

const STATUS_STYLES: Record<Lesson["status"], string> = {
  Completed: "bg-green-100 text-green-700",
  Scheduled: "bg-blue-100 text-blue-700",
  Unscheduled: "bg-orange-100 text-orange-700",
  Draft: "bg-muted text-muted-foreground",
};

// Icons
function IconLayers({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0l8.57-3.908a1 1 0 0 0 0-1.832z"/>
      <path d="M2 12l8.57 3.908a2 2 0 0 0 1.66 0L20.57 12"/>
      <path d="M2 17l8.57 3.908a2 2 0 0 0 1.66 0L20.57 17"/>
    </svg>
  );
}

function IconFile({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/>
      <path d="M14 2v4a2 2 0 0 0 2 2h4"/>
    </svg>
  );
}

function IconPlus({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M5 12h14"/><path d="M12 5v14"/>
    </svg>
  );
}

function IconSearch({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <circle cx="11" cy="11" r="8"/><path d="m21 21-4.34-4.34"/>
    </svg>
  );
}

function IconSortAsc({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="m3 8 4-4 4 4"/><path d="M7 4v16"/><path d="M11 12h4"/><path d="M11 16h7"/><path d="M11 20h10"/>
    </svg>
  );
}

function IconEdit({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
    </svg>
  );
}

function IconList({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <line x1="8" x2="21" y1="6" y2="6"/><line x1="8" x2="21" y1="12" y2="12"/><line x1="8" x2="21" y1="18" y2="18"/>
      <line x1="3" x2="3.01" y1="6" y2="6"/><line x1="3" x2="3.01" y1="12" y2="12"/><line x1="3" x2="3.01" y1="18" y2="18"/>
    </svg>
  );
}

function IconCalendar({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <rect width="18" height="18" x="3" y="4" rx="2"/><path d="M16 2v4"/><path d="M8 2v4"/><path d="M3 10h18"/>
    </svg>
  );
}

function IconGraduationCap({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z"/>
      <path d="M22 10v6"/>
      <path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5"/>
    </svg>
  );
}

function IconArrowUpRight({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M7 7h10v10"/><path d="M7 17 17 7"/>
    </svg>
  );
}

export default function LessonsPage() {
  const [selectedClassId, setSelectedClassId] = useState<string>("7-d");
  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null);

  const unitsForClass = useMemo(
    () => UNITS.filter((u) => u.classId === selectedClassId),
    [selectedClassId]
  );

  const lessonsForUnit = useMemo(() => {
    if (!selectedUnitId) return [];
    if (selectedUnitId === "__none__") {
      return LESSONS.filter((l) => l.classId === selectedClassId && l.unitId === null);
    }
    return LESSONS.filter((l) => l.unitId === selectedUnitId);
  }, [selectedUnitId, selectedClassId]);

  const classStats = useMemo(() => {
    const units = UNITS.filter((u) => u.classId === selectedClassId);
    const lessons = LESSONS.filter((l) => l.classId === selectedClassId);
    const completed = lessons.filter((l) => l.status === "Completed").length;
    return {
      units: units.length,
      lessons: lessons.length,
      completed,
      pct: lessons.length ? Math.round((completed / lessons.length) * 100) : 0,
    };
  }, [selectedClassId]);

  const unitProgress = (unitId: string) => {
    const all = LESSONS.filter((l) => l.unitId === unitId);
    const done = all.filter((l) => l.status === "Completed").length;
    return { total: all.length, pct: all.length ? Math.round((done / all.length) * 100) : 0 };
  };

  const unitStats = useMemo(() => {
    if (!selectedUnitId || selectedUnitId === "__none__") return null;
    const lessons = LESSONS.filter((l) => l.unitId === selectedUnitId);
    const completed = lessons.filter((l) => l.status === "Completed").length;
    return { lessons: lessons.length, completed, pct: lessons.length ? Math.round((completed / lessons.length) * 100) : 0 };
  }, [selectedUnitId]);

  const selectedClass = CLASSES.find((c) => c.id === selectedClassId) ?? null;
  const selectedUnit = selectedUnitId && selectedUnitId !== "__none__"
    ? UNITS.find((u) => u.id === selectedUnitId) ?? null
    : null;

  const selectedClassColor = selectedClass ? classColor(selectedClass) : "emerald";
  const selectedClassTokens = CLASS_COLOR_TOKENS[selectedClassColor];
  const selectedClassHex = CLASS_COLOR_HEX[selectedClassColor];

  return (
    <div className="flex h-full min-h-0 gap-4 p-4">
      {/* ── Column 1: All Classes ── */}
      <div className="w-[280px] shrink-0 h-full">
        <ClassListPanel
          selectedClassId={selectedClassId}
          onSelect={(id) => { setSelectedClassId(id); setSelectedUnitId(null); }}
        />
      </div>

      {/* ── Column 2: Units ── */}
      <div className="w-[380px] shrink-0 flex flex-col rounded-2xl border border-border bg-card overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 shrink-0">
          <div className="flex items-center gap-2">
            <IconLayers className="size-4 text-muted-foreground" />
            <span className="text-base font-bold">Units</span>
          </div>
          <div className="flex items-center gap-1">
            <button className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-muted text-muted-foreground transition-colors">
              <IconSearch />
            </button>
            <button className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-muted text-muted-foreground transition-colors">
              <IconSortAsc />
            </button>
            <button className="flex items-center gap-1.5 px-3 h-8 rounded-md bg-foreground text-background text-xs font-semibold hover:opacity-90 transition-opacity ml-1">
              <IconPlus className="size-3" />
              Create Unit
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-3 pb-3 flex flex-col gap-2 scrollbar-thin">
          {unitsForClass.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center py-16 px-6">
              <IconLayers className="size-10 text-muted-foreground/30 mb-3" />
              <p className="text-sm font-medium text-muted-foreground">No units yet</p>
              <p className="text-xs text-muted-foreground/60 mt-1">Add your first unit to this class.</p>
            </div>
          ) : (
            <>
              {unitsForClass.map((unit) => {
                const { total, pct } = unitProgress(unit.id);
                const isSelected = selectedUnitId === unit.id;
                return (
                  <button
                    key={unit.id}
                    onClick={() => setSelectedUnitId(isSelected ? null : unit.id)}
                    className={cn(
                      "w-full text-left rounded-xl p-3 border-2 transition-all bg-card",
                      isSelected ? "" : "border-transparent hover:bg-muted/30"
                    )}
                    style={isSelected ? { borderColor: selectedClassHex, background: `${selectedClassHex}10` } : undefined}
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center shrink-0", selectedClassTokens.iconBg)}>
                        <IconLayers className={cn("size-5", selectedClassTokens.iconText)} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[13px] font-semibold leading-snug truncate">
                          {String(unit.number).padStart(2, "0")}. {unit.title}
                        </p>
                        <p className="text-[11px] text-muted-foreground leading-snug mt-0.5 truncate">
                          {unit.description}
                        </p>
                      </div>
                      <div className="shrink-0 flex flex-col items-end gap-1.5">
                        <span className="text-[11px] font-semibold text-muted-foreground tabular-nums">{total}</span>
                      </div>
                    </div>
                    {isSelected && (
                      <div className="mt-3 flex items-center gap-3">
                        <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                          <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: selectedClassHex }} />
                        </div>
                        <span className="text-[11px] font-bold tabular-nums">{pct}%</span>
                      </div>
                    )}
                  </button>
                );
              })}

              {/* No unit row */}
              <button
                onClick={() => setSelectedUnitId(selectedUnitId === "__none__" ? null : "__none__")}
                className={cn(
                  "w-full text-left rounded-xl p-3 border-2 transition-all bg-card",
                  selectedUnitId === "__none__" ? "" : "border-transparent hover:bg-muted/30"
                )}
                style={selectedUnitId === "__none__" ? { borderColor: selectedClassHex, background: `${selectedClassHex}10` } : undefined}
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl flex items-center justify-center bg-muted shrink-0">
                    <IconLayers className="size-5 text-muted-foreground" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-semibold">No unit</p>
                    <p className="text-[11px] text-muted-foreground">Lessons not assigned to any unit</p>
                  </div>
                </div>
              </button>
            </>
          )}
        </div>

        {/* Bottom selected unit card */}
        {selectedUnit && unitStats && (
          <div className="border-t border-border p-3 shrink-0">
            <div className="rounded-xl p-3" style={{ background: `${selectedClassHex}15` }}>
              <div className="flex items-center gap-3 mb-3">
                <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center shrink-0", selectedClassTokens.iconBg)}>
                  <IconLayers className={cn("size-5", selectedClassTokens.iconText)} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className={cn("text-sm font-bold leading-tight", selectedClassTokens.badgeText)}>
                    {String(selectedUnit.number).padStart(2, "0")}. {selectedUnit.title.length > 22 ? selectedUnit.title.slice(0, 22) + "..." : selectedUnit.title}
                  </p>
                  <p className={cn("text-[11px] leading-tight opacity-70 mt-0.5 truncate", selectedClassTokens.badgeText)}>
                    {selectedUnit.description}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 mb-3">
                <div className={cn("rounded-lg px-3 py-2 text-center", selectedClassTokens.iconBg)}>
                  <p className={cn("text-lg font-bold leading-tight", selectedClassTokens.badgeText)}>{unitStats.lessons}</p>
                  <p className={cn("text-[10px] opacity-70", selectedClassTokens.badgeText)}>Lessons</p>
                </div>
                <div className={cn("rounded-lg px-3 py-2 text-center flex items-center justify-center gap-1", selectedClassTokens.iconBg)}>
                  <span className={cn("text-[10px] opacity-70", selectedClassTokens.badgeText)}>Classes</span>
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className={cn("text-[11px] font-medium opacity-70", selectedClassTokens.badgeText)}>Completed</span>
                  <span className={cn("text-[11px] font-bold tabular-nums", selectedClassTokens.badgeText)}>
                    {unitStats.completed}/{unitStats.lessons}
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-white/60 w-full overflow-hidden">
                  <div className="h-full rounded-full transition-all" style={{ width: `${unitStats.pct}%`, background: selectedClassHex }} />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Column 3: Lessons ── */}
      <div className="flex-1 min-w-0 flex flex-col rounded-2xl border border-border bg-card overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 shrink-0">
          <div className="flex items-center gap-2">
            <IconFile className="size-4 text-muted-foreground" />
            <span className="text-base font-bold">Lessons</span>
          </div>
          <div className="flex items-center gap-1">
            <button className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-muted text-muted-foreground transition-colors">
              <IconEdit />
            </button>
            <button className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-muted text-muted-foreground transition-colors">
              <IconSearch />
            </button>
            <button className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-muted text-muted-foreground transition-colors">
              <IconSortAsc />
            </button>
            {selectedUnitId && (
              <button className="flex items-center gap-1.5 px-3 h-8 rounded-md bg-foreground text-background text-xs font-semibold hover:opacity-90 transition-opacity ml-1">
                <IconPlus className="size-3" />
                New Lesson
              </button>
            )}
            <div className="w-px h-5 bg-border mx-1" />
            <button className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-muted text-muted-foreground transition-colors">
              <IconList />
            </button>
            <button className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-muted text-muted-foreground transition-colors">
              <IconCalendar />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-3 pb-3 flex flex-col gap-2 scrollbar-thin">
          {!selectedUnitId ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center py-24">
              <IconFile className="size-12 text-muted-foreground/20 mb-3" />
              <p className="text-sm font-medium text-muted-foreground">No Unit Selected</p>
              <p className="text-xs text-muted-foreground/60 mt-1">Select a unit to view its lessons.</p>
            </div>
          ) : lessonsForUnit.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center py-24">
              <IconFile className="size-12 text-muted-foreground/20 mb-3" />
              <p className="text-sm font-medium text-muted-foreground">No lessons yet</p>
              <p className="text-xs text-muted-foreground/60 mt-1">Add your first lesson to this unit.</p>
              <button className="mt-4 flex items-center gap-1.5 px-4 py-2 rounded-lg border border-border bg-card text-sm font-medium hover:bg-muted transition-colors">
                <IconPlus />
                New Lesson
              </button>
            </div>
          ) : (
            lessonsForUnit.map((lesson) => {
              const lessonUnit = UNITS.find(u => u.id === lesson.unitId);
              return (
                <div
                  key={lesson.id}
                  className="flex items-start gap-3 rounded-xl p-3 border border-border bg-card hover:bg-muted/30 transition-colors cursor-pointer group"
                >
                  <div className="h-10 w-10 rounded-xl bg-pink-100 flex items-center justify-center shrink-0">
                    <IconFile className="size-5 text-pink-500" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="text-[13px] font-semibold leading-snug truncate">
                          {String(lesson.number).padStart(2, "0")}. {lesson.title}
                        </p>
                        {lessonUnit && (
                          <p className="text-[11px] text-muted-foreground mt-0.5 truncate flex items-center gap-1">
                            <span className="size-1.5 rounded-full" style={{ background: selectedClassHex }} />
                            {String(lessonUnit.number).padStart(2, "0")}. {lessonUnit.title}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {lesson.date && (
                          <span className="text-[11px] text-muted-foreground tabular-nums">
                            {lesson.date}
                            {lesson.time && <span className="ml-1">· {lesson.time}</span>}
                            {lesson.classCount && lesson.classCount > 1 && (
                              <span className="ml-1 text-muted-foreground/70">+{lesson.classCount - 1}</span>
                            )}
                          </span>
                        )}
                        {lesson.classCount && (
                          <span className="text-[11px] text-muted-foreground flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-muted">
                            <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3" fill="currentColor"/></svg>
                            {lesson.classCount}
                          </span>
                        )}
                        <span className={cn("text-[11px] font-medium px-2 py-0.5 rounded-full inline-flex items-center gap-1", STATUS_STYLES[lesson.status])}>
                          <span className="size-1.5 rounded-full bg-current" />
                          {lesson.status}
                        </span>
                        <button className="h-6 w-6 flex items-center justify-center rounded-md hover:bg-muted text-muted-foreground transition-colors opacity-0 group-hover:opacity-100">
                          <IconArrowUpRight />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

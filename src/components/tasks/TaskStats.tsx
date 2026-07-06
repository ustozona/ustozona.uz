"use client";

import { useMemo, useEffect, useState } from "react";
import { BarChart3, AlertCircle, Timer, CheckCircle2, Flag, ChevronRight } from "lucide-react";
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { SectionIcon } from "@/components/ui/section-icon";
import { CardTitle } from "@/components/ui/card";
import { TypographyLabel } from "@/components/ui/typography";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { ClassSwatch } from "@/components/ClassSwatch";
import { cn } from "@/lib/utils";
import { useTaskStore } from "@/store/useTaskStore";
import { TASK_STATUS, STATUS_META, type TaskPriority } from "@/lib/tasks-data";
import { filterTasksByFilter } from "@/hooks/useFilteredTasks";
import { classColor } from "@/lib/grades-data";
import { useLiveClasses } from "@/hooks/useLiveClasses";
import { CLASS_COLOR_HEX } from "@/lib/class-colors";
import type { TaskFilter } from "./TasksSidebar";

// Hafta kunlari qisqa yorligʻi (getDay 0=Yakshanba)
const WEEKDAY_SHORT = ["Yak", "Du", "Se", "Cho", "Pay", "Ju", "Sha"];

const TREND_CONFIG = {
  count: { label: "Bajarildi", color: "var(--primary)" },
} satisfies ChartConfig;

const PRIORITY_META: { id: TaskPriority; label: string; bar: string }[] = [
  { id: "high",   label: "Yuqori", bar: "bg-destructive" },
  { id: "medium", label: "O‘rta",  bar: "bg-warning" },
  { id: "low",    label: "Past",   bar: "bg-info" },
  { id: "none",   label: "Belgilanmagan",   bar: "bg-muted-foreground/40" },
];

type Props = {
  activeFilter: TaskFilter;
  onSelectFilter: (f: TaskFilter) => void;
};

function StatTile({
  icon: Icon,
  label,
  value,
  sub,
  tone = "default",
  active,
  onClick,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  sub?: string;
  tone?: "default" | "destructive" | "success";
  active?: boolean;
  onClick?: () => void;
}) {
  const interactive = !!onClick;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!interactive}
      className={cn(
        "group/tile text-left rounded-xl border bg-muted/30 px-3.5 py-3 flex flex-col gap-1 transition-colors",
        interactive && "hover:bg-muted/60 cursor-pointer",
        active ? "border-primary/40 bg-primary/5" : "border-border/60",
        !interactive && "cursor-default"
      )}
    >
      <div className="flex items-center gap-1.5 text-muted-foreground">
        <Icon
          className={cn(
            "size-3.5 shrink-0",
            tone === "destructive" && "text-destructive",
            tone === "success" && "text-success"
          )}
        />
        <TypographyLabel className="truncate flex-1">{label}</TypographyLabel>
        {interactive && (
          <ChevronRight className="size-3.5 text-muted-foreground/40 opacity-0 group-hover/tile:opacity-100 transition-opacity shrink-0" />
        )}
      </div>
      <div
        className={cn(
          "text-2xl font-bold tabular-nums leading-none",
          tone === "destructive" && "text-destructive",
          tone === "success" && "text-success"
        )}
      >
        {value}
      </div>
      {sub && <div className="text-xs text-muted-foreground/80 truncate">{sub}</div>}
    </button>
  );
}

function scopeLabel(f: TaskFilter, classNameOf: (id: string) => string | undefined): string {
  if (f === "inbox") return "Kiruvchi";
  if (f === "today") return "Bugun";
  if (f === "upcoming") return "Rejalashtirilgan";
  if (f === "overdue") return "Kechikkanlar";
  if (f === "important") return "Muhim";
  if (f === "completed") return "Bajarilgan";
  if (f === "all") return "Barcha vazifalar";
  if (f.startsWith("class-")) {
    const cid = f.replace("class-", "");
    if (cid === "none") return "Umumiy";
    return classNameOf(cid) ?? "Sinf";
  }
  return "Barcha vazifalar";
}

export default function TaskStats({ activeFilter, onSelectFilter }: Props) {
  const tasks = useTaskStore((s) => s.tasks);
  const liveClasses = useLiveClasses();
  const todayStr = new Date().toISOString().split("T")[0];

  // Recharts ResponsiveContainer serverda oʻlchovsiz (-1) boʻlib hydration
  // nomuvofiqligini keltirib chiqaradi — chartni faqat mount'dan keyin chizamiz.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Joriy filtr boʻyicha scope — TasksList koʻrsatayotgan roʻyxat bilan bir xil.
  const scope = useMemo(() => filterTasksByFilter(tasks, activeFilter), [tasks, activeFilter]);

  const stats = useMemo(() => {
    const statusCounts: Record<string, number> = {
      [TASK_STATUS.TODO]: 0, [TASK_STATUS.IN_PROGRESS]: 0, [TASK_STATUS.DONE]: 0, [TASK_STATUS.CANCELED]: 0,
    };
    const priorityCounts: Record<TaskPriority, number> = { high: 0, medium: 0, low: 0, none: 0 };

    let done = 0;
    let active = 0; // bekor qilinmagan (bajarish maxraji)
    let focusMinutes = 0;
    let focusSessions = 0;

    scope.forEach((t) => {
      statusCounts[t.status]++;
      priorityCounts[t.priority]++;
      if (t.status === TASK_STATUS.DONE) done++;
      if (t.status !== TASK_STATUS.CANCELED) active++;
      (t.pomodoroSessions || []).forEach((p) => {
        if (p.type === "focus") { focusMinutes += p.durationMin; focusSessions++; }
      });
    });

    // Maxraj — bekor qilinganlarni hisobga olmaydi (ular ish emas).
    const percent = active === 0 ? 0 : Math.round((done / active) * 100);

    return { total: scope.length, done, active, percent, statusCounts, priorityCounts, focusMinutes, focusSessions };
  }, [scope]);

  // Global, doimo amalga oshiriladigan koʻrsatkichlar (scope'dan qat'i nazar) —
  // navigatsiya nuqtalari sifatida xizmat qiladi.
  const global = useMemo(() => {
    let overdue = 0, todayTotal = 0, todayDone = 0;
    tasks.forEach((t) => {
      const isDone = t.status === TASK_STATUS.DONE;
      const isCanceled = t.status === TASK_STATUS.CANCELED;
      if (t.dueDate && t.dueDate < todayStr && !isDone && !isCanceled) overdue++;
      if (t.dueDate === todayStr && !isCanceled) { todayTotal++; if (isDone) todayDone++; }
    });
    return { overdue, todayTotal, todayDone, todayRemaining: todayTotal - todayDone };
  }, [tasks, todayStr]);

  // ── Bu hafta bajarish trendi (global) — oxirgi 7 kun, completedAt boʻyicha ──
  const week = useMemo(() => {
    const days: { key: string; day: string; count: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      days.push({ key, day: WEEKDAY_SHORT[d.getDay()], count: 0 });
    }
    const idx = new Map(days.map((d, i) => [d.key, i]));
    tasks.forEach((t) => {
      if (t.status !== TASK_STATUS.DONE || !t.completedAt) return;
      const k = t.completedAt.slice(0, 10);
      const i = idx.get(k);
      if (i !== undefined) days[i].count++;
    });
    return { days, total: days.reduce((s, d) => s + d.count, 0) };
  }, [tasks]);

  // ── Sinf boʻyicha yuk (global) — ochiq (todo/jarayonda) vazifalar soni ──
  const classLoad = useMemo(() => {
    const counts: Record<string, number> = {};
    tasks.forEach((t) => {
      const open = t.status === TASK_STATUS.TODO || t.status === TASK_STATUS.IN_PROGRESS;
      if (!open || !t.classIds?.length) return;
      t.classIds.forEach((cid) => { counts[cid] = (counts[cid] || 0) + 1; });
    });
    const rows = liveClasses
      .filter((c) => counts[c.id] > 0)
      .map((c) => ({ id: c.id, name: c.name, count: counts[c.id], hex: CLASS_COLOR_HEX[classColor(c)] }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
    const max = rows.reduce((m, r) => Math.max(m, r.count), 0);
    return { rows, max };
  }, [tasks, liveClasses]);

  const activeStatuses = STATUS_META.filter((s) => stats.statusCounts[s.id] > 0);
  const donutGradient = (() => {
    if (stats.total === 0) return "var(--muted)";
    let acc = 0;
    const stops = activeStatuses.map((s) => {
      const start = (acc / stats.total) * 360;
      acc += stats.statusCounts[s.id];
      const end = (acc / stats.total) * 360;
      return `${s.cssVar} ${start}deg ${end}deg`;
    });
    return `conic-gradient(${stops.join(", ")})`;
  })();

  const focusH = Math.floor(stats.focusMinutes / 60);
  const focusM = stats.focusMinutes % 60;
  const focusLabel = focusH > 0 ? `${focusH}s ${focusM}d` : `${focusM}d`;

  return (
    <div className="h-full flex flex-col">
      <div className="bg-card rounded-xl card-elevation flex flex-col overflow-hidden min-w-0 min-h-0 h-full">
        {/* Header */}
        <div className="px-5 py-5 flex items-center shrink-0 gap-3 border-b border-border min-h-[4.5rem]">
          <SectionIcon><BarChart3 /></SectionIcon>
          <CardTitle className="truncate">Statistika</CardTitle>
        </div>

        <div className="flex-1 min-h-0 relative overflow-hidden">
          <ScrollArea className="h-full w-full">
            <div className="px-5 py-5 space-y-7">

              {/* ── Global amal qutilari (navigatsiya) ── */}
              <div className="grid grid-cols-2 gap-2.5">
                <StatTile
                  icon={CheckCircle2}
                  label="Bugun"
                  value={global.todayRemaining}
                  sub={global.todayTotal === 0 ? "Rejalar yoʻq" : `${global.todayDone}/${global.todayTotal} bajarildi`}
                  tone={global.todayRemaining === 0 && global.todayTotal > 0 ? "success" : "default"}
                  active={activeFilter === "today"}
                  onClick={() => onSelectFilter("today")}
                />
                <StatTile
                  icon={AlertCircle}
                  label="Muddati oʻtgan"
                  value={global.overdue}
                  sub={global.overdue > 0 ? "eʼtibor talab qiladi" : "Kechikkanlar yoʻq"}
                  tone={global.overdue > 0 ? "destructive" : "default"}
                  active={activeFilter === "overdue"}
                  onClick={() => onSelectFilter("overdue")}
                />
              </div>

              {/* ── Bu hafta bajarish trendi (global) ── */}
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <TypographyLabel>Shu haftada bajarilgan</TypographyLabel>
                  <span className="text-sm font-semibold tabular-nums">{week.total}</span>
                </div>
                {week.total === 0 ? (
                  <p className="text-sm text-muted-foreground py-1">Oxirgi 7 kunda hech qanday vazifa bajarilmadi.</p>
                ) : !mounted ? (
                  <div className="h-24 w-full" />
                ) : (
                  <ChartContainer config={TREND_CONFIG} className="aspect-auto h-24 w-full">
                    <BarChart data={week.days} margin={{ top: 4, right: 4, left: 4, bottom: 0 }}>
                      <CartesianGrid vertical={false} />
                      <XAxis dataKey="day" tickLine={false} axisLine={false} tickMargin={6} />
                      <ChartTooltip
                        cursor={false}
                        content={<ChartTooltipContent hideLabel formatter={(v) => `${v} ta bajarildi`} />}
                      />
                      <Bar dataKey="count" fill="var(--color-count)" radius={4} />
                    </BarChart>
                  </ChartContainer>
                )}
              </div>

              {/* ── Bajarish foizi (joriy filtr boʻyicha) ── */}
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <TypographyLabel>Samaradorlik</TypographyLabel>
                  <span className="text-[11px] text-muted-foreground/70 truncate">{scopeLabel(activeFilter, (id) => liveClasses.find((c) => c.id === id)?.name)}</span>
                </div>
                {stats.active === 0 ? (
                  <p className="text-sm text-muted-foreground py-2">Bu roʻyxatda hali maʼlumotlar yoʻq.</p>
                ) : (
                  <>
                    <div className="flex items-end justify-between">
                      <div className="text-4xl font-bold tabular-nums leading-none">{stats.percent}%</div>
                      <div className="text-xs text-muted-foreground tabular-nums pb-0.5">
                        {stats.done} / {stats.active} vazifa
                      </div>
                    </div>
                    <Progress value={stats.percent} className="h-2" />
                  </>
                )}
              </div>

              {/* ── Holat boʻyicha taqsimot ── */}
              {stats.total > 0 && (
                <div className="space-y-3">
                  <TypographyLabel>Holat bo‘yicha</TypographyLabel>
                  <div className="flex items-center gap-5">
                    <div className="relative shrink-0 size-28">
                      <div className="size-28 rounded-full" style={{ background: donutGradient }} />
                      <div className="absolute inset-[14px] rounded-full bg-card flex flex-col items-center justify-center">
                        <span className="text-xl font-bold tabular-nums leading-none">{stats.total}</span>
                        <span className="text-xs text-muted-foreground">jami</span>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0 space-y-2">
                      {STATUS_META.map((s) => (
                        <div key={s.id} className="flex items-center gap-2 text-sm">
                          <span className={cn("size-2.5 rounded-full shrink-0", s.dot)} />
                          <span className="text-foreground/80 flex-1 truncate">{s.label}</span>
                          <span className="font-semibold tabular-nums text-foreground/90">
                            {stats.statusCounts[s.id]}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ── Ustuvorlik boʻyicha taqsimot ── */}
              {stats.total > 0 && (
                <div className="space-y-3">
                  <TypographyLabel>Ustuvorlik bo‘yicha</TypographyLabel>
                  <div className="space-y-2.5">
                    {PRIORITY_META.map((p) => {
                      const count = stats.priorityCounts[p.id];
                      const pct = stats.total === 0 ? 0 : Math.round((count / stats.total) * 100);
                      return (
                        <div key={p.id} className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="flex items-center gap-1.5 text-foreground/80">
                              <Flag className="size-3" />
                              {p.label}
                            </span>
                            <span className="tabular-nums text-muted-foreground">{count}</span>
                          </div>
                          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                            <div
                              className={cn("h-full rounded-full transition-all duration-500", p.bar)}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ── Sinf boʻyicha yuk (global, bosiladigan) ── */}
              {classLoad.rows.length > 0 && (
                <div className="space-y-3">
                  <TypographyLabel>Sinf bo‘yicha yuk</TypographyLabel>
                  <div className="space-y-2.5">
                    {classLoad.rows.map((c) => {
                      const pct = classLoad.max === 0 ? 0 : Math.round((c.count / classLoad.max) * 100);
                      const isActive = activeFilter === `class-${c.id}`;
                      return (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => onSelectFilter(`class-${c.id}` as TaskFilter)}
                          className={cn(
                            "w-full text-left space-y-1 rounded-md px-1.5 py-1 -mx-1.5 transition-colors hover:bg-muted/50 cursor-pointer",
                            isActive && "bg-primary/5"
                          )}
                        >
                          <div className="flex items-center justify-between text-xs gap-2">
                            <span className="flex items-center gap-1.5 text-foreground/80 min-w-0">
                              <ClassSwatch hex={c.hex} />
                              <span className="truncate">{c.name}</span>
                            </span>
                            <span className="tabular-nums text-muted-foreground shrink-0">{c.count}</span>
                          </div>
                          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-500"
                              style={{ width: `${pct}%`, backgroundColor: c.hex }}
                            />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ── Fokus vaqti (Pomodoro) ── */}
              {stats.focusSessions > 0 && (
                <div className="space-y-3">
                  <TypographyLabel>Fokus vaqti</TypographyLabel>
                  <div className="grid grid-cols-2 gap-2.5">
                    <StatTile icon={Timer} label="Jami fokus" value={focusLabel} sub="ishlangan vaqt" />
                    <StatTile icon={CheckCircle2} label="Seanslar" value={stats.focusSessions} sub="pomodoro" />
                  </div>
                </div>
              )}

            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  );
}

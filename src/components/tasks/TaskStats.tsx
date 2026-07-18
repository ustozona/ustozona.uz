"use client";

import { useMemo, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { BarChart3, AlertCircle, Timer, CheckCircle2, Flag } from "lucide-react";
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { SectionIcon } from "@/components/ui/section-icon";
import { CardTitle } from "@/components/ui/card";
import { TypographyLabel } from "@/components/ui/typography";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { ClassSwatch } from "@/components/ClassSwatch";
import { StatTile } from "@/components/StatTile";
import { cn } from "@/lib/utils";
import { useTaskStore } from "@/store/useTaskStore";
import { TASK_STATUS, STATUS_META, type TaskPriority } from "@/lib/tasks-data";
import { filterTasksByFilter } from "@/hooks/useFilteredTasks";
import { classColor, type ClassInfo } from "@/lib/grades-data";
import { useLiveClasses } from "@/hooks/useLiveClasses";
import { CLASS_COLOR_HEX } from "@/lib/class-colors";
import type { TaskFilter } from "./TasksSidebar";
import type { Task } from "@/lib/tasks-data";

// Hafta kunlari qisqa yorligʻi kalitlari (getDay 0=Yakshanba) — matn TaskStats
// i18n namespace'idan (weekdaySun..weekdaySat) olinadi.
const WEEKDAY_SHORT_KEYS = [
  "weekdaySun", "weekdayMon", "weekdayTue", "weekdayWed", "weekdayThu", "weekdayFri", "weekdaySat",
] as const;

const PRIORITY_BAR: { id: TaskPriority; bar: string }[] = [
  { id: "high",   bar: "bg-destructive" },
  { id: "medium", bar: "bg-warning" },
  { id: "low",    bar: "bg-info" },
  { id: "none",   bar: "bg-muted-foreground/40" },
];

type Props = {
  activeFilter: TaskFilter;
  onSelectFilter: (f: TaskFilter) => void;
  /** Tur demo rejimida haqiqiy vazifa/sinf oʻrniga koʻrsatiladigan namunaviy maʼlumot. */
  demoTasks?: Task[];
  demoClasses?: ClassInfo[];
};

function scopeLabel(
  f: TaskFilter,
  classNameOf: (id: string) => string | undefined,
  t: (key: string) => string
): string {
  if (f === "inbox") return t("filterInbox");
  if (f === "today") return t("filterToday");
  if (f === "upcoming") return t("filterUpcoming");
  if (f === "overdue") return t("filterOverdue");
  if (f === "important") return t("filterImportant");
  if (f === "completed") return t("filterCompleted");
  if (f === "all") return t("filterAll");
  if (f.startsWith("class-")) {
    const cid = f.replace("class-", "");
    if (cid === "none") return t("generalClass");
    return classNameOf(cid) ?? t("classLabel");
  }
  return t("filterAll");
}

export default function TaskStats({ activeFilter, onSelectFilter, demoTasks, demoClasses }: Props) {
  const t = useTranslations("TaskStats");
  const tPriority = useTranslations("TaskPriority");
  const tStatus = useTranslations("TaskStatus");
  const WEEKDAY_SHORT = WEEKDAY_SHORT_KEYS.map((k) => t(k));
  const TREND_CONFIG = {
    count: { label: t("completedLegend"), color: "var(--primary)" },
  } satisfies ChartConfig;
  const PRIORITY_META: { id: TaskPriority; label: string; bar: string }[] = PRIORITY_BAR.map((p) => ({
    ...p,
    label: tPriority(p.id),
  }));
  const storedTasks = useTaskStore((s) => s.tasks);
  const tasks = demoTasks ?? storedTasks;
  const liveClassesReal = useLiveClasses();
  const liveClasses = demoClasses && liveClassesReal.length === 0 ? demoClasses : liveClassesReal;
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

    scope.forEach((task) => {
      statusCounts[task.status]++;
      priorityCounts[task.priority]++;
      if (task.status === TASK_STATUS.DONE) done++;
      if (task.status !== TASK_STATUS.CANCELED) active++;
      (task.pomodoroSessions || []).forEach((p) => {
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
    tasks.forEach((task) => {
      const isDone = task.status === TASK_STATUS.DONE;
      const isCanceled = task.status === TASK_STATUS.CANCELED;
      if (task.dueDate && task.dueDate < todayStr && !isDone && !isCanceled) overdue++;
      if (task.dueDate === todayStr && !isCanceled) { todayTotal++; if (isDone) todayDone++; }
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
    tasks.forEach((task) => {
      if (task.status !== TASK_STATUS.DONE || !task.completedAt) return;
      const k = task.completedAt.slice(0, 10);
      const i = idx.get(k);
      if (i !== undefined) days[i].count++;
    });
    return { days, total: days.reduce((s, d) => s + d.count, 0) };
  }, [tasks]);

  // ── Sinf boʻyicha yuk (global) — ochiq (todo/jarayonda) vazifalar soni ──
  const classLoad = useMemo(() => {
    const counts: Record<string, number> = {};
    tasks.forEach((task) => {
      const open = task.status === TASK_STATUS.TODO || task.status === TASK_STATUS.IN_PROGRESS;
      if (!open || !task.classIds?.length) return;
      task.classIds.forEach((cid) => { counts[cid] = (counts[cid] || 0) + 1; });
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
  const focusLabel = focusH > 0 ? t("hoursMinutes", { hours: focusH, minutes: focusM }) : t("minutesOnly", { minutes: focusM });

  return (
    <div className="h-full flex flex-col">
      <div className="bg-card rounded-xl card-elevation flex flex-col overflow-hidden min-w-0 min-h-0 h-full">
        {/* Header */}
        <div className="px-5 py-5 flex items-center shrink-0 gap-3 border-b border-border min-h-[4.5rem]">
          <SectionIcon><BarChart3 /></SectionIcon>
          <CardTitle className="truncate">{t("title")}</CardTitle>
        </div>

        <div className="flex-1 min-h-0 relative overflow-hidden">
          <ScrollArea className="h-full w-full">
            <div className="px-5 py-5 space-y-7">

              {/* ── Global amal qutilari (navigatsiya) ── */}
              <div className="grid grid-cols-2 gap-2.5">
                <StatTile
                  icon={CheckCircle2}
                  label={t("today")}
                  value={global.todayRemaining}
                  sub={global.todayTotal === 0 ? t("noPlans") : t("doneOfTotal", { done: global.todayDone, total: global.todayTotal })}
                  tone={global.todayRemaining === 0 && global.todayTotal > 0 ? "success" : "default"}
                  active={activeFilter === "today"}
                  onClick={() => onSelectFilter("today")}
                />
                <StatTile
                  icon={AlertCircle}
                  label={t("overdueLabel")}
                  value={global.overdue}
                  sub={global.overdue > 0 ? t("overdueNeedsAttention") : t("noOverdue")}
                  tone={global.overdue > 0 ? "destructive" : "default"}
                  active={activeFilter === "overdue"}
                  onClick={() => onSelectFilter("overdue")}
                />
              </div>

              {/* ── Bu hafta bajarish trendi (global) ── */}
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <TypographyLabel>{t("weeklyCompletedTitle")}</TypographyLabel>
                  <span className="text-sm font-semibold tabular-nums">{week.total}</span>
                </div>
                {week.total === 0 ? (
                  <p className="text-sm text-muted-foreground py-1">{t("weeklyCompletedEmpty")}</p>
                ) : !mounted ? (
                  <div className="h-24 w-full" />
                ) : (
                  <ChartContainer config={TREND_CONFIG} className="aspect-auto h-24 w-full">
                    <BarChart data={week.days} margin={{ top: 4, right: 4, left: 4, bottom: 0 }}>
                      <CartesianGrid vertical={false} />
                      <XAxis dataKey="day" tickLine={false} axisLine={false} tickMargin={6} />
                      <ChartTooltip
                        cursor={false}
                        content={<ChartTooltipContent hideLabel formatter={(v) => t("chartTooltipCompleted", { count: Number(v) })} />}
                      />
                      <Bar dataKey="count" fill="var(--color-count)" radius={4} />
                    </BarChart>
                  </ChartContainer>
                )}
              </div>

              {/* ── Bajarish foizi (joriy filtr boʻyicha) ── */}
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <TypographyLabel>{t("efficiencyTitle")}</TypographyLabel>
                  <span className="text-[11px] text-muted-foreground/70 truncate">{scopeLabel(activeFilter, (id) => liveClasses.find((c) => c.id === id)?.name, t)}</span>
                </div>
                {stats.active === 0 ? (
                  <p className="text-sm text-muted-foreground py-2">{t("efficiencyEmpty")}</p>
                ) : (
                  <>
                    <div className="flex items-end justify-between">
                      <div className="text-4xl font-bold tabular-nums leading-none">{stats.percent}%</div>
                      <div className="text-xs text-muted-foreground tabular-nums pb-0.5">
                        {t("tasksFraction", { done: stats.done, total: stats.active })}
                      </div>
                    </div>
                    <Progress value={stats.percent} className="h-2" />
                  </>
                )}
              </div>

              {/* ── Holat boʻyicha taqsimot ── */}
              {stats.total > 0 && (
                <div className="space-y-3">
                  <TypographyLabel>{t("byStatusTitle")}</TypographyLabel>
                  <div className="flex items-center gap-5">
                    <div className="relative shrink-0 size-28">
                      <div className="size-28 rounded-full" style={{ background: donutGradient }} />
                      <div className="absolute inset-[14px] rounded-full bg-card flex flex-col items-center justify-center">
                        <span className="text-xl font-bold tabular-nums leading-none">{stats.total}</span>
                        <span className="text-xs text-muted-foreground">{t("totalLabel")}</span>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0 space-y-2">
                      {STATUS_META.map((s) => (
                        <div key={s.id} className="flex items-center gap-2 text-sm">
                          <span className={cn("size-2.5 rounded-full shrink-0", s.dot)} />
                          <span className="text-foreground/80 flex-1 truncate">{tStatus(s.id)}</span>
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
                  <TypographyLabel>{t("byPriorityTitle")}</TypographyLabel>
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
                  <TypographyLabel>{t("byClassLoadTitle")}</TypographyLabel>
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
                  <TypographyLabel>{t("focusTimeTitle")}</TypographyLabel>
                  <div className="grid grid-cols-2 gap-2.5">
                    <StatTile icon={Timer} label={t("totalFocus")} value={focusLabel} sub={t("timeSpent")} />
                    <StatTile icon={CheckCircle2} label={t("sessions")} value={stats.focusSessions} sub={t("pomodoro")} />
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

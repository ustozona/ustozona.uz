"use client";

import Image from "next/image";
import Link from "next/link";
import { Sunrise, Sunset, BookOpen, CalendarDays, SquareCheckBig, Plus, ArrowUpRight, FileText, Trash2, Clock } from "lucide-react";
import * as React from "react";
import { useState, useEffect, useMemo } from "react";
import { uz } from "date-fns/locale";
import { type DayButton } from "react-day-picker";
import { Calendar, CalendarDayButton } from "@/components/ui/calendar";
import { useTimetableStore } from "@/store/useTimetableStore";
import { useCalendarStore } from "@/store/useCalendarStore";
import { useLessonStore } from "@/store/useLessonStore";
import { useTaskStore } from "@/store/useTaskStore";
import { resolveVersionForDate } from "@/lib/timetable-versions";
import { getHolidayForDate } from "@/lib/academic-calendar";
import { dateToKey } from "@/lib/date-keys";
import { useLiveClasses } from "@/hooks/useLiveClasses";
import { classColor } from "@/lib/grades-data";
import { lessonClassIds } from "@/lib/lessons-data";
import { TASK_STATUS } from "@/lib/tasks-data";
import { DAYS_UZ_SUN } from "@/lib/localization";
import { autoClassColor, classTints, CLASS_COLOR_HEX } from "@/lib/class-colors";
import { fmtMin } from "@/lib/timetable";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { SectionIcon } from "@/components/ui/section-icon";
import { Badge } from "@/components/ui/badge";
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription, EmptyContent } from "@/components/ui/empty";

import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { TypographyH3, TypographyMuted, TypographySmall } from "@/components/ui/typography";
import { cn } from "@/lib/utils";
import { MONTHS_UZ } from "@/lib/localization";
import { useSettingsStore } from "@/store/useSettingsStore";
import DashboardPageLayout, {
  panelCardClass,
  panelCardContentClass,
  panelCardHeaderClass,
  panelScrollInnerClass,
  dashboardGridClass,
  dashboardStackClass,
} from "@/components/DashboardPage";

/** hex → "r, g, b" (rgba fon uchun). */
function hexToRgb(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `${r}, ${g}, ${b}`;
}

/** Dashboard mini-kalendar kun tugmasi — dars boʻlgan kunlarda past qismida
    yashil nuqta koʻrsatadi (modifiers.hasLesson orqali). */
function DashboardDayButton(props: React.ComponentProps<typeof CalendarDayButton>) {
  const hasLesson = !!props.modifiers?.hasLesson;
  return (
    <CalendarDayButton {...props}>
      {props.children}
      {hasLesson && (
        <span className="absolute bottom-1 left-1/2 size-1 -translate-x-1/2 rounded-full bg-success group-data-[selected-single=true]/day:bg-primary-foreground" />
      )}
    </CalendarDayButton>
  );
}

export default function DashboardPage() {
  const [mounted, setMounted] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const firstName = useSettingsStore((s) => s.profile.name).split(/\s+/)[0];
  
  const [currentMonthDate, setCurrentMonthDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());

  useEffect(() => {
    setMounted(true);
    setCurrentTime(new Date());
    setCurrentMonthDate(new Date());
    setSelectedDate(new Date());
    
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    
    return () => clearInterval(timer);
  }, []);

  // ── Bugungi darslar — bugun amaldagi jadval versiyasidan ──
  const versions = useTimetableStore((s) => s.versions);
  const calendar = useCalendarStore((s) => s.calendar);
  const todayKey = dateToKey(currentTime);
  const holiday = getHolidayForDate(calendar, todayKey);
  const todayDow = currentTime.getDay(); // 0=Yakshanba
  const todaysEvents = useMemo(() => {
    if (holiday || todayDow === 0) return [];
    return (resolveVersionForDate(versions, todayKey)?.events ?? [])
      .filter((e) => e.day === todayDow)
      .sort((a, b) => a.startMin - b.startMin);
  }, [versions, todayKey, holiday, todayDow]);

  // ── Kelgusi darslar — jonli mavzu bankidan (rejalangan, bugundan boshlab) ──
  const allLessons = useLessonStore((s) => s.lessons);
  const liveClasses = useLiveClasses();
  // Jonli sinf xaritasi — "Bugungi darslar" (jadval eventlari) ham shu manbadan
  const liveById = useMemo(() => new Map(liveClasses.map((c) => [c.id, c])), [liveClasses]);
  const classMetaById = useMemo(
    () => new Map(liveClasses.map((c) => [c.id, { name: c.name, hex: CLASS_COLOR_HEX[classColor(c)] }])),
    [liveClasses]
  );
  const upcomingLessons = useMemo(() => {
    return allLessons
      .filter((l) => l.scheduledDate && l.scheduledDate >= todayKey && l.status !== "Completed")
      .sort((a, b) =>
        a.scheduledDate!.localeCompare(b.scheduledDate!) || (a.startMin ?? 0) - (b.startMin ?? 0)
      )
      .slice(0, 8)
      .map((l) => {
        const [y, mo, d] = l.scheduledDate!.split("-").map(Number);
        const date = new Date(y, mo - 1, d);
        const firstClassId = lessonClassIds(l)[0];
        const meta = firstClassId ? classMetaById.get(firstClassId) : undefined;
        const hex = meta?.hex ?? "#94a3b8";
        return {
          id: l.id,
          dayName: DAYS_UZ_SUN[date.getDay()],
          date: `${d}-${MONTHS_UZ[mo - 1].toLowerCase()}`,
          className: meta?.name ?? "Sinf",
          topic: l.title || "(nomsiz mavzu)",
          startTime: l.startMin != null ? fmtMin(l.startMin) : (l.time ?? ""),
          isReady: !!(l.content && l.content.trim().length > 0),
          color: hex,
          bg: `rgba(${hexToRgb(hex)}, 0.125)`,
        };
      });
  }, [allLessons, classMetaById, todayKey]);

  // ── Vazifalar — jonli (ochiq, muddat boʻyicha) ──
  const allTasks = useTaskStore((s) => s.tasks);
  const openTasks = useMemo(
    () =>
      allTasks
        .filter((t) => t.status !== TASK_STATUS.DONE && t.status !== TASK_STATUS.CANCELED)
        .sort((a, b) => {
          if (!a.dueDate) return 1;
          if (!b.dueDate) return -1;
          return a.dueDate.localeCompare(b.dueDate);
        }),
    [allTasks]
  );
  const openTaskCount = openTasks.length;
  const upcomingTasks = useMemo(() => openTasks.slice(0, 4), [openTasks]);

  const hour = currentTime.getHours();
  const minute = currentTime.getMinutes();
  const isDay = hour >= 6 && hour < 19;
  
  const getTimelineTop = () => {
    if (hour < 7) return -10;
    if (hour > 18) return 120 * 12 + 10;
    return (hour - 7) * 120 + (minute * 2) + 1;
  };
  
  const greetingText = () => {
    if (hour < 12) return "Xayrli tong";
    if (hour < 18) return "Xayrli kun";
    return "Xayrli kech";
  };

  // ── Mini-kalendar modifikatorlari — jonli maʼlumotdan ──
  // Dars kunlari (rejalangan mavzular) va bloklangan kunlar (yakshanba + taʼtil).
  const lessonDayKeys = useMemo(() => {
    const s = new Set<string>();
    for (const l of allLessons) if (l.scheduledDate) s.add(l.scheduledDate);
    return s;
  }, [allLessons]);

  const calendarModifiers = useMemo(
    () => ({
      hasLesson: (date: Date) => lessonDayKeys.has(dateToKey(date)),
      blocked: (date: Date) =>
        date.getDay() === 0 || !!getHolidayForDate(calendar, dateToKey(date)),
    }),
    [lessonDayKeys, calendar]
  );

  const imageSrc = isDay ? "/day.png" : "/night.png";
  const Icon = isDay ? Sunrise : Sunset;
  const iconColor = isDay ? "text-yellow-300" : "text-indigo-300";

  if (!mounted) {
    return <div className="flex-1 min-h-0 bg-card/50 h-full animate-pulse"></div>;
  }

  return (
    <div className="flex flex-col h-full">
      <DashboardPageLayout className="flex-1">
        <div className={cn(dashboardGridClass, "flex-1 min-h-0 grid-cols-1 lg:grid-cols-4 lg:grid-rows-[1fr]")}>
          
          {/* Left Column (Hero & Lessons) */}
          <div className={cn(dashboardStackClass, "lg:col-span-2 h-full min-h-0")}>
            {/* HERO CARD */}
            <div className="relative overflow-hidden rounded-xl px-5 py-7 md:px-8 md:py-12 text-white">
              <div className={`absolute inset-0 bg-gradient-to-br z-0 ${isDay ? "from-amber-400 via-orange-500 to-rose-500" : "from-slate-800 via-indigo-900 to-purple-900"}`} />
              <Image 
                alt="Manzara" 
                fill 
                className="object-cover object-center z-[1]" 
                src={imageSrc}
                priority
              />
              <div className="absolute inset-0 bg-black/10 z-[2]" />
              <div className="relative z-10 flex items-start justify-between [text-shadow:_0_2px_8px_rgb(0_0_0_/_60%)]">
                <div className="flex flex-col gap-1 md:gap-2">
                  <div className="flex items-center gap-3">
                    <Icon className={`size-7 md:size-8 drop-shadow-lg ${iconColor}`} />
                    <TypographyH3 className="text-2xl text-white">{greetingText()}, {firstName}!</TypographyH3>
                  </div>
                  <TypographyMuted className="max-w-md leading-relaxed text-white">
                    {liveClasses.length === 0 && allLessons.length === 0
                      ? "Ustozona'ga xush kelibsiz! Boshlash uchun birinchi sinfingizni yarating."
                      : holiday
                        ? `Bugun — ${holiday.name}. Yaxshi dam oling!`
                        : todaysEvents.length === 0
                          ? openTaskCount > 0
                            ? `Bugun darsingiz yoʻq, lekin bajarishingiz kerak boʻlgan ${openTaskCount} ta vazifangiz bor.`
                            : "Bugun darsingiz yoʻq. Yaxshi dam oling!"
                          : `Bugun ${todaysEvents.length} ta darsingiz${openTaskCount > 0 ? ` va ${openTaskCount} ta vazifangiz` : ""} bor.`}
                  </TypographyMuted>
                </div>
              </div>
              <div className="absolute -top-10 -right-10 size-48 rounded-full bg-white/10 z-[3]" />
              <div className="absolute -bottom-8 -right-4 size-32 rounded-full bg-white/5 z-[3]" />
            </div>

            {/* LESSONS CARD */}
            <Card data-tour="home-overview" className={cn("shadow-sm", panelCardClass)}>
              <CardHeader className={cn(panelCardHeaderClass, "justify-between min-h-[4.5rem] px-5 py-5!")}>
                <div className="flex items-center gap-2">
                  <SectionIcon><BookOpen /></SectionIcon>
                  <CardTitle>Kelgusi darslar</CardTitle>
                </div>
                <Link href="/dashboard/lessons" className="hidden md:inline-block text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
                  Barchasi
                </Link>
              </CardHeader>
              <CardContent className={panelCardContentClass}>
                  <div className={cn(panelScrollInnerClass, "space-y-4")}>
                    {mounted && upcomingLessons.length === 0 && (
                      <Empty className="border-0 py-8">
                        <EmptyHeader>
                          <EmptyMedia variant="icon"><BookOpen className="size-6" /></EmptyMedia>
                          <EmptyTitle>Rejalangan dars yoʻq</EmptyTitle>
                          <EmptyDescription>
                            Darslar rejalashtiruvchida sanaga qoʻyilgach shu yerda koʻrinadi.
                          </EmptyDescription>
                        </EmptyHeader>
                        <EmptyContent>
                          <Link href="/dashboard/planner" className="text-xs text-primary hover:underline">
                            Rejalashtiruvchini ochish
                          </Link>
                        </EmptyContent>
                      </Empty>
                    )}
                    {/* Kunlar boʻyicha guruhlangan darslar */}
                    {Array.from(new Map(upcomingLessons.map(l => [l.dayName + l.date, l])).entries()).map(([dayKey, firstLesson]) => (
                      <div key={dayKey}>
                        <div className="flex items-center gap-2 mb-2">
                          <TypographySmall className="text-foreground">{firstLesson.dayName}</TypographySmall>
                          <TypographyMuted>{firstLesson.date}</TypographyMuted>
                        </div>
                        <div className="space-y-2">
                          {upcomingLessons.filter(l => l.dayName + l.date === dayKey).map((lesson, i) => (
                            <div
                              key={lesson.id}
                              style={{
                                animationDelay: `${i * 55}ms`,
                                borderColor: `var(--hover-color, var(--border))`,
                              } as React.CSSProperties}
                              className="animate-fade-slide-up group rounded-lg border p-4 cursor-pointer bg-card transition-all duration-200 hover:bg-muted/5"
                              onMouseEnter={(e) => {
                                (e.currentTarget as HTMLDivElement).style.setProperty('--hover-color', lesson.color);
                              }}
                              onMouseLeave={(e) => {
                                (e.currentTarget as HTMLDivElement).style.setProperty('--hover-color', 'var(--border)');
                              }}
                            >
                              <div className="flex items-center gap-3">
                                {/* Chap: Icon */}
                                <div className="p-3 rounded-xl shrink-0 transition-transform duration-300 ease-out group-hover:scale-110 group-hover:-rotate-3" style={{ backgroundColor: lesson.bg }}>
                                  <FileText className="size-7" style={{ color: lesson.color }} />
                                </div>

                                {/* Oʻrta: Mavzu + Sinf/vaqt */}
                                <div className="min-w-0 flex-1 flex flex-col gap-1">
                                  <p className="text-sm font-semibold leading-snug text-foreground transition-colors duration-200 group-hover:text-primary">{lesson.topic}</p>
                                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                    <span className="font-medium text-foreground">{lesson.className}</span>
                                    <span className="size-0.5 rounded-full bg-muted-foreground" />
                                    <span>{lesson.startTime}</span>
                                  </div>
                                </div>

                                {/* Oʻng: Badge */}
                                {lesson.isReady ? (
                                  <Badge variant="outline" className="hidden px-2.5 py-1 md:inline-flex items-center gap-1.5 rounded-full border-success/30 bg-success/10 text-success text-xs font-medium shrink-0">
                                    <span className="size-1.5 rounded-full flex-shrink-0 bg-success" />
                                    Tayyor
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="hidden px-2.5 py-1 md:inline-flex items-center gap-1.5 rounded-full border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 text-xs font-medium shrink-0">
                                    <span className="size-1.5 rounded-full flex-shrink-0 bg-amber-500" />
                                    Reja yoʻq
                                  </Badge>
                                )}
                              <div className="shrink-0 group/actions relative flex items-center before:content-[''] before:absolute before:-inset-y-4 before:-left-10 before:-right-4">
                                <div className="relative z-10 flex items-center gap-0.5 overflow-hidden max-w-0 opacity-0 group-hover/actions:max-w-16 group-hover/actions:opacity-100 transition-all duration-200 ease-out">
                                  <Button variant="ghost" size="icon-sm" className="text-muted-foreground/60 hover:text-destructive shrink-0">
                                    <Trash2 className="size-3.5" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
              </CardContent>
            </Card>
          </div>

          {/* Middle Column (Schedule) */}
          <div className="h-full min-h-0">
            <Card className={cn("shadow-sm", panelCardClass)}>
              <CardHeader className={cn(panelCardHeaderClass, "min-h-[4.5rem] px-5 py-5!")}>
                <div className="flex items-center gap-2">
                  <SectionIcon><Clock /></SectionIcon>
                  <CardTitle>Bugungi darslar</CardTitle>
                </div>
              </CardHeader>
              <CardContent className={panelCardContentClass}>
                <div className={panelScrollInnerClass}>
                  <div className="relative border-t border-border/30 flex">
                    <div className="w-12 shrink-0 border-r border-border/30">
                      {[7, 8, 9, 10, 11, 12, 1, 2, 3, 4, 5, 6].map((h, i) => (
                        <div key={i} className="flex items-start justify-center pt-1 border-b border-border/30" style={{ height: 120 }}>
                          <span className="text-xs font-medium text-muted-foreground">{h}:00</span>
                        </div>
                      ))}
                    </div>
                    <div className="relative flex-1">
                      {Array.from({ length: 12 }).map((_, i) => (
                        <div key={i} className="border-b border-border/30" style={{ height: 120 }}>
                          <Separator className="mt-[60px] opacity-20" />
                        </div>
                      ))}
                      
                      {/* Bugungi darslar — jadval versiyasidan (7:00 boshlanish, 1 soat = 120px) */}
                      {todaysEvents.map((ev) => {
                        const cls = liveById.get(ev.classId);
                        const color = cls ? classColor(cls) : autoClassColor(ev.classId);
                        const tints = classTints(color);
                        const top = (ev.startMin / 60 - 7) * 120 + 1;
                        const height = Math.max(((ev.endMin - ev.startMin) / 60) * 120 - 2, 32);
                        if (top + height < 0 || top > 120 * 12) return null;
                        return (
                          <div key={ev.id} className="absolute left-1 right-1 z-[1] group transition-shadow overflow-hidden rounded-md border" style={{ top, height, ...tints.surface, ...tints.softBorder }}>
                            <div className="h-full flex flex-col px-2 pt-2 pb-2">
                              <div className="relative shrink-0 mb-0.5">
                                <div className="flex items-baseline gap-1.5 min-w-0">
                                  <TypographySmall className="text-sm font-semibold truncate min-w-0 leading-none">
                                    {cls?.name ?? "Nomaʼlum sinf"}
                                  </TypographySmall>
                                  <span className="text-xs text-muted-foreground shrink-0 whitespace-nowrap">{fmtMin(ev.startMin)} - {fmtMin(ev.endMin)}</span>
                                </div>
                                <div className="absolute top-0 right-0 bottom-0 flex items-stretch gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button asChild variant="ghost" size="icon-xs" className="h-full aspect-square bg-black/5 hover:bg-black/10 dark:bg-white/10 dark:hover:bg-white/20">
                                        <Link href={cls ? `/dashboard/classes/${ev.classId}` : "/dashboard/timetable"}>
                                          <ArrowUpRight className="size-3.5" />
                                        </Link>
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Sinfni ochish</TooltipContent>
                                  </Tooltip>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}

                      {/* Boʻsh holat — taʼtil yoki darssiz kun */}
                      {todaysEvents.length === 0 && (
                        <div className="absolute inset-x-3 top-6 z-[1] flex flex-col items-center gap-2 rounded-xl border border-dashed border-border bg-background/80 px-4 py-6 text-center backdrop-blur-sm">
                          <CalendarDays className="size-5 text-muted-foreground" />
                          <p className="text-sm font-medium text-foreground">
                            {holiday ? `Bugun — ${holiday.name}` : "Bugun dars yoʻq"}
                          </p>
                          <Link href="/dashboard/timetable" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                            Jadvalni ochish
                          </Link>
                        </div>
                      )}

                      {/* Current Time Line */}
                      <div className="absolute left-0 right-0 z-20 flex items-center pointer-events-none transition-all duration-1000 ease-linear" style={{ top: getTimelineTop() }}>
                        <div className="size-2 rounded-full bg-destructive -ml-1" />
                        <div className="flex-1 h-[2px] bg-destructive" />
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column (Calendar & Tasks) */}
          <div className={cn(dashboardStackClass, "h-full min-h-0")}>
            <Card className="shadow-sm flex flex-col flex-1 min-h-0 py-0">
              <CardContent className="px-6 py-5 flex flex-col flex-1 min-h-0 overflow-hidden">

                {/* ── Calendar ── */}
                <div className="shrink-0">
                  <div className="flex items-center gap-2 mb-3">
                    <SectionIcon><CalendarDays /></SectionIcon>
                    <CardTitle>Kalendar</CardTitle>
                  </div>

                  <Calendar
                    mode="single"
                    locale={uz}
                    selected={selectedDate}
                    onSelect={(d) => d && setSelectedDate(d)}
                    month={currentMonthDate}
                    onMonthChange={setCurrentMonthDate}
                    formatters={{
                      formatMonthDropdown: (date) => MONTHS_UZ[date.getMonth()],
                      formatWeekdayName: (date) => ["Ya", "Du", "Se", "Ch", "Pa", "Ju", "Sh"][date.getDay()],
                    }}
                    modifiers={calendarModifiers}
                    modifiersClassNames={{ blocked: "text-muted-foreground/40 line-through" }}
                    components={{ DayButton: DashboardDayButton }}
                    className="w-full p-0 [--cell-size:--spacing(9)]"
                  />
                </div>

                {/* ── Spacer ── */}
                <div className="my-5 shrink-0" />

                {/* ── Tasks ── */}
                <div className="flex-1 min-h-0 overflow-y-auto scrollbar-thin flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <SectionIcon><SquareCheckBig /></SectionIcon>
                      <CardTitle>Vazifalar</CardTitle>
                    </div>
                    <Button variant="ghost" size="icon-sm" className="text-muted-foreground">
                      <Plus className="size-4" />
                    </Button>
                  </div>

                  <div className="flex flex-col gap-2">
                    {mounted && upcomingTasks.length === 0 && (
                      <div className="flex flex-col items-center gap-1.5 py-6 text-center">
                        <SquareCheckBig className="size-5 text-muted-foreground" />
                        <TypographyMuted className="text-xs">Ochiq vazifa yoʻq</TypographyMuted>
                      </div>
                    )}
                    {upcomingTasks.map((task) => {
                      const overdue = !!task.dueDate && task.dueDate < todayKey;
                      const dueLabel = task.dueDate
                        ? (() => {
                            const [, m, d] = task.dueDate!.split("-").map(Number);
                            return `${d}-${MONTHS_UZ[m - 1].toLowerCase()}`;
                          })()
                        : null;
                      return (
                        <Link
                          key={task.id}
                          href="/dashboard/tasks"
                          className="flex items-center gap-3 rounded-lg px-3 py-4 transition-colors bg-muted/40 hover:bg-muted cursor-pointer"
                        >
                          <Checkbox id={`task-${task.id}`} checked={task.status === TASK_STATUS.DONE} />
                          <span className="font-medium flex-1 text-sm truncate text-foreground min-w-0">
                            {task.title}
                          </span>
                          {dueLabel && (
                            <span className={cn("text-xs shrink-0 font-medium", overdue ? "text-destructive" : "text-muted-foreground")}>
                              {dueLabel}
                            </span>
                          )}
                        </Link>
                      );
                    })}
                  </div>

                  <Link href="/dashboard/tasks" className="block text-center text-xs text-muted-foreground hover:text-foreground transition-colors">
                    Barchasi
                  </Link>
                </div>

              </CardContent>
            </Card>
          </div>

        </div>
      </DashboardPageLayout>
    </div>
  );
}

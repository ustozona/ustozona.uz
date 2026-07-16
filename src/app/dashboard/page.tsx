"use client";

import Link from "next/link";
import { BookOpen, SquareCheckBig, ArrowRight, ArrowUpRight, FileText, Trash2, Clock } from "lucide-react";
import * as React from "react";
import { useState, useEffect, useMemo } from "react";
import { useTimetableStore } from "@/store/useTimetableStore";
import { useGradesStore } from "@/store/useGradesStore";
import { useCalendarStore } from "@/store/useCalendarStore";
import { useLessonStore } from "@/store/useLessonStore";
import { useTaskStore } from "@/store/useTaskStore";
import { WelcomeCard } from "@/components/dashboard/WelcomeCard";
import { WeekStrip } from "@/components/dashboard/WeekStrip";
import { resolveVersionForDate } from "@/lib/timetable-versions";
import { getHolidayForDate } from "@/lib/academic-calendar";
import { dateToKey } from "@/lib/date-keys";
import { getSunTimes, getDayPhase } from "@/lib/sun";
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
import { Illustration } from "@/components/ui/illustration";

import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { TypographyMuted, TypographySmall } from "@/components/ui/typography";
import { cn } from "@/lib/utils";
import { MONTHS_UZ } from "@/lib/localization";
import { useSettingsStore } from "@/store/useSettingsStore";
import { useTourRequest } from "@/components/tour/tour-request";
import { makeHomeTourDemo, DEMO_CLASS_NAMES, type DemoEvent } from "@/components/tour/home-tour-demo";
import DashboardPageLayout, {
  panelCardClass,
  panelCardContentClass,
  panelCardHeaderClass,
  panelScrollInnerClass,
  dashboardGridClass,
  dashboardStackClass,
} from "@/components/DashboardPage";


export default function DashboardPage() {
  const [mounted, setMounted] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const firstName = useSettingsStore((s) => s.profile.name).split(/\s+/)[0];
  
  const [selectedDate, setSelectedDate] = useState(new Date());

  useEffect(() => {
    setMounted(true);
    setCurrentTime(new Date());
    setSelectedDate(new Date());
    
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    
    return () => clearInterval(timer);
  }, []);

  // ── Bugungi darslar — bugun amaldagi jadval versiyasidan ──
  const versions = useTimetableStore((s) => s.versions);
  const calendar = useCalendarStore((s) => s.calendar);
  const classDataMap = useGradesStore((s) => s.classDataMap);
  const todayKey = dateToKey(currentTime);
  const holiday = getHolidayForDate(calendar, todayKey);
  const todayDow = currentTime.getDay(); // 0=Yakshanba
  const todaysEvents = useMemo(() => {
    if (holiday || todayDow === 0) return [];
    return (resolveVersionForDate(versions, todayKey)?.events ?? [])
      .filter((e) => e.day === todayDow)
      .sort((a, b) => a.startMin - b.startMin);
  }, [versions, todayKey, holiday, todayDow]);

  // ── Tanlangan kun darslari — haftalik tasma tanloviga bogʻliq ──
  const selectedKey = dateToKey(selectedDate);
  const isSelectedToday = selectedKey === todayKey;
  const selectedHoliday = getHolidayForDate(calendar, selectedKey);
  const selectedDow = selectedDate.getDay();
  const selectedEvents = useMemo(() => {
    if (selectedHoliday || selectedDow === 0) return [];
    return (resolveVersionForDate(versions, selectedKey)?.events ?? [])
      .filter((e) => e.day === selectedDow)
      .sort((a, b) => a.startMin - b.startMin);
  }, [versions, selectedKey, selectedHoliday, selectedDow]);
  const selectedDayLabel = isSelectedToday
    ? "Bugungi darslar"
    : `${selectedDate.getDate()}-${MONTHS_UZ[selectedDate.getMonth()].toLowerCase()} (${DAYS_UZ_SUN[selectedDow].toLowerCase()})`;

  // ── Kelgusi darslar — jonli mavzu bankidan (rejalangan, bugundan boshlab) ──
  const allLessons = useLessonStore((s) => s.lessons);
  const liveClasses = useLiveClasses();
  // Jonli sinf xaritasi — "Bugungi darslar" (jadval eventlari) ham shu manbadan
  const liveById = useMemo(() => new Map(liveClasses.map((c) => [c.id, c])), [liveClasses]);
  const classMetaById = useMemo(
    () => new Map(liveClasses.map((c) => {
      const color = classColor(c);
      return [c.id, { name: c.name, hex: CLASS_COLOR_HEX[color], color }];
    })),
    [liveClasses]
  );
  // ── Salomlashuv kartasi metrikalari ──
  const classCount = liveClasses.length;
  const studentCount = useMemo(
    () => Object.values(classDataMap).reduce((n, cd) => n + (cd.students?.length ?? 0), 0),
    [classDataMap]
  );
  // Bugungi agenda — jadval eventlaridan (vaqt · sinf · rang)
  const todayAgenda = useMemo(
    () =>
      todaysEvents.map((ev) => {
        const meta = classMetaById.get(ev.classId);
        return {
          id: ev.id,
          className: meta?.name ?? "Nomaʼlum sinf",
          timeLabel: fmtMin(ev.startMin),
          hex: meta?.hex ?? "#94a3b8",
        };
      }),
    [todaysEvents, classMetaById]
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
          classColor: meta?.color ?? null,
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
  // Bugun muddati keladigan ochiq vazifalar (WelcomeCard chipi)
  const todayTaskCount = useMemo(
    () => openTasks.filter((t) => t.dueDate === todayKey).length,
    [openTasks, todayKey]
  );
  // Tanlangan kun vazifalari — bugun tanlansa yaqin vazifalar, aks holda oʻsha kun muddatlilari
  const dayTasks = useMemo(
    () =>
      isSelectedToday
        ? openTasks.slice(0, 5)
        : openTasks.filter((t) => t.dueDate === selectedKey),
    [openTasks, isSelectedToday, selectedKey]
  );

  // ── Tur-demo rejimi — home tur ochiq boʻlsa boʻsh panellar namunaviy
  //    maʼlumot bilan toʻldiriladi (faqat vizual, store'larga yozilmaydi) ──
  const tourDemoActive = useTourRequest((s) => s.activeTourId === "home");
  const tourDemo = useMemo(
    () => (tourDemoActive ? makeHomeTourDemo(currentTime) : null),
    [tourDemoActive, currentTime]
  );
  const upcomingDisplay =
    tourDemo && upcomingLessons.length === 0 ? tourDemo.upcomingLessons : upcomingLessons;
  const eventsDisplay: ReadonlyArray<(typeof selectedEvents)[number] | DemoEvent> =
    tourDemo && selectedEvents.length === 0 ? tourDemo.events : selectedEvents;
  const tasksDisplay = tourDemo && dayTasks.length === 0 ? tourDemo.tasks : dayTasks;
  // Salomlashuv kartasi ham demo rejimda "sozlangan" koʻrinishda (metrikalar +
  // agenda chiplari) — aks holda tur "Sinf qoʻshish" boʻsh variantini yoritardi.
  const welcomeDemo = tourDemo && classCount === 0 ? tourDemo.welcome : null;

  const hour = currentTime.getHours();
  const minute = currentTime.getMinutes();

  // ── Salom — haqiqiy quyosh chiqishi/botishiga bogʻlangan (Toshkent) ──
  const sun = useMemo(() => getSunTimes(currentTime), [currentTime]);
  const dayPhase = getDayPhase(currentTime, sun);

  const getTimelineTop = () => {
    if (hour < 7) return -10;
    if (hour > 18) return 120 * 12 + 10;
    return (hour - 7) * 120 + (minute * 2) + 1;
  };

  const PHASE_GREETING: Record<typeof dayPhase, string> = {
    tong: "Xayrli tong",
    kun: "Xayrli kun",
    kech: "Xayrli kech",
  };
  const greetingText = () => PHASE_GREETING[dayPhase];

  // ── Mini-kalendar modifikatorlari — jonli maʼlumotdan ──
  // Dars kunlari (rejalangan mavzular) va bloklangan kunlar (yakshanba + taʼtil).
  const lessonDayKeys = useMemo(() => {
    const s = new Set<string>();
    for (const l of allLessons) if (l.scheduledDate) s.add(l.scheduledDate);
    return s;
  }, [allLessons]);

  if (!mounted) {
    return <div className="flex-1 min-h-0 bg-card/50 h-full animate-pulse"></div>;
  }

  return (
    <div className="flex flex-col h-full">
      <DashboardPageLayout className="flex-1">
        <div className={cn(dashboardGridClass, "stagger-children flex-1 min-h-0 grid-cols-1 lg:grid-cols-4 lg:grid-rows-[1fr]")}>
          
          {/* Left Column (Hero & Lessons) */}
          <div data-tour="home-overview" className={cn(dashboardStackClass, "lg:col-span-2 h-full min-h-0")}>
            {/* SALOMLASHUV KARTASI (card-05 dizayni) */}
            <WelcomeCard
              firstName={firstName}
              greeting={greetingText()}
              dateLabel={`Bugun ${currentTime.getDate()}-${MONTHS_UZ[currentTime.getMonth()].toLowerCase()}, ${DAYS_UZ_SUN[todayDow].toLowerCase()}`}
              restNote={holiday ? `${holiday.name}. Yaxshi dam oling!` : todayDow === 0 ? "Yaxshi dam oling!" : undefined}
              todayLessonCount={welcomeDemo ? welcomeDemo.todayLessonCount : todaysEvents.length}
              todayTaskCount={welcomeDemo ? welcomeDemo.todayTaskCount : todayTaskCount}
              studentCount={welcomeDemo ? welcomeDemo.studentCount : studentCount}
              classCount={welcomeDemo ? welcomeDemo.classCount : classCount}
              todayAgenda={todayAgenda}
            />

            {/* LESSONS CARD */}
            <Card className={cn("shadow-sm", panelCardClass)}>
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
                    {mounted && upcomingDisplay.length === 0 && (
                      <Empty className="border-0 p-4 gap-4">
                        <EmptyHeader>
                          <EmptyMedia><Illustration name="22" className="h-[clamp(5rem,14vh,8rem)] text-black dark:text-white" /></EmptyMedia>
                          <EmptyTitle>Haftalik darslar belgilanmagan</EmptyTitle>
                          <EmptyDescription>Jadval boʻsh — darslarni rejalashtiring.</EmptyDescription>
                        </EmptyHeader>
                        <EmptyContent>
                          <Button asChild variant="link" size="sm" className="h-auto p-0 underline">
                            <Link href="/dashboard/planner">Rejalashtirish</Link>
                          </Button>
                        </EmptyContent>
                      </Empty>
                    )}
                    {/* Kunlar boʻyicha guruhlangan darslar */}
                    {Array.from(new Map(upcomingDisplay.map(l => [l.dayName + l.date, l])).entries()).map(([dayKey, firstLesson]) => (
                      <div key={dayKey}>
                        <div className="flex items-center gap-2 mb-2">
                          <TypographySmall className="text-foreground">{firstLesson.dayName}</TypographySmall>
                          <TypographyMuted>{firstLesson.date}</TypographyMuted>
                        </div>
                        <div className="space-y-2">
                          {upcomingDisplay.filter(l => l.dayName + l.date === dayKey).map((lesson, i) => (
                            <div
                              key={lesson.id}
                              style={{
                                animationDelay: `${i * 55}ms`,
                                ["--card-accent" as string]: lesson.color,
                              } as React.CSSProperties}
                              className="list-card animate-fade-slide-up group flex items-center gap-3 p-4 cursor-pointer"
                            >
                                {/* Chap: Icon */}
                                <div
                                  className="list-card-icon size-11 rounded-full shrink-0 flex items-center justify-center text-white"
                                  style={lesson.classColor ? classTints(lesson.classColor).gradientTile : { backgroundColor: lesson.color }}
                                >
                                  <FileText className="size-5" />
                                </div>

                                {/* Oʻrta: Mavzu + Sinf/vaqt */}
                                <div className="min-w-0 flex-1 flex flex-col gap-1">
                                  <p className="text-sm font-semibold leading-snug text-foreground transition-colors duration-fast group-hover:text-primary">{lesson.topic}</p>
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
                                <div className="relative z-10 flex items-center gap-0.5 overflow-hidden max-w-0 opacity-0 group-hover/actions:max-w-16 group-hover/actions:opacity-100 transition-all duration-fast ease-standard">
                                  <Button variant="ghost" size="icon-sm" className="text-muted-foreground/60 hover:text-destructive shrink-0">
                                    <Trash2 className="size-3.5" />
                                  </Button>
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
          <div data-tour="home-schedule" className="h-full min-h-0">
            <Card className={cn("shadow-sm", panelCardClass)}>
              <CardHeader className={cn(panelCardHeaderClass, "min-h-[4.5rem] px-5 py-5!")}>
                <div className="flex items-center gap-2">
                  <SectionIcon><Clock /></SectionIcon>
                  <CardTitle>{selectedDayLabel}</CardTitle>
                </div>
              </CardHeader>
              <CardContent className={panelCardContentClass}>
                <div className={panelScrollInnerClass}>
                  {eventsDisplay.length === 0 ? (
                    <Empty className="h-full border-0 p-4 gap-4">
                      <EmptyHeader>
                        <EmptyMedia><Illustration name="28" className="h-[clamp(5rem,14vh,8rem)] text-black dark:text-white" /></EmptyMedia>
                        <EmptyTitle>
                          {selectedHoliday
                            ? `${isSelectedToday ? "Bugun" : "Bu kun"} — ${selectedHoliday.name}`
                            : isSelectedToday
                              ? "Bugun darslar rejalashtirilmagan"
                              : "Bu kunga dars yoʻq"}
                        </EmptyTitle>
                        <EmptyDescription>
                          {isSelectedToday
                            ? "Bugunga mashgʻulot yoʻq — jadvalni tekshiring."
                            : "Bu kunga dars rejalanmagan — jadvalni tekshiring."}
                        </EmptyDescription>
                      </EmptyHeader>
                      <EmptyContent>
                        <Button asChild variant="link" size="sm" className="h-auto p-0 underline">
                          <Link href="/dashboard/timetable">Dars jadvalini ochish</Link>
                        </Button>
                      </EmptyContent>
                    </Empty>
                  ) : (
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
                      
                      {/* Tanlangan kun darslari — jadval versiyasidan (7:00 boshlanish, 1 soat = 120px) */}
                      {eventsDisplay.map((ev) => {
                        const cls = liveById.get(ev.classId);
                        const demoName = DEMO_CLASS_NAMES[ev.classId];
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
                                    {cls?.name ?? demoName ?? "Nomaʼlum sinf"}
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

                      {/* Joriy vaqt chizigʻi — faqat bugun tanlangida */}
                      {isSelectedToday && (
                        <div className="absolute left-0 right-0 z-20 flex items-center pointer-events-none transition-all duration-1000 ease-linear" style={{ top: getTimelineTop() }}>
                          <div className="size-2 rounded-full bg-destructive -ml-1" />
                          <div className="flex-1 h-[2px] bg-destructive" />
                        </div>
                      )}
                    </div>
                  </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column (Calendar & Tasks) */}
          <div data-tour="home-week" className={cn(dashboardStackClass, "h-full min-h-0")}>

            {/* ── Taqvim kartasi (sarlavhasiz — faqat hafta/oy koʻrinishi) ── */}
            <Card className="shadow-sm shrink-0 py-0">
              <CardContent className="px-6 py-5">
                <WeekStrip
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  todayKey={todayKey}
                  hasLesson={(key) => lessonDayKeys.has(key)}
                  isBlocked={(date) => date.getDay() === 0 || !!getHolidayForDate(calendar, dateToKey(date))}
                />
              </CardContent>
            </Card>

            {/* ── Vazifalar kartasi ── */}
            <Card className="shadow-sm flex flex-col flex-1 min-h-0 py-0 gap-0">
              <CardHeader className="min-h-[4.5rem] px-5 py-5! flex flex-row items-center justify-between gap-2 space-y-0 border-b border-border">
                <div className="flex items-center gap-2 min-w-0">
                  <SectionIcon><SquareCheckBig /></SectionIcon>
                  <CardTitle className="truncate">Vazifalar</CardTitle>
                  {!isSelectedToday && (
                    <span className="text-xs text-muted-foreground shrink-0">· {selectedDate.getDate()}-{MONTHS_UZ[selectedDate.getMonth()].toLowerCase()}</span>
                  )}
                </div>
                <Button asChild variant="ghost" size="icon-sm" className="text-muted-foreground shrink-0">
                  <Link href="/dashboard/tasks"><ArrowRight className="size-4" /></Link>
                </Button>
              </CardHeader>
              <CardContent className="p-0 flex flex-col flex-1 min-h-0 overflow-hidden">
                {mounted && tasksDisplay.length === 0 ? (
                  <Empty className="border-0 flex-1 min-h-0 overflow-hidden p-4 gap-3">
                    <EmptyHeader>
                      <EmptyMedia><Illustration name="30" className="h-[clamp(3.5rem,11vh,6rem)] text-black dark:text-white" /></EmptyMedia>
                      <EmptyTitle>
                        {isSelectedToday
                          ? "Faol vazifa yoʻq"
                          : "Bu kunga vazifa yoʻq"}
                      </EmptyTitle>
                      <EmptyDescription>
                        {isSelectedToday
                          ? "Yangi vazifa qoʻshib rejani boshlang."
                          : "Bu kunga vazifa qoʻshing."}
                      </EmptyDescription>
                    </EmptyHeader>
                    <EmptyContent>
                      <Button asChild variant="link" size="sm" className="h-auto p-0 underline">
                        <Link href="/dashboard/tasks">Vazifa qoʻshish</Link>
                      </Button>
                    </EmptyContent>
                  </Empty>
                ) : (
                <div className="flex-1 min-h-0 overflow-y-auto scrollbar-thin flex flex-col px-6 py-5">
                  <div className="flex flex-col gap-2">
                    {tasksDisplay.map((task) => {
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
                </div>
                )}
              </CardContent>
            </Card>
          </div>

        </div>
      </DashboardPageLayout>
    </div>
  );
}

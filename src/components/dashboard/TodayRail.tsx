"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import {
  BookOpenCheck,
  CalendarDays,
  Check,
  Clock,
  Eye,
  EyeOff,
  Link as LinkIcon,
  Plus,
  UserCheck,
} from "lucide-react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription, EmptyContent } from "@/components/ui/empty";
import { Illustration } from "@/components/ui/illustration";
import { SectionIcon } from "@/components/ui/section-icon";
import { ScrollFade } from "@/components/ui/scroll-fade";
import { WeekStrip } from "@/components/dashboard/WeekStrip";
import { addDays, startOfWeekMon } from "@/lib/calendar-core/date-math";
import { sessionMatchesSlot } from "@/lib/calendar-core/resolve";
import { EventCard } from "@/components/calendar/EventCard";
import { LinkLessonDialog, type LinkLessonSlot } from "@/components/LinkLessonDialog";
import { panelCardClass, panelCardHeaderClass, panelCardContentClass } from "@/components/DashboardPage";
import { useTimetableStore } from "@/store/useTimetableStore";
import { useCalendarStore } from "@/store/useCalendarStore";
import { useLessonStore } from "@/store/useLessonStore";
import { useGradesStore } from "@/store/useGradesStore";
import { useLiveClasses } from "@/hooks/useLiveClasses";
import { useTourRequest } from "@/components/tour/tour-request";
import { makeHomeTourDemo, DEMO_CLASS_NAMES } from "@/components/tour/home-tour-demo";
import { resolveVersionForDate } from "@/lib/timetable-versions";
import { getHolidayForDate } from "@/lib/academic-calendar";
import { dateToKey } from "@/lib/date-keys";
import { classColor } from "@/lib/grades-data";
import { classTints, autoClassColor, type ClassColor } from "@/lib/class-colors";
import { lessonSessions, type LessonStatus } from "@/lib/lessons-data";
import { fmtMin } from "@/lib/timetable";
import { cn } from "@/lib/utils";

/* ════════════════════════════════════════════════════════════════════
   BUGUNGI DARSLAR RAIL — bosh sahifa oʻng ustuni (redesign M2).

   Tepada WeekStrip (kun tanlovi FAQAT shu railni filtrlaydi), soʻng
   Roʻyxat ⇄ Vaqt oʻqi koʻrinishlari (pref localStorage'da). Temporal
   holatlar: oʻtgan=xira, joriy=surfaceStrong+ring, keyingi=yumshoq
   urgʻu. Oxirgi darsdan soʻng "kun yopildi" kartasi — kunlik iqtibos
   (useQuotesStore) va ertangi kun xulosasi bilan.
   ════════════════════════════════════════════════════════════════════ */

/** Rail ishlatadigan minimal event koʻrinishi (jonli TimetableEvent ham,
    tur-demo eventi ham shu shaklga tushadi). */
type RailEvent = { id: string; classId: string; startMin: number; endMin: number };

type LessonInfo = { title: string; status: LessonStatus };

const SUNDAY_PREF_KEY = "today-rail-show-sunday";

/** Planner kunlik paneli bilan bir xil masshtab: 180px/soat = 3px/daqiqa. */
const PX_PER_MIN = 3;
/** Birinchi darsdan qancha oldin scroll qilib koʻrsatish (daqiqa). */
const SCROLL_LEAD_MIN = 15;

export function TodayRail({ now }: { now: Date }) {
  const t = useTranslations("TodayRail");
  const router = useRouter();
  const scrollRef = useRef<HTMLDivElement>(null);
  const addLesson = useLessonStore((s) => s.addLesson);
  const addScheduleForClass = useLessonStore((s) => s.addScheduleForClass);
  const [linkSlot, setLinkSlot] = useState<LinkLessonSlot | null>(null);
  const [selectedDate, setSelectedDate] = useState(() => new Date(now));
  const [weekStart, setWeekStart] = useState(() => startOfWeekMon(selectedDate));
  // Yakshanba katakchasi — koʻz tugmasi bilan yashiriladi (pref localStorage'da).
  // TodayRail faqat mount'dan keyin render qilinadi, shuning uchun lazy oʻqish xavfsiz.
  const [showSunday, setShowSunday] = useState(
    () => typeof window === "undefined" || localStorage.getItem(SUNDAY_PREF_KEY) !== "0"
  );
  const toggleSunday = () => {
    setShowSunday((v) => {
      const next = !v;
      localStorage.setItem(SUNDAY_PREF_KEY, next ? "1" : "0");
      // Yakshanba tanlangan holda yashirilsa — tanlov bugungi kunga qaytadi.
      if (!next) setSelectedDate((d) => (d.getDay() === 0 ? new Date(now) : d));
      return next;
    });
  };

  const versions = useTimetableStore((s) => s.versions);
  const calendar = useCalendarStore((s) => s.calendar);
  const classDataMap = useGradesStore((s) => s.classDataMap);
  const allLessons = useLessonStore((s) => s.lessons);
  const liveClasses = useLiveClasses();

  const todayKey = dateToKey(now);
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const selectedKey = dateToKey(selectedDate);
  const isToday = selectedKey === todayKey;
  const dow = selectedDate.getDay();
  const holiday = getHolidayForDate(calendar, selectedKey);

  const version = useMemo(
    () => resolveVersionForDate(versions, selectedKey),
    [versions, selectedKey]
  );
  const dayEvents = useMemo<RailEvent[]>(() => {
    if (holiday || dow === 0) return [];
    return (version?.events ?? [])
      .filter((e) => e.day === dow)
      .sort((a, b) => a.startMin - b.startMin);
  }, [version, holiday, dow]);

  // ── Tur-demo — boʻsh hisobda rail namunaviy darslar bilan koʻrinadi ──
  const tourDemoActive = useTourRequest((s) => s.activeTourId === "home");
  const tourDemo = useMemo(
    () => (tourDemoActive ? makeHomeTourDemo(now) : null),
    [tourDemoActive, now]
  );
  const events: RailEvent[] =
    tourDemo && dayEvents.length === 0 && !holiday && dow !== 0 ? tourDemo.events : dayEvents;

  // ── Sinf meta — jonli roʻyxat, demo idlar uchun zaxira nom/rang ──
  const liveById = useMemo(() => new Map(liveClasses.map((c) => [c.id, c])), [liveClasses]);
  const metaFor = (classId: string): { name: string; color: ClassColor } => {
    const cls = liveById.get(classId);
    if (cls) return { name: cls.name, color: classColor(cls) };
    return { name: DEMO_CLASS_NAMES[classId] ?? t("unknownClass"), color: autoClassColor(classId) };
  };

  // ── Tanlangan kun mavzu sessiyalari — event ↔ dars mosligi ──
  const daySessions = useMemo(() => {
    const list: { classId: string; startMin: number; endMin: number; info: LessonInfo }[] = [];
    for (const l of allLessons) {
      for (const s of lessonSessions(l)) {
        if (s.date !== selectedKey) continue;
        list.push({
          classId: s.classId,
          startMin: s.startMin,
          endMin: s.endMin,
          info: { title: l.title, status: l.status },
        });
      }
    }
    return list;
  }, [allLessons, selectedKey]);
  // "overlap" — rail'ning tarixiy semantikasi (planner "start-in-slot" ishlatadi).
  const lessonFor = (ev: RailEvent): LessonInfo | undefined =>
    daySessions.find((s) => sessionMatchesSlot(ev, s, "overlap"))?.info;

  // ── "Nazorat" belgisi — shu kunga summativ topshiriq muddati bor sinflar ──
  const controlClassIds = useMemo(() => {
    const set = new Set<string>();
    for (const [cid, cd] of Object.entries(classDataMap)) {
      if (!cd) continue;
      const summative = new Set(
        cd.topics.filter((tp) => tp.purpose === "summative").map((tp) => tp.id)
      );
      if (
        cd.assignments.some(
          (a) => (a.dueDate ?? a.date) === selectedKey && !!a.topicId && summative.has(a.topicId)
        )
      )
        set.add(cid);
    }
    return set;
  }, [classDataMap, selectedKey]);

  // ── Temporal holat (faqat bugun) ──
  const nextEvent = isToday ? events.find((e) => e.startMin > nowMin) : undefined;
  const temporalOf = (ev: RailEvent): "past" | "current" | "next" | "none" => {
    if (!isToday) return "none";
    if (ev.endMin <= nowMin) return "past";
    if (ev.startMin <= nowMin) return "current";
    if (nextEvent && ev.id === nextEvent.id) return "next";
    return "none";
  };

  const lastEnd = events.length ? events[events.length - 1].endMin : 0;
  const dayClosed = isToday && events.length > 0 && nowMin >= lastEnd;

  // ── Toʻliq sutkalik toʻr endi scroll boʻladi — birinchi darsdan ~15 daqiqa
  //    oldin koʻrinadigan qilib avtomatik pastga aylantiramiz. ──
  useEffect(() => {
    const el = scrollRef.current;
    if (!el || events.length === 0) return;
    const targetMin = Math.max(events[0].startMin - SCROLL_LEAD_MIN, 0);
    el.scrollTop = targetMin * PX_PER_MIN;
  }, [selectedKey, events]);

  // ── WeekStrip modifikatorlari ──
  const lessonDayKeys = useMemo(() => {
    const s = new Set<string>();
    for (const l of allLessons) for (const sess of lessonSessions(l)) s.add(sess.date);
    return s;
  }, [allLessons]);

  // ── Ertangi kun xulosasi — "kun yopildi" kartasi uchun ──
  const tomorrow = useMemo(() => {
    const d = addDays(now, 1);
    const key = dateToKey(d);
    if (getHolidayForDate(calendar, key) || d.getDay() === 0) return { count: 0, firstMin: null as number | null };
    const evs = (resolveVersionForDate(versions, key)?.events ?? []).filter(
      (e) => e.day === d.getDay()
    );
    if (!evs.length) return { count: 0, firstMin: null as number | null };
    return { count: evs.length, firstMin: Math.min(...evs.map((e) => e.startMin)) };
  }, [now, calendar, versions]);

  // ── Yaratish — toʻgʻridan-toʻgʻri dars muharrirga oʻtadi (planner bilan bir xil). ──
  const createLessonInSlot = (ev: RailEvent) => {
    const id = addLesson({ classId: ev.classId, unitId: null, title: "", status: "Draft" });
    addScheduleForClass(id, ev.classId, selectedKey, ev.startMin, ev.endMin);
    router.push(`/lessons/${id}`);
  };

  return (
    <Card className={panelCardClass}>
      {/* border-b-0: kontent (kun tasmasi) darhol davom etadi, ajratuvchi chiziq keraksiz — panel-language-v1 "no-divider" istisnosi */}
      <CardHeader className={cn(panelCardHeaderClass, "border-b-0 pt-4! pb-4!")}>
        <div className="flex min-w-0 items-center gap-2">
          <SectionIcon>
            <CalendarDays />
          </SectionIcon>
          <CardTitle className="truncate">{t("title")}</CardTitle>
        </div>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={showSunday ? t("hideSunday") : t("showSunday")}
              aria-pressed={!showSunday}
              className="ml-auto shrink-0 text-muted-foreground hover:text-foreground"
              onClick={toggleSunday}
            >
              {showSunday ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
            </Button>
          </TooltipTrigger>
          <TooltipContent>{showSunday ? t("hideSunday") : t("showSunday")}</TooltipContent>
        </Tooltip>
      </CardHeader>

      <div data-tour="home-week" className="shrink-0 px-4 pb-3">
        <WeekStrip
          selected={selectedDate}
          onSelect={setSelectedDate}
          todayKey={todayKey}
          hasLesson={(key) => lessonDayKeys.has(key)}
          isBlocked={(date) => date.getDay() === 0 || !!getHolidayForDate(calendar, dateToKey(date))}
          weekStart={weekStart}
          onWeekStartChange={setWeekStart}
          showSunday={showSunday}
        />
      </div>

      <div data-tour="home-schedule" className="relative flex min-h-0 flex-1 flex-col">
        <ScrollFade position="top" />
        <div ref={scrollRef} className={panelCardContentClass}>
          <div className="px-4 py-4">
            {events.length === 0 ? (
              <Empty className="border-0 p-4 gap-4">
                <EmptyHeader>
                  <EmptyMedia>
                    <Illustration name="28" className="h-[clamp(4.5rem,12vh,7rem)] text-black dark:text-white" />
                  </EmptyMedia>
                  <EmptyTitle>
                    {holiday
                      ? t("emptyHolidayTitle", { holiday: holiday.name })
                      : dow === 0
                        ? t("emptySundayTitle")
                        : isToday
                          ? t("emptyTodayTitle")
                          : t("emptyDayTitle")}
                  </EmptyTitle>
                  <EmptyDescription>
                    {holiday || dow === 0 ? t("emptyRestDescription") : t("emptyDescription")}
                  </EmptyDescription>
                </EmptyHeader>
                {!holiday && dow !== 0 && (
                  <EmptyContent>
                    <Button asChild variant="link" size="sm" className="h-auto p-0 underline">
                      <Link href="/dashboard/timetable">{t("openSchedule")}</Link>
                    </Button>
                  </EmptyContent>
                )}
              </Empty>
            ) : (
              <DayGridView
                events={events}
                nowMin={nowMin}
                isToday={isToday}
                metaFor={metaFor}
                lessonFor={lessonFor}
                controlClassIds={controlClassIds}
                temporalOf={temporalOf}
                onCreate={createLessonInSlot}
                onLink={(ev) =>
                  setLinkSlot({
                    dateKey: selectedKey,
                    classId: ev.classId,
                    startMin: ev.startMin,
                    endMin: ev.endMin,
                  })
                }
              />
            )}

            {dayClosed && (
              <div className="relative mt-4 overflow-hidden rounded-xl border border-success/30 bg-success/5 p-4">
                <div className="flex items-center gap-2">
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-success/15 text-success">
                    <Check className="size-3.5" strokeWidth={3} />
                  </span>
                  <span className="flex-1 text-sm font-semibold text-foreground">{t("dayDone")}</span>
                </div>
                {/* Iqtibos ataylab bu yerda emas — u bosh sahifa hero'sida
                    koʻrsatiladi (bir kunda ikki joyda takrorlanmasligi uchun). */}
                <p className="mt-2.5 text-xs text-muted-foreground">
                  {tomorrow.count > 0 && tomorrow.firstMin != null
                    ? t("tomorrowInfo", { count: tomorrow.count, time: fmtMin(tomorrow.firstMin) })
                    : t("tomorrowFree")}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <LinkLessonDialog slot={linkSlot} onOpenChange={(open) => !open && setLinkSlot(null)} />
    </Card>
  );
}

/* ─────────────────────── Kunlik grafik (Google/Apple Calendar uslubi) ───────────────────────
   Bitta ustunli soat-toʻri: chapda soat belgilari, oʻngda darslar davomiylikka
   mutanosib balandlikda joylashadi (bir oʻqituvchining darslari kesishmaydi —
   koʻp-ustunli overlap logikasi kerak emas). Bugungi kun uchun "hozir" chizigʻi. */

function hourLabel(min: number): string {
  const h = Math.floor(min / 60) % 24;
  return `${String(h).padStart(2, "0")}:00`;
}

const DAY_START_MIN = 0;
const DAY_END_MIN = 24 * 60;

function DayGridView({
  events,
  nowMin,
  isToday,
  metaFor,
  lessonFor,
  controlClassIds,
  temporalOf,
  onCreate,
  onLink,
}: {
  events: RailEvent[];
  nowMin: number;
  isToday: boolean;
  metaFor: (classId: string) => { name: string; color: ClassColor };
  lessonFor: (ev: RailEvent) => LessonInfo | undefined;
  controlClassIds: Set<string>;
  temporalOf: (ev: RailEvent) => "past" | "current" | "next" | "none";
  /** Boʻsh slotga mavzu yaratish / mavjudini ulash — planner bilan bir xil. */
  onCreate: (ev: RailEvent) => void;
  onLink: (ev: RailEvent) => void;
}) {
  const t = useTranslations("TodayRail");
  const tp = useTranslations("PlannerView");

  // Toʻliq sutka — kunlik panel (planner) bilan bir xil, scroll orqali koʻriladi.
  const rangeStart = DAY_START_MIN;
  const rangeEnd = DAY_END_MIN;
  const hours = useMemo(() => {
    const list: number[] = [];
    for (let m = rangeStart; m <= rangeEnd; m += 60) list.push(m);
    return list;
  }, [rangeStart, rangeEnd]);
  const gridHeight = (rangeEnd - rangeStart) * PX_PER_MIN;
  const showNowLine = isToday && nowMin >= rangeStart && nowMin <= rangeEnd;

  return (
    <div className="relative" style={{ height: gridHeight }}>
      {hours.map((m) => (
        <div
          key={m}
          className="absolute inset-x-0 flex items-start"
          style={{ top: (m - rangeStart) * PX_PER_MIN }}
        >
          <span className="w-10 shrink-0 -translate-y-1/2 text-right text-[10px] tabular-nums text-muted-foreground/70">
            {hourLabel(m)}
          </span>
          <div className="ml-2 h-px flex-1 bg-border/60" />
        </div>
      ))}

      {showNowLine && (
        <div
          className="absolute inset-x-0 z-20 flex items-center"
          style={{ top: (nowMin - rangeStart) * PX_PER_MIN }}
        >
          <span className="w-10 shrink-0 -translate-y-1/2 text-right text-[10px] font-semibold tabular-nums text-destructive">
            {fmtMin(nowMin)}
          </span>
          <div className="relative ml-2 h-px flex-1 bg-destructive">
            <span className="absolute -left-1 top-1/2 size-1.5 -translate-y-1/2 rounded-full bg-destructive" />
          </div>
        </div>
      )}

      {events.map((ev) => {
        const meta = metaFor(ev.classId);
        const tints = classTints(meta.color);
        const lesson = lessonFor(ev);
        const hasLesson = !!lesson;
        const temporal = temporalOf(ev);
        const control = controlClassIds.has(ev.classId);
        const top = (ev.startMin - rangeStart) * PX_PER_MIN;
        const height = Math.max((ev.endMin - ev.startMin) * PX_PER_MIN, 32);
        const compact = height < 60;
        // Qisqa darslarda ikki tugma ustma-ust (har biri ~36px + boʻshliq)
        // sigʻmaydi — shunday holatda faqat ikonka koʻrsatiladi (yonma-yon).
        const roomy = height >= 120;
        return (
          <EventCard
            key={ev.id}
            color={meta.color}
            state={hasLesson ? "filled" : "empty"}
            title={meta.name}
            density="cozy"
            temporal={temporal === "none" ? undefined : temporal}
            titleRowClassName="pr-14"
            subtitle={
              <>
                <Clock className="size-3 shrink-0" />
                {fmtMin(ev.startMin)}–{fmtMin(ev.endMin)}
              </>
            }
            trailing={
              control ? (
                <Badge
                  variant="outline"
                  className="shrink-0 rounded-full border-warning/40 bg-warning/10 px-1.5 py-0 text-[10px] font-semibold text-warning"
                >
                  {t("controlBadge")}
                </Badge>
              ) : undefined
            }
            actions={<EventActions classId={ev.classId} solidBg />}
            className="absolute isolate"
            style={{ top, height, left: 48, right: 0 }}
          >
            {!compact && hasLesson && (
              /* Haftalik/kunlik panel bilan bir xil naqsh — mavzu tashqi (sinf)
                 karta ICHIDA alohida oq chip sifatida chiqadi. */
              <div className="relative mt-1 flex items-center gap-2 overflow-hidden rounded-sm border border-border bg-card p-1.5 pr-2.5 text-left shadow-xs">
                <span style={tints.iconBg} className="flex size-6 shrink-0 items-center justify-center rounded-full">
                  {lesson.status === "Completed" ? (
                    <Check style={tints.iconText} className="size-3.5" strokeWidth={3} />
                  ) : (
                    <BookOpenCheck style={tints.iconText} className="size-3.5" />
                  )}
                </span>
                <span className="truncate text-xs font-semibold text-foreground">
                  {lesson.title || t("untitledTopic")}
                </span>
              </div>
            )}
            {!compact && !hasLesson && (
              /* Tinch holatda "Reja yoʻq" yorligʻi; kartaga hover qilinganda
                 (group/ev — EventCard'ning oʻzida) planner'dagi bilan bir xil
                 ikki tez-amal tugmasi (Yaratish / Ulash) ustidan chiqadi. */
              <div className={cn("relative mt-0.5", roomy ? "min-h-[78px]" : "min-h-[22px]")}>
                <p
                  style={tints.textOnTint}
                  className="absolute inset-0 truncate text-xs font-medium leading-snug opacity-100 transition-opacity duration-fast group-hover/ev:opacity-0"
                >
                  {t("noPlan")}
                </p>
                <div
                  className={cn(
                    "absolute inset-0 flex gap-1.5 opacity-0 transition-opacity duration-fast",
                    roomy ? "flex-col" : "justify-center",
                    "pointer-events-none group-hover/ev:pointer-events-auto group-hover/ev:opacity-100",
                    "focus-within:pointer-events-auto focus-within:opacity-100",
                    "[@media(hover:none)]:pointer-events-auto [@media(hover:none)]:opacity-100"
                  )}
                >
                  {roomy ? (
                    <>
                      <button
                        type="button"
                        onClick={() => onCreate(ev)}
                        className="flex h-9 w-full cursor-pointer items-center justify-center gap-1.5 rounded-md bg-foreground/6 px-3 text-sm font-semibold text-foreground/80 transition-colors duration-fast hover:bg-foreground/12 hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--ring)]"
                      >
                        <Plus className="size-4 shrink-0" strokeWidth={2.5} />
                        <span className="truncate">{tp("create")}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => onLink(ev)}
                        className="flex h-9 w-full cursor-pointer items-center justify-center gap-1.5 rounded-md bg-foreground/6 px-3 text-sm font-semibold text-foreground/80 transition-colors duration-fast hover:bg-foreground/12 hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--ring)]"
                      >
                        <LinkIcon className="size-4 shrink-0" />
                        <span className="truncate">{tp("link")}</span>
                      </button>
                    </>
                  ) : (
                    /* Tor karta — faqat ikonka, tooltip orqali izohlangan. */
                    <>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            type="button"
                            aria-label={tp("create")}
                            onClick={() => onCreate(ev)}
                            className="flex size-6 shrink-0 cursor-pointer items-center justify-center rounded-sm bg-foreground/6 text-foreground/80 transition-colors duration-fast hover:bg-foreground/12 hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--ring)]"
                          >
                            <Plus className="size-3.5" strokeWidth={2.5} />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent>{tp("create")}</TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            type="button"
                            aria-label={tp("link")}
                            onClick={() => onLink(ev)}
                            className="flex size-6 shrink-0 cursor-pointer items-center justify-center rounded-sm bg-foreground/6 text-foreground/80 transition-colors duration-fast hover:bg-foreground/12 hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--ring)]"
                          >
                            <LinkIcon className="size-3.5" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent>{tp("link")}</TooltipContent>
                      </Tooltip>
                    </>
                  )}
                </div>
              </div>
            )}
          </EventCard>
        );
      })}
    </div>
  );
}

/* ─────────────── Davomat/Jurnal harakatlari (deep-link) ─────────────── */

function EventActions({ classId, solidBg }: { classId: string; solidBg?: boolean }) {
  const t = useTranslations("TodayRail");
  return (
    <div
      className={cn(
        "flex shrink-0 items-center gap-0.5",
        solidBg && "rounded-md bg-background/85 shadow-sm backdrop-blur-sm"
      )}
    >
      <Tooltip>
        <TooltipTrigger asChild>
          <Button asChild variant="ghost" size="icon-sm" className="text-muted-foreground hover:text-foreground">
            <Link href={`/dashboard/attendance?classId=${encodeURIComponent(classId)}`}>
              <UserCheck className="size-3.5" />
            </Link>
          </Button>
        </TooltipTrigger>
        <TooltipContent>{t("attendanceAction")}</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button asChild variant="ghost" size="icon-sm" className="text-muted-foreground hover:text-foreground">
            <Link href={`/dashboard/grades?classId=${encodeURIComponent(classId)}`}>
              <BookOpenCheck className="size-3.5" />
            </Link>
          </Button>
        </TooltipTrigger>
        <TooltipContent>{t("gradesAction")}</TooltipContent>
      </Tooltip>
    </div>
  );
}

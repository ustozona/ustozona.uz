"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import {
  BookOpenCheck,
  CalendarDays,
  Check,
  Clock,
  Quote as QuoteIcon,
  Trash2,
  UserCheck,
} from "lucide-react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription, EmptyContent } from "@/components/ui/empty";
import { Illustration } from "@/components/ui/illustration";
import { SectionIcon } from "@/components/ui/section-icon";
import { ScrollFade } from "@/components/ui/scroll-fade";
import { WeekStrip } from "@/components/dashboard/WeekStrip";
import { addDays, startOfWeekMon } from "@/lib/calendar-core/date-math";
import { sessionMatchesSlot } from "@/lib/calendar-core/resolve";
import { EventCard } from "@/components/calendar/EventCard";
import { panelCardClass, panelCardHeaderClass, panelCardContentClass } from "@/components/DashboardPage";
import { useTimetableStore } from "@/store/useTimetableStore";
import { useCalendarStore } from "@/store/useCalendarStore";
import { useLessonStore } from "@/store/useLessonStore";
import { useGradesStore } from "@/store/useGradesStore";
import { useQuotesStore } from "@/store/useQuotesStore";
import { useLiveClasses } from "@/hooks/useLiveClasses";
import { useTourRequest } from "@/components/tour/tour-request";
import { makeHomeTourDemo, DEMO_CLASS_NAMES } from "@/components/tour/home-tour-demo";
import { resolveVersionForDate } from "@/lib/timetable-versions";
import { computePeriods, type PeriodRow } from "@/lib/bell-schedule";
import { getHolidayForDate } from "@/lib/academic-calendar";
import { dateToKey } from "@/lib/date-keys";
import { classColor } from "@/lib/grades-data";
import { classTints, autoClassColor, type ClassColor } from "@/lib/class-colors";
import { lessonSessions, type LessonStatus } from "@/lib/lessons-data";
import { dailyQuote } from "@/lib/quotes";
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

export function TodayRail({ now }: { now: Date }) {
  const t = useTranslations("TodayRail");
  const [selectedDate, setSelectedDate] = useState(() => new Date(now));
  const [weekStart, setWeekStart] = useState(() => startOfWeekMon(selectedDate));
  const [quotesOpen, setQuotesOpen] = useState(false);

  const versions = useTimetableStore((s) => s.versions);
  const calendar = useCalendarStore((s) => s.calendar);
  const classDataMap = useGradesStore((s) => s.classDataMap);
  const allLessons = useLessonStore((s) => s.lessons);
  const quotes = useQuotesStore((s) => s.quotes);
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
          (a) => (a.dueDate ?? a.date) === selectedKey && summative.has(a.topicId)
        )
      )
        set.add(cid);
    }
    return set;
  }, [classDataMap, selectedKey]);

  // ── Qoʻngʻiroq periodlari — vaqt oʻqi qatorlari va oraliq chiplari ──
  const periods = useMemo(
    () => (version ? computePeriods(version.bellConfig) : []),
    [version]
  );

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

  const quote = useMemo(() => dailyQuote(quotes, todayKey), [quotes, todayKey]);

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
        />
      </div>

      <div data-tour="home-schedule" className="relative flex min-h-0 flex-1 flex-col">
        <ScrollFade position="top" />
        <div className={panelCardContentClass}>
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
                periods={periods}
                nowMin={nowMin}
                isToday={isToday}
                metaFor={metaFor}
                lessonFor={lessonFor}
                controlClassIds={controlClassIds}
                temporalOf={temporalOf}
              />
            )}

            {dayClosed && (
              <div className="relative mt-4 overflow-hidden rounded-xl border border-success/30 bg-success/5 p-4">
                <div className="flex items-center gap-2">
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-success/15 text-success">
                    <Check className="size-3.5" strokeWidth={3} />
                  </span>
                  <span className="flex-1 text-sm font-semibold text-foreground">{t("dayDone")}</span>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        className="text-muted-foreground/70 hover:text-foreground"
                        onClick={() => setQuotesOpen(true)}
                      >
                        <QuoteIcon className="size-3.5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>{t("quotesManage")}</TooltipContent>
                  </Tooltip>
                </div>
                {quote && (
                  <blockquote className="mt-2.5 text-sm italic leading-relaxed text-foreground/80">
                    «{quote.text}»
                    {quote.author && (
                      <footer className="mt-1 text-xs not-italic text-muted-foreground">
                        — {quote.author}
                      </footer>
                    )}
                  </blockquote>
                )}
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

      <QuotesDialog open={quotesOpen} onOpenChange={setQuotesOpen} />
    </Card>
  );
}

/* ─────────────────────── Kunlik grafik (Google/Apple Calendar uslubi) ───────────────────────
   Bitta ustunli soat-toʻri: chapda soat belgilari, oʻngda darslar davomiylikka
   mutanosib balandlikda joylashadi (bir oʻqituvchining darslari kesishmaydi —
   koʻp-ustunli overlap logikasi kerak emas). Bugungi kun uchun "hozir" chizigʻi. */

const PX_PER_MIN = 1;

function hourLabel(min: number): string {
  const h = Math.floor(min / 60) % 24;
  return `${String(h).padStart(2, "0")}:00`;
}

function DayGridView({
  events,
  periods,
  nowMin,
  isToday,
  metaFor,
  lessonFor,
  controlClassIds,
  temporalOf,
}: {
  events: RailEvent[];
  periods: PeriodRow[];
  nowMin: number;
  isToday: boolean;
  metaFor: (classId: string) => { name: string; color: ClassColor };
  lessonFor: (ev: RailEvent) => LessonInfo | undefined;
  controlClassIds: Set<string>;
  temporalOf: (ev: RailEvent) => "past" | "current" | "next" | "none";
}) {
  const t = useTranslations("TodayRail");

  // Diapazon — qoʻngʻiroq jadvali (boʻsh vaqt ham koʻrinadi), zaxiraga darslar
  // chegarasi; har ikkalasi ham yoʻq boʻlsa render qilinmaydi (yuqorida Empty).
  const rangeStart = Math.floor(
    (periods.length ? Math.min(...periods.map((p) => p.startMin)) : events[0].startMin) / 60
  ) * 60;
  const rangeEnd = Math.ceil(
    (periods.length ? Math.max(...periods.map((p) => p.endMin)) : events[events.length - 1].endMin) / 60
  ) * 60;
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
        const temporal = temporalOf(ev);
        const control = controlClassIds.has(ev.classId);
        const top = (ev.startMin - rangeStart) * PX_PER_MIN;
        const height = Math.max((ev.endMin - ev.startMin) * PX_PER_MIN, 32);
        const compact = height < 44;
        return (
          <EventCard
            key={ev.id}
            color={meta.color}
            title={meta.name}
            corner={false}
            temporal={temporal === "none" ? undefined : temporal}
            titleRowClassName="pr-14"
            badges={
              control ? (
                <Badge
                  variant="outline"
                  className="shrink-0 rounded-full border-warning/40 bg-warning/10 px-1.5 py-0 text-[10px] font-semibold text-warning"
                >
                  {t("controlBadge")}
                </Badge>
              ) : undefined
            }
            className="group absolute isolate rounded-lg p-2"
            style={{ top, height, left: 48, right: 0 }}
          >
            {!compact && (
              <p
                style={lesson ? { ...tints.textStrong } : undefined}
                className={cn(
                  "mt-0.5 truncate text-xs leading-snug",
                  lesson ? "opacity-80" : "font-medium text-warning"
                )}
              >
                {lesson ? lesson.title || t("untitledTopic") : t("noPlan")}
              </p>
            )}
            {!compact && (
              <p style={tints.textStrong} className="mt-0.5 flex items-center gap-1 text-[11px] tabular-nums opacity-75">
                <Clock className="size-3 shrink-0" />
                {fmtMin(ev.startMin)} – {fmtMin(ev.endMin)}
              </p>
            )}
            <div className="absolute right-1.5 top-1.5 z-10">
              <EventActions classId={ev.classId} solidBg />
            </div>
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
        "flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity duration-fast group-hover:opacity-100 focus-within:opacity-100",
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

/* ─────────────── Iqtiboslar boshqaruv dialogi ─────────────── */

function QuotesDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const t = useTranslations("TodayRail");
  const quotes = useQuotesStore((s) => s.quotes);
  const addQuote = useQuotesStore((s) => s.addQuote);
  const removeQuote = useQuotesStore((s) => s.removeQuote);
  const [text, setText] = useState("");
  const [author, setAuthor] = useState("");

  const submit = () => {
    if (!text.trim()) return;
    addQuote(text, author);
    setText("");
    setAuthor("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("quotesTitle")}</DialogTitle>
          <DialogDescription>{t("quotesDescription")}</DialogDescription>
        </DialogHeader>
        <div className="flex max-h-56 flex-col gap-1 overflow-y-auto scrollbar-thin pr-1">
          {quotes.length === 0 && (
            <p className="py-4 text-center text-sm text-muted-foreground">{t("quotesEmpty")}</p>
          )}
          {quotes.map((q) => (
            <div
              key={q.id}
              className="group flex items-start gap-2 rounded-lg px-2.5 py-2 transition-colors hover:bg-muted/60"
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm leading-snug text-foreground">{q.text}</p>
                {q.author && <p className="mt-0.5 text-xs text-muted-foreground">— {q.author}</p>}
              </div>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={t("quotesDelete")}
                className="shrink-0 text-muted-foreground/50 opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
                onClick={() => removeQuote(q.id)}
              >
                <Trash2 className="size-3.5" />
              </Button>
            </div>
          ))}
        </div>
        <div className="flex flex-col gap-2 border-t border-border pt-3">
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={t("quotesAddPlaceholder")}
            className="min-h-16 resize-none text-sm"
          />
          <div className="flex items-center gap-2">
            <Input
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder={t("quotesAuthorPlaceholder")}
              className="h-9 flex-1 text-sm"
            />
            <Button size="sm" onClick={submit} disabled={!text.trim()}>
              {t("quotesAdd")}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

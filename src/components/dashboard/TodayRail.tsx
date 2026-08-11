"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import {
  BookOpenCheck,
  CalendarDays,
  Check,
  Eye,
  EyeOff,
  Link as LinkIcon,
  MoreHorizontal,
  UserCheck,
} from "lucide-react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription, EmptyContent } from "@/components/ui/empty";
import { Illustration } from "@/components/ui/illustration";
import { SectionIcon } from "@/components/ui/section-icon";
import { ScrollFade } from "@/components/ui/scroll-fade";
import { WeekStrip } from "@/components/dashboard/WeekStrip";
import { addDays, startOfWeekMon } from "@/lib/calendar-core/date-math";
import { sessionMatchesSlot } from "@/lib/calendar-core/resolve";
import { EventCard } from "@/components/calendar/EventCard";
import { AddTopicButton } from "@/components/calendar/AddTopicButton";
import { LessonChip } from "@/components/calendar/LessonChip";
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
import { autoClassColor, type ClassColor } from "@/lib/class-colors";
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

type LessonInfo = { id: string; title: string; status: LessonStatus };

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
          info: { id: l.id, title: l.title, status: l.status },
        });
      }
    }
    return list;
  }, [allLessons, selectedKey]);
  // "overlap" — rail'ning tarixiy semantikasi (planner "start-in-slot" ishlatadi).
  const lessonFor = (ev: RailEvent): LessonInfo | undefined =>
    daySessions.find((s) => sessionMatchesSlot(ev, s, "overlap"))?.info;

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

  // ── Yaratish — toʻgʻridan-toʻgʻri dars muharrirga oʻtadi (planner bilan bir xil).
  //    Sarlavha boʻsh emas, "(nomsiz mavzu)" bilan boshlanadi — oʻqituvchi
  //    darhol muharrirda oʻzgartiraveradi, lekin xaritada/rejada butunlay
  //    boʻsh nom qoldirmaydi. ──
  const createLessonInSlot = (ev: RailEvent) => {
    const id = addLesson({ classId: ev.classId, unitId: null, title: t("untitledTopic"), status: "Draft" });
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
                onOpenLesson={(id) => router.push(`/lessons/${id}`)}
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
  temporalOf,
  onCreate,
  onLink,
  onOpenLesson,
}: {
  events: RailEvent[];
  nowMin: number;
  isToday: boolean;
  metaFor: (classId: string) => { name: string; color: ClassColor };
  lessonFor: (ev: RailEvent) => LessonInfo | undefined;
  temporalOf: (ev: RailEvent) => "past" | "current" | "next" | "none";
  /** Boʻsh slotga mavzu yaratish / mavjudini ulash — planner bilan bir xil. */
  onCreate: (ev: RailEvent) => void;
  onLink: (ev: RailEvent) => void;
  onOpenLesson: (lessonId: string) => void;
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
        const lesson = lessonFor(ev);
        const hasLesson = !!lesson;
        const temporal = temporalOf(ev);
        const top = (ev.startMin - rangeStart) * PX_PER_MIN;
        const height = Math.max((ev.endMin - ev.startMin) * PX_PER_MIN, 32);
        const compact = height < 60;
        return (
          <EventCard
            key={ev.id}
            color={meta.color}
            state={hasLesson ? "filled" : "empty"}
            title={meta.name}
            density="cozy"
            temporal={temporal === "none" ? undefined : temporal}
            /* ── Amal zonasi va boʻshliq shkalasi ───────────────────────────
               Karta `p-3` (12px). `⋯` — asosiy tugma bilan BIR XIL 36px quti
               (`size-9`), shuning uchun sarlavha qatoriga 40px zaxira (`pr-10`)
               kerak: 4px gutter + 36px quti.
               Nega gutter 12px emas, 4px: `⋯` ghost (fonsiz), shuning uchun u
               qutisi boʻyicha emas, IKONKASI boʻyicha tekislanadi — 36px quti
               ichida 16px ikonka atrofida 10px oʻz padding'i bor, 4+10 = 14px
               ≈ kartaning 12px kontent gutter'i.
               Tor kartada (`compact`, <60px) 36px sigʻmaydi — u yerda kichik
               24px token qoladi, zaxira ham `pr-8`.
               `⋯` HAR IKKALA holatda ham aynan shu joyda — oʻng-yuqorida.
               Ilgari boʻsh slotda u pastki qatorga, "Mavzu qoʻshish" yoniga
               tushardi: bir xil amal ikki xil joyda turgani uchun mushak
               xotirasi ishlamasdi va koʻz uni har safar qidirishga majbur
               edi. Karta ustidagi ortiqcha amal menyusining kanonik oʻrni —
               oʻng-yuqori burchak. */
            titleRowClassName={compact ? "pr-8" : "pr-10"}
            subtitle={`${fmtMin(ev.startMin)} — ${fmtMin(ev.endMin)}`}
            actions={
              <EventActions
                classId={ev.classId}
                triggerClassName={compact ? undefined : "size-9 [&_svg]:size-4"}
              />
            }
            className="absolute isolate"
            style={{ top, height, left: 48, right: 0 }}
          >
            {!compact && hasLesson && (
              /* Mavzu chipi — umumiy [[LessonChip]] (Planner ham shuni
                 ishlatadi). Karta ostiga tekislangan (mt-auto). */
              <LessonChip
                color={meta.color}
                title={lesson.title || t("untitledTopic")}
                done={lesson.status === "Completed"}
                className="mt-auto"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenLesson(lesson.id);
                }}
              />
            )}
            {!compact && !hasLesson && (
              /* CHORLOVCHI boʼsh slot. Eski yechimda "Reja yoʻq" yorligʻi
                 hoverda ikki tugmaga almashardi: rail boʻylab sichqoncha
                 yurganda kartalar "miltillardi", oʻlik matn hech nima taklif
                 qilmasdi, Yaratish/Ulash esa teng ogʻirlikda edi. Endi bitta
                 DOIM koʻrinadigan chorlov — aynan mavzu chipi turadigan joyda
                 (mt-auto, h-9), shuning uchun boʻsh↔toʻlgan oʻtishda geometriya
                 sakramaydi. Ikkilamchi "Ulash" — Planner bilan bir xil: SHU
                 QATORDA, "Mavzu qoʻshish" uslubida (dashed+qavs+gradient),
                 faqat ikon-tugma sifatida (`iconOnly`). Ilgari yuqoridagi `⋯`
                 menyusida edi — bir xil chorlov ikki xil vizual tilda
                 (ghost menyu vs dashed-qavs tugma) turishi nomuvofiq edi.
                 [[AddTopicButton]] */
              <div className="mt-auto flex shrink-0 items-stretch gap-1.5">
                <AddTopicButton
                  color={meta.color}
                  label={t("addTopic")}
                  tooltip={t("addTopicTooltip")}
                  onClick={(e) => {
                    e.stopPropagation();
                    onCreate(ev);
                  }}
                />
                <AddTopicButton
                  color={meta.color}
                  label={tp("link")}
                  tooltip={t("linkTooltip")}
                  icon={LinkIcon}
                  iconOnly
                  onClick={(e) => {
                    e.stopPropagation();
                    onLink(ev);
                  }}
                />
              </div>
            )}
          </EventCard>
        );
      })}
    </div>
  );
}

/* ─────────────── Davomat/Jurnal harakatlari (deep-link) ─────────────── */

/* I variant — BITTA MENYU. Ilgari uchta 24px ikon-katak segmentli guruhda
   turardi: 14px ikonka atrofida 5px joy (dizayn tizimi 36px nazoratining
   uchdan ikkisi), ajratgich chiziqlari shu oʻlchamda ikonkalar bilan
   qorishardi, guruh sarlavhadan ~84px oʻgʻirlardi va har ikonka tooltipsiz
   taxmin talab qilardi. Endi bitta 26px `⋯` — sarlavha deyarli toʻliq
   boʻshaydi, har amal menyuda YOZUV bilan chiqadi.
   Hover-reveal logikasi shart emas: EventCard `actions` slotining oʻzi
   `group-hover/ev` bilan boshqariladi. */
function EventActions({
  classId,
  triggerClassName,
}: {
  classId: string;
  /** Joylashuvga qarab oʻlcham tokeni — ikkalasi ham `Button` komponentining
      oʻz oʻlchamlaridan olingan ([[design-system]]), oraliq qiymat emas:
      — default `icon-xs` = 24px quti + 12px ikonka — faqat TOR kartada;
      — `icon` = 36px quti + 16px ikonka — asosiy holat, "Mavzu qoʻshish"
        tugmasining `h-9` balandligiga aynan teng. */
  triggerClassName?: string;
}) {
  const t = useTranslations("TodayRail");
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={t("moreActions")}
        onClick={(e) => e.stopPropagation()}
        className={cn(
          /* Ghost: fon/chegara/soya yoʻq — yonidagi "Mavzu qoʻshish" ham
             ghost, ikkalasi bitta materialda. Ilgari `⋯` oq fon + chegara +
             soya bilan "koʻtarilgan" nazorat edi va ikkilamchi boʻlishiga
             qaramay asosiy CTA dan ustunroq oʻqilardi. */
          "flex size-6 shrink-0 cursor-pointer items-center justify-center rounded-md text-foreground/55 transition-colors duration-fast hover:bg-foreground/8 hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--ring)] data-[state=open]:bg-accent data-[state=open]:text-foreground [&_svg]:size-3",
          triggerClassName,
        )}
      >
        <MoreHorizontal />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-40" onClick={(e) => e.stopPropagation()}>
        <DropdownMenuItem asChild>
          <Link href={`/dashboard/attendance?classId=${encodeURIComponent(classId)}`}>
            <UserCheck />
            {t("attendanceAction")}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href={`/dashboard/grades?classId=${encodeURIComponent(classId)}`}>
            <BookOpenCheck />
            {t("gradesAction")}
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

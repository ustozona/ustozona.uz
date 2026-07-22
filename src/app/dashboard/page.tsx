"use client";

import { useTranslations } from "next-intl";
import { useState, useEffect, useMemo } from "react";
import { useTimetableStore } from "@/store/useTimetableStore";
import { useCalendarStore } from "@/store/useCalendarStore";
import { useAttendanceStore } from "@/store/useAttendanceStore";
import { HomeHero, type HeroEvent } from "@/components/dashboard/HomeHero";
import { TodayRail } from "@/components/dashboard/TodayRail";
import { QueueSection } from "@/components/dashboard/QueueSection";
import { NextLessonsCard } from "@/components/dashboard/NextLessonsCard";
import { attendanceEntryForDay } from "@/lib/home-metrics";
import { resolveVersionForDate } from "@/lib/timetable-versions";
import { getHolidayForDate } from "@/lib/academic-calendar";
import { dateToKey } from "@/lib/date-keys";
import { getSunTimes, getDayPhase } from "@/lib/sun";
import { useLiveClasses } from "@/hooks/useLiveClasses";
import { DAYS_UZ_SUN, MONTHS_UZ } from "@/lib/localization";
import { cn } from "@/lib/utils";
import { useSettingsStore } from "@/store/useSettingsStore";
import { useTourRequest } from "@/components/tour/tour-request";
import { makeHomeTourDemo, DEMO_CLASS_NAMES } from "@/components/tour/home-tour-demo";
import DashboardPageLayout, {
  dashboardGridClass,
  dashboardStackClass,
} from "@/components/DashboardPage";


export default function DashboardPage() {
  const t = useTranslations("DashboardPage");
  const [mounted, setMounted] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const firstName = useSettingsStore((s) => s.profile.name).split(/\s+/)[0];

  useEffect(() => {
    setMounted(true);
    setCurrentTime(new Date());

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

  // ── Jonli sinflar — hero uchun nom xaritasi ──
  const liveClasses = useLiveClasses();
  const classNameById = useMemo(
    () => new Map(liveClasses.map((c) => [c.id, c.name])),
    [liveClasses]
  );
  // ── Hero konteksti ──
  const classCount = liveClasses.length;
  // Hero chiplari — davomat kiritilishi va tekshirish navbati (sof helperlar)
  const recordsByClass = useAttendanceStore((s) => s.recordsByClass);
  const attendanceEntry = useMemo(
    () => attendanceEntryForDay(todaysEvents.map((e) => e.classId), recordsByClass, todayKey),
    [todaysEvents, recordsByClass, todayKey]
  );

  // ── Tur-demo rejimi — home tur ochiq boʻlsa boʻsh panellar namunaviy
  //    maʼlumot bilan toʻldiriladi (faqat vizual, store'larga yozilmaydi) ──
  const tourDemoActive = useTourRequest((s) => s.activeTourId === "home");
  const tourDemo = useMemo(
    () => (tourDemoActive ? makeHomeTourDemo(currentTime) : null),
    [tourDemoActive, currentTime]
  );
  // Hero ham demo rejimda "sozlangan" koʻrinishda — aks holda tur
  // "Sinf qoʻshish" boʻsh variantini yoritardi.
  const welcomeDemo = tourDemo && classCount === 0 ? tourDemo.welcome : null;
  const heroClassCount = welcomeDemo ? welcomeDemo.classCount : classCount;
  const heroEvents = useMemo<HeroEvent[]>(
    () =>
      (welcomeDemo && tourDemo ? tourDemo.events : todaysEvents).map((ev) => ({
        startMin: ev.startMin,
        endMin: ev.endMin,
        className:
          classNameById.get(ev.classId) ?? DEMO_CLASS_NAMES[ev.classId] ?? t("unknownClass"),
      })),
    [welcomeDemo, tourDemo, todaysEvents, classNameById]
  );

  const hour = currentTime.getHours();
  const minute = currentTime.getMinutes();
  const nowMin = hour * 60 + minute;

  // ── Salom — haqiqiy quyosh chiqishi/botishiga bogʻlangan (Toshkent) ──
  const sun = useMemo(() => getSunTimes(currentTime), [currentTime]);
  const dayPhase = getDayPhase(currentTime, sun);

  const PHASE_GREETING: Record<typeof dayPhase, string> = {
    tong: t("greetingMorning"),
    kun: t("greetingDay"),
    kech: t("greetingEvening"),
  };
  const greetingText = () => PHASE_GREETING[dayPhase];

  if (!mounted) {
    return <div className="flex-1 min-h-0 bg-card/50 h-full animate-pulse"></div>;
  }

  return (
    <div className="flex flex-col h-full">
      <DashboardPageLayout className="flex-1">
        <div data-tour="home-overview" className={cn(dashboardGridClass, "stagger-children flex-1 min-h-0 grid-cols-1 lg:grid-cols-[minmax(0,45fr)_minmax(0,30fr)_minmax(0,25fr)] lg:grid-rows-[1fr]")}>

          {/* Chap ustun (45%) — Hero + Kelgusi darslar */}
          <div className={cn(dashboardStackClass, "h-full min-h-0")}>
            <HomeHero
              firstName={firstName}
              greeting={greetingText()}
              dateLabel={t("todayDateLabel", { date: `${currentTime.getDate()}-${MONTHS_UZ[currentTime.getMonth()].toLowerCase()}`, day: DAYS_UZ_SUN[todayDow].toLowerCase() })}
              restNote={holiday ? t("restNoteWithHoliday", { holiday: holiday.name }) : todayDow === 0 ? t("restNote") : undefined}
              classCount={heroClassCount}
              todayEvents={heroEvents}
              nowMin={nowMin}
              attendance={attendanceEntry}
              calendar={calendar}
              todayKey={todayKey}
            />
            {/* Kelgusi darslar — bugundan keyingi rejalashtirilgan sessiyalar */}
            <div className="flex-1 min-h-0">
              <NextLessonsCard now={currentTime} />
            </div>
          </div>

          {/* Oʻrta ustun (30%) — Bugungi darslar (WeekStrip + roʻyxat ⇄ vaqt oʻqi) */}
          <div className={cn(dashboardStackClass, "h-full min-h-0")}>
            <TodayRail now={currentTime} />
          </div>

          {/* Oʻng ustun (25%) — Vazifalar (tekshirish + summativ muddatlar) */}
          <div className={cn(dashboardStackClass, "h-full min-h-0")}>
            <QueueSection now={currentTime} />
          </div>

        </div>
      </DashboardPageLayout>
    </div>
  );
}

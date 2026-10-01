import "server-only";
import { ForbiddenError, UnauthorizedError } from "@/server/session";
import { resolveVersionForDate } from "@/lib/timetable-versions";
import { isoDayOfKey } from "@/lib/calendar-core/date-math";
import { getHolidayForDate } from "@/lib/academic-calendar";
import { activeYear } from "@/lib/academic-years";
import type { DoskaTodayResult } from "@/lib/doska/today";
import { listLiveClasses } from "./assess/live";
import { getYears } from "./academic-years";
import { getTimetablePayload } from "./timetable";

/* ════════════════════════════════════════════════════════════════════
   DOSKA — bugungi darslar, «Bugun» vidjeti uchun (R409).

   `today` — BRAUZER sanasi (server boshqa mintaqada boʻlishi mumkin).
   Faqat oʻqituvchining oʻz jadvali va oʻzi dars beradigan sinflar
   nomi; oʻquvchi maʼlumoti yoʻq. Arxivlangan sinf darsi chiqmaydi.
   Kirmagan / jadvalsiz — `none` (xato emas: `/doska` mehmonga ochiq).
   ════════════════════════════════════════════════════════════════════ */

export async function doskaToday(today: string): Promise<DoskaTodayResult> {
  let versions;
  let classes;
  let years;
  try {
    [versions, classes, years] = await Promise.all([
      getTimetablePayload().then((p) => p.versions),
      listLiveClasses(),
      getYears(),
    ]);
  } catch (e) {
    if (e instanceof UnauthorizedError || e instanceof ForbiddenError) return { status: "none" };
    throw e;
  }
  // Taʼtil yoki bayram — jadval haftalik, u buni bilmaydi.
  const calendar = activeYear(years)?.calendar;
  const holiday = calendar ? getHolidayForDate(calendar, today) : null;
  if (holiday) return { status: "ok", lessons: [], holiday: holiday.name };

  const version = resolveVersionForDate(versions, today);
  if (!version) return { status: "none" };
  const names = new Map(classes.map((c) => [c.id, c.name]));
  const day = isoDayOfKey(today);
  const lessons = version.events
    .filter((e) => e.day === day && names.has(e.classId))
    .map((e) => ({ startMin: e.startMin, endMin: e.endMin, className: names.get(e.classId)! }))
    .sort((a, b) => a.startMin - b.startMin);
  return { status: "ok", lessons };
}

import "server-only";
import { ForbiddenError, UnauthorizedError } from "@/server/session";
import { resolveVersionForDate } from "@/lib/timetable-versions";
import { isoDayOfKey } from "@/lib/calendar-core/date-math";
import type { DoskaTodayResult } from "@/lib/doska/today";
import { listLiveClasses } from "./assess/live";
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
  try {
    [versions, classes] = await Promise.all([
      getTimetablePayload().then((p) => p.versions),
      listLiveClasses(),
    ]);
  } catch (e) {
    if (e instanceof UnauthorizedError || e instanceof ForbiddenError) return { status: "none" };
    throw e;
  }
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

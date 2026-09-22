import type { TimetableEvent } from "@/lib/timetable";
import { isTaught, lessonSessions, type Lesson, type LessonSession } from "@/lib/lessons-data";
import { distributeTopics, slotKey } from "@/lib/ish-reja/distribute";

/* ════════════════════════════════════════════════════════════════════
   SURISH DVIGATELI — sof funksiya, UI va store'dan mustaqil.

   «Keyingi darsga sur»: mavzu oʻtilmadi → uning sessiyasi va sinfdagi
   undan keyingi barcha OʻTILMAGAN sessiyalar bir slotga siljiydi
   (domino). Har sessiya keyingisining oʻrnini oladi; zanjirdagi oxirgisi
   jadvaldagi birinchi boʻsh slotga tushadi (taʼtil, oʻquv yili oxiri va
   band slotlar hisobga olinadi — import taqsimoti bilan bir qoida).
   Joy topilmasa — sanasiz qoladi (`to: null`).

   Natija — koʻchishlar roʻyxati; qoʻllash store'da (`applySessionMoves`),
   bekor qilish esa teskari roʻyxat (`invertMoves`).
   ════════════════════════════════════════════════════════════════════ */

export type SessionMove = { lessonId: string; from: LessonSession | null; to: LessonSession | null };

type ChainItem = { lessonId: string; s: LessonSession };

const cmp = (a: LessonSession, b: LessonSession) => a.date.localeCompare(b.date) || a.startMin - b.startMin;

export function planBump(opts: {
  classId: string;
  lessons: Lesson[];
  fromLessonId: string;
  eventsForDate: (dateKey: string) => TimetableEvent[];
  isHoliday: (dateKey: string) => boolean;
  /** Oxirgi joylash kuni (odatda oʻquv yili tugashi). */
  toKey: string;
}): SessionMove[] {
  const { classId, lessons, fromLessonId, eventsForDate, isHoliday, toKey } = opts;
  const all: ChainItem[] = [];
  for (const l of lessons) {
    for (const s of lessonSessions(l)) {
      if (s.classId === classId) all.push({ lessonId: l.id, s: { date: s.date, startMin: s.startMin, endMin: s.endMin } });
    }
  }
  all.sort((a, b) => cmp(a.s, b.s));
  const taught = new Set(lessons.filter(isTaught).map((l) => l.id));
  const start = all.findIndex((c) => c.lessonId === fromLessonId);
  if (start < 0) return [];
  // Oʻtilgan mavzular joyida qoladi — zanjir ularni chetlab oʻtadi.
  const chain = all.slice(start).filter((c) => c.lessonId === fromLessonId || !taught.has(c.lessonId));

  const last = chain[chain.length - 1].s;
  const occupied = new Set(all.map((c) => slotKey(c.s.date, c.s.startMin)));
  // Oxirgi sessiya kunida undan oldingi slotlar ham band hisoblanadi.
  for (const e of eventsForDate(last.date)) if (e.classId === classId && e.startMin <= last.startMin) occupied.add(slotKey(last.date, e.startMin));
  const [tail] = distributeTopics({ classId, count: 1, fromKey: last.date, toKey, eventsForDate, isHoliday, occupied });

  return chain.map((c, i) => ({
    lessonId: c.lessonId,
    from: c.s,
    to: i + 1 < chain.length ? chain[i + 1].s : tail,
  }));
}

/** «Oʻtildimi?» soʻralsinmi: mavzu oʻtilmagan, lekin sinfdagi biror sessiyasi
    tugagan. (Bugungi dars tugaganidan keyin ham soʻraladi.) */
export function needsTaughtConfirm(l: Lesson, classId: string, today: string, nowMin: number): boolean {
  if (isTaught(l)) return false;
  return lessonSessions(l).some((s) => s.classId === classId && (s.date < today || (s.date === today && s.endMin <= nowMin)));
}

/** Bekor qilish uchun teskari koʻchishlar (teskari tartibda). */
export function invertMoves(moves: SessionMove[]): SessionMove[] {
  return [...moves].reverse().map((m) => ({ lessonId: m.lessonId, from: m.to, to: m.from }));
}

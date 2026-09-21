import { isTaught, lessonSessions, type Lesson } from "@/lib/lessons-data";

/* ════════════════════════════════════════════════════════════════════
   OʻQUV YILI KALENDARI — sof hisob-kitob, qoʻlda toʻldirilmaydi.

   Kalendar oʻqituvchi baribir yaratadigan mavzular va ularning jadval
   sessiyalaridan yigʻiladi, shuning uchun reja surilsa kalendar ham oʻzi
   yangilanadi. Har kun katagi — shu kungi darslar (sinf rangida).
   ════════════════════════════════════════════════════════════════════ */

export type DayEntry = { classId: string; title: string; taught: boolean };

/** `dateKey → shu kungi sessiyalar` (faqat berilgan sinflar). */
export function sessionsByDay(lessons: Lesson[], classIds: Set<string>): Map<string, DayEntry[]> {
  const out = new Map<string, DayEntry[]>();
  for (const l of lessons) {
    const taught = isTaught(l);
    for (const s of lessonSessions(l)) {
      if (!classIds.has(s.classId)) continue;
      const arr = out.get(s.date) ?? [];
      arr.push({ classId: s.classId, title: l.title, taught });
      out.set(s.date, arr);
    }
  }
  return out;
}

/** Katak rangi uchun kunning asosiy sinfi (eng koʻp sessiya) va hammasi oʻtilganmi. */
export function dominantOf(entries: DayEntry[]): { classId: string; taught: boolean } {
  const count = new Map<string, number>();
  for (const e of entries) count.set(e.classId, (count.get(e.classId) ?? 0) + 1);
  const classId = [...count.entries()].sort((a, b) => b[1] - a[1])[0][0];
  return { classId, taught: entries.filter((e) => e.classId === classId).every((e) => e.taught) };
}

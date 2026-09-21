import { isTaught, lessonSessions, type Lesson } from "@/lib/lessons-data";

/* ════════════════════════════════════════════════════════════════════
   OʻQUV YILI KALENDARI — sof hisob-kitob, qoʻlda toʻldirilmaydi.

   Kalendar oʻqituvchi baribir yaratadigan mavzular va ularning jadval
   sessiyalaridan yigʻiladi, shuning uchun reja surilsa kalendar ham oʻzi
   yangilanadi. Har kun katagi — shu kungi darslar (sinf yoki boʻlim rangida).
   ════════════════════════════════════════════════════════════════════ */

export type DayEntry = { lessonId: string; classId: string; title: string; taught: boolean };

/** `dateKey → shu kungi sessiyalar` (faqat berilgan sinflar). */
export function sessionsByDay(lessons: Lesson[], classIds: Set<string>): Map<string, DayEntry[]> {
  const out = new Map<string, DayEntry[]>();
  for (const l of lessons) {
    const taught = isTaught(l);
    for (const s of lessonSessions(l)) {
      if (!classIds.has(s.classId)) continue;
      const arr = out.get(s.date) ?? [];
      arr.push({ lessonId: l.id, classId: s.classId, title: l.title, taught });
      out.set(s.date, arr);
    }
  }
  return out;
}

/** Katak rangi uchun kunning asosiy guruhi (sinf yoki boʻlim — eng koʻp sessiya)
    va shu guruhning hammasi oʻtilganmi. */
export function dominantBy(entries: DayEntry[], groupOf: (e: DayEntry) => string): { group: string; taught: boolean } {
  const count = new Map<string, number>();
  for (const e of entries) { const g = groupOf(e); count.set(g, (count.get(g) ?? 0) + 1); }
  const group = [...count.entries()].sort((a, b) => b[1] - a[1])[0][0];
  return { group, taught: entries.filter((e) => groupOf(e) === group).every((e) => e.taught) };
}

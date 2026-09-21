import { isTaught, lessonSessions, unitIdForClass, type Lesson, type Unit } from "@/lib/lessons-data";
import { byNumber } from "@/lib/ordinals";

/* ════════════════════════════════════════════════════════════════════
   OʻQUV YILI XARITASI — sof hisob-kitob, qoʻlda toʻldirilmaydi.

   Xarita oʻqituvchi baribir yaratadigan sinf → boʻlim → mavzu va
   jadval sessiyalaridan yigʻiladi, shuning uchun reja surilsa xarita
   ham oʻzi yangilanadi. Uch savolga javob beradi: nima oʻtiladi
   (boʻlim qatorlari), qachon (kun kataklari) va qay darajada bajarildi
   (qamrov va surʼat — rejadagi va aslida oʻtilgan mavzular farqi).
   ════════════════════════════════════════════════════════════════════ */

export type DayEntry = { classId: string; taught: boolean };

/** `dateKey → shu kungi sessiyalar` (faqat berilgan sinflar). */
export function sessionsByDay(lessons: Lesson[], classIds: Set<string>): Map<string, DayEntry[]> {
  const out = new Map<string, DayEntry[]>();
  for (const l of lessons) {
    const taught = isTaught(l);
    for (const s of lessonSessions(l)) {
      if (!classIds.has(s.classId)) continue;
      const arr = out.get(s.date) ?? [];
      arr.push({ classId: s.classId, taught });
      out.set(s.date, arr);
    }
  }
  return out;
}

/** Kunning asosiy sinfi (eng koʻp sessiya) va hammasi oʻtilganmi. */
export function dominantOf(entries: DayEntry[]): { classId: string; taught: boolean } {
  const count = new Map<string, number>();
  for (const e of entries) count.set(e.classId, (count.get(e.classId) ?? 0) + 1);
  const classId = [...count.entries()].sort((a, b) => b[1] - a[1])[0][0];
  return { classId, taught: entries.filter((e) => e.classId === classId).every((e) => e.taught) };
}

const firstSessionOn = (l: Lesson, classId: string) =>
  lessonSessions(l).filter((s) => s.classId === classId).map((s) => s.date).sort()[0];

export type Pace = { total: number; taught: number; expected: number };

/** Sinf boʻyicha qamrov va surʼat: `expected` — birinchi sessiyasi bugundan oldin boʻlgan mavzular. */
export function paceForClass(classLessons: Lesson[], classId: string, today: string): Pace {
  let taught = 0, expected = 0;
  for (const l of classLessons) {
    if (isTaught(l)) taught++;
    const first = firstSessionOn(l, classId);
    if (first && first < today) expected++;
  }
  return { total: classLessons.length, taught, expected };
}

export type UnitRow = {
  unit: Unit;
  ordinal: number;
  total: number;
  taught: number;
  start?: string;
  end?: string;
  standards: number;
  state: "done" | "behind" | "active" | "upcoming" | "unscheduled";
};

/** Xarita jadvali — sinfning boʻlimlari tartib boʻyicha. */
export function unitRowsForClass(units: Unit[], classLessons: Lesson[], classId: string, today: string): UnitRow[] {
  return units
    .filter((u) => u.classId === classId)
    .sort(byNumber)
    .map((unit, i) => {
      const ls = classLessons.filter((l) => unitIdForClass(l, classId) === unit.id);
      const dates = ls.flatMap((l) => lessonSessions(l).filter((s) => s.classId === classId).map((s) => s.date)).sort();
      const taught = ls.filter(isTaught).length;
      const start = dates[0], end = dates[dates.length - 1];
      const standards = new Set(ls.flatMap((l) => l.standards ?? [])).size;
      const state: UnitRow["state"] =
        ls.length > 0 && taught === ls.length ? "done"
        : !start ? "unscheduled"
        : end < today ? "behind"
        : start <= today ? "active"
        : "upcoming";
      return { unit, ordinal: i + 1, total: ls.length, taught, start, end, standards, state };
    });
}

import { isTaught, lessonSessions, unitIdForClass, type Lesson, type Unit } from "@/lib/lessons-data";
import { byNumber } from "@/lib/ordinals";

/* ════════════════════════════════════════════════════════════════════
   OʻQUV YILI XARITASI — sof hisob-kitob, qoʻlda toʻldirilmaydi.

   Xarita oʻqituvchi baribir yaratadigan sinf → boʻlim → mavzu va
   jadval sessiyalaridan yigʻiladi, shuning uchun reja surilsa xarita
   ham oʻzi yangilanadi. Uch savolga javob beradi: nima oʻtiladi
   (boʻlim qatorlari), qachon (vaqt chizigʻidagi boʻlim chiziqlari) va qay darajada bajarildi
   (qamrov va surʼat — rejadagi va aslida oʻtilgan mavzular farqi).
   ════════════════════════════════════════════════════════════════════ */

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

export type TimelineBar = {
  /** Boʻlim id yoki `null` — boʻlimsiz mavzular. */
  unitId: string | null;
  ordinal: number | null;
  title: string;
  total: number;
  taught: number;
  start: string;
  end: string;
  /** Bir sinf ichida ustma-ust tushgan chiziqlar alohida yoʻlakka tushadi. */
  lane: number;
};

/** Sinf qatorining chiziqlari: sanasi bor boʻlimlar (+ boʻlimsiz mavzular) va yoʻlaklar. */
export function timelineBarsForClass(units: Unit[], classLessons: Lesson[], classId: string, today: string): TimelineBar[] {
  const bars: Omit<TimelineBar, "lane">[] = unitRowsForClass(units, classLessons, classId, today)
    .filter((r) => r.start)
    .map((r) => ({ unitId: r.unit.id, ordinal: r.ordinal, title: r.unit.title, total: r.total, taught: r.taught, start: r.start!, end: r.end! }));
  const loose = classLessons.filter((l) => unitIdForClass(l, classId) === null);
  const looseDates = loose.flatMap((l) => lessonSessions(l).filter((s) => s.classId === classId).map((s) => s.date)).sort();
  if (looseDates.length) {
    bars.push({ unitId: null, ordinal: null, title: "", total: loose.length, taught: loose.filter(isTaught).length, start: looseDates[0], end: looseDates[looseDates.length - 1] });
  }
  bars.sort((x, y) => x.start.localeCompare(y.start));
  const laneEnds: string[] = [];
  return bars.map((bar) => {
    let lane = laneEnds.findIndex((end) => end < bar.start);
    if (lane < 0) { lane = laneEnds.length; laneEnds.push(bar.end); } else laneEnds[lane] = bar.end;
    return { ...bar, lane };
  });
}

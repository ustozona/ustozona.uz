// Qamrov (Coverage = oʻqitildi) ⇄ Lessons koʻprigi (v3 §9 Q4).
// Dars "Completed" boʻlsa va u standartni bogʻlagan boʻlsa → standart avtomatik "oʻqitildi".
// Bu INPUT/reja signali (prediktiv EMAS) — Mastery'dan (standards-mastery.ts) qatʼiy ajratiladi.

import { type Lesson, lessonClassIds } from "@/lib/lessons-data";

export interface LessonCoverage {
  /** Tugallangan dars orqali oʻqitilganmi? */
  taught: boolean;
  /** Standartni bogʻlagan tugallangan darslar (eng yangi tartibda emas — kiritilgan tartibda). */
  lessons: { id: string; title: string }[];
}

const EMPTY: LessonCoverage = { taught: false, lessons: [] };

/** Berilgan sinfda standartni bogʻlagan TUGALLANGAN darslarni topadi. */
export function lessonCoverage(lessons: Lesson[], classId: string, standardId: string): LessonCoverage {
  const hits = lessons.filter(
    (l) =>
      l.status === "Completed" &&
      lessonClassIds(l).includes(classId) &&
      (l.standards?.includes(standardId) ?? false),
  );
  if (hits.length === 0) return EMPTY;
  return { taught: true, lessons: hits.map((l) => ({ id: l.id, title: l.title })) };
}

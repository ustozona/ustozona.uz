// Standart ⇄ dars bogʻlanishi.
//
// Standart darsga FAQAT dars muharririda biriktiriladi (LessonEditor →
// `lesson.standards`). Standartlar sahifasida qoʻlda belgilash YOʻQ — bu fayl
// shu bogʻlanishni teskari yoʻnalishda oʻqiydi: "bu standart qaysi darsga
// biriktirilgan va u dars tugallanganmi".

import { type Lesson, lessonClassIds } from "@/lib/lessons-data";

export interface LinkedLesson {
  id: string;
  title: string;
  /** Dars tugallanganmi (status === "Completed"). */
  completed: boolean;
}

export interface LessonCoverage {
  /** Biriktirilgan darslardan kamida bittasi tugallanganmi → "oʻqitildi". */
  taught: boolean;
  /** Standartni biriktirgan darslar — holatidan qatʼi nazar. */
  lessons: LinkedLesson[];
}

const EMPTY: LessonCoverage = { taught: false, lessons: [] };

/** Berilgan sinfda standartni biriktirgan darslarni topadi. */
export function lessonCoverage(lessons: Lesson[], classId: string, standardId: string): LessonCoverage {
  const hits = lessons.filter(
    (l) => lessonClassIds(l).includes(classId) && (l.standards?.includes(standardId) ?? false),
  );
  if (hits.length === 0) return EMPTY;
  return {
    taught: hits.some((l) => l.status === "Completed"),
    lessons: hits.map((l) => ({ id: l.id, title: l.title, completed: l.status === "Completed" })),
  };
}

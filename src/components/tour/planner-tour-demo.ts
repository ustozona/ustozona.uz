/* ════════════════════════════════════════════════════════════════════
   PLANNER TUR DEMO MAʼLUMOTI — faqat vizual, store'larga YOZILMAYDI.

   Planner turʼi jadval hali boʻsh hisobda ishga tushsa (jadval tuzilmagan
   boʻlsa haftalik grid oʻrniga "Boʻsh holat" chiqadi va barcha
   data-tour nishonlari yoʻqoladi — tur qadamlari sirtdan oʻtkazib
   yuboriladi). Shu sababli boʻsh holatda ham grid koʻrsatiladi va bir
   nechta namunaviy sinf + bogʻlangan darslar bilan toʻldiriladi
   (classes/timetable demo fayllari bilan bir xil naqsh —
   [[classes-tour-demo]], [[timetable-tour-demo]]).

   Haqiqiy jadval kabi HAFTA BOʻYLAB TAKRORLANUVCHI naqsh — bitta
   sanaga emas, HAR DUSHANBA/SESHANBA/... ga bogʻlangan (`day` 1..5),
   shu sababli hafta VA oy koʻrinishida ham (istalgan oyga oʻtilsa ham)
   toʻlgan koʻrinadi — [[color-system-layers]] tokenlaridan foydalanadi.
   ════════════════════════════════════════════════════════════════════ */

import type { ClassInfo } from "@/lib/grades-data";
import type { TimetableEvent } from "@/lib/timetable";
import type { Lesson } from "@/lib/lessons-data";

const CLASS_A = "demo-planner-cl-a";
const CLASS_B = "demo-planner-cl-b";

type PatternEntry = {
  day: number; // 1=Dushanba .. 5=Juma
  classId: string;
  startMin: number;
  endMin: number;
  /** Berilsa — bogʻlangan dars (rangga toʻlgan blok); boʻlmasa boʻsh slot. */
  lessonTitle?: string;
};

const PATTERN: PatternEntry[] = [
  { day: 1, classId: CLASS_A, startMin: 8 * 60 + 15, endMin: 9 * 60, lessonTitle: "Kasrlar boʻyicha mashqlar" },
  { day: 2, classId: CLASS_B, startMin: 9 * 60 + 15, endMin: 10 * 60, lessonTitle: "Sifatdosh mavzusi" },
  { day: 3, classId: CLASS_A, startMin: 9 * 60, endMin: 9 * 60 + 45 }, // boʻsh slot
  { day: 4, classId: CLASS_B, startMin: 8 * 60 + 30, endMin: 9 * 60 + 15, lessonTitle: "Sifatlar sinovi" },
  { day: 5, classId: CLASS_A, startMin: 10 * 60, endMin: 10 * 60 + 45, lessonTitle: "Geometrik shakllar" },
];

export type PlannerTourDemo = {
  classInfoById: Map<string, ClassInfo>;
  /** Berilgan sananing dars-jadval kuni (1..7, Dushanba=1) uchun eventlar. */
  eventsForWeekday: (tDay: number) => TimetableEvent[];
  /** Berilgan aniq sana (YYYY-MM-DD) + hafta kuni uchun joylangan darslar. */
  placementsForDate: (dateKey: string, tDay: number) => { lesson: Lesson; classId: string; startMin: number; endMin: number }[];
};

export function makePlannerTourDemo(): PlannerTourDemo {
  const classA: ClassInfo = { id: CLASS_A, name: "Matematika 7-A", subject: "Matematika", color: "sky" };
  const classB: ClassInfo = { id: CLASS_B, name: "Ona tili 8-B", subject: "Ona tili", color: "green" };

  return {
    classInfoById: new Map([[CLASS_A, classA], [CLASS_B, classB]]),
    eventsForWeekday: (tDay) =>
      PATTERN.filter((p) => p.day === tDay).map((p) => ({
        id: `demo-planner-ev-${p.day}`,
        classId: p.classId,
        day: p.day,
        startMin: p.startMin,
        endMin: p.endMin,
      })),
    placementsForDate: (dateKey, tDay) =>
      PATTERN.filter((p) => p.day === tDay && p.lessonTitle).map((p) => ({
        lesson: {
          id: `demo-planner-lesson-${p.day}-${dateKey}`,
          classId: p.classId,
          unitId: null,
          number: 1,
          title: p.lessonTitle!,
          status: "Scheduled",
        } satisfies Lesson,
        classId: p.classId,
        startMin: p.startMin,
        endMin: p.endMin,
      })),
  };
}

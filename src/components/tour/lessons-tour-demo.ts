/* ════════════════════════════════════════════════════════════════════
   DARSLAR TUR DEMO MAʼLUMOTI — faqat vizual, store'larga YOZILMAYDI.

   Lessons turʼi boʻsh hisobda ishga tushsa (hali sinf/boʻlim/dars
   qoʻshilmagan) boʻsh panellar tur davomida shu namunaviy sinf, boʻlim
   va darslar bilan toʻldiriladi (students-tour-demo.ts bilan bir xil
   naqsh — [[students-tour-demo]]).
   ════════════════════════════════════════════════════════════════════ */

import type { ClassColor } from "@/lib/class-colors";
import type { ClassInfo } from "@/lib/grades-data";
import type { Unit, Lesson } from "@/lib/lessons-data";

/** Avtomatik tanlangan demo sinf — boʻlim/darslar shu sinfga tegishli. */
export const LESSONS_TOUR_DEMO_CLASS_ID = "demo-lessons-cl-1";
/** Avtomatik tanlangan demo boʻlim — mavzular shu boʻlimga tegishli. */
export const LESSONS_TOUR_DEMO_UNIT_ID = "demo-lessons-u-1";

export function makeLessonsTourDemoClasses(): ClassInfo[] {
  return [
    { id: LESSONS_TOUR_DEMO_CLASS_ID, name: "7-A", subject: "Matematika", color: "sky" as ClassColor },
    { id: "demo-lessons-cl-2", name: "8-B", subject: "Ona tili", color: "green" as ClassColor },
    { id: "demo-lessons-cl-3", name: "9-A", subject: "Fizika", color: "amber" as ClassColor },
  ];
}

export function makeLessonsTourDemoUnits(): Unit[] {
  return [
    {
      id: LESSONS_TOUR_DEMO_UNIT_ID,
      classId: LESSONS_TOUR_DEMO_CLASS_ID,
      number: 1,
      title: "Sonlar va amallar",
      description: "Sonlar bilan ishlash koʻnikmalarini shakllantirish",
    },
    {
      id: "demo-lessons-u-2",
      classId: LESSONS_TOUR_DEMO_CLASS_ID,
      number: 2,
      title: "Kasrlar va oʻnlik kasrlar",
      description: "Kasrlarga kirish",
    },
    {
      id: "demo-lessons-u-3",
      classId: LESSONS_TOUR_DEMO_CLASS_ID,
      number: 3,
      title: "Geometriya asoslari",
      description: "Shakllar va fazoviy fikrlash",
    },
  ];
}

export function makeLessonsTourDemoLessons(): Lesson[] {
  return [
    {
      id: "demo-lessons-l-1",
      classId: LESSONS_TOUR_DEMO_CLASS_ID,
      unitId: LESSONS_TOUR_DEMO_UNIT_ID,
      number: 1,
      title: "Xona qiymatini takrorlash",
      status: "Completed",
      date: "10-iyul",
    },
    {
      id: "demo-lessons-l-2",
      classId: LESSONS_TOUR_DEMO_CLASS_ID,
      unitId: LESSONS_TOUR_DEMO_UNIT_ID,
      number: 2,
      title: "Qoʻshish strategiyalari",
      status: "Scheduled",
      date: "11-iyul",
    },
    {
      id: "demo-lessons-l-3",
      classId: LESSONS_TOUR_DEMO_CLASS_ID,
      unitId: LESSONS_TOUR_DEMO_UNIT_ID,
      number: 3,
      title: "Ayirish (qarzga olish bilan)",
      status: "Scheduled",
      date: "12-iyul",
    },
  ];
}

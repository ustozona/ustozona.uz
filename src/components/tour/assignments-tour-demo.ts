/* ════════════════════════════════════════════════════════════════════
   TOPSHIRIQLAR TUR DEMO MAʼLUMOTI — faqat vizual, store'larga YOZILMAYDI.

   Assignments turʼi boʻsh hisobda ishga tushsa (hali sinf qoʻshilmagan)
   boʻsh panel shu namunaviy sinf va topshiriqlar bilan toʻldiriladi
   ([[lessons-tour-demo]] bilan bir xil naqsh).
   ════════════════════════════════════════════════════════════════════ */

import type { ClassColor } from "@/lib/class-colors";
import type { ClassData, ClassInfo } from "@/lib/grades-data";

/** Avtomatik tanlangan demo sinf — topshiriqlar shu sinfga tegishli. */
export const ASSIGNMENTS_TOUR_DEMO_CLASS_ID = "demo-assignments-cl-1";

/** Sinflar paneli roʻyxati — boshqa turʼlar bilan bir xil namunaviy sinflar. */
export function makeAssignmentsTourDemoClasses(): ClassInfo[] {
  return [
    { id: ASSIGNMENTS_TOUR_DEMO_CLASS_ID, name: "Matematika 7-A", subject: "Matematika", color: "sky" as ClassColor },
    { id: "demo-assignments-cl-2", name: "Ona tili 8-B", subject: "Ona tili", color: "green" as ClassColor },
    { id: "demo-assignments-cl-3", name: "Fizika 9-A", subject: "Fizika", color: "amber" as ClassColor },
  ];
}

export function makeAssignmentsTourDemoClassData(): ClassData {
  return {
    info: makeAssignmentsTourDemoClasses()[0],
    students: [
      { id: "demo-assignments-s-1", name: "Aziza Karimova", initials: "AK" },
      { id: "demo-assignments-s-2", name: "Bekzod Rahimov", initials: "BR" },
    ],
    topics: [
      { id: "demo-assignments-t-1", name: "Nazorat ishi", color: "violet", purpose: "summative", weightPercent: 50, scaleKind: "ten" },
      { id: "demo-assignments-t-2", name: "Uy ishi", color: "lime", purpose: "formative", weightPercent: 0, scaleKind: "ten" },
    ],
    assignments: [
      {
        id: "demo-assignments-a-1",
        title: "Kasrlar boʻyicha nazorat ishi",
        maxScore: 10,
        topicId: "demo-assignments-t-1",
        date: "2026-08-14",
        kind: "test",
      },
      {
        id: "demo-assignments-a-2",
        title: "Geometrik shakllar — uy ishi",
        maxScore: 10,
        topicId: "demo-assignments-t-2",
        dueDate: "2026-08-20",
        kind: "manual",
      },
    ],
    grades: [],
  };
}

/* ════════════════════════════════════════════════════════════════════
   OʻQUVCHILAR TUR DEMO MAʼLUMOTI — faqat vizual, store'larga YOZILMAYDI.

   Students turʼi boʻsh hisobda ishga tushsa (hali sinf/oʻquvchi
   qoʻshilmagan) boʻsh panellar tur davomida shu namunaviy sinflar va
   oʻquvchilar bilan toʻldiriladi (classes-tour-demo.ts bilan bir xil
   naqsh — [[classes-tour-demo]]).
   ════════════════════════════════════════════════════════════════════ */

import type { ClassColor } from "@/lib/class-colors";
import type { ClassInfo } from "@/lib/grades-data";

/** Birinchi (avtomatik tanlangan) demo sinf — oʻquvchilar shu sinfga tegishli. */
export const STUDENTS_TOUR_DEMO_CLASS_ID = "demo-students-cl-1";

export function makeStudentsTourDemoClasses(): ClassInfo[] {
  return [
    { id: STUDENTS_TOUR_DEMO_CLASS_ID, name: "Matematika 7-A", subject: "Matematika", color: "sky" as ClassColor },
    { id: "demo-students-cl-2", name: "Ona tili 8-B", subject: "Ona tili", color: "green" as ClassColor },
    { id: "demo-students-cl-3", name: "Ingliz tili 6-D", subject: "Ingliz tili", color: "amber" as ClassColor },
    { id: "demo-students-cl-4", name: "Fizika 9-A", subject: "Fizika", color: "violet" as ClassColor },
  ];
}

export type StudentsTourDemoRow = {
  id: string;
  name: string;
  initials: string;
  studentId: string;
  grade: number;
  attendance: number;
  status: "active" | "away" | "archived";
  parentName?: string;
  parentPhone?: string;
  studentPhone?: string;
};

export function makeStudentsTourDemo(): StudentsTourDemoRow[] {
  return [
    {
      id: "demo-st-1",
      name: "Amira Boʻriyeva",
      initials: "AB",
      studentId: "ID-1001",
      grade: 94,
      attendance: 96,
      status: "active",
      parentName: "Gulnora Boʻriyeva",
      parentPhone: "+998 90 123 45 67",
    },
    {
      id: "demo-st-2",
      name: "Dilnoza Choriyeva",
      initials: "DC",
      studentId: "ID-1002",
      grade: 76,
      attendance: 88,
      status: "active",
      parentName: "Shavkat Choriyev",
      parentPhone: "+998 90 234 56 78",
    },
    {
      id: "demo-st-3",
      name: "Elyor Fayzullayev",
      initials: "EF",
      studentId: "ID-1003",
      grade: 81,
      attendance: 72,
      status: "away",
    },
    {
      id: "demo-st-4",
      name: "Gulbahor Hamidova",
      initials: "GH",
      studentId: "ID-1004",
      grade: 88,
      attendance: 95,
      status: "active",
      parentName: "Zarina Hamidova",
      parentPhone: "+998 90 345 67 89",
      studentPhone: "+998 93 456 78 90",
    },
    {
      id: "demo-st-5",
      name: "Ismoil Joʻrayev",
      initials: "IJ",
      studentId: "ID-1005",
      grade: 97,
      attendance: 99,
      status: "active",
    },
    {
      id: "demo-st-6",
      name: "Kamola Latipova",
      initials: "KL",
      studentId: "ID-1006",
      grade: 69,
      attendance: 84,
      status: "archived",
    },
  ];
}

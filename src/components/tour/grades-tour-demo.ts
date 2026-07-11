/* ════════════════════════════════════════════════════════════════════
   JURNAL TUR DEMO MAʼLUMOTI — faqat vizual, store'ga YOZILMAYDI.

   Grades turʼi boʻsh hisobda ishga tushsa (hali sinf/oʻquvchi/topshiriq
   qoʻshilmagan) boʻsh panellar tur davomida shu namunaviy sinf va toʻliq
   jurnal (mavzular + topshiriqlar + baholar) bilan toʻldiriladi
   (lessons-tour-demo.ts bilan bir xil naqsh — [[lessons-tour-demo]]).
   ════════════════════════════════════════════════════════════════════ */

import type { ClassColor } from "@/lib/class-colors";
import type { ClassInfo, ClassData, Student, Topic, Assignment, Grade } from "@/lib/grades-data";

/** Avtomatik tanlangan demo sinf — mavzu/topshiriq/baholar shu sinfga tegishli. */
export const GRADES_TOUR_DEMO_CLASS_ID = "demo-grades-cl-1";

export function makeGradesTourDemoClasses(): ClassInfo[] {
  return [
    { id: GRADES_TOUR_DEMO_CLASS_ID, name: "Matematika 7-A", subject: "Matematika", color: "sky" as ClassColor },
    { id: "demo-grades-cl-2", name: "Ona tili 8-B", subject: "Ona tili", color: "green" as ClassColor },
    { id: "demo-grades-cl-3", name: "Fizika 9-A", subject: "Fizika", color: "amber" as ClassColor },
  ];
}

const DEMO_STUDENTS: Student[] = [
  { id: "demo-gr-s1", name: "Amina Yusupova", initials: "AY", status: "active" },
  { id: "demo-gr-s2", name: "Bekzod Qodirov", initials: "BQ", status: "active" },
  { id: "demo-gr-s3", name: "Dilshod Rashidov", initials: "DR", status: "active" },
  { id: "demo-gr-s4", name: "Feruza Tosheva", initials: "FT", status: "active" },
  { id: "demo-gr-s5", name: "Gʻayrat Sodiqov", initials: "GS", status: "active" },
];

const DEMO_TOPICS: Topic[] = [
  {
    id: "demo-gr-t1", groupId: "demo-gr-t1", name: "Nazorat ishi", color: "blue",
    purpose: "summative", weightPercent: 40, inputMode: "score", scaleKind: "percent",
    passLabel: "Bajardi", failLabel: "Bajarmadi",
  },
  {
    id: "demo-gr-t2", groupId: "demo-gr-t2", name: "Amaliy ish", color: "green",
    purpose: "summative", weightPercent: 35, inputMode: "score", scaleKind: "percent",
    passLabel: "Bajardi", failLabel: "Bajarmadi",
  },
  {
    id: "demo-gr-t3", groupId: "demo-gr-t3", name: "Loyiha", color: "violet",
    purpose: "summative", weightPercent: 25, inputMode: "score", scaleKind: "percent",
    passLabel: "Bajardi", failLabel: "Bajarmadi",
  },
];

const DEMO_ASSIGNMENTS: Assignment[] = [
  { id: "demo-gr-a1", title: "3-bob nazorati", maxScore: 100, topicId: "demo-gr-t1", date: "2026-07-01" },
  { id: "demo-gr-a2", title: "5-mavzu testi", maxScore: 20, topicId: "demo-gr-t1", date: "2026-07-04" },
  { id: "demo-gr-a3", title: "12-topshiriq", maxScore: 10, topicId: "demo-gr-t2", date: "2026-07-06" },
  { id: "demo-gr-a4", title: "Laboratoriya ishi", maxScore: 50, topicId: "demo-gr-t2", date: "2026-07-08" },
  { id: "demo-gr-a5", title: "Sinf muhokamasi", maxScore: 10, topicId: "demo-gr-t3", date: "2026-07-10" },
];

const DEMO_GRADES: Grade[] = [
  { studentId: "demo-gr-s1", assignmentId: "demo-gr-a1", score: 95 },
  { studentId: "demo-gr-s1", assignmentId: "demo-gr-a2", score: 18 },
  { studentId: "demo-gr-s1", assignmentId: "demo-gr-a3", score: 10 },
  { studentId: "demo-gr-s1", assignmentId: "demo-gr-a4", score: 47 },
  { studentId: "demo-gr-s1", assignmentId: "demo-gr-a5", score: 9 },

  { studentId: "demo-gr-s2", assignmentId: "demo-gr-a1", score: 78 },
  { studentId: "demo-gr-s2", assignmentId: "demo-gr-a2", score: 14 },
  { studentId: "demo-gr-s2", assignmentId: "demo-gr-a3", score: 8 },
  { studentId: "demo-gr-s2", assignmentId: "demo-gr-a4", score: 36 },
  { studentId: "demo-gr-s2", assignmentId: "demo-gr-a5", score: 7 },

  { studentId: "demo-gr-s3", assignmentId: "demo-gr-a1", score: 71 },
  { studentId: "demo-gr-s3", assignmentId: "demo-gr-a2", score: 16 },
  { studentId: "demo-gr-s3", assignmentId: "demo-gr-a3", score: 7 },
  { studentId: "demo-gr-s3", assignmentId: "demo-gr-a4", score: 40 },
  { studentId: "demo-gr-s3", assignmentId: "demo-gr-a5", score: 8 },

  { studentId: "demo-gr-s4", assignmentId: "demo-gr-a1", score: 98 },
  { studentId: "demo-gr-s4", assignmentId: "demo-gr-a2", score: 20 },
  { studentId: "demo-gr-s4", assignmentId: "demo-gr-a3", score: 10 },
  { studentId: "demo-gr-s4", assignmentId: "demo-gr-a4", score: 49 },
  { studentId: "demo-gr-s4", assignmentId: "demo-gr-a5", score: 10 },

  { studentId: "demo-gr-s5", assignmentId: "demo-gr-a1", score: 82 },
  { studentId: "demo-gr-s5", assignmentId: "demo-gr-a2", score: 15 },
  { studentId: "demo-gr-s5", assignmentId: "demo-gr-a3", score: 8 },
  { studentId: "demo-gr-s5", assignmentId: "demo-gr-a4", score: 42 },
  { studentId: "demo-gr-s5", assignmentId: "demo-gr-a5", score: 9 },
];

export function makeGradesTourDemoClassData(): ClassData {
  return {
    info: { id: GRADES_TOUR_DEMO_CLASS_ID, name: "Matematika 7-A", subject: "Matematika", color: "sky" as ClassColor },
    students: DEMO_STUDENTS,
    topics: DEMO_TOPICS,
    assignments: DEMO_ASSIGNMENTS,
    grades: DEMO_GRADES,
  };
}

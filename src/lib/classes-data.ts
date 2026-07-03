import type { ClassColor } from "@/lib/class-colors";
import type { ClassIconKey } from "@/lib/class-icons";
import type { Shift } from "@/lib/timetable";

/* ════════════════════════════════════════════════════════════════════
   SINFLAR — yagona umumiy manba (single source of truth)

   Sinf maʼlumotlari FAQAT shu yerda aniqlanadi. Dars jadvali (timetable),
   rejalashtiruvchi (planner) va sinflar (classes) sahifalari — hammasi
   shu roʻyxatdan foydalanadi. Shu sababli bitta `classId` har joyda bir
   xil nom, rang va fanga ishora qiladi.

   Mock maʼlumot: bitta ingliz tili oʻqituvchisining sinflari.
   ════════════════════════════════════════════════════════════════════ */

export type SchoolClass = {
  id: number;
  name: string;
  /** Sinf raqami (5, 6, …); toʻgarak kabilar uchun null */
  grade?: number | null;
  subject: string;
  /** 1-smena (ertalabki) yoki 2-smena (tushdan keyin) */
  shift: Shift;
  /** Belgilanmagan boʻlsa — id boʻyicha avtomatik rang */
  color?: ClassColor;
  /** Sinf avatari ikonkasi (kalit); belgilanmagan boʻlsa — default */
  icon?: ClassIconKey;
  students: number;
  /** Rejadagi (jami) mavzular soni */
  lessons: number;
  /** Oʻtilgan (yakunlangan) mavzular soni — dars rejasi progressi uchun, ≤ lessons */
  coveredLessons: number;
  assignments: number;
  /** Qisqa jadval xulosasi, masalan "Du · 08:00" */
  schedule: string;
  /** Avatar uchun oʻquvchi bosh harflari */
  initials: string[];
  description?: string;
};

export const CLASSES: SchoolClass[] = [
  { id: 1,  name: "5-A",  grade: 5,  subject: "Ingliz tili", shift: 1, students: 28, lessons: 18, coveredLessons: 15, assignments: 3, schedule: "Du · 08:00", initials: ["AK", "DT", "MN"], icon: "languages", description: "5-sinflar uchun ingliz tili asoslari (A1)" },
  { id: 2,  name: "5-B",  grade: 5,  subject: "Ingliz tili", shift: 1, students: 26, lessons: 18, coveredLessons: 16, assignments: 2, schedule: "Se · 08:50", initials: ["SR", "GH", "JB"], icon: "languages" },
  { id: 3,  name: "6-A",  grade: 6,  subject: "Ingliz tili", shift: 1, students: 30, lessons: 16, coveredLessons: 13, assignments: 3, schedule: "Ch · 09:40", initials: ["NX", "OB", "RT"], icon: "languages" },
  { id: 4,  name: "6-B",  grade: 6,  subject: "Ingliz tili", shift: 1, students: 24, lessons: 16, coveredLessons: 14, assignments: 2, schedule: "Pa · 10:35", initials: ["LM", "FK", "QA"], icon: "book" },
  { id: 5,  name: "7-A",  grade: 7,  subject: "Ingliz tili", shift: 2, students: 22, lessons: 14, coveredLessons: 10, assignments: 4, schedule: "Ju · 13:00", initials: ["AB", "VS", "ZD"], icon: "pen", description: "Grammatika va soʻzlashuv (A2)" },
  { id: 6,  name: "7-B",  grade: 7,  subject: "Ingliz tili", shift: 2, students: 19, lessons: 14, coveredLessons: 11, assignments: 3, schedule: "Du · 13:50", initials: ["IK", "MM", "TT"], icon: "book" },
  { id: 7,  name: "8-A",  grade: 8,  subject: "Ingliz tili", shift: 2, students: 25, lessons: 12, coveredLessons: 9,  assignments: 4, schedule: "Se · 14:40", initials: ["BN", "DD", "EH"], icon: "library", description: "Oʻqish va yozish koʻnikmalari (A2–B1)" },
  { id: 8,  name: "9-A",  grade: 9,  subject: "Ingliz tili", shift: 2, students: 18, lessons: 10, coveredLessons: 8,  assignments: 2, schedule: "Ch · 15:30", initials: ["KR", "PS", "UU"], color: "teal", icon: "brain" },
  { id: 9,  name: "10-A", grade: 10, subject: "Ingliz tili", shift: 1, students: 27, lessons: 8,  coveredLessons: 6,  assignments: 2, schedule: "Pa · 11:30", initials: ["OT", "SH", "YA"], icon: "trophy" },
  { id: 10, name: "Toʻgarak (Speaking Club)", grade: null, subject: "Ingliz tili — soʻzlashuv", shift: 2, students: 16, lessons: 12, coveredLessons: 8,  assignments: 1, schedule: "Sh · 10:00", initials: ["AA", "BB", "CC"], color: "orange", icon: "speaking", description: "Erkin soʻzlashuv va IELTS tayyorgarlik toʻgaragi" },
];

/** id → sinf tezkor qidiruvi */
export const CLASS_BY_ID = new Map(CLASSES.map((c) => [c.id, c]));

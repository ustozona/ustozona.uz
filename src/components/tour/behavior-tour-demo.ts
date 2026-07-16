/* ════════════════════════════════════════════════════════════════════
   XULQ TUR DEMO MAʼLUMOTI — faqat vizual, store'ga YOZILMAYDI.

   Behavior turʼi boʻsh hisobda ishga tushsa (hali sinf/oʻquvchi
   qoʻshilmagan) boʻsh panel tur davomida namunaviy sinf va oʻquvchilar
   bilan toʻldiriladi (attendance-tour-demo.ts bilan bir xil naqsh —
   [[attendance-tour-demo]]). Bu sahifada ball berish serverga yoziladi
   (useBehaviorStore server-backed), shu sabab demo rejimida ball berish
   amali BehaviorView'da bloklanadi — faqat koʻrsatish uchun.
   ════════════════════════════════════════════════════════════════════ */

import type { ClassColor } from "@/lib/class-colors";
import type { ClassInfo, Student } from "@/lib/grades-data";

export const BEHAVIOR_TOUR_DEMO_CLASS_ID = "demo-behavior-cl-1";

export function makeBehaviorTourDemoClasses(): ClassInfo[] {
  return [
    { id: BEHAVIOR_TOUR_DEMO_CLASS_ID, name: "Matematika 7-A", subject: "Matematika", color: "sky" as ClassColor },
    { id: "demo-behavior-cl-2", name: "Ona tili 8-B", subject: "Ona tili", color: "green" as ClassColor },
    { id: "demo-behavior-cl-3", name: "Fizika 9-A", subject: "Fizika", color: "amber" as ClassColor },
  ];
}

export function makeBehaviorTourDemoStudents(): Student[] {
  return [
    { id: "demo-bh-s1", name: "Amina Yusupova", initials: "AY", status: "active" },
    { id: "demo-bh-s2", name: "Bekzod Qodirov", initials: "BQ", status: "active" },
    { id: "demo-bh-s3", name: "Dilshod Rashidov", initials: "DR", status: "active" },
    { id: "demo-bh-s4", name: "Feruza Tosheva", initials: "FT", status: "active" },
    { id: "demo-bh-s5", name: "Gʻayrat Sodiqov", initials: "GS", status: "active" },
  ];
}

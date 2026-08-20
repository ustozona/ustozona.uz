/* ════════════════════════════════════════════════════════════════════
   SINFLAR TUR DEMO MAʼLUMOTI — faqat vizual, store'larga YOZILMAYDI.

   Classes turʼi boʻsh hisobda ishga tushsa (3–4-qadamlar: koʻrinish
   almashtirish, statistika) boʻsh panellar tur davomida shu namunaviy
   sinflar bilan toʻldiriladi (home-tour-demo.ts bilan bir xil naqsh —
   [[home-tour-demo]]).
   ════════════════════════════════════════════════════════════════════ */

import type { ClassColor } from "@/lib/class-colors";
import type { ClassIconKey } from "@/lib/class-icons";
import type { LiveClass } from "@/app/dashboard/classes/page";

export function makeClassesTourDemo(): LiveClass[] {
  const base = (
    id: string,
    name: string,
    color: ClassColor,
    subject: string,
    icon: ClassIconKey,
    students: number,
    lessons: number,
    coveredLessons: number,
    assignments: number,
    initials: string[]
  ): LiveClass => ({
    id,
    info: { id, name, subject, color, icon },
    name,
    color,
    subject,
    students,
    lessons,
    coveredLessons,
    assignments,
    initials,
  });

  return [
    base("demo-cl-1", "7-A", "sky" as ClassColor, "Matematika", "calculator", 24, 18, 11, 9, ["AB", "DC", "EF"]),
    base("demo-cl-2", "8-B", "green" as ClassColor, "Ona tili", "languages", 22, 15, 15, 7, ["GH", "IJ", "KL"]),
    base("demo-cl-3", "9-A", "amber" as ClassColor, "Fizika", "atom", 26, 12, 6, 5, ["MN", "OP", "QR"]),
  ];
}

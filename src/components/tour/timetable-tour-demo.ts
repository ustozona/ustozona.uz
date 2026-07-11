/* ════════════════════════════════════════════════════════════════════
   JADVAL TUR DEMO MAʼLUMOTI — faqat vizual, store'larga YOZILMAYDI.

   Timetable turʼi boʻsh hisobda ishga tushsa ("Sinflaringiz" / "Haftalik
   jadval" qadamlari) boʻsh panellar tur davomida shu namunaviy sinflar +
   dars bloklari bilan toʻldiriladi (home-tour-demo.ts bilan bir xil
   naqsh — [[home-tour-demo]]).
   ════════════════════════════════════════════════════════════════════ */

import type { ClassColor } from "@/lib/class-colors";
import type { TimetableClass } from "@/components/timetable/PeriodGrid";
import type { TimetableEvent } from "@/lib/timetable";

export function makeTimetableTourDemo(): { classes: TimetableClass[]; events: TimetableEvent[] } {
  const classes: TimetableClass[] = [
    { id: "demo-tt-1", name: "Matematika 7-A", color: "sky" as ClassColor, subject: "Matematika" },
    { id: "demo-tt-2", name: "Ona tili 8-B", color: "green" as ClassColor, subject: "Ona tili" },
    { id: "demo-tt-3", name: "Fizika 9-A", color: "amber" as ClassColor, subject: "Fizika" },
  ];

  const events: TimetableEvent[] = [
    { id: "demo-tt-e1", classId: "demo-tt-1", day: 1, startMin: 8 * 60, endMin: 8 * 60 + 45 },
    { id: "demo-tt-e2", classId: "demo-tt-2", day: 1, startMin: 9 * 60, endMin: 9 * 60 + 45 },
    { id: "demo-tt-e3", classId: "demo-tt-3", day: 2, startMin: 8 * 60, endMin: 8 * 60 + 45 },
    { id: "demo-tt-e4", classId: "demo-tt-1", day: 3, startMin: 8 * 60, endMin: 8 * 60 + 45 },
    { id: "demo-tt-e5", classId: "demo-tt-2", day: 4, startMin: 10 * 60, endMin: 10 * 60 + 45 },
  ];

  return { classes, events };
}

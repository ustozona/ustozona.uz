/* ════════════════════════════════════════════════════════════════════
   STANDARTLAR TUR DEMO MAʼLUMOTI — faqat vizual, store'ga YOZILMAYDI.

   Standards turʼi boʻsh hisobda ishga tushsa (hali sinf/toʻplam yoʻq)
   boʻsh panel tur davomida namunaviy sinf + toʻplam + standartlar bilan
   toʻldiriladi (attendance-tour-demo.ts bilan bir xil naqsh —
   [[attendance-tour-demo]]).
   ════════════════════════════════════════════════════════════════════ */

import type { ClassColor } from "@/lib/class-colors";
import type { ClassInfo } from "@/lib/grades-data";
import type { StandardSet } from "@/store/useStandardsStore";
import type { StandardItem } from "@/lib/standards-data";

/** Avtomatik tanlangan demo sinf. */
export const STANDARDS_TOUR_DEMO_CLASS_ID = "demo-standards-cl-1";

export function makeStandardsTourDemoClasses(): ClassInfo[] {
  return [
    { id: STANDARDS_TOUR_DEMO_CLASS_ID, name: "Matematika 7-A", subject: "Matematika", color: "sky" as ClassColor },
    { id: "demo-standards-cl-2", name: "Ona tili 8-B", subject: "Ona tili", color: "green" as ClassColor },
    { id: "demo-standards-cl-3", name: "Fizika 9-A", subject: "Fizika", color: "amber" as ClassColor },
  ];
}

const DEMO_STANDARDS: StandardItem[] = [
  { id: "MAT.7.1", covered: true, bloom: "apply", desc: "Oʻquvchi butun sonlar bilan toʻrt amalni bajara oladi.", foundational: true },
  { id: "MAT.7.2", covered: true, bloom: "apply", desc: "Oʻquvchi kasr va oʻnlik kasrlarni oʻzaro aylantira oladi." },
  { id: "MAT.7.3", covered: false, bloom: "analyze", desc: "Oʻquvchi chiziqli tenglamalarni yecha oladi.", foundational: true },
  { id: "MAT.7.4", covered: false, bloom: "understand", desc: "Oʻquvchi geometrik shakllarning perimetri va yuzini hisoblay oladi." },
  { id: "MAT.7.5", covered: false, bloom: "evaluate", desc: "Oʻquvchi statistik maʼlumotlarni tahlil qilib xulosa chiqara oladi.", assessType: "subjective" },
];

export function makeStandardsTourDemoSets(): StandardSet[] {
  return [
    {
      id: "demo-standards-set-1",
      name: "Milliy taʼlim standarti — Matematika",
      subject: "Matematika",
      classIds: [STANDARDS_TOUR_DEMO_CLASS_ID],
      standards: DEMO_STANDARDS,
      source: "OʻzDTS",
      grade: "7-sinf",
      frameworkCode: "MAT-7",
    },
  ];
}

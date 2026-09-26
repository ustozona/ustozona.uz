/* ════════════════════════════════════════════════════════════════════
   MATERIALLAR TUR DEMOʼSI — faqat vizual, bazaga YOZILMAYDI.

   Materiallar sahifasi server komponenti (`getLibrary()` bazadan oʻqiydi),
   shuning uchun demo roʻyxat CLIENT tomonda, real `items` boʻsh boʻlganda
   almashtiriladi ([[lessons-tour-demo]] bilan bir xil naqsh).
   ════════════════════════════════════════════════════════════════════ */

import type { LibraryItem } from "@/lib/library-types";

const daysAgo = (n: number) => new Date(Date.now() - n * 24 * 60 * 60 * 1000);

export function makeResourcesTourDemoItems(): LibraryItem[] {
  return [
    {
      id: "demo-resources-i-1",
      kind: "test",
      title: "Kasrlar boʻyicha nazorat ishi",
      meta: "12 savol",
      subject: "Matematika",
      grade: 7,
      classId: null,
      className: "7-A",
      updatedAt: daysAgo(1),
      usedCount: 3,
      lastUsedAt: daysAgo(1),
      isDraft: false,
    },
    {
      id: "demo-resources-i-2",
      kind: "lesson",
      title: "Boʻlish va koʻpaytirish",
      meta: "2-boʻlim · 3-dars",
      subject: "Matematika",
      grade: 7,
      classId: null,
      className: "7-A",
      updatedAt: daysAgo(2),
      usedCount: null,
      lastUsedAt: null,
      isDraft: true,
    },
    {
      id: "demo-resources-i-3",
      kind: "test",
      title: "Sifatlar boʻyicha test",
      meta: "8 savol",
      subject: "Ona tili",
      grade: 8,
      classId: null,
      className: "8-B",
      updatedAt: daysAgo(4),
      usedCount: 1,
      lastUsedAt: daysAgo(4),
      isDraft: false,
    },
    {
      id: "demo-resources-i-4",
      kind: "lesson",
      title: "Yorugʻlik sinishi",
      meta: "1-boʻlim · 1-dars",
      subject: "Fizika",
      grade: 9,
      classId: null,
      className: "9-A",
      updatedAt: daysAgo(6),
      usedCount: null,
      lastUsedAt: null,
      isDraft: false,
    },
  ];
}

/* ════════════════════════════════════════════════════════════════════
   HOME TUR DEMO MAʼLUMOTI — faqat vizual, store'larga YOZILMAYDI.

   Home turʼi yangi (boʻsh) hisobda ishga tushadi — boʻsh panellar ustida
   tur qadamlari maʼnosiz koʻrinadi. Tur faol paytida (activeTourId ===
   "home") bosh sahifa boʻsh roʻyxatlar oʻrniga shu namunaviy maʼlumotni
   chizadi; tur yopilishi bilan hammasi yoʻqoladi.

   Shakllar isteʼmolchilarning jonli hisob-kitob natijalariga mos:
   kun jadvali eventlari (TodayRail), hero sinf soni (page.tsx) va
   ishlar navbati (QueueSection) renderlarida ishlatiladigan
   maydonlargina bor.
   ════════════════════════════════════════════════════════════════════ */

import type { Task } from "@/lib/tasks-data";
import type { LessonStatus } from "@/lib/lessons-data";
import { addDaysKey, dateToKey } from "@/lib/date-keys";

/** Jadval eventi renderida ishlatiladigan minimal maydonlar.
    `lesson` — ixtiyoriy: berilsa TodayRail "toʻlgan" (mavzu chipi bilan),
    boʻlmasa "boʻsh" (+ Mavzu qoʻshish chorlovi bilan) holatda chizadi —
    haqiqiy kunda ikkalasi ham aralash boʻladi, demo ham shuni aks ettirsin. */
export type DemoEvent = {
  id: string;
  classId: string;
  startMin: number;
  endMin: number;
  lesson?: { id: string; title: string; status: LessonStatus };
};

/** Demo classId → sinf nomi (liveById'da topilmagach shu yerdan olinadi). */
export const DEMO_CLASS_NAMES: Record<string, string> = {
  "demo-7a": "7-A",
  "demo-8b": "8-B",
};

/** Bosh sahifa tur-demo toʻplami — `now` ga nisbatan sanalar. */
export function makeHomeTourDemo(now: Date) {
  const events: DemoEvent[] = [
    {
      id: "demo-e1",
      classId: "demo-7a",
      startMin: 8 * 60,
      endMin: 8 * 60 + 45,
      lesson: { id: "demo-l1", title: "Feʼl zamonlari", status: "Completed" },
    },
    // Mavzu ATAYIN yoʻq — boʻsh slot ("+ Mavzu qoʻshish" chorlovi) ham
    // koʻrinsin, hammasi bir xil "toʻlgan" holatda boʻlib qolmasin.
    { id: "demo-e2", classId: "demo-8b", startMin: 9 * 60, endMin: 9 * 60 + 45 },
    { id: "demo-e3", classId: "demo-7a", startMin: 11 * 60, endMin: 11 * 60 + 45 },
  ];

  // Hero "sozlangan" koʻrinishda chiqishi uchun — boʻsh hisobda tur
  // "Sinf qoʻshish" CTA variantini yoritib qoʻymasin.
  const welcome = {
    classCount: 2,
  };

  // Ishlar navbati (QueueSection) uchun — bitta muddati oʻtgan, bitta
  // bugungi, bitta keyingi hafta ichidagi baholash vazifasi: "Kechikkan"/
  // "Bugun"/"Keyinroq" guruhlash hammasi bir vaqtda koʻrinsin.
  const todayKey = dateToKey(now);
  const tasks: Task[] = [
    {
      id: "demo-task-overdue",
      title: "Amaliy ish — 24-mavzu",
      status: "todo",
      priority: "none",
      dueDate: addDaysKey(todayKey, -2),
      classId: "demo-7a",
      source: { kind: "grading", classId: "demo-7a", assignmentId: "demo-a1" },
      sortOrder: 0,
      createdAt: now.toISOString(),
    },
    {
      id: "demo-task-today",
      title: "Mustaqil ish — Grammatika",
      status: "todo",
      priority: "none",
      dueDate: todayKey,
      classId: "demo-8b",
      source: { kind: "grading", classId: "demo-8b", assignmentId: "demo-a2" },
      sortOrder: 1,
      createdAt: now.toISOString(),
    },
    {
      id: "demo-task-later",
      title: "Nazorat ishi — 2-chorak",
      status: "todo",
      priority: "none",
      dueDate: addDaysKey(todayKey, 3),
      classId: "demo-7a",
      source: { kind: "grading", classId: "demo-7a", assignmentId: "demo-a3" },
      sortOrder: 2,
      createdAt: now.toISOString(),
    },
  ];

  return { events, welcome, tasks };
}

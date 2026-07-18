/* ════════════════════════════════════════════════════════════════════
   HOME TUR DEMO MAʼLUMOTI — faqat vizual, store'larga YOZILMAYDI.

   Home turʼi yangi (boʻsh) hisobda ishga tushadi — boʻsh panellar ustida
   tur qadamlari maʼnosiz koʻrinadi. Tur faol paytida (activeTourId ===
   "home") bosh sahifa boʻsh roʻyxatlar oʻrniga shu namunaviy maʼlumotni
   chizadi; tur yopilishi bilan hammasi yoʻqoladi.

   Shakllar isteʼmolchilarning jonli hisob-kitob natijalariga mos:
   kun jadvali eventlari (TodayRail), vazifalar (QueueSection) va hero
   sinf soni (page.tsx) renderlarida ishlatiladigan maydonlargina bor.
   ════════════════════════════════════════════════════════════════════ */

import { TASK_STATUS } from "@/lib/tasks-data";

/** Jadval eventi renderida ishlatiladigan minimal maydonlar. */
export type DemoEvent = {
  id: string;
  classId: string;
  startMin: number;
  endMin: number;
};

/** Demo classId → sinf nomi (liveById'da topilmagach shu yerdan olinadi). */
export const DEMO_CLASS_NAMES: Record<string, string> = {
  "demo-7a": "7-A",
  "demo-8b": "8-B",
};

/** Bosh sahifa tur-demo toʻplami — `now` ga nisbatan sanalar. */
export function makeHomeTourDemo(now: Date) {
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);

  const events: DemoEvent[] = [
    { id: "demo-e1", classId: "demo-7a", startMin: 8 * 60, endMin: 8 * 60 + 45 },
    { id: "demo-e2", classId: "demo-8b", startMin: 9 * 60, endMin: 9 * 60 + 45 },
    { id: "demo-e3", classId: "demo-7a", startMin: 11 * 60, endMin: 11 * 60 + 45 },
  ];

  const todayKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  const tomorrowKey = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, "0")}-${String(tomorrow.getDate()).padStart(2, "0")}`;

  const tasks = [
    { id: "demo-t1", title: "Matematika daftarlarini tekshirish", dueDate: todayKey, status: TASK_STATUS.TODO },
    { id: "demo-t2", title: "Laboratoriya mashgʻulotini tayyorlash", dueDate: tomorrowKey, status: TASK_STATUS.TODO },
  ];

  // Hero "sozlangan" koʻrinishda chiqishi uchun — boʻsh hisobda tur
  // "Sinf qoʻshish" CTA variantini yoritib qoʻymasin.
  const welcome = {
    classCount: 2,
  };

  return { events, tasks, welcome };
}

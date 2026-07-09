/* ════════════════════════════════════════════════════════════════════
   HOME TUR DEMO MAʼLUMOTI — faqat vizual, store'larga YOZILMAYDI.

   Home turʼi yangi (boʻsh) hisobda ishga tushadi — boʻsh panellar ustida
   tur qadamlari maʼnosiz koʻrinadi. Tur faol paytida (activeTourId ===
   "home") bosh sahifa boʻsh roʻyxatlar oʻrniga shu namunaviy maʼlumotni
   chizadi; tur yopilishi bilan hammasi yoʻqoladi.

   Shakllar page.tsx dagi jonli hisob-kitob natijalariga mos: kelgusi
   darslar (upcomingLessons), kun jadvali eventlari (selectedEvents) va
   vazifalar (dayTasks) renderlarida ishlatiladigan maydonlargina bor.
   ════════════════════════════════════════════════════════════════════ */

import { DAYS_UZ_SUN, MONTHS_UZ } from "@/lib/localization";
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

const DEMO_HEX = {
  blue: "#3b82f6",
  green: "#10b981",
  amber: "#f59e0b",
} as const;

function rgba(hex: string, a: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

function dayLabel(d: Date) {
  return {
    dayName: DAYS_UZ_SUN[d.getDay()],
    date: `${d.getDate()}-${MONTHS_UZ[d.getMonth()].toLowerCase()}`,
  };
}

/** Bosh sahifa tur-demo toʻplami — `now` ga nisbatan sanalar. */
export function makeHomeTourDemo(now: Date) {
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  const after = new Date(now);
  after.setDate(now.getDate() + 2);

  const upcomingLessons = [
    {
      id: "demo-l1",
      ...dayLabel(tomorrow),
      className: "7-A",
      topic: "Kasrlarga kirish",
      startTime: "08:00",
      isReady: true,
      color: DEMO_HEX.blue,
      bg: rgba(DEMO_HEX.blue, 0.125),
    },
    {
      id: "demo-l2",
      ...dayLabel(tomorrow),
      className: "8-B",
      topic: "Suv aylanishi",
      startTime: "09:00",
      isReady: false,
      color: DEMO_HEX.green,
      bg: rgba(DEMO_HEX.green, 0.125),
    },
    {
      id: "demo-l3",
      ...dayLabel(after),
      className: "7-A",
      topic: "Oʻnli kasrlar",
      startTime: "10:00",
      isReady: false,
      color: DEMO_HEX.amber,
      bg: rgba(DEMO_HEX.amber, 0.125),
    },
  ];

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

  // Salomlashuv kartasi — metrik 2×2 panjara (agenda EMAS: u "bugun dars
  // rejalashtirilgan" degan daʼvo qiladi, demo'da yolgʻon boʻlardi).
  const welcome = {
    classCount: 2,
    studentCount: 34,
    todayLessonCount: 3,
    todayTaskCount: 2,
  };

  return { upcomingLessons, events, tasks, welcome };
}

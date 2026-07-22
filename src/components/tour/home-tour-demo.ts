/* ════════════════════════════════════════════════════════════════════
   HOME TUR DEMO MAʼLUMOTI — faqat vizual, store'larga YOZILMAYDI.

   Home turʼi yangi (boʻsh) hisobda ishga tushadi — boʻsh panellar ustida
   tur qadamlari maʼnosiz koʻrinadi. Tur faol paytida (activeTourId ===
   "home") bosh sahifa boʻsh roʻyxatlar oʻrniga shu namunaviy maʼlumotni
   chizadi; tur yopilishi bilan hammasi yoʻqoladi.

   Shakllar isteʼmolchilarning jonli hisob-kitob natijalariga mos:
   kun jadvali eventlari (TodayRail) va hero sinf soni (page.tsx)
   renderlarida ishlatiladigan maydonlargina bor.
   ════════════════════════════════════════════════════════════════════ */

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
  void now;

  const events: DemoEvent[] = [
    { id: "demo-e1", classId: "demo-7a", startMin: 8 * 60, endMin: 8 * 60 + 45 },
    { id: "demo-e2", classId: "demo-8b", startMin: 9 * 60, endMin: 9 * 60 + 45 },
    { id: "demo-e3", classId: "demo-7a", startMin: 11 * 60, endMin: 11 * 60 + 45 },
  ];

  // Hero "sozlangan" koʻrinishda chiqishi uchun — boʻsh hisobda tur
  // "Sinf qoʻshish" CTA variantini yoritib qoʻymasin.
  const welcome = {
    classCount: 2,
  };

  return { events, welcome };
}

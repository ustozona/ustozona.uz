/* ════════════════════════════════════════════════════════════════════
   FAOLLIK — NEYTRAL MODUL (server ham, client ham import qiladi).

   ⚠️ BU YERGA `server-only` HAM, `"use server"` HAM QOʻSHILMAYDI.

   Bu konstantalar ikkala tomonga kerak: server tomonda SQL filtri
   (`dal/admin/users.ts`), client tomonda esa filtr tanlovi va ustun
   yorligʻi (`admin/users/_components/UsersTable.tsx`). Ular
   `server/db/views.ts` da turganda client komponent uni import qilib,
   «This module cannot be imported from a Client Component» xatosini
   berardi — shuning uchun alohida, neytral joyda.

   Koʻrinishlarning oʻzi: drizzle/views/faollik.sql
   ════════════════════════════════════════════════════════════════════ */

/** Koʻrinishdagi boʻlim nomlari — «kenglik» maxraji (X / 12).

    ⚠️ Bu roʻyxat `drizzle/views/faollik.sql` dagi UNION shoxlari bilan
    MOS boʻlishi shart. Yangi boʻlim qoʻshilsa ikkala joy ham yangilanadi;
    aks holda ekranda «5 / 12» deb yozilib, aslida 13 boʻlim boʻlardi. */
export const ACTIVITY_AREAS = [
  "davomat",
  "baho",
  "dars",
  "mavzu",
  "topshiriq",
  "vazifa",
  "jadval",
  "standart",
  "test",
  "viktorina",
  "xulq",
  "qayd",
] as const;

export type ActivityArea = (typeof ACTIVITY_AREAS)[number];

export const AREA_LABELS: Record<string, string> = {
  davomat: "Davomat",
  baho: "Baho",
  dars: "Dars rejasi",
  mavzu: "Mavzu",
  topshiriq: "Topshiriq",
  vazifa: "Vazifa",
  jadval: "Jadval",
  standart: "Standart",
  test: "Test",
  viktorina: "Viktorina",
  xulq: "Xulq",
  qayd: "Qayd",
};

/** «Faollashgan» uchun eng kam alohida ish kuni.

    ⭐ Nega kun, nega 3: bir kunda kiritilgan 400 ta davomat yozuvi —
    bitta ommaviy amal, odat emas. Kun boʻyicha oʻlchovni ommaviy amal
    bilan shishirib boʻlmaydi. */
export const ACTIVATED_MIN_DAYS = 3;

/** Shundan koʻp jim tursa «jim qolgan» deb belgilanadi. */
export const QUIET_AFTER_DAYS = 14;

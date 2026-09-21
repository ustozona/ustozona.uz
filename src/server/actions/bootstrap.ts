"use server";

import { getSettings } from "@/server/dal/settings";
import { getGradesPayload } from "@/server/dal/grades";
import { getAttendancePayload } from "@/server/dal/attendance";
import { getLessonsPayload } from "@/server/dal/lessons";
import { getTimetablePayload } from "@/server/dal/timetable";
import { getYears } from "@/server/dal/academic-years";
import { getStandardsPayload } from "@/server/dal/standards";
import { getClassNotes } from "@/server/dal/class-notes";
import { getRelations } from "@/server/dal/relations";
import { getClassPrefs } from "@/server/dal/class-prefs";
import { getNotificationsPayload } from "@/server/dal/notifications";
import { getFeedbackPayload } from "@/server/dal/feedback";
import { getBehaviorPayload } from "@/server/dal/behavior";
import { getStudentNotesPayload } from "@/server/dal/student-notes";
import { getTasksPayload } from "@/server/dal/tasks";
import { activeYear } from "@/lib/academic-years";
import type {
  DashboardBootstrap,
  DashboardPayloads,
  SliceResult,
} from "@/lib/sync/bootstrap-types";

/* ════════════════════════════════════════════════════════════════════
   DASHBOARD BOOTSTRAP — 15 ta hydration soʻrovi oʻrniga BITTA.

   Ilgari `dashboard/layout.tsx` dagi har `*ServerSync` mount'da oʻz
   `fetch*Action()` ini chaqirardi. Next Server Action'larni NAVBATGA
   qoʻyadi — yaʼni 15 ta POST ketma-ket ketardi va ekranda maʼlumot
   oxirgisi qaytgandan keyin paydo boʻlardi. Har soʻrov, ustiga, oʻz
   sessiya tekshiruvini ham olib kelardi.

   Endi hammasi bitta soʻrovda: DAL chaqiruvlari server ichida PARALLEL
   ketadi, `requireTeacher` esa React `cache()` bilan oʻralgani uchun
   sessiya bir marta oʻqiladi.

   ⚠️ XATOLIK BIRLASHTIRILMAYDI. Har boʻlak alohida `SliceResult`
   qaytaradi — sabab `bootstrap-types.ts` dagi izohda. Shuning uchun bu
   yerda `Promise.all` YALANGʻOCH chaqiruvlar ustida emas, allaqachon
   `settle()` bilan oʻralgan (hech qachon rad etmaydigan) promise'lar
   ustida ishlaydi.

   ⛔ Bu faylda `export type { … }` YOZILMAYDI — AGENTS.md dagi
   `"use server"` qoidasi. Tiplar `@/lib/sync/bootstrap-types` da.

   ⚠️ Alohida `fetch*Action` lar OʻCHIRILMADI: ular hydration'dan
   keyingi nuqtaviy qayta oʻqishlarda kerak (masalan
   `reloadGradesFromServer`). Bu yerda faqat MOUNT yoʻli birlashtirildi.
   ════════════════════════════════════════════════════════════════════ */

/* ⚠️ BOʻLAK UCHUN VAQT CHEGARASI (2026-09-21 prod hodisasi).
   postgres-js da soʻrov timeout'i yoʻq: oʻlik socketga tushgan bitta
   soʻrov cheksiz kutadi. Bitta amalda 15 boʻlak boʻlgani uchun u
   BUTUN amalni 300 s Vercel timeout'igacha ushlab turardi (504) va
   dashboard faqat skeleton koʻrsatib qolardi. Endi osilgan boʻlak
   yiqilgan hisoblanadi — qolganlari javobga yetib boradi. */
const SLICE_TIMEOUT_MS = 15_000;

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const limit = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`timeout ${ms}ms`)), ms);
  });
  return Promise.race([p, limit]).finally(() => clearTimeout(timer));
}

/* ⚠️ BIR VAQTDA KOʻPI BILAN 3 BOʻLAK (2026-09-21 prod hodisasi).
   15 boʻlak birdan ishga tushganda soʻrovlar soni pool'dagi ulanishlardan
   (`max: 5`, db/client.ts) oshib ketardi va postgres-js ularni bitta
   ulanishga ketma-ket (pipeline) yozardi. Supavisor transaction
   rejimida shunday yuklanishda har soʻrovda bittasining javobi
   qaytmay qoldi: prod logida 14 boʻlak 100–450 ms da tugagan, bittasi
   (har safar boshqasi — "tasks", "behavior") esa HECH QACHON tugamagan.
   Oldingi 15 alohida amal Next navbatida ketma-ket ketgani uchun bu
   holat yuzaga kelmagan. Ayrim DAL'lar ichida ham Promise.all bor,
   shuning uchun chegara pool hajmidan ancha past. */
const SLICE_CONCURRENCY = 3;
let active = 0;
const waiting: (() => void)[] = [];

async function gate<T>(run: () => Promise<T>): Promise<T> {
  if (active >= SLICE_CONCURRENCY) await new Promise<void>((r) => waiting.push(r));
  active++;
  try {
    return await run();
  } finally {
    active--;
    waiting.shift()?.();
  }
}

/** Bitta boʻlakni oʻqiydi va HECH QACHON rad etmaydi — xato natijaning
    ichiga tushadi, qoʻshnilariga tegmaydi. */
async function settle<K extends keyof DashboardPayloads>(
  key: K,
  read: () => Promise<DashboardPayloads[K]>
): Promise<[K, SliceResult<DashboardPayloads[K]>]> {
  try {
    const value = await gate(() => withTimeout(read(), SLICE_TIMEOUT_MS));
    return [key, { ok: true, value }];
  } catch (err) {
    console.error(`[bootstrap] "${String(key)}" boʻlagi olinmadi:`, err);
    return [key, { ok: false, error: err instanceof Error ? err.message : "unknown" }];
  }
}

export async function fetchDashboardBootstrapAction(): Promise<DashboardBootstrap> {
  const entries = await Promise.all([
    settle("settings", getSettings),
    settle("grades", async () => ({ classDataMap: await getGradesPayload() })),
    settle("attendance", getAttendancePayload),
    settle("lessons", getLessonsPayload),
    settle("timetable", getTimetablePayload),
    /* Kalendar boʻlagi `fetchYearsAction` bilan bir xil shakl beradi:
       yil yoʻq boʻlsa `null`, shunda `CalendarServerSync` eager-seed
       yoʻliga tushadi. `activeYear` boʻsh boʻlmagan roʻyxatda hech
       qachon `undefined` qaytarmaydi (ichida `?? years[0]` bor). */
    settle("calendar", async () => {
      const years = await getYears();
      return years.length === 0 ? null : { years, calendar: activeYear(years)!.calendar };
    }),
    settle("standards", getStandardsPayload),
    settle("classNotes", getClassNotes),
    settle("relations", getRelations),
    settle("classPrefs", getClassPrefs),
    settle("notifications", getNotificationsPayload),
    settle("feedback", getFeedbackPayload),
    settle("behavior", getBehaviorPayload),
    settle("studentNotes", getStudentNotesPayload),
    settle("tasks", getTasksPayload),
  ]);

  return Object.fromEntries(entries) as DashboardBootstrap;
}

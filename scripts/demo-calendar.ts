import { currentAcademicStartYear, type AcademicYearCalendar } from "@/lib/academic-calendar";
import { addDaysKey, dateToKey, todayKey } from "@/lib/date-keys";

/* ════════════════════════════════════════════════════════════════════
   DEMO KALENDAR — har safar seed ishga tushganda "bugun"ni ichiga oladi.

   Rasmiy kalendar (2-sentabr—25-may) demo hisobda "dars toʻxtab qolgan"
   taassurot qoldiradi (yoz oylarida boʻsh). Demo hisob ekran-suratlar
   uchun ishlatilgani sabab kalendar 1-iyundan boshlanadi va taʼtilsiz —
   shu bilan DEMO_TIMETABLE'dagi darslar yil davomida hech qachon
   toʻxtamaydi, "bugun" doim yil ichida qoladi (qayta seed qilinganda ham).
   ════════════════════════════════════════════════════════════════════ */

const now = new Date();
const startYear = currentAcademicStartYear(now);

const rangeStart = `${startYear}-06-01`;
const rangeEnd = `${startYear + 1}-05-25`;

function addMonthsKey(key: string, months: number): string {
  const [y, m, d] = key.split("-").map(Number);
  return dateToKey(new Date(y, m - 1 + months, d));
}

export const TODAY_KEY = todayKey();

/** Demo hisobda saqlanadigan sinflar — kam va toʻliq (har birida
    boy maʼlumot) "koʻp va yupqa"dan yaxshiroq skrinshot uchun. */
export const DEMO_CLASS_IDS = ["5-a", "6-a", "7-a", "8-a", "9-a"];

export const DEMO_CALENDAR: AcademicYearCalendar = {
  yearLabel: `${startYear}–${startYear + 1}`,
  range: { start: rangeStart, end: rangeEnd },
  quarters: [
    { id: "q1", name: "1-chorak", range: { start: rangeStart, end: addDaysKey(addMonthsKey(rangeStart, 3), -1) } },
    { id: "q2", name: "2-chorak", range: { start: addMonthsKey(rangeStart, 3), end: addDaysKey(addMonthsKey(rangeStart, 6), -1) } },
    { id: "q3", name: "3-chorak", range: { start: addMonthsKey(rangeStart, 6), end: addDaysKey(addMonthsKey(rangeStart, 9), -1) } },
    { id: "q4", name: "4-chorak", range: { start: addMonthsKey(rangeStart, 9), end: rangeEnd } },
  ],
  holidays: [],
};

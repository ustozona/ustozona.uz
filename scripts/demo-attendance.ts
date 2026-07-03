import { CLASS_DATA, type Student } from "@/lib/grades-data";
import type { AttendanceRecord, LessonDay } from "@/lib/attendance-data";
import {
  DEFAULT_CALENDAR_2025_2026,
  isSchoolDay,
} from "@/lib/academic-calendar";
import { addDaysKey, dateKeyToDate } from "@/lib/date-keys";
import { buildSlots, DOUBLE_SHIFT_DEFAULTS, type TimetableEvent } from "@/lib/timetable";

/* ════════════════════════════════════════════════════════════════════
   DEMO JADVAL + DAVOMAT GENERATORI — faqat scripts/seed.ts uchun.

   9-bosqichgacha davomat "dars kunlari" statik fallback (2026 apr–iyun
   Cho/Ju) edi va jadval versiyasi BOʻSH seed qilinardi. Endi UI dars
   kunlarini haqiqiy jadval versiyasidan hisoblaydi, shuning uchun demo
   ham izchil boʻlishi kerak: BITTA manba (DEMO_TIMETABLE) ham jadval
   eventlarini, ham davomat yozuvlari tushadigan kunlarni belgilaydi.

   Sinf-koʻprik (class-bridge) NOM boʻyicha bogʻlaydi — grades-data'dagi
   15 sinfdan 8 tasi classes-data'da bor; qolganlariga jadval eventi
   yozilmaydi (davomat yozuvlari baribir yaratiladi — "Barcha kunlar"
   koʻrinishida koʻrinadi, bu classes-domeni serverga koʻchguncha maʼlum
   demo cheklovi).
   ════════════════════════════════════════════════════════════════════ */

type DemoSlot = {
  /** classes-data (timetable) raqamli sinf id — koʻprik mavjud boʻlsa */
  schoolClassId?: number;
  /** Haftada 2 dars kuni (1=Du … 6=Sh) */
  days: [number, number];
  /** 1-smena 08:00dan, 2-smena 13:00dan (DOUBLE_SHIFT_DEFAULTS) */
  shift: 1 | 2;
  /** Smena ichidagi period indeksi (0-based) */
  slot: number;
};

export const DEMO_TIMETABLE: Record<string, DemoSlot> = {
  // Koʻprikli sinflar — jadval eventi + davomat
  "5-a":    { schoolClassId: 1,  days: [1, 4], shift: 1, slot: 0 },
  "5-b":    { schoolClassId: 2,  days: [2, 5], shift: 1, slot: 0 },
  "6-a":    { schoolClassId: 3,  days: [3, 6], shift: 1, slot: 0 },
  "6-b":    { schoolClassId: 4,  days: [1, 4], shift: 1, slot: 1 },
  "7-a":    { schoolClassId: 5,  days: [2, 5], shift: 2, slot: 0 },
  "7-b":    { schoolClassId: 6,  days: [3, 6], shift: 2, slot: 0 },
  "8-a":    { schoolClassId: 7,  days: [1, 4], shift: 2, slot: 0 },
  "9-a":    { schoolClassId: 8,  days: [2, 5], shift: 2, slot: 1 },
  // Koʻpriksiz sinflar — faqat davomat yozuvlari
  "5-d":    { days: [3, 6], shift: 1, slot: 1 },
  "6-d":    { days: [1, 4], shift: 1, slot: 2 },
  "7-d":    { days: [2, 5], shift: 2, slot: 2 },
  "8-b":    { days: [3, 6], shift: 2, slot: 1 },
  "9-b":    { days: [1, 4], shift: 2, slot: 1 },
  "club-1": { days: [2, 5], shift: 2, slot: 3 },
  "club-2": { days: [3, 6], shift: 2, slot: 3 },
};

/** Demo oʻqituvchining jadval eventlari (tt-seed-v1 versiyasiga). */
export function demoTimetableEvents(): TimetableEvent[] {
  const events: TimetableEvent[] = [];
  for (const [gradesId, cfg] of Object.entries(DEMO_TIMETABLE)) {
    if (cfg.schoolClassId == null) continue;
    const shiftCfg = cfg.shift === 1 ? DOUBLE_SHIFT_DEFAULTS.shift1 : DOUBLE_SHIFT_DEFAULTS.shift2;
    const slot = buildSlots(shiftCfg)[cfg.slot];
    for (const day of cfg.days) {
      events.push({
        id: `tt-seed-${gradesId}-${day}`,
        classId: cfg.schoolClassId,
        day,
        startMin: slot.startMin,
        endMin: slot.endMin,
      });
    }
  }
  return events;
}

/** Sinfning oʻquv yilidagi dars kunlari — kalendar (taʼtil/yakshanba) hisobga
    olingan holda DEMO_TIMETABLE'dagi hafta kunlari boʻyicha. */
function demoLessonDays(classId: string): LessonDay[] {
  const cfg = DEMO_TIMETABLE[classId];
  if (!cfg) return [];
  const cal = DEFAULT_CALENDAR_2025_2026;
  const days: LessonDay[] = [];
  for (let key = cal.range.start; key <= cal.range.end; key = addDaysKey(key, 1)) {
    if (!isSchoolDay(cal, key)) continue;
    const dow = dateKeyToDate(key).getDay();
    if (cfg.days.includes(dow)) days.push({ date: key, dayOfWeek: dow });
  }
  return days;
}

// Barqaror psevdo-tasodif (seed) — har oʻquvchining "ishonchliligi" turlicha
// boʻlsin, davomat foizlari realistik tarqalsin (~60–100%), bir xil emas.
function seeded(seed: number): () => number {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}

function makeRecords(students: Student[], days: LessonDay[]): AttendanceRecord[] {
  const records: AttendanceRecord[] = [];
  students.forEach((s, si) => {
    const rnd = seeded(si * 97 + 13);
    // Har oʻquvchining bazaviy "kelish ehtimoli" 0.70–0.98 oraligʻida
    const reliability = 0.7 + rnd() * 0.28;
    for (const d of days) {
      const r = rnd();
      let status: string;
      if (r < reliability) status = "present";
      else if (r < reliability + 0.06) status = "late";
      else if (r < reliability + 0.10) status = "excused";
      else status = "absent";
      records.push({ studentId: s.id, date: d.date, status });
    }
  });
  return records;
}

/** Demo oʻqituvchi sinfining davomat yozuvlari (deterministik). */
export function demoAttendanceRecords(classId: string): AttendanceRecord[] {
  const students = CLASS_DATA[classId]?.students ?? [];
  return makeRecords(students, demoLessonDays(classId));
}

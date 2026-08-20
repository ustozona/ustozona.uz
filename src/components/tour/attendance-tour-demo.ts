/* ════════════════════════════════════════════════════════════════════
   DAVOMAT TUR DEMO MAʼLUMOTI — faqat vizual, store'ga YOZILMAYDI.

   Attendance turʼi boʻsh hisobda ishga tushsa (hali sinf/oʻquvchi/dars
   yoʻq) boʻsh jadval tur davomida namunaviy sinf, oʻquvchilar, dars
   kunlari va davomat yozuvlari bilan toʻldiriladi (grades-tour-demo.ts
   bilan bir xil naqsh — [[grades-tour-demo]]). Yozuvlar faqat mahalliy
   React holatida saqlanadi — `useAttendanceStore.setRecords` chaqirilmaydi,
   shu sabab server'ga hech narsa yozilmaydi.
   ════════════════════════════════════════════════════════════════════ */

import type { ClassColor } from "@/lib/class-colors";
import type { ClassInfo, Student } from "@/lib/grades-data";
import type { AttendanceRecord } from "@/lib/attendance-data";

/** Avtomatik tanlangan demo sinf. */
export const ATTENDANCE_TOUR_DEMO_CLASS_ID = "demo-attendance-cl-1";

export function makeAttendanceTourDemoClasses(): ClassInfo[] {
  return [
    { id: ATTENDANCE_TOUR_DEMO_CLASS_ID, name: "7-A", subject: "Matematika", color: "sky" as ClassColor },
    { id: "demo-attendance-cl-2", name: "8-B", subject: "Ona tili", color: "green" as ClassColor },
    { id: "demo-attendance-cl-3", name: "9-A", subject: "Fizika", color: "amber" as ClassColor },
  ];
}

export function makeAttendanceTourDemoRoster(): Student[] {
  return [
    { id: "demo-att-s1", name: "Amina Yusupova", initials: "AY", status: "active" },
    { id: "demo-att-s2", name: "Bekzod Qodirov", initials: "BQ", status: "active" },
    { id: "demo-att-s3", name: "Dilshod Rashidov", initials: "DR", status: "active" },
    { id: "demo-att-s4", name: "Feruza Tosheva", initials: "FT", status: "active" },
    { id: "demo-att-s5", name: "Gʻayrat Sodiqov", initials: "GS", status: "active" },
  ];
}

/** Joriy oyning ish kunlari (Dush–Juma) — kalendar/jadval store'siz "dars kuni" hissi uchun. */
export function makeAttendanceTourDemoLessonDays(year: number, month: number): { date: string; dayOfWeek: number }[] {
  const days: { date: string; dayOfWeek: number }[] = [];
  const d = new Date(year, month - 1, 1);
  while (d.getMonth() === month - 1) {
    const dow = d.getDay();
    if (dow !== 0 && dow !== 6) {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");
      days.push({ date: `${y}-${m}-${dd}`, dayOfWeek: dow });
    }
    d.setDate(d.getDate() + 1);
  }
  return days;
}

// Deterministik naqsh — har oʻquvchi uchun turlicha, lekin barqaror koʻrinish.
const PATTERN: AttendanceRecord["status"][] = ["present", "present", "present", "present", "late", "present", "absent", "present", "excused", "present"];

export function makeAttendanceTourDemoRecords(
  roster: Student[],
  lessonDays: { date: string }[],
  todayKey: string
): AttendanceRecord[] {
  const records: AttendanceRecord[] = [];
  const pastDays = lessonDays.filter((d) => d.date <= todayKey);
  roster.forEach((s, si) => {
    pastDays.forEach((d, di) => {
      const status = PATTERN[(di + si * 3) % PATTERN.length];
      records.push({ studentId: s.id, date: d.date, status });
    });
  });
  return records;
}

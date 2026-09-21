/* ════════════════════════════════════════════════════════════════════
   DASHBOARD BOOTSTRAP — TIPLAR (neytral modul)

   ⛔ Bu tiplar `src/server/actions/bootstrap.ts` dan EKSPORT QILINMAYDI.
   `"use server"` faylda `export type { … }` yozish prodni butunlay
   buzadi (AGENTS.md dagi izohga qarang) — shuning uchun umumiy shakl
   shu yerda, ikkala tomon ham SHU YERDAN import qiladi.

   Fayl `server-only` ham, `"use server"` ham emas: faqat `import type`
   ishlatiladi, ular kompilyatsiyada oʻchadi, shuning uchun DAL tiplariga
   havola client bundle'ga hech narsa olib kirmaydi.
   ════════════════════════════════════════════════════════════════════ */

import type { AttendancePayload } from "@/server/dal/attendance";
import type { BehaviorPayload } from "@/server/dal/behavior";
import type { ClassNotesPayload } from "@/server/dal/class-notes";
import type { ClassPrefs } from "@/server/dal/class-prefs";
import type { FeedbackPayload } from "@/server/dal/feedback";
import type { LessonsPayload } from "@/server/dal/lessons";
import type { NotificationsPayload } from "@/server/dal/notifications";
import type { RelationsPayload } from "@/server/dal/relations";
import type { SettingsPayload } from "@/server/dal/settings";
import type { StandardsPayload } from "@/server/dal/standards";
import type { StudentNotesPayload } from "@/server/dal/student-notes";
import type { TasksPayload } from "@/server/dal/tasks";
import type { TimetablePayload } from "@/server/dal/timetable";
import type { ClassData } from "@/lib/grades-data";
import type { AcademicYearCalendar } from "@/lib/academic-calendar";
import type { AcademicYearEntry } from "@/lib/academic-years";

/** Kalendar boʻlagi — `fetchYearsAction` bilan bir xil shakl.
    `null` = serverda yil yoʻq → eager-seed ishlaydi. */
export type CalendarSlice = {
  years: AcademicYearEntry[];
  calendar: AcademicYearCalendar;
} | null;

/** Dashboard layout mount boʻlganda BITTA soʻrovda keladigan hamma narsa.
    Kalitlar `components/sync/*ServerSync` fayllariga bir-birga mos. */
export type DashboardBootstrap = {
  settings: SettingsPayload;
  grades: { classDataMap: Record<string, ClassData> };
  attendance: AttendancePayload;
  lessons: LessonsPayload;
  timetable: TimetablePayload;
  calendar: CalendarSlice;
  standards: StandardsPayload;
  classNotes: ClassNotesPayload;
  relations: RelationsPayload;
  classPrefs: ClassPrefs | null;
  notifications: NotificationsPayload;
  feedback: FeedbackPayload;
  behavior: BehaviorPayload;
  studentNotes: StudentNotesPayload;
  tasks: TasksPayload;
};

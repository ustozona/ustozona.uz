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

/** Har boʻlakning yuki — `*ServerSync` fayl nomlariga bir-birga mos. */
export type DashboardPayloads = {
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

/* ⛔ NEGA HAR BOʻLAK ALOHIDA NATIJA QAYTARADI

   Ilgari 15 ta mustaqil soʻrov bor edi va bitta yiqilsa faqat oʻzi
   yiqilardi. Ularni bitta soʻrovga birlashtirish xatolikni ham
   birlashtirib qoʻyardi: `Promise.all` birinchi rad javobda butun
   amalni rad etadi, yaʼni bitta buzuq qator butun ilovani hydrate
   boʻlmagan holda qoldirardi — va `useHydrateStore` xatoda `false`
   qaytargani uchun HECH BIR store sync'ni boshlamasdi.

   Shuning uchun natija boʻlak-boʻlak: yiqilgan boʻlak faqat oʻzining
   store'ini hydrate qilmaydi va faqat oʻzining sync'ini boshlamaydi.
   Qolgan 14 tasi normal ishlaydi.

   ⚠️ Yiqilgan boʻlakka JIMGINA standart qiymat BERILMAYDI. Berilsa
   store default holatda "hydrate boʻldim" deb hisoblanardi, sync
   boshlanardi va oʻsha standartlar serverdagi haqiqiy maʼlumot ustiga
   yozilardi (`useHydrateStore` izohidagi asosiy qoida). */
export type SliceResult<T> = { ok: true; value: T } | { ok: false; error: string };

/** Dashboard layout mount boʻlganda BITTA soʻrovda keladigan hamma narsa. */
export type DashboardBootstrap = {
  [K in keyof DashboardPayloads]: SliceResult<DashboardPayloads[K]>;
};

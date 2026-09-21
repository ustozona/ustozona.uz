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
import type { DashboardBootstrap, CalendarSlice } from "@/lib/sync/bootstrap-types";

/* ════════════════════════════════════════════════════════════════════
   DASHBOARD BOOTSTRAP — 15 ta hydration soʻrovi oʻrniga BITTA.

   Ilgari `dashboard/layout.tsx` dagi har `*ServerSync` mount'da oʻz
   `fetch*Action()` ini chaqirardi. Next Server Action'larni NAVBATGA
   qoʻyadi — yaʼni 15 ta POST ketma-ket ketardi va ekranda maʼlumot
   oxirgisi qaytgandan keyin paydo boʻlardi. Har soʻrov, ustiga, oʻz
   sessiya tekshiruvini ham olib kelardi.

   Endi hammasi bitta soʻrovda: DAL chaqiruvlari server ichida
   `Promise.all` bilan PARALLEL ketadi, `requireTeacher` esa React
   `cache()` bilan oʻralgani uchun sessiya bir marta oʻqiladi.

   ⛔ Bu faylda `export type { … }` YOZILMAYDI — AGENTS.md dagi
   `"use server"` qoidasi. Tiplar `@/lib/sync/bootstrap-types` da.

   ⚠️ Alohida `fetch*Action` lar OʻCHIRILMADI: ular hydration'dan
   keyingi nuqtaviy qayta oʻqishlarda kerak (masalan
   `reloadGradesFromServer`). Bu yerda faqat MOUNT yoʻli birlashtirildi.
   ════════════════════════════════════════════════════════════════════ */

export async function fetchDashboardBootstrapAction(): Promise<DashboardBootstrap> {
  const [
    settings,
    classDataMap,
    attendance,
    lessons,
    timetable,
    years,
    standards,
    classNotes,
    relations,
    classPrefs,
    notifications,
    feedback,
    behavior,
    studentNotes,
    tasks,
  ] = await Promise.all([
    getSettings(),
    getGradesPayload(),
    getAttendancePayload(),
    getLessonsPayload(),
    getTimetablePayload(),
    getYears(),
    getStandardsPayload(),
    getClassNotes(),
    getRelations(),
    getClassPrefs(),
    getNotificationsPayload(),
    getFeedbackPayload(),
    getBehaviorPayload(),
    getStudentNotesPayload(),
    getTasksPayload(),
  ]);

  /* `fetchYearsAction` bilan bir xil shakl: yil yoʻq boʻlsa `null`,
     shunda `CalendarServerSync` eager-seed yoʻliga tushadi. */
  const calendar: CalendarSlice =
    years.length === 0 ? null : { years, calendar: activeYear(years)!.calendar };

  return {
    settings,
    grades: { classDataMap },
    attendance,
    lessons,
    timetable,
    calendar,
    standards,
    classNotes,
    relations,
    classPrefs,
    notifications,
    feedback,
    behavior,
    studentNotes,
    tasks,
  };
}

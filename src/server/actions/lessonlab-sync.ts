"use server";

import { revalidatePath } from "next/cache";
import { syncRosterDirect, syncTestsDirect } from "@/server/dal/lessonlab-import";
import type { SyncOutcome } from "@/lib/sync-types";

/* LessonLab bilan TOʻGʻRIDAN sinxronizatsiya — rozilik soʻralmaydi.

   Bogʻlangan oʻqituvchi uchun OAuth ortiqcha: ikkala mahsulot bitta
   bazada va `user_telegram` kimlikni allaqachon tasdiqlagan.
   Bogʻlanmagan boʻlsa `not_linked` qaytadi va mijoz eski OAuth yoʻliga
   (`/api/lessonlab/start`) yuboradi — u yerda rozilik HAQIQATAN kerak.

   ⛔ BU FAYLDA `export type { … }` YOZMANG — `AGENTS.md` ga qarang.
   `SyncOutcome` neytral moduldan (`@/lib/sync-types`) keladi.

   Auth: `syncRosterDirect` / `syncTestsDirect` ichida `requireTeacher()`,
   telegram id esa FAQAT sessiyadagi oʻqituvchining `user_telegram`
   qatoridan — argument sifatida qabul qilinmaydi. */

export async function syncRosterAction(): Promise<SyncOutcome> {
  try {
    const res = await syncRosterDirect();
    if (!res.ok) return { ok: false, reason: "not_linked" };
    // Sahifa server komponentida sinf roʻyxatini oʻqiydi — yangilanmasa
    // oʻqituvchi «hech narsa boʻlmadi» deb oʻylardi.
    revalidatePath("/baholash");
    return {
      ok: true,
      classesCreated: res.report.classesCreated,
      studentsCreated: res.report.studentsCreated,
      testsCreated: res.report.testsCreated,
      testsUpdated: res.report.testsUpdated,
      conflicts: res.report.conflicts.length,
      skipped: res.report.skipped.length,
      reportId: res.reportId,
    };
  } catch {
    // Batafsil xato mijozga chiqmaydi (u yerda oʻquvchi/test nomlari
    // boʻlishi mumkin); sabab server logida qoladi.
    return { ok: false, reason: "failed" };
  }
}

export async function syncTestsAction(classId: string): Promise<SyncOutcome> {
  try {
    const res = await syncTestsDirect(classId);
    if (!res.ok) return { ok: false, reason: "not_linked" };
    revalidatePath("/baholash");
    return {
      ok: true,
      classesCreated: res.report.classesCreated,
      studentsCreated: res.report.studentsCreated,
      testsCreated: res.report.testsCreated,
      testsUpdated: res.report.testsUpdated,
      conflicts: res.report.conflicts.length,
      skipped: res.report.skipped.length,
      reportId: res.reportId,
    };
  } catch {
    return { ok: false, reason: "failed" };
  }
}

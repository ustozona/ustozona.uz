import "server-only";
import { and, asc, eq } from "drizzle-orm";
import { db } from "@/server/db/client";
import { academicYears } from "@/server/db/schema";
import { requireTeacher } from "@/server/session";
import type { AcademicYearCalendar } from "@/lib/academic-calendar";

/* ════════════════════════════════════════════════════════════════════
   LEGACY CALENDAR DAL — endi FAOL oʻquv yiliga yoʻnaltiruvchi (koʻp-yil).

   Ilgari `calendars` (PK=teacher_id) bitta hujjat edi. Koʻp-yil
   migratsiyasidan soʻng manba `academic_years`. Yangi kod fetchYears/
   saveYears'dan foydalanadi; bu ikki funksiya faqat DEPLOYDAN OLDINGI
   eski brauzer tablari (fetchCalendarAction/saveCalendarAction) uchun
   moslik qatlami — ular endi FAOL yil qatorini oʻqiydi/yozadi, shunda
   eski tab yangi maʼlumotni buzmaydi. `calendars` jadvali tegilmaydi
   (rollback snapshoti). Bir reliz keyin bu qatlam olib tashlanadi.
   ════════════════════════════════════════════════════════════════════ */

export async function getCalendar(): Promise<AcademicYearCalendar | null> {
  const teacher = await requireTeacher();
  const [row] = await db
    .select()
    .from(academicYears)
    .where(and(eq(academicYears.teacherId, teacher.id), eq(academicYears.isActive, true)))
    .orderBy(asc(academicYears.createdAt))
    .limit(1);
  return row ? (row.data as unknown as AcademicYearCalendar) : null;
}

export async function saveCalendar(calendar: AcademicYearCalendar): Promise<void> {
  const teacher = await requireTeacher();
  const data = calendar as unknown as Record<string, unknown>;
  const [active] = await db
    .select({ id: academicYears.id })
    .from(academicYears)
    .where(and(eq(academicYears.teacherId, teacher.id), eq(academicYears.isActive, true)))
    .orderBy(asc(academicYears.createdAt))
    .limit(1);

  if (active) {
    await db
      .update(academicYears)
      .set({ data, updatedAt: new Date() })
      .where(eq(academicYears.id, active.id));
  } else {
    // Faol yil yoʻq (yangi hisob) — eski tab yozayotgan boʻlsa yaratamiz.
    await db.insert(academicYears).values({
      id: crypto.randomUUID(),
      teacherId: teacher.id,
      data,
      isActive: true,
    });
  }
}

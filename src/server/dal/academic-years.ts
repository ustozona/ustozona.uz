import "server-only";
import { and, asc, eq, notInArray, sql } from "drizzle-orm";
import { db } from "@/server/db/client";
import { academicYears } from "@/server/db/schema";
import { requireTeacher } from "@/server/session";
import type { AcademicYearCalendar } from "@/lib/academic-calendar";
import type { AcademicYearEntry } from "@/lib/academic-years";

/* ════════════════════════════════════════════════════════════════════
   ACADEMIC YEARS DAL — useCalendarStore'ning server tomoni (koʻp-yil).

   Har oʻquv yili = qator (data JSONB = AcademicYearCalendar). Snapshot
   sync: butun roʻyxat kelib, upsert + delete-missing bilan bazaga
   moslashtiriladi. "Bitta faol" invariantini `isActive` boʻyicha partial
   unique index kafolatlaydi; upsert oldidan mavjud faol bayroqlar
   tozalanadi (bir statementda ikkita faol paydo boʻlmasin).
   ════════════════════════════════════════════════════════════════════ */

export async function getYears(): Promise<AcademicYearEntry[]> {
  const teacher = await requireTeacher();
  const rows = await db
    .select()
    .from(academicYears)
    .where(eq(academicYears.teacherId, teacher.id))
    .orderBy(asc(academicYears.createdAt));
  return rows.map((r) => ({
    id: r.id,
    isActive: r.isActive,
    calendar: r.data as unknown as AcademicYearCalendar,
  }));
}

export async function saveYears(years: AcademicYearEntry[]): Promise<void> {
  const teacher = await requireTeacher();
  const tid = teacher.id;

  // Bitta faol assert — roʻyxat boʻsh boʻlmasa aynan bitta faol yil boʻlsin.
  const activeCount = years.filter((y) => y.isActive).length;
  if (years.length > 0 && activeCount !== 1) {
    throw new Error(
      `academic_years: aynan bitta faol yil kutilgan edi, ${activeCount} keldi`
    );
  }

  const now = new Date();

  // 1) Faol bayroqlarni tozalash — yilni almashtirishda partial unique index
  //    (bitta faol) bitta INSERT ichida ikki faol qatordan buzilmasin.
  await db
    .update(academicYears)
    .set({ isActive: false, updatedAt: now })
    .where(and(eq(academicYears.teacherId, tid), eq(academicYears.isActive, true)));

  // 2) Upsert — kelgan har qatorni yozadi (aynan bittasi faol).
  if (years.length > 0) {
    await db
      .insert(academicYears)
      .values(
        years.map((y) => ({
          id: y.id,
          teacherId: tid,
          data: y.calendar as unknown as Record<string, unknown>,
          isActive: y.isActive,
          updatedAt: now,
        }))
      )
      .onConflictDoUpdate({
        target: academicYears.id,
        set: {
          data: sql`excluded.data`,
          isActive: sql`excluded.is_active`,
          updatedAt: now,
        },
        setWhere: eq(academicYears.teacherId, tid),
      });
  }

  // 3) Delete-missing — roʻyxatda qolmagan yillarni oʻchiradi.
  const keepIds = years.map((y) => y.id);
  if (keepIds.length > 0) {
    await db
      .delete(academicYears)
      .where(and(eq(academicYears.teacherId, tid), notInArray(academicYears.id, keepIds)));
  } else {
    await db.delete(academicYears).where(eq(academicYears.teacherId, tid));
  }
}

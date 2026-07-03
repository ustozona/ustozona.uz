import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/server/db/client";
import { calendars } from "@/server/db/schema";
import { requireTeacher } from "@/server/session";
import type { AcademicYearCalendar } from "@/lib/academic-calendar";

/* ════════════════════════════════════════════════════════════════════
   CALENDAR DAL — useCalendarStore'ning server tomoni.
   Oʻqituvchi boshiga BITTA hujjat (PK = teacher_id); satr yoʻq boʻlsa
   null qaytadi va store DEFAULT_CALENDAR bilan qoladi.
   ════════════════════════════════════════════════════════════════════ */

export async function getCalendar(): Promise<AcademicYearCalendar | null> {
  const teacher = await requireTeacher();
  const [row] = await db
    .select()
    .from(calendars)
    .where(eq(calendars.teacherId, teacher.id));
  return row ? (row.data as unknown as AcademicYearCalendar) : null;
}

export async function saveCalendar(calendar: AcademicYearCalendar): Promise<void> {
  const teacher = await requireTeacher();
  await db
    .insert(calendars)
    .values({
      teacherId: teacher.id,
      data: calendar as unknown as Record<string, unknown>,
    })
    .onConflictDoUpdate({
      target: calendars.teacherId,
      set: {
        data: calendar as unknown as Record<string, unknown>,
        updatedAt: new Date(),
      },
    });
}

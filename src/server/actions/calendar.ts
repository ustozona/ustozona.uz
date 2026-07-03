"use server";

import { z } from "zod";
import { getCalendar, saveCalendar } from "@/server/dal/calendar";
import type { AcademicYearCalendar } from "@/lib/academic-calendar";

/* Calendar server actions — yupqa qatlam: zod-parse → DAL.
   Hujjat bitta — batch/diff yoʻq, butun snapshot saqlanadi. */

const rangeSchema = z.object({
  start: z.string().min(8).max(20),
  end: z.string().min(8).max(20),
});

const calendarSchema = z.object({
  yearLabel: z.string().min(1).max(40),
  range: rangeSchema,
  quarters: z
    .array(
      z.object({ id: z.string().min(1).max(100), name: z.string().min(1).max(100), range: rangeSchema })
    )
    .max(12),
  holidays: z
    .array(
      z.object({ id: z.string().min(1).max(100), name: z.string().min(1).max(200), range: rangeSchema })
    )
    .max(100),
});

export async function fetchCalendarAction(): Promise<{
  calendar: AcademicYearCalendar;
} | null> {
  const calendar = await getCalendar();
  return calendar ? { calendar } : null;
}

export async function saveCalendarAction(input: {
  calendar: AcademicYearCalendar;
}): Promise<{ ok: true }> {
  await saveCalendar(calendarSchema.parse(input.calendar));
  return { ok: true };
}

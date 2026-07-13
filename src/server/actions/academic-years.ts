"use server";

import { z } from "zod";
import { getYears, saveYears } from "@/server/dal/academic-years";
import { activeYear, type AcademicYearEntry } from "@/lib/academic-years";
import type { AcademicYearCalendar } from "@/lib/academic-calendar";

/* Academic years server actions — yupqa qatlam: zod-parse → DAL.
   Snapshot rejimi: butun `years` roʻyxati kelib DAL upsert+delete qiladi. */

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

const yearSchema = z.object({
  id: z.string().min(1).max(100),
  isActive: z.boolean(),
  calendar: calendarSchema,
});

export async function fetchYearsAction(): Promise<{
  years: AcademicYearEntry[];
  calendar: AcademicYearCalendar;
} | null> {
  const years = await getYears();
  if (years.length === 0) return null; // → eager-seed
  const active = activeYear(years)!;
  // `calendar` = faol yilning koʻzgusi (store hydration ikkalasini ham oʻrnatadi).
  return { years, calendar: active.calendar };
}

export async function saveYearsAction(input: {
  years: AcademicYearEntry[];
}): Promise<{ ok: true }> {
  const years = z.array(yearSchema).max(50).parse(input.years);
  await saveYears(years);
  return { ok: true };
}

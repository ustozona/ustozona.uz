import "server-only";
import { ForbiddenError, UnauthorizedError } from "@/server/session";
import { activeYear } from "@/lib/academic-years";
import { isCalendarConfigured } from "@/lib/academic-calendar";
import type { DoskaCalendarResult } from "@/lib/doska/countdown";
import { getYears } from "./academic-years";

/* ════════════════════════════════════════════════════════════════════
   DOSKA — oʻquv kalendari «voqea sanogʻi» uchun (docs/doska-referens-
   koriklari.md R407).

   Faqat FAOL yil kalendari, faqat oʻqish. Bepul tarifda ham ochiq —
   kalendarda shaxsiy maʼlumot yoʻq (taʼtil va chorak sanalari).

   «Kirmagan», «oʻqituvchi emas» va «kalendar sozlanmagan» — XATO EMAS,
   `none` javobi: `/doska` mehmonga ham ochiq (R134), vidjet esa oʻz
   voqeasini yozishni taklif qiladi.
   ════════════════════════════════════════════════════════════════════ */

export async function doskaCalendar(): Promise<DoskaCalendarResult> {
  let years;
  try {
    years = await getYears();
  } catch (e) {
    if (e instanceof UnauthorizedError || e instanceof ForbiddenError) return { status: "none" };
    throw e;
  }
  const calendar = activeYear(years)?.calendar;
  if (!calendar || !isCalendarConfigured(calendar)) return { status: "none" };
  return { status: "ok", calendar };
}

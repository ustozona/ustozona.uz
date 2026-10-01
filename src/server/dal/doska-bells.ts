import "server-only";
import { ForbiddenError, UnauthorizedError } from "@/server/session";
import { computePeriods } from "@/lib/bell-schedule";
import { resolveVersionForDate } from "@/lib/timetable-versions";
import type { DoskaBellsResult } from "@/lib/doska/bells";
import { getTimetablePayload } from "./timetable";

/* ════════════════════════════════════════════════════════════════════
   DOSKA — bugungi qoʻngʻiroq jadvali, soat vidjeti uchun (R408).

   `today` — BRAUZER sanasi ("YYYY-MM-DD"): server boshqa vaqt
   mintaqasida boʻlishi mumkin, jadval versiyasi esa oʻqituvchining
   kuniga qarab tanlanadi. Faqat oʻqish, bepul tarifda ham — vaqtlarda
   shaxsiy maʼlumot yoʻq. Kirmagan / jadvalsiz — `none` (xato emas).
   ════════════════════════════════════════════════════════════════════ */

export async function doskaBells(today: string): Promise<DoskaBellsResult> {
  let versions;
  try {
    versions = (await getTimetablePayload()).versions;
  } catch (e) {
    if (e instanceof UnauthorizedError || e instanceof ForbiddenError) return { status: "none" };
    throw e;
  }
  const version = resolveVersionForDate(versions, today);
  if (!version) return { status: "none" };
  const periods = computePeriods(version.bellConfig).map((p) => ({
    index: p.index,
    shift: p.shift,
    startMin: p.startMin,
    endMin: p.endMin,
  }));
  return periods.length > 0 ? { status: "ok", periods } : { status: "none" };
}

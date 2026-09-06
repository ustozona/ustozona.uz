import "server-only";
import { sql } from "drizzle-orm";
import { pgView, text, timestamp, integer, doublePrecision } from "drizzle-orm/pg-core";
import { db } from "./client";

/* ════════════════════════════════════════════════════════════════════
   SQL KOʻRINISHLARI — Drizzle uchun eʼlon (yaratish EMAS).

   `.existing()` — drizzle-kit bu koʻrinishlarni BOSHQARMAYDI: ular
   `drizzle/views/faollik.sql` da yashaydi va qoʻlda qoʻllanadi.
   Bu yerda faqat JOIN va sort tip-xavfsiz boʻlishi uchun tavsif bor.

   ⚠️ BU FAYL `schema/index.ts` DAN EKSPORT QILINMAYDI — ataylab.
   drizzle-kit sxemani oʻsha fayldan oʻqiydi; koʻrinishlar unga
   koʻrinsa, migratsiya generatsiyasiga aralashib ketardi (prodda
   migratsiya hash'lari allaqachon nozik holatda).

   Taʼrif va sabablar: drizzle/views/faollik.sql
   ════════════════════════════════════════════════════════════════════ */

export const teacherActivitySummary = pgView("v_teacher_activity_summary", {
  teacherId: text("teacher_id").notNull(),
  firstAt: timestamp("first_at", { withTimezone: true }),
  lastAt: timestamp("last_at", { withTimezone: true }),
  /** Oxirgi harakat qaysi boʻlimda — «Oxirgi ish» ustunida koʻrsatiladi. */
  lastArea: text("last_area"),
  activeDaysTotal: integer("active_days_total"),
  areasTotal: integer("areas_total"),
  activeDays30d: integer("active_days_30d"),
  areas30d: integer("areas_30d"),
  activeDays7d: integer("active_days_7d"),
}).existing();

export const teacherSessionStats = pgView("v_teacher_session_stats", {
  teacherId: text("teacher_id").notNull(),
  sessions30d: integer("sessions_30d"),
  medianMinutes30d: doublePrecision("median_minutes_30d"),
  p90Minutes30d: doublePrecision("p90_minutes_30d"),
  totalMinutes30d: doublePrecision("total_minutes_30d"),
}).existing();

/** Faollik koʻrinishlari bazada bormi.

    Nega kerak: koʻrinishlar Drizzle migratsiyalaridan TASHQARIDA
    (`drizzle/views/faollik.sql` qoʻlda qoʻllanadi, chunki prodda
    migratsiya hash'lari nozik holatda). Kod prodga koʻrinishdan OLDIN
    yetib borsa, joinlar butun sahifani yiqitardi.

    ⚠️ Yoʻq boʻlsa eski (notoʻgʻri) taʼrifga QAYTILMAYDI — u jimgina
    yolgʻon raqam berardi, yaʼni aynan tuzatilayotgan xatoni koʻrinmas
    holda tiklardi. */
export async function hasActivityViews(): Promise<boolean> {
  const [probe] = await db.execute<{ exists: string | null }>(
    sql`SELECT to_regclass('public.v_teacher_activity_summary')::text AS exists`,
  );
  return Boolean(probe?.exists);
}

/* Boʻlim nomlari va chegaralar `@/lib/faollik` da — ular client
   komponentga ham kerak, bu fayl esa `server-only`. */

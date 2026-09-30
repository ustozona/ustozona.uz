import "server-only";
import { and, asc, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/server/db/client";
import { enrollmentPeriods, enrollments, students } from "@/server/db/schema";
import { periodOnSql } from "@/server/db/membership";
import { todayTashkentKey } from "@/lib/date-keys";
import type { MembershipPeriod, MembershipSpan } from "@/lib/membership";

/* ════════════════════════════════════════════════════════════════════
   SINF ROʻYXATI — «kim shu kuni shu guruhda?» ning YAGONA server manbasi.

   docs/sinf-azoligi-spec.md §5. Boshqa DAL `enrollments.ended_at` ni
   oʻzi tekshirmaydi — ilgari aynan shu tufayli toʻrt joyda (oʻyinga
   qoʻshilish, AI konteksti, admin statistikasi) ketgan bola «hali shu
   sinfda» deb hisoblanardi.

   Qoida — `memberOnSql` / `periodOnSql` (server/db/membership.ts),
   mijozdagi `isMemberOn` bilan AYNAN bir xil: yarim-ochiq
   [started_on, ended_on), null = chegara yoʻq. Haqiqat manbai —
   `enrollment_periods`; `enrollments.started_at/ended_at` faqat kesh.
   Arxivlangan oʻquvchi (`status = archived`) roʻyxatga kirmaydi.

   ⚠️ Ruxsat tekshiruvi BU YERDA YOʻQ — chaqiruvchi (`assertTeachesClass`
   va h.k.) oʻzi qiladi.
   ════════════════════════════════════════════════════════════════════ */

export type RosterMember = {
  id: string;
  name: string;
  joinedAt: string | null;
  leftAt: string | null;
};

/** Sinfda `date` kuni aʼzo boʻlganlar, jurnal tartibida. `joinedAt` /
    `leftAt` — `date` ni qamragan DAVRniki (bola qaytgan boʻlsa — oʻsha stint). */
export async function rosterOn(classId: string, date: string): Promise<RosterMember[]> {
  const rows = await db
    .select({
      id: students.id,
      name: students.name,
      status: students.status,
      joinedAt: enrollmentPeriods.startedOn,
      leftAt: enrollmentPeriods.endedOn,
    })
    .from(enrollments)
    .innerJoin(students, eq(students.id, enrollments.studentId))
    .innerJoin(
      enrollmentPeriods,
      and(
        eq(enrollmentPeriods.classId, enrollments.classId),
        eq(enrollmentPeriods.studentId, enrollments.studentId)
      )
    )
    .where(and(eq(enrollments.classId, classId), periodOnSql(date)))
    .orderBy(asc(enrollments.sortOrder), asc(students.createdAt));

  return rows
    .filter((r) => r.status !== "archived")
    .map(({ id, name, joinedAt, leftAt }) => ({ id, name, joinedAt, leftAt }));
}

/**
 * Sinfning BUGUNGI roʻyxati (Toshkent kuni) — baholash varaqlari, doska
 * gʻildiragi, oʻyinlar, mobil jurnal kabi «hozir» ekranlari uchun.
 */
export async function activeClassRoster(classId: string): Promise<{ id: string; name: string }[]> {
  const roster = await rosterOn(classId, todayTashkentKey());
  return roster.map(({ id, name }) => ({ id, name }));
}

const CHUNK = 400;

/**
 * Chegarasi bor aʼzoliklar: `(classId|studentId) → oraliq`. Chegarasiz
 * (bitta `[NULL, NULL)` davrli, oddiy) yozilishlar qaytarilmaydi — ular har
 * kuni aʼzo, soʻrovni kichik tutish uchun. Bola sinfga bir necha marta
 * kirgan boʻlsa — `periods` bilan barcha davrlari (yozuvlarni saralash:
 * davomat serveri).
 *
 * Soʻrovlar ketma-ket: bitta amalda pool'dan koʻp parallel soʻrov
 * Supavisor'da osilib qoladi.
 */
export async function boundedSpans(
  classIds: string[],
  studentIds: string[]
): Promise<Map<string, MembershipSpan>> {
  const out = new Map<string, MembershipSpan>();
  if (classIds.length === 0 || studentIds.length === 0) return out;
  const uniqStudents = [...new Set(studentIds)];
  for (let i = 0; i < uniqStudents.length; i += CHUNK) {
    const rows = await db
      .select({
        classId: enrollmentPeriods.classId,
        studentId: enrollmentPeriods.studentId,
        from: enrollmentPeriods.startedOn,
        to: enrollmentPeriods.endedOn,
      })
      .from(enrollmentPeriods)
      .where(
        and(
          inArray(enrollmentPeriods.classId, [...new Set(classIds)]),
          inArray(enrollmentPeriods.studentId, uniqStudents.slice(i, i + CHUNK))
        )
      )
      .orderBy(sql`${enrollmentPeriods.startedOn} ASC NULLS FIRST`);
    const byKey = new Map<string, MembershipPeriod[]>();
    for (const r of rows) {
      const key = spanKey(r.classId, r.studentId);
      const list = byKey.get(key) ?? [];
      list.push({ from: r.from, to: r.to });
      byKey.set(key, list);
    }
    for (const [key, periods] of byKey) {
      if (periods.length === 1) {
        const [p] = periods;
        if (p.from === null && p.to === null) continue;
        out.set(key, { joinedAt: p.from, leftAt: p.to });
      } else {
        const last = periods[periods.length - 1];
        out.set(key, { joinedAt: last.from, leftAt: last.to, periods });
      }
    }
  }
  return out;
}

export function spanKey(classId: string, studentId: string): string {
  return `${classId}|${studentId}`;
}

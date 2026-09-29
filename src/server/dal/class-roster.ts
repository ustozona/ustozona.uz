import "server-only";
import { and, asc, eq, inArray, isNotNull, or } from "drizzle-orm";
import { db } from "@/server/db/client";
import { enrollments, students } from "@/server/db/schema";
import { memberOnSql } from "@/server/db/membership";
import { todayTashkentKey } from "@/lib/date-keys";
import type { MembershipSpan } from "@/lib/membership";

/* ════════════════════════════════════════════════════════════════════
   SINF ROʻYXATI — «kim shu kuni shu guruhda?» ning YAGONA server manbasi.

   docs/sinf-azoligi-spec.md §5. Boshqa DAL `enrollments.ended_at` ni
   oʻzi tekshirmaydi — ilgari aynan shu tufayli toʻrt joyda (oʻyinga
   qoʻshilish, AI konteksti, admin statistikasi) ketgan bola «hali shu
   sinfda» deb hisoblanardi.

   Qoida — `memberOnSql` (server/db/membership.ts), mijozdagi `isMemberOn`
   bilan AYNAN bir xil: yarim-ochiq [started_at, ended_at), null = chegara
   yoʻq. Arxivlangan oʻquvchi (`status = archived`) roʻyxatga kirmaydi.

   ⚠️ Ruxsat tekshiruvi BU YERDA YOʻQ — chaqiruvchi (`assertTeachesClass`
   va h.k.) oʻzi qiladi.
   ════════════════════════════════════════════════════════════════════ */

export type RosterMember = {
  id: string;
  name: string;
  joinedAt: string | null;
  leftAt: string | null;
};

/** Sinfda `date` kuni aʼzo boʻlganlar, jurnal tartibida. */
export async function rosterOn(classId: string, date: string): Promise<RosterMember[]> {
  const rows = await db
    .select({
      id: students.id,
      name: students.name,
      status: students.status,
      joinedAt: enrollments.startedAt,
      leftAt: enrollments.endedAt,
    })
    .from(enrollments)
    .innerJoin(students, eq(students.id, enrollments.studentId))
    .where(and(eq(enrollments.classId, classId), memberOnSql(date)))
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

/** Bola `date` kuni shu sinfda boʻlganmi (arxivlanganlik tekshirilmaydi —
    bu aʼzolik savoli, roʻyxat savoli emas). */
export async function isMember(classId: string, studentId: string, date: string): Promise<boolean> {
  const [row] = await db
    .select({ id: enrollments.studentId })
    .from(enrollments)
    .where(
      and(eq(enrollments.classId, classId), eq(enrollments.studentId, studentId), memberOnSql(date))
    )
    .limit(1);
  return !!row;
}

const CHUNK = 400;

/**
 * Chegarasi bor aʼzoliklar: `(classId|studentId) → oraliq`. Chegarasiz
 * (oddiy) yozilishlar qaytarilmaydi — ular har kuni aʼzo, soʻrovni
 * kichik tutish uchun. Yozuvlarni saralash (davomat serveri) uchun.
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
        classId: enrollments.classId,
        studentId: enrollments.studentId,
        joinedAt: enrollments.startedAt,
        leftAt: enrollments.endedAt,
      })
      .from(enrollments)
      .where(
        and(
          inArray(enrollments.classId, [...new Set(classIds)]),
          inArray(enrollments.studentId, uniqStudents.slice(i, i + CHUNK)),
          or(isNotNull(enrollments.startedAt), isNotNull(enrollments.endedAt))
        )
      );
    for (const r of rows) {
      out.set(spanKey(r.classId, r.studentId), { joinedAt: r.joinedAt, leftAt: r.leftAt });
    }
  }
  return out;
}

export function spanKey(classId: string, studentId: string): string {
  return `${classId}|${studentId}`;
}

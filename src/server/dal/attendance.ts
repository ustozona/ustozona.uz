import "server-only";
import { and, asc, eq, inArray, or } from "drizzle-orm";
import { sql } from "drizzle-orm";
import { db } from "@/server/db/client";
import {
  attendanceRecords,
  attendanceStatuses,
  classes,
  students,
  type AttendanceRecordRow,
  type AttendanceStatusRow,
} from "@/server/db/schema";
import { requireTeacher } from "@/server/session";
import { visibleClassIds, visibleStudentIds } from "@/server/workspace";
import {
  BUILTIN_STATUSES,
  normalizeScoreImpact,
  type AttendanceRecord,
  type AttendanceStatusDef,
} from "@/lib/attendance-data";
import type { AttendanceBatch } from "@/lib/sync/attendance-batch";

/* ════════════════════════════════════════════════════════════════════
   ATTENDANCE DAL — useAttendanceStore'ning server tomoni.

   Oʻqish: statuses (sortOrder tartibida) + records (sinf boʻyicha
   guruhlangan) → frontend {recordsByClass, statuses} shakli.
   Yangi oʻqituvchida statuses jadvali boʻsh — BUILTIN_STATUSES defaulti
   qaytariladi (DB'ga YOZILMAYDI; birinchi oʻzgarishda sync yozadi).

   Yozish: grades DAL bilan bir xil qoidalar — tranzaksiyasiz
   (neon-http), idempotent upsert, teacher egaligi filtri.
   ════════════════════════════════════════════════════════════════════ */

const CHUNK = 400;

function chunks<T>(rows: T[]): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < rows.length; i += CHUNK) out.push(rows.slice(i, i + CHUNK));
  return out;
}

/**
 * Statuslar toʻplami QULFLANGAN: har doim 4 ta built-in, shu tartibda.
 * DB'dan faqat oʻqituvchi oʻzgartira oladigan maydonlar olinadi
 * (active, scoreImpact); label/icon/tone — kod manbasidan. Notanish
 * kalitli qatorlar eʼtiborsiz qoldiriladi.
 */
function mergeStatuses(rows: AttendanceStatusRow[]): AttendanceStatusDef[] {
  const byKey = new Map(rows.map((r) => [r.key, r]));
  return BUILTIN_STATUSES.map((b) => {
    const row = byKey.get(b.key);
    return row
      ? {
          ...b,
          active: row.active,
          // Eski positive/negative/neutral qiymatlar amaldagi vaznlarga tiklanadi
          scoreImpact: normalizeScoreImpact(b.key, row.scoreImpact),
        }
      : { ...b };
  });
}

function rowToRecord(r: AttendanceRecordRow): AttendanceRecord {
  return {
    studentId: r.studentId,
    date: r.date,
    status: r.status,
    ...(r.note ? { note: r.note } : {}),
  };
}

export type AttendancePayload = {
  recordsByClass: Record<string, AttendanceRecord[]>;
  statuses: AttendanceStatusDef[];
};

export async function getAttendancePayload(): Promise<AttendancePayload> {
  const teacher = await requireTeacher();
  const tid = teacher.id;

  const [statusRows, recordRows] = await Promise.all([
    db
      .select()
      .from(attendanceStatuses)
      .where(eq(attendanceStatuses.teacherId, tid))
      .orderBy(asc(attendanceStatuses.sortOrder)),
    db.select().from(attendanceRecords).where(eq(attendanceRecords.teacherId, tid)),
  ]);

  const recordsByClass: Record<string, AttendanceRecord[]> = {};
  for (const r of recordRows) {
    (recordsByClass[r.classId] ??= []).push(rowToRecord(r));
  }

  return {
    recordsByClass,
    statuses: mergeStatuses(statusRows),
  };
}

export async function applyAttendanceBatch(batch: AttendanceBatch): Promise<void> {
  const teacher = await requireTeacher();
  const tid = teacher.id;
  const now = new Date();

  /* 1. Holatlar — PK (teacherId, key), begona qatorga tegib boʻlmaydi. */
  for (const part of chunks(batch.statusesUpsert)) {
    await db
      .insert(attendanceStatuses)
      .values(
        part.map((s) => ({
          teacherId: tid,
          key: s.key,
          label: s.label,
          icon: s.icon,
          scoreImpact: s.scoreImpact,
          active: s.active,
          builtIn: s.builtIn,
          tone: s.tone,
          sortOrder: s.sortOrder,
        }))
      )
      .onConflictDoUpdate({
        target: [attendanceStatuses.teacherId, attendanceStatuses.key],
        set: {
          label: sql`excluded.label`,
          icon: sql`excluded.icon`,
          scoreImpact: sql`excluded.score_impact`,
          active: sql`excluded.active`,
          builtIn: sql`excluded.built_in`,
          tone: sql`excluded.tone`,
          sortOrder: sql`excluded.sort_order`,
        },
      });
  }
  if (batch.statusesDelete.length > 0) {
    await db
      .delete(attendanceStatuses)
      .where(
        and(
          eq(attendanceStatuses.teacherId, tid),
          inArray(attendanceStatuses.key, batch.statusesDelete)
        )
      );
  }

  /* 2. Yozuvlar — dars va oʻquvchi qamrovda boʻlsin (PK'da teacherId yoʻq). */
  const [classIds, studentIds] = await Promise.all([
    visibleClassIds("data"),
    visibleStudentIds("data"),
  ]);
  const ownClasses = new Set(classIds);
  const ownStudents = new Set(studentIds);

  const recordUpserts = batch.recordsUpsert.filter(
    (r) => ownClasses.has(r.classId) && ownStudents.has(r.studentId)
  );
  for (const part of chunks(recordUpserts)) {
    await db
      .insert(attendanceRecords)
      .values(
        part.map((r) => ({
          teacherId: tid,
          classId: r.classId,
          studentId: r.studentId,
          date: r.date,
          status: r.status,
          note: r.note,
        }))
      )
      .onConflictDoUpdate({
        target: [
          attendanceRecords.classId,
          attendanceRecords.studentId,
          attendanceRecords.date,
        ],
        set: {
          status: sql`excluded.status`,
          note: sql`excluded.note`,
          updatedAt: now,
        },
        setWhere: eq(attendanceRecords.teacherId, tid),
      });
  }

  for (const part of chunks(batch.recordsDelete)) {
    await db
      .delete(attendanceRecords)
      .where(
        and(
          eq(attendanceRecords.teacherId, tid),
          or(
            ...part.map((k) =>
              and(
                eq(attendanceRecords.classId, k.classId),
                eq(attendanceRecords.studentId, k.studentId),
                eq(attendanceRecords.date, k.date)
              )
            )
          )
        )
      );
  }
}

import "server-only";
import { and, asc, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/server/db/client";
import { timetableVersions } from "@/server/db/schema";
import { requireTeacher } from "@/server/session";
import type { TimetableVersion } from "@/lib/timetable-versions";
import type { TimetableBatch } from "@/lib/sync/timetable-batch";

/* ════════════════════════════════════════════════════════════════════
   TIMETABLE DAL — useTimetableStore'ning server tomoni.
   Versiya = hujjat (events/bellConfig JSONB snapshotlari).
   ════════════════════════════════════════════════════════════════════ */

export type TimetablePayload = { versions: TimetableVersion[] };

export async function getTimetablePayload(): Promise<TimetablePayload> {
  const teacher = await requireTeacher();

  const rows = await db
    .select()
    .from(timetableVersions)
    .where(eq(timetableVersions.teacherId, teacher.id))
    .orderBy(asc(timetableVersions.effectiveFrom));

  return {
    versions: rows.map((v) => ({
      id: v.id,
      effectiveFrom: v.effectiveFrom,
      events: v.events as TimetableVersion["events"],
      bellConfig: v.bellConfig as unknown as TimetableVersion["bellConfig"],
      ...(v.note ? { note: v.note } : {}),
      createdAt: v.createdAt,
    })),
  };
}

export async function applyTimetableBatch(batch: TimetableBatch): Promise<void> {
  const teacher = await requireTeacher();
  const tid = teacher.id;
  const now = new Date();

  if (batch.versionsUpsert.length > 0) {
    await db
      .insert(timetableVersions)
      .values(
        batch.versionsUpsert.map((v) => ({
          id: v.id,
          teacherId: tid,
          effectiveFrom: v.effectiveFrom,
          note: v.note,
          createdAt: v.createdAt,
          bellConfig: v.bellConfig,
          events: v.events,
        }))
      )
      .onConflictDoUpdate({
        target: timetableVersions.id,
        set: {
          effectiveFrom: sql`excluded.effective_from`,
          note: sql`excluded.note`,
          createdAt: sql`excluded.created_at`,
          bellConfig: sql`excluded.bell_config`,
          events: sql`excluded.events`,
          updatedAt: now,
        },
        setWhere: eq(timetableVersions.teacherId, tid),
      });
  }

  if (batch.versionsDelete.length > 0) {
    await db
      .delete(timetableVersions)
      .where(
        and(
          eq(timetableVersions.teacherId, tid),
          inArray(timetableVersions.id, batch.versionsDelete)
        )
      );
  }
}

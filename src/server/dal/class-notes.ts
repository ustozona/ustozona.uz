import "server-only";
import { and, eq, notInArray, sql } from "drizzle-orm";
import { db } from "@/server/db/client";
import { classNotes } from "@/server/db/schema";
import { requireTeacher } from "@/server/session";

/* ════════════════════════════════════════════════════════════════════
   CLASS NOTES DAL — useClassNotesStore'ning server tomoni.
   Kichik Record<classId, string> — butun snapshot saqlanadi:
   har yozuv upsert, snapshot'da yoʻq classId qatorlari oʻchiriladi.
   ════════════════════════════════════════════════════════════════════ */

export type ClassNotesPayload = { notes: Record<string, string> };

export async function getClassNotes(): Promise<ClassNotesPayload> {
  const teacher = await requireTeacher();
  const rows = await db
    .select()
    .from(classNotes)
    .where(eq(classNotes.teacherId, teacher.id));
  return { notes: Object.fromEntries(rows.map((r) => [r.classId, r.note])) };
}

export async function saveClassNotes(notes: Record<string, string>): Promise<void> {
  const teacher = await requireTeacher();
  const tid = teacher.id;
  const now = new Date();
  const entries = Object.entries(notes);

  if (entries.length > 0) {
    await db
      .insert(classNotes)
      .values(entries.map(([classId, note]) => ({ teacherId: tid, classId, note })))
      .onConflictDoUpdate({
        target: [classNotes.teacherId, classNotes.classId],
        set: { note: sql`excluded.note`, updatedAt: now },
      });
  }

  const keep = entries.map(([classId]) => classId);
  await db
    .delete(classNotes)
    .where(
      keep.length > 0
        ? and(eq(classNotes.teacherId, tid), notInArray(classNotes.classId, keep))
        : eq(classNotes.teacherId, tid)
    );
}

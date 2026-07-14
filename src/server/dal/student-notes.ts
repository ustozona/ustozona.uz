import "server-only";
import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/server/db/client";
import { studentNotes } from "@/server/db/schema";
import { requireTeacher } from "@/server/session";
import type { StudentNoteEntry } from "@/store/useStudentNotesStore";
import type { StudentNotesBatch } from "@/lib/sync/student-notes-batch";

/* Student notes DAL — useStudentNotesStore'ning server tomoni.
   feedback DAL qoidalari: idempotent upsert + setWhere teacherId. */

export type StudentNotesPayload = { items: StudentNoteEntry[] };

export async function getStudentNotesPayload(): Promise<StudentNotesPayload> {
  const teacher = await requireTeacher();
  const rows = await db
    .select()
    .from(studentNotes)
    .where(eq(studentNotes.teacherId, teacher.id))
    .orderBy(desc(studentNotes.createdAt));
  return {
    items: rows.map((r) => ({
      id: r.id,
      studentId: r.studentId,
      text: r.text,
      sentiment: r.sentiment as StudentNoteEntry["sentiment"],
      createdAt: r.createdAt,
    })),
  };
}

export async function applyStudentNotesBatch(batch: StudentNotesBatch): Promise<void> {
  const teacher = await requireTeacher();
  const tid = teacher.id;

  if (batch.itemsUpsert.length) {
    await db
      .insert(studentNotes)
      .values(
        batch.itemsUpsert.map((n) => ({
          id: n.id,
          teacherId: tid,
          studentId: n.studentId,
          text: n.text,
          sentiment: n.sentiment,
          createdAt: n.createdAt,
        }))
      )
      .onConflictDoUpdate({
        target: studentNotes.id,
        set: {
          text: sql`excluded.text`,
          sentiment: sql`excluded.sentiment`,
        },
        setWhere: eq(studentNotes.teacherId, tid),
      });
  }

  if (batch.itemsDelete.length) {
    await db
      .delete(studentNotes)
      .where(and(eq(studentNotes.teacherId, tid), inArray(studentNotes.id, batch.itemsDelete)));
  }
}

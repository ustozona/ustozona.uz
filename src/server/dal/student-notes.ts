import "server-only";
import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/server/db/client";
import { studentNotes, teachers } from "@/server/db/schema";
import { requireTeacher } from "@/server/session";
import type { StudentNoteEntry } from "@/store/useStudentNotesStore";
import type { StudentNotesBatch } from "@/lib/sync/student-notes-batch";

/* Student notes DAL — useStudentNotesStore'ning server tomoni.
   feedback DAL qoidalari: idempotent upsert + setWhere teacherId. */

export type StudentNotesPayload = { items: StudentNoteEntry[] };

export async function getStudentNotesPayload(): Promise<StudentNotesPayload> {
  const teacher = await requireTeacher();
  const rows = await db
    .select({
      id: studentNotes.id,
      studentId: studentNotes.studentId,
      title: studentNotes.title,
      text: studentNotes.text,
      tags: studentNotes.tags,
      color: studentNotes.color,
      visibility: studentNotes.visibility,
      createdAt: studentNotes.createdAt,
      authorId: studentNotes.teacherId,
      authorName: teachers.name,
      authorAvatarUrl: teachers.avatarUrl,
    })
    .from(studentNotes)
    .innerJoin(teachers, eq(teachers.id, studentNotes.teacherId))
    .where(eq(studentNotes.teacherId, teacher.id))
    .orderBy(desc(studentNotes.createdAt));
  return {
    items: rows.map((r) => ({
      id: r.id,
      studentId: r.studentId,
      title: r.title,
      text: r.text,
      tags: (r.tags as string[]) ?? [],
      color: r.color,
      visibility: r.visibility as StudentNoteEntry["visibility"],
      createdAt: r.createdAt,
      authorId: r.authorId,
      authorName: r.authorName,
      authorAvatarUrl: r.authorAvatarUrl,
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
          title: n.title,
          text: n.text,
          tags: n.tags,
          color: n.color,
          visibility: n.visibility,
          createdAt: n.createdAt,
        }))
      )
      .onConflictDoUpdate({
        target: studentNotes.id,
        set: {
          title: sql`excluded.title`,
          text: sql`excluded.text`,
          tags: sql`excluded.tags`,
          color: sql`excluded.color`,
          visibility: sql`excluded.visibility`,
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

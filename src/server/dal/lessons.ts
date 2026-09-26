import "server-only";
import { and, asc, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/server/db/client";
import { lessons, units } from "@/server/db/schema";
import { requireTeacher } from "@/server/session";
import type { Lesson, Unit } from "@/lib/lessons-data";
import type { LessonsBatch, LessonsDeleteCommand } from "@/lib/sync/lessons-batch";

/* ════════════════════════════════════════════════════════════════════
   LESSONS DAL — useLessonStore'ning server tomoni.

   Oʻqish: lessons.data JSONB = haqiqat manbai (toʻliq Lesson hujjati),
   ustunlar faqat denormallangan nusxa. Yozish: grades DAL qoidalari
   (idempotent upsert + setWhere teacherId; tranzaksiyasiz).
   classId/unitId FK emas — egalik filtri shart emas, qatorlar baribir
   teacherId bilan izolyatsiyalangan.
   ════════════════════════════════════════════════════════════════════ */

const CHUNK = 200; // lessons.data katta boʻlishi mumkin (content HTML)

function chunks<T>(rows: T[]): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < rows.length; i += CHUNK) out.push(rows.slice(i, i + CHUNK));
  return out;
}

export type LessonsPayload = { units: Unit[]; lessons: Lesson[] };

export async function getLessonsPayload(): Promise<LessonsPayload> {
  const teacher = await requireTeacher();
  const tid = teacher.id;

  const [unitRows, lessonRows] = await Promise.all([
    db.select().from(units).where(eq(units.teacherId, tid)).orderBy(asc(units.sortOrder)),
    db
      .select()
      .from(lessons)
      .where(eq(lessons.teacherId, tid))
      .orderBy(asc(lessons.sortOrder)),
  ]);

  return {
    units: unitRows.map((u) => ({
      id: u.id,
      classId: u.classId,
      number: u.number,
      title: u.title,
      description: u.description,
    })),
    lessons: lessonRows.map((l) => l.data as unknown as Lesson),
  };
}

export async function applyLessonsBatch(batch: LessonsBatch): Promise<void> {
  const teacher = await requireTeacher();
  const tid = teacher.id;
  const now = new Date();

  for (const part of chunks(batch.unitsUpsert)) {
    await db
      .insert(units)
      .values(
        part.map((u) => ({
          id: u.id,
          teacherId: tid,
          classId: u.classId,
          number: u.number,
          title: u.title,
          description: u.description,
          sortOrder: u.sortOrder,
        }))
      )
      .onConflictDoUpdate({
        target: units.id,
        set: {
          classId: sql`excluded.class_id`,
          number: sql`excluded.number`,
          title: sql`excluded.title`,
          description: sql`excluded.description`,
          sortOrder: sql`excluded.sort_order`,
          updatedAt: now,
        },
        setWhere: eq(units.teacherId, tid),
      });
  }

  for (const part of chunks(batch.lessonsUpsert)) {
    await db
      .insert(lessons)
      .values(
        part.map((l) => ({
          id: l.id,
          teacherId: tid,
          classId: l.classId,
          unitId: l.unitId,
          number: l.number,
          title: l.title,
          status: l.status,
          sortOrder: l.sortOrder,
          data: l.data,
        }))
      )
      .onConflictDoUpdate({
        target: lessons.id,
        set: {
          classId: sql`excluded.class_id`,
          unitId: sql`excluded.unit_id`,
          number: sql`excluded.number`,
          title: sql`excluded.title`,
          status: sql`excluded.status`,
          sortOrder: sql`excluded.sort_order`,
          data: sql`excluded.data`,
          updatedAt: now,
        },
        setWhere: eq(lessons.teacherId, tid),
      });
  }

  for (const part of chunks(batch.lessonsDelete)) {
    await db.delete(lessons).where(and(eq(lessons.teacherId, tid), inArray(lessons.id, part)));
  }
  for (const part of chunks(batch.unitsDelete)) {
    await db.delete(units).where(and(eq(units.teacherId, tid), inArray(units.id, part)));
  }
}

/**
 * Boʻlim va darslarni ATAYLAB oʻchirish — `applyLessonsBatch` dagi
 * farqdan chiqarilgan oʻchirishdan farqli oʻlaroq, bu aniq buyruq.
 *
 * Bitta tranzaksiya: yo hammasi oʻchadi, yo hech nima. Yarim holat
 * (boʻlim ketdi, darsi qoldi) — aynan shu funksiya oldini olishi kerak
 * boʻlgan narsa.
 *
 * Idempotent: mavjud boʻlmagan id xato bermaydi. Shu sabab buyruqni
 * qayta yuborish xavfsiz — tarmoq uzilganda chaqiruvchi shunday qiladi.
 */
export async function deleteLessonsAndUnits(
  cmd: LessonsDeleteCommand
): Promise<{ lessons: number; units: number }> {
  const teacher = await requireTeacher();
  const tid = teacher.id;
  if (!cmd.lessonIds.length && !cmd.unitIds.length) return { lessons: 0, units: 0 };

  return db.transaction(async (tx) => {
    let lessonCount = 0;
    let unitCount = 0;

    for (const part of chunks(cmd.lessonIds)) {
      const rows = await tx
        .delete(lessons)
        .where(and(eq(lessons.teacherId, tid), inArray(lessons.id, part)))
        .returning({ id: lessons.id });
      lessonCount += rows.length;
    }

    for (const part of chunks(cmd.unitIds)) {
      const rows = await tx
        .delete(units)
        .where(and(eq(units.teacherId, tid), inArray(units.id, part)))
        .returning({ id: units.id });
      unitCount += rows.length;

      /* Xavfsizlik toʻri: boʻlim ketdi, lekin uni koʻrsatib turgan dars
         qoldi (foydalanuvchi «Darslar oʻchmasin» ni tanlagan boʻlishi
         mumkin). Ustun osilib qolmasin — `data` JSONB'ni klient
         baribir tuzatilgan holida qayta yozadi. */
      await tx
        .update(lessons)
        .set({ unitId: null })
        .where(and(eq(lessons.teacherId, tid), inArray(lessons.unitId, part)));
    }

    return { lessons: lessonCount, units: unitCount };
  });
}

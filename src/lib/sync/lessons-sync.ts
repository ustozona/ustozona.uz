import type { Lesson, Unit } from "@/lib/lessons-data";
import {
  emptyLessonsBatch,
  isEmptyLessonsBatch,
  type LessonsBatch,
  type LessonUpsert,
  type UnitUpsert,
} from "./lessons-batch";

/* ════════════════════════════════════════════════════════════════════
   LESSONS DIFF — {units, lessons} (prev, next) → batch | null.
   grades-sync bilan bir xil: id boʻyicha, reference yoki pozitsiya
   oʻzgargan element upsert; yoʻqolgan id delete.
   ════════════════════════════════════════════════════════════════════ */

export type LessonsSnapshot = { units: Unit[]; lessons: Lesson[] };

function toUnitUpsert(u: Unit, sortOrder: number): UnitUpsert {
  return {
    id: u.id,
    classId: u.classId,
    number: u.number,
    title: u.title,
    description: u.description ?? "",
    sortOrder,
  };
}

function toLessonUpsert(l: Lesson, sortOrder: number): LessonUpsert {
  return {
    id: l.id,
    classId: l.classId,
    unitId: l.unitId ?? null,
    number: l.number,
    title: l.title,
    status: l.status,
    sortOrder,
    data: l as unknown as Record<string, unknown>,
  };
}

function diffList<T extends { id: string }, U>(
  prev: T[],
  next: T[],
  toUpsert: (item: T, index: number) => U,
  upserts: U[],
  deletes: string[]
): void {
  const prevById = new Map<string, { item: T; index: number }>();
  prev.forEach((item, index) => prevById.set(item.id, { item, index }));

  next.forEach((item, index) => {
    const p = prevById.get(item.id);
    if (!p || p.item !== item || p.index !== index) upserts.push(toUpsert(item, index));
  });

  const nextIds = new Set(next.map((it) => it.id));
  for (const it of prev) if (!nextIds.has(it.id)) deletes.push(it.id);
}

export function diffLessons(
  prev: LessonsSnapshot,
  next: LessonsSnapshot
): LessonsBatch | null {
  if (prev.units === next.units && prev.lessons === next.lessons) return null;
  const batch = emptyLessonsBatch();

  if (prev.units !== next.units) {
    diffList(prev.units, next.units, toUnitUpsert, batch.unitsUpsert, batch.unitsDelete);
  }
  if (prev.lessons !== next.lessons) {
    diffList(
      prev.lessons,
      next.lessons,
      toLessonUpsert,
      batch.lessonsUpsert,
      batch.lessonsDelete
    );
  }

  return isEmptyLessonsBatch(batch) ? null : batch;
}

import type { StudentNoteEntry } from "@/store/useStudentNotesStore";
import {
  emptyStudentNotesBatch,
  isEmptyStudentNotesBatch,
  type StudentNotesBatch,
  type StudentNoteUpsert,
} from "./student-notes-batch";

/* Student notes diff — {items} (prev, next) → batch | null.
   feedback-sync bilan bir xil: id boʻyicha, reference oʻzgargan
   element upsert; yoʻqolgan id delete. */

export type StudentNotesSnapshot = { items: StudentNoteEntry[] };

function toUpsert(n: StudentNoteEntry): StudentNoteUpsert {
  return {
    id: n.id,
    studentId: n.studentId,
    title: n.title,
    text: n.text,
    tags: n.tags,
    color: n.color,
    visibility: n.visibility,
    createdAt: n.createdAt,
  };
}

export function diffStudentNotes(
  prev: StudentNotesSnapshot,
  next: StudentNotesSnapshot
): StudentNotesBatch | null {
  if (prev.items === next.items) return null;
  const batch = emptyStudentNotesBatch();

  const prevById = new Map(prev.items.map((n) => [n.id, n]));
  for (const n of next.items) {
    const p = prevById.get(n.id);
    if (!p || p !== n) batch.itemsUpsert.push(toUpsert(n));
  }

  const nextIds = new Set(next.items.map((n) => n.id));
  for (const n of prev.items) if (!nextIds.has(n.id)) batch.itemsDelete.push(n.id);

  return isEmptyStudentNotesBatch(batch) ? null : batch;
}

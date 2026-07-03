"use server";

import { z } from "zod";
import {
  getClassNotes,
  saveClassNotes,
  type ClassNotesPayload,
} from "@/server/dal/class-notes";

/* Class notes server actions — yupqa qatlam: zod-parse → DAL.
   Kichik Record — batch/diff yoʻq, butun snapshot saqlanadi. */

const notesSchema = z.record(z.string().min(1).max(200), z.string().max(20000));

export async function fetchClassNotesAction(): Promise<ClassNotesPayload> {
  return getClassNotes();
}

export async function saveClassNotesAction(input: {
  notes: Record<string, string>;
}): Promise<{ ok: true }> {
  await saveClassNotes(notesSchema.parse(input.notes));
  return { ok: true };
}

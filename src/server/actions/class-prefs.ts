"use server";

import { z } from "zod";
import {
  getClassPrefs,
  saveClassPrefs,
  type ClassPrefs,
} from "@/server/dal/class-prefs";

/* Class prefs server actions — yupqa qatlam: zod-parse → DAL.
   Bitta kichik hujjat (teachers.prefs.classPrefs) — snapshot saqlanadi. */

const journalScaleSchema = z.object({
  kind: z.string().min(1).max(30),
  labelStyle: z.enum(["number", "word"]),
  showPercent: z.boolean(),
});

const classPrefsSchema = z.object({
  selectedClassId: z.string().min(1).max(200),
  journalScale: journalScaleSchema,
  journalScaleByClass: z.record(z.string(), journalScaleSchema).optional(),
});

export async function fetchClassPrefsAction(): Promise<ClassPrefs | null> {
  return getClassPrefs();
}

export async function saveClassPrefsAction(input: ClassPrefs): Promise<{ ok: true }> {
  await saveClassPrefs(classPrefsSchema.parse(input) as ClassPrefs);
  return { ok: true };
}

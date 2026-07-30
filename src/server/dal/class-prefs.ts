import "server-only";
import { eq, sql } from "drizzle-orm";
import { db } from "@/server/db/client";
import { teachers } from "@/server/db/schema";
import { requireTeacher } from "@/server/session";
import type { JournalScale } from "@/lib/grade-scale";

/* ════════════════════════════════════════════════════════════════════
   CLASS PREFS DAL — useClassStore'ning persist boʻlagi (selectedClassId
   + journalScale) → teachers.prefs.classPrefs kaliti ostida.

   Yozish JSONB `||` merge bilan ATOMIK — settings sync (avatarColor,
   workspaceBackground) bilan poygada bir-birining kalitini oʻchirib
   yubormaydi.
   ════════════════════════════════════════════════════════════════════ */

export type ClassPrefs = {
  selectedClassId: string;
  journalScale: JournalScale;
  /** Sinf darajasidagi bekor qilish (C3) — yoʻq boʻlsa `journalScale` ishlatiladi. */
  journalScaleByClass?: Record<string, JournalScale>;
};

type PrefsDoc = { classPrefs?: Partial<ClassPrefs> };

export async function getClassPrefs(): Promise<ClassPrefs | null> {
  const teacher = await requireTeacher();
  const stored = ((teacher.prefs ?? {}) as PrefsDoc).classPrefs;
  if (!stored || typeof stored.selectedClassId !== "string" || !stored.journalScale) {
    return null;
  }
  return {
    selectedClassId: stored.selectedClassId,
    journalScale: stored.journalScale as JournalScale,
    journalScaleByClass: (stored.journalScaleByClass as Record<string, JournalScale>) ?? {},
  };
}

export async function saveClassPrefs(prefs: ClassPrefs): Promise<void> {
  const teacher = await requireTeacher();
  const patch = JSON.stringify({ classPrefs: prefs });
  await db
    .update(teachers)
    .set({
      prefs: sql`${teachers.prefs} || ${patch}::jsonb`,
      updatedAt: new Date(),
    })
    .where(eq(teachers.id, teacher.id));
}

import "server-only";
import { randomUUID } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { db } from "@/server/db/client";
import { activitySets, type ActivitySetRow } from "@/server/db/schema";
import { requireTeacher } from "@/server/session";

/* ════════════════════════════════════════════════════════════════════
   ACTIVITY SETS — kviz, taqdimot, interaktiv video, matn+savol.
   Bitta tushunchaning toʻrt koʻrinishi (B4.3) — `containerKind` ajratadi.
   `purpose: formative | summative` YADRO AJRATUVCHI — publish.ts shu
   bilan tekshiradi.
   ════════════════════════════════════════════════════════════════════ */

export type CreateSetInput = {
  classId: string;
  title: string;
  purpose: "formative" | "summative";
  items: { activityId: string; role: "entry" | "check" | "vocabulary" | "practice" | "exit" }[];
  containerKind?: "none" | "deck" | "video" | "passage";
  containerRef?: string;
  config?: Record<string, unknown>;
};

export async function listSets(classId?: string): Promise<ActivitySetRow[]> {
  const teacher = await requireTeacher();
  return db
    .select()
    .from(activitySets)
    .where(
      classId
        ? and(eq(activitySets.teacherId, teacher.id), eq(activitySets.classId, classId))
        : eq(activitySets.teacherId, teacher.id)
    );
}

export async function getSet(id: string): Promise<ActivitySetRow | null> {
  const teacher = await requireTeacher();
  const [row] = await db
    .select()
    .from(activitySets)
    .where(and(eq(activitySets.id, id), eq(activitySets.teacherId, teacher.id)));
  return row ?? null;
}

export async function createSet(input: CreateSetInput): Promise<ActivitySetRow> {
  const teacher = await requireTeacher();
  const [row] = await db
    .insert(activitySets)
    .values({
      id: randomUUID(),
      teacherId: teacher.id,
      classId: input.classId,
      title: input.title,
      purpose: input.purpose,
      items: input.items,
      containerKind: input.containerKind ?? "none",
      containerRef: input.containerRef ?? null,
      config: input.config ?? {},
    })
    .returning();
  return row;
}

export type UpdateSetInput = Partial<Omit<CreateSetInput, "classId">>;

export async function updateSet(id: string, patch: UpdateSetInput): Promise<ActivitySetRow> {
  const teacher = await requireTeacher();
  const [row] = await db
    .update(activitySets)
    .set({ ...patch, updatedAt: new Date() })
    .where(and(eq(activitySets.id, id), eq(activitySets.teacherId, teacher.id)))
    .returning();
  if (!row) throw new Error("Toʻplam topilmadi yoki sizga tegishli emas");
  return row;
}

export async function deleteSet(id: string): Promise<void> {
  const teacher = await requireTeacher();
  await db
    .delete(activitySets)
    .where(and(eq(activitySets.id, id), eq(activitySets.teacherId, teacher.id)));
}

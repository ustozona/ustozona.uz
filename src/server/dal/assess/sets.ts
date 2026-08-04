import "server-only";
import { randomUUID } from "node:crypto";
import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/server/db/client";
import {
  activities,
  activityItems,
  activitySets,
  type ActivitySetRow,
} from "@/server/db/schema";
import type { SetContentSummary } from "@/lib/baholash-shells";
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

/**
 * Toʻplamlarning qobiq uchun muhim kontent xulosasi.
 *
 * Nega alohida funksiya: `listSets()` faqat `activity_sets` qatorini
 * qaytaradi, u yerda `items` — faqat `activityId` roʻyxati. Shakl ham,
 * variant soni ham boshqa ikki jadvalda. Qobiq mosligini hisoblash
 * uchun esa aynan shular kerak (`shellAvailability()`).
 *
 * Hamma toʻplam uchun UCHTA soʻrov bajariladi, har toʻplamga alohida
 * emas — panel bir necha oʻnlab toʻplamni birdan koʻrsatadi.
 */
export async function summarizeSetContent(
  sets: ActivitySetRow[]
): Promise<Map<string, SetContentSummary>> {
  const out = new Map<string, SetContentSummary>();
  const empty = (): SetContentSummary => ({
    countByShape: {},
    minOptions: null,
    maxOptions: null,
  });

  const allActivityIds = [...new Set(sets.flatMap((s) => s.items.map((i) => i.activityId)))];
  if (allActivityIds.length === 0) {
    sets.forEach((s) => out.set(s.id, empty()));
    return out;
  }

  const teacher = await requireTeacher();

  const activityRows = await db
    .select({ id: activities.id, shape: activities.shape })
    .from(activities)
    .where(and(eq(activities.teacherId, teacher.id), inArray(activities.id, allActivityIds)));
  const shapeById = new Map(activityRows.map((a) => [a.id, a.shape as string]));

  const itemRows = await db
    .select({ activityId: activityItems.activityId, content: activityItems.content })
    .from(activityItems)
    .where(inArray(activityItems.activityId, allActivityIds));

  // Faoliyat → shu faoliyatdagi mcq variantlari soni. `mcq` da bitta
  // element boʻladi (content.ts shu taxminda ishlaydi), lekin bir
  // nechta kelsa ham eng kengini olamiz — qobiq eng ogʻir holatni
  // chiza olishi kerak.
  const optionsById = new Map<string, number[]>();
  for (const row of itemRows) {
    const options = (row.content as { options?: unknown[] } | null)?.options;
    if (!Array.isArray(options)) continue;
    const list = optionsById.get(row.activityId) ?? [];
    list.push(options.length);
    optionsById.set(row.activityId, list);
  }

  for (const set of sets) {
    const summary = empty();
    for (const { activityId } of set.items) {
      const shape = shapeById.get(activityId);
      if (!shape) continue; // oʻchirilgan yoki begona faoliyat — sanalmaydi
      summary.countByShape[shape] = (summary.countByShape[shape] ?? 0) + 1;
      if (shape !== "mcq") continue;
      for (const count of optionsById.get(activityId) ?? []) {
        summary.minOptions =
          summary.minOptions === null ? count : Math.min(summary.minOptions, count);
        summary.maxOptions =
          summary.maxOptions === null ? count : Math.max(summary.maxOptions, count);
      }
    }
    out.set(set.id, summary);
  }

  return out;
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

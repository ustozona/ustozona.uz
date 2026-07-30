import "server-only";
import { randomUUID } from "node:crypto";
import { and, asc, eq } from "drizzle-orm";
import { db } from "@/server/db/client";
import {
  activities,
  activityItems,
  type ActivityItemRow,
  type ActivityRow,
  type ActivityShape,
  type GradingKind,
} from "@/server/db/schema";
import { requireTeacher } from "@/server/session";

/* ════════════════════════════════════════════════════════════════════
   ACTIVITIES — bitta faoliyat (savol/toʻplam birligi) + uning elementlari.

   `version` element tahrirlanganda oshadi — `responses.itemVersion` shu
   bilan qulflanadi, oʻtmishdagi javoblar qayta yozilmaydi (B boʻlim,
   "Uchta ataylab qilingan qaror" #2).
   ════════════════════════════════════════════════════════════════════ */

export type ActivityWithItems = ActivityRow & { items: ActivityItemRow[] };

export async function getActivity(id: string): Promise<ActivityWithItems | null> {
  const teacher = await requireTeacher();
  const [activity] = await db
    .select()
    .from(activities)
    .where(and(eq(activities.id, id), eq(activities.teacherId, teacher.id)));
  if (!activity) return null;
  const items = await db
    .select()
    .from(activityItems)
    .where(eq(activityItems.activityId, id))
    .orderBy(asc(activityItems.ordinal));
  return { ...activity, items };
}

export async function listActivities(bankId?: string): Promise<ActivityRow[]> {
  const teacher = await requireTeacher();
  return db
    .select()
    .from(activities)
    .where(
      bankId
        ? and(eq(activities.teacherId, teacher.id), eq(activities.bankId, bankId))
        : eq(activities.teacherId, teacher.id)
    );
}

export type CreateActivityInput = {
  bankId?: string;
  standardId?: string;
  shape: ActivityShape;
  title: string;
  grading: GradingKind;
  source?: "teacher" | "ai" | "bank" | "student";
  config?: Record<string, unknown>;
  items: { content: Record<string, unknown> }[];
};

export async function createActivity(input: CreateActivityInput): Promise<ActivityWithItems> {
  const teacher = await requireTeacher();
  const activityId = randomUUID();
  const source = input.source ?? "teacher";
  // student/ai manbali kontent oʻqituvchi tasdigʻisiz oʻyinga chiqmaydi.
  const approved = source === "teacher" || source === "bank";

  const [activity] = await db
    .insert(activities)
    .values({
      id: activityId,
      teacherId: teacher.id,
      bankId: input.bankId ?? null,
      standardId: input.standardId ?? null,
      shape: input.shape,
      title: input.title,
      grading: input.grading,
      source,
      approved,
      config: input.config ?? {},
    })
    .returning();

  const items =
    input.items.length > 0
      ? await db
          .insert(activityItems)
          .values(
            input.items.map((item, ordinal) => ({
              id: randomUUID(),
              activityId,
              teacherId: teacher.id,
              ordinal,
              content: item.content,
            }))
          )
          .returning()
      : [];

  return { ...activity, items };
}

export type UpdateActivityInput = {
  title?: string;
  standardId?: string;
  grading?: GradingKind;
  approved?: boolean;
  config?: Record<string, unknown>;
  /** Berilsa — barcha elementlar ALMASHTIRILADI va `version` oshadi. */
  items?: { content: Record<string, unknown> }[];
};

export async function updateActivity(id: string, input: UpdateActivityInput): Promise<ActivityWithItems> {
  const teacher = await requireTeacher();
  const [existing] = await db
    .select()
    .from(activities)
    .where(and(eq(activities.id, id), eq(activities.teacherId, teacher.id)));
  if (!existing) throw new Error("Faoliyat topilmadi yoki sizga tegishli emas");

  const bumpsVersion = input.items !== undefined;
  const [activity] = await db
    .update(activities)
    .set({
      ...(input.title !== undefined ? { title: input.title } : {}),
      ...(input.standardId !== undefined ? { standardId: input.standardId } : {}),
      ...(input.grading !== undefined ? { grading: input.grading } : {}),
      ...(input.approved !== undefined ? { approved: input.approved } : {}),
      ...(input.config !== undefined ? { config: input.config } : {}),
      ...(bumpsVersion ? { version: existing.version + 1 } : {}),
      updatedAt: new Date(),
    })
    .where(eq(activities.id, id))
    .returning();

  if (input.items !== undefined) {
    await db.delete(activityItems).where(eq(activityItems.activityId, id));
    if (input.items.length > 0) {
      await db.insert(activityItems).values(
        input.items.map((item, ordinal) => ({
          id: randomUUID(),
          activityId: id,
          teacherId: teacher.id,
          ordinal,
          content: item.content,
        }))
      );
    }
  }

  const items = await db
    .select()
    .from(activityItems)
    .where(eq(activityItems.activityId, id))
    .orderBy(asc(activityItems.ordinal));
  return { ...activity, items };
}

export async function deleteActivity(id: string): Promise<void> {
  const teacher = await requireTeacher();
  await db.delete(activities).where(and(eq(activities.id, id), eq(activities.teacherId, teacher.id)));
}

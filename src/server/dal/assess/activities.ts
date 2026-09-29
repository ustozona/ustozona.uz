import "server-only";
import { randomUUID } from "node:crypto";
import { and, asc, eq, sql } from "drizzle-orm";
import { db } from "@/server/db/client";
import {
  activities,
  activityItems,
  activitySets,
  quizSessions,
  responses,
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
  /** Muharrirda savol turi almashtirilganda — elementlar ham birga almashadi. */
  shape?: ActivityShape;
  title?: string;
  standardId?: string;
  grading?: GradingKind;
  approved?: boolean;
  config?: Record<string, unknown>;
  /** Tarkib oʻzgarsa elementlar almashtiriladi va `version` oshadi. */
  items?: { content: Record<string, unknown> }[];
};

async function assertNoActivityHistory(id: string, teacherId: string): Promise<void> {
  const [answered] = await db
    .select({ id: responses.id })
    .from(responses)
    .where(and(eq(responses.activityId, id), eq(responses.teacherId, teacherId)))
    .limit(1);
  const [launched] = await db
    .select({ id: quizSessions.id })
    .from(quizSessions)
    .innerJoin(activitySets, eq(activitySets.id, quizSessions.setId))
    .where(
      and(
        eq(quizSessions.teacherId, teacherId),
        sql`${activitySets.items} @> ${JSON.stringify([{ activityId: id }])}::jsonb`
      )
    )
    .limit(1);
  if (answered || launched) {
    throw new Error("Bu savol allaqachon oʻtkazilgan. Natijalarni saqlash uchun yangi savol yarating.");
  }
}

function sameJson(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (a === null || b === null || typeof a !== "object" || typeof b !== "object") return false;
  if (Array.isArray(a) || Array.isArray(b)) {
    return Array.isArray(a) && Array.isArray(b) &&
      a.length === b.length && a.every((value, index) => sameJson(value, b[index]));
  }
  const left = a as Record<string, unknown>;
  const right = b as Record<string, unknown>;
  const keys = Object.keys(left);
  return keys.length === Object.keys(right).length &&
    keys.every((key) => Object.hasOwn(right, key) && sameJson(left[key], right[key]));
}

export async function updateActivity(id: string, input: UpdateActivityInput): Promise<ActivityWithItems> {
  const teacher = await requireTeacher();
  const [existing] = await db
    .select()
    .from(activities)
    .where(and(eq(activities.id, id), eq(activities.teacherId, teacher.id)));
  if (!existing) throw new Error("Faoliyat topilmadi yoki sizga tegishli emas");

  // Eski itemId'lar javoblar jadvalida CASCADE FK bilan bogʻlangan.
  // Faqat haqiqatan oʻzgargan elementlarni almashtiramiz.
  const currentItems = await db
    .select()
    .from(activityItems)
    .where(eq(activityItems.activityId, id))
    .orderBy(asc(activityItems.ordinal));
  const sameItems =
    input.items === undefined ||
    (input.items.length === currentItems.length &&
      input.items.every((item, index) =>
        sameJson(item.content, currentItems[index].content)
      ));
  const changesContent =
    !sameItems ||
    (input.shape !== undefined && input.shape !== existing.shape) ||
    (input.grading !== undefined && input.grading !== existing.grading) ||
    (input.config !== undefined && !sameJson(input.config, existing.config));
  if (changesContent) await assertNoActivityHistory(id, teacher.id);

  const bumpsVersion = input.items !== undefined && !sameItems;
  const [activity] = await db
    .update(activities)
    .set({
      ...(input.title !== undefined ? { title: input.title } : {}),
      ...(input.standardId !== undefined ? { standardId: input.standardId } : {}),
      ...(input.grading !== undefined ? { grading: input.grading } : {}),
      ...(input.approved !== undefined ? { approved: input.approved } : {}),
      ...(input.config !== undefined ? { config: input.config } : {}),
      ...(input.shape !== undefined ? { shape: input.shape } : {}),
      ...(bumpsVersion ? { version: existing.version + 1 } : {}),
      updatedAt: new Date(),
    })
    .where(eq(activities.id, id))
    .returning();

  if (bumpsVersion && input.items) {
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
  await assertNoActivityHistory(id, teacher.id);
  await db.delete(activities).where(and(eq(activities.id, id), eq(activities.teacherId, teacher.id)));
}

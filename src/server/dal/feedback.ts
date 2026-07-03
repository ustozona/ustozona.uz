import "server-only";
import { and, asc, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/server/db/client";
import { feedback } from "@/server/db/schema";
import { requireTeacher } from "@/server/session";
import type { FeedbackItem } from "@/store/useFeedbackStore";
import type { FeedbackBatch } from "@/lib/sync/feedback-batch";

/* ════════════════════════════════════════════════════════════════════
   FEEDBACK DAL — useFeedbackStore'ning server tomoni.

   Oʻqish: feedback.data JSONB = haqiqat manbai (toʻliq FeedbackItem).
   Yozish: lessons DAL qoidalari (idempotent upsert + setWhere
   teacherId). CHUNK kichik — rasmli itemlar base64 boʻlib katta.
   ════════════════════════════════════════════════════════════════════ */

const CHUNK = 20;

function chunks<T>(rows: T[]): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < rows.length; i += CHUNK) out.push(rows.slice(i, i + CHUNK));
  return out;
}

export type FeedbackPayload = { items: FeedbackItem[] };

export async function getFeedbackPayload(): Promise<FeedbackPayload> {
  const teacher = await requireTeacher();
  const rows = await db
    .select()
    .from(feedback)
    .where(eq(feedback.teacherId, teacher.id))
    .orderBy(asc(feedback.sortOrder));
  return { items: rows.map((r) => r.data as unknown as FeedbackItem) };
}

export async function applyFeedbackBatch(batch: FeedbackBatch): Promise<void> {
  const teacher = await requireTeacher();
  const tid = teacher.id;
  const now = new Date();

  for (const part of chunks(batch.itemsUpsert)) {
    await db
      .insert(feedback)
      .values(
        part.map((f) => ({
          id: f.id,
          teacherId: tid,
          status: f.status,
          category: f.category,
          sortOrder: f.sortOrder,
          data: f.data,
        }))
      )
      .onConflictDoUpdate({
        target: feedback.id,
        set: {
          status: sql`excluded.status`,
          category: sql`excluded.category`,
          sortOrder: sql`excluded.sort_order`,
          data: sql`excluded.data`,
          updatedAt: now,
        },
        setWhere: eq(feedback.teacherId, tid),
      });
  }

  for (const part of chunks(batch.itemsDelete)) {
    await db
      .delete(feedback)
      .where(and(eq(feedback.teacherId, tid), inArray(feedback.id, part)));
  }
}

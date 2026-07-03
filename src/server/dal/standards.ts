import "server-only";
import { and, asc, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/server/db/client";
import { standardSets } from "@/server/db/schema";
import { requireTeacher } from "@/server/session";
import type { CustomSet, StandardSet } from "@/store/useStandardsStore";
import type { StandardsBatch } from "@/lib/sync/standards-batch";

/* ════════════════════════════════════════════════════════════════════
   STANDARDS DAL — useStandardsStore'ning server tomoni.

   Oʻqish: standard_sets.data JSONB = haqiqat manbai; kind ustuni
   qatorlarni store'dagi ikki roʻyxatga (sets/customSets) ajratadi.
   Yozish: lessons DAL qoidalari (idempotent upsert + setWhere
   teacherId; tranzaksiyasiz).
   ════════════════════════════════════════════════════════════════════ */

const CHUNK = 200;

function chunks<T>(rows: T[]): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < rows.length; i += CHUNK) out.push(rows.slice(i, i + CHUNK));
  return out;
}

export type StandardsPayload = { sets: StandardSet[]; customSets: CustomSet[] };

export async function getStandardsPayload(): Promise<StandardsPayload> {
  const teacher = await requireTeacher();
  const rows = await db
    .select()
    .from(standardSets)
    .where(eq(standardSets.teacherId, teacher.id))
    .orderBy(asc(standardSets.sortOrder));
  return {
    sets: rows
      .filter((r) => r.kind === "class")
      .map((r) => r.data as unknown as StandardSet),
    customSets: rows
      .filter((r) => r.kind === "custom")
      .map((r) => r.data as unknown as CustomSet),
  };
}

export async function applyStandardsBatch(batch: StandardsBatch): Promise<void> {
  const teacher = await requireTeacher();
  const tid = teacher.id;
  const now = new Date();

  for (const part of chunks(batch.setsUpsert)) {
    await db
      .insert(standardSets)
      .values(
        part.map((s) => ({
          id: s.id,
          teacherId: tid,
          kind: s.kind,
          name: s.name,
          subject: s.subject,
          sortOrder: s.sortOrder,
          data: s.data,
        }))
      )
      .onConflictDoUpdate({
        target: standardSets.id,
        set: {
          kind: sql`excluded.kind`,
          name: sql`excluded.name`,
          subject: sql`excluded.subject`,
          sortOrder: sql`excluded.sort_order`,
          data: sql`excluded.data`,
          updatedAt: now,
        },
        setWhere: eq(standardSets.teacherId, tid),
      });
  }

  for (const part of chunks(batch.setsDelete)) {
    await db
      .delete(standardSets)
      .where(and(eq(standardSets.teacherId, tid), inArray(standardSets.id, part)));
  }
}

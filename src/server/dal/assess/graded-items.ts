import "server-only";
import { and, inArray, ne, eq, sql } from "drizzle-orm";
import { db } from "@/server/db/client";
import { activities, activityItems } from "@/server/db/schema";

/* ════════════════════════════════════════════════════════════════════
   BAHOLANADIGAN ELEMENTLAR — maks. ball, aniqlik va yakunlash foizi
   uchun yagona manba.

   Soʻrovnoma va soʻz buluti (`grading = "none"`) javobni `activity_items`
   qatoriga bogʻlaydi, lekin toʻgʻri javobi yoʻq. Ular sanoqqa kirsa
   jurnal bahosining maxraji ortib ketardi: 10 savol + 2 soʻrovnoma
   boʻlgan testda hammasini toʻgʻri topgan bola 10/12 = 83% olardi.
   Slaydlarning elementi umuman yoʻq — ular bu yerga yetib kelmaydi.
   ════════════════════════════════════════════════════════════════════ */

const graded = ne(activities.grading, "none");

export async function countGradedItems(activityIds: string[]): Promise<number> {
  if (activityIds.length === 0) return 0;
  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(activityItems)
    .innerJoin(activities, eq(activities.id, activityItems.activityId))
    .where(and(inArray(activityItems.activityId, activityIds), graded));
  return row?.count ?? 0;
}

export async function gradedItemRows(
  activityIds: string[],
): Promise<{ id: string; activityId: string; ordinal: number }[]> {
  if (activityIds.length === 0) return [];
  return db
    .select({ id: activityItems.id, activityId: activityItems.activityId, ordinal: activityItems.ordinal })
    .from(activityItems)
    .innerJoin(activities, eq(activities.id, activityItems.activityId))
    .where(and(inArray(activityItems.activityId, activityIds), graded));
}

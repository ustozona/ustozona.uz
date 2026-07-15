import "server-only";
import { and, asc, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/server/db/client";
import { notifications } from "@/server/db/schema";
import { requireTeacher } from "@/server/session";
import type { NotificationItem } from "@/store/useNotificationsStore";
import type { NotificationsBatch } from "@/lib/sync/notifications-batch";

/* ════════════════════════════════════════════════════════════════════
   NOTIFICATIONS DAL — useNotificationsStore'ning server tomoni.
   Yassi ustunlar (JSONB'siz); yozish lessons DAL qoidalari
   (idempotent upsert + setWhere teacherId; tranzaksiyasiz).
   ════════════════════════════════════════════════════════════════════ */

const CHUNK = 400;

function chunks<T>(rows: T[]): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < rows.length; i += CHUNK) out.push(rows.slice(i, i + CHUNK));
  return out;
}

export type NotificationsPayload = { items: NotificationItem[] };

export async function getNotificationsPayload(): Promise<NotificationsPayload> {
  const teacher = await requireTeacher();
  const rows = await db
    .select()
    .from(notifications)
    .where(eq(notifications.teacherId, teacher.id))
    .orderBy(asc(notifications.sortOrder));
  return {
    items: rows.map((r) => ({
      id: r.id,
      kind: r.kind as NotificationItem["kind"],
      title: r.title,
      body: r.body ?? undefined,
      href: r.href ?? undefined,
      badgeLabel: r.badgeLabel ?? undefined,
      badgeClassName: r.badgeClassName ?? undefined,
      read: r.read,
      createdAt: r.createdAt,
    })),
  };
}

export async function applyNotificationsBatch(batch: NotificationsBatch): Promise<void> {
  const teacher = await requireTeacher();
  const tid = teacher.id;
  const now = new Date();

  for (const part of chunks(batch.itemsUpsert)) {
    await db
      .insert(notifications)
      .values(
        part.map((n) => ({
          id: n.id,
          teacherId: tid,
          kind: n.kind,
          title: n.title,
          body: n.body,
          href: n.href,
          badgeLabel: n.badgeLabel,
          badgeClassName: n.badgeClassName,
          read: n.read,
          createdAt: n.createdAt,
          sortOrder: n.sortOrder,
        }))
      )
      .onConflictDoUpdate({
        target: notifications.id,
        set: {
          kind: sql`excluded.kind`,
          title: sql`excluded.title`,
          body: sql`excluded.body`,
          href: sql`excluded.href`,
          badgeLabel: sql`excluded.badge_label`,
          badgeClassName: sql`excluded.badge_class_name`,
          read: sql`excluded.read`,
          createdAt: sql`excluded.created_at`,
          sortOrder: sql`excluded.sort_order`,
          updatedAt: now,
        },
        setWhere: eq(notifications.teacherId, tid),
      });
  }

  for (const part of chunks(batch.itemsDelete)) {
    await db
      .delete(notifications)
      .where(and(eq(notifications.teacherId, tid), inArray(notifications.id, part)));
  }
}

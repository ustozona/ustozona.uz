import { z } from "zod";

/* ════════════════════════════════════════════════════════════════════
   NOTIFICATIONS SYNC BATCH — client diff ↔ server action shartnomasi.
   Yassi yozuvlar — JSONB'siz, hamma maydon qattiq ustunlarga boradi.
   ════════════════════════════════════════════════════════════════════ */

const id = z.string().min(1).max(200);

export const notificationUpsertSchema = z.object({
  id,
  kind: z.enum(["reply", "feedback", "status", "system"]),
  title: z.string().min(1).max(300),
  body: z.string().max(2000).nullable(),
  href: z.string().max(500).nullable(),
  badgeLabel: z.string().max(60).nullable(),
  badgeClassName: z.string().max(200).nullable(),
  read: z.boolean(),
  createdAt: z.string().min(1).max(40),
  sortOrder: z.number().int().min(0),
});

export const notificationsBatchSchema = z.object({
  itemsUpsert: z.array(notificationUpsertSchema).max(2000),
  itemsDelete: z.array(id).max(2000),
});

export type NotificationUpsert = z.infer<typeof notificationUpsertSchema>;
export type NotificationsBatch = z.infer<typeof notificationsBatchSchema>;

export function emptyNotificationsBatch(): NotificationsBatch {
  return { itemsUpsert: [], itemsDelete: [] };
}

export function isEmptyNotificationsBatch(b: NotificationsBatch): boolean {
  return b.itemsUpsert.length === 0 && b.itemsDelete.length === 0;
}

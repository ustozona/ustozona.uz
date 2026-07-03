import type { NotificationItem } from "@/store/useNotificationsStore";
import {
  emptyNotificationsBatch,
  isEmptyNotificationsBatch,
  type NotificationsBatch,
  type NotificationUpsert,
} from "./notifications-batch";

/* ════════════════════════════════════════════════════════════════════
   NOTIFICATIONS DIFF — {items} (prev, next) → batch | null.
   tasks-sync bilan bir xil: id boʻyicha, reference yoki pozitsiya
   oʻzgargan element upsert; yoʻqolgan id delete.
   ════════════════════════════════════════════════════════════════════ */

export type NotificationsSnapshot = { items: NotificationItem[] };

function toUpsert(n: NotificationItem, sortOrder: number): NotificationUpsert {
  return {
    id: n.id,
    kind: n.kind,
    title: n.title,
    body: n.body ?? null,
    href: n.href ?? null,
    read: n.read,
    createdAt: n.createdAt,
    sortOrder,
  };
}

export function diffNotifications(
  prev: NotificationsSnapshot,
  next: NotificationsSnapshot
): NotificationsBatch | null {
  if (prev.items === next.items) return null;
  const batch = emptyNotificationsBatch();

  const prevById = new Map<string, { item: NotificationItem; index: number }>();
  prev.items.forEach((item, index) => prevById.set(item.id, { item, index }));

  next.items.forEach((item, index) => {
    const p = prevById.get(item.id);
    if (!p || p.item !== item || p.index !== index) {
      batch.itemsUpsert.push(toUpsert(item, index));
    }
  });

  const nextIds = new Set(next.items.map((n) => n.id));
  for (const n of prev.items) if (!nextIds.has(n.id)) batch.itemsDelete.push(n.id);

  return isEmptyNotificationsBatch(batch) ? null : batch;
}

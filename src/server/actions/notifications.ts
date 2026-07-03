"use server";

import {
  getNotificationsPayload,
  applyNotificationsBatch,
  type NotificationsPayload,
} from "@/server/dal/notifications";
import {
  notificationsBatchSchema,
  type NotificationsBatch,
} from "@/lib/sync/notifications-batch";

/* Notifications server actions — yupqa qatlam: zod-parse → DAL. */

export async function fetchNotificationsAction(): Promise<NotificationsPayload> {
  return getNotificationsPayload();
}

export async function syncNotificationsAction(
  batch: NotificationsBatch
): Promise<{ ok: true }> {
  await applyNotificationsBatch(notificationsBatchSchema.parse(batch));
  return { ok: true };
}

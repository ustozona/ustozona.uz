"use client";

import * as React from "react";
import { useNotificationsStore } from "@/store/useNotificationsStore";
import { useHydrateStore } from "@/hooks/useHydrateStore";
import { createServerSync } from "@/lib/sync/create-server-sync";
import { bootstrapSlice } from "@/lib/sync/bootstrap-client";
import {
  diffNotifications,
  type NotificationsSnapshot,
} from "@/lib/sync/notifications-sync";
import { syncNotificationsAction } from "@/server/actions/notifications";

/* Notifications store ↔ server koʻprigi (renderi yoʻq). */

type NotificationsState = ReturnType<typeof useNotificationsStore.getState>;

function selectSnapshot(s: NotificationsState): NotificationsSnapshot {
  return { items: s.items };
}

/** Mount hydration umumiy bootstrap javobidan oʻqiladi (bitta soʻrov). */
const fetchSlice = bootstrapSlice("notifications");

export default function NotificationsServerSync() {
  const hydrated = useHydrateStore(useNotificationsStore, fetchSlice);

  React.useEffect(() => {
    if (!hydrated) return;
    const sync = createServerSync({
      store: useNotificationsStore,
      select: selectSnapshot,
      diff: diffNotifications,
      push: syncNotificationsAction,
      errorMessage: "Bildirishnomalar serverga saqlanmadi",
    });
    return sync.stop;
  }, [hydrated]);

  return null;
}

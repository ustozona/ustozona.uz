"use client";

import * as React from "react";
import { useCalendarStore } from "@/store/useCalendarStore";
import { useHydrateStore } from "@/hooks/useHydrateStore";
import { createServerSync } from "@/lib/sync/create-server-sync";
import {
  fetchCalendarAction,
  saveCalendarAction,
} from "@/server/actions/calendar";

/* Calendar store ↔ server koʻprigi (renderi yoʻq).
   Bitta hujjat — diff'siz snapshot rejimi (default shallowEqual):
   `calendar` referensi oʻzgarsa butun kalendar saqlanadi. */

type CalendarState = ReturnType<typeof useCalendarStore.getState>;

function selectSnapshot(s: CalendarState) {
  return { calendar: s.calendar };
}

export default function CalendarServerSync() {
  const hydrated = useHydrateStore(useCalendarStore, fetchCalendarAction);

  React.useEffect(() => {
    if (!hydrated) return;
    const sync = createServerSync({
      store: useCalendarStore,
      select: selectSnapshot,
      push: saveCalendarAction,
      errorMessage: "Oʻquv yili kalendari serverga saqlanmadi",
    });
    return sync.stop;
  }, [hydrated]);

  return null;
}

"use client";

import * as React from "react";
import { useTimetableStore } from "@/store/useTimetableStore";
import { useHydrateStore } from "@/hooks/useHydrateStore";
import { createServerSync } from "@/lib/sync/create-server-sync";
import { diffTimetable, type TimetableSnapshot } from "@/lib/sync/timetable-sync";
import {
  fetchTimetableAction,
  syncTimetableAction,
} from "@/server/actions/timetable";

/* Timetable store ↔ server koʻprigi (renderi yoʻq).

   MUHIM tartib: sync AVVAL yaratiladi, seedIfEmpty KEYIN chaqiriladi —
   shunda yangi oʻqituvchining sintez qilingan 1-versiyasi diff orqali
   serverga yoziladi (aks holda lastSynced ichida qolib ketardi). */

type TimetableState = ReturnType<typeof useTimetableStore.getState>;

function selectSnapshot(s: TimetableState): TimetableSnapshot {
  return { versions: s.versions };
}

export default function TimetableServerSync() {
  const hydrated = useHydrateStore(useTimetableStore, fetchTimetableAction);

  React.useEffect(() => {
    if (!hydrated) return;
    const sync = createServerSync({
      store: useTimetableStore,
      select: selectSnapshot,
      diff: diffTimetable,
      push: syncTimetableAction,
      errorMessage: "Dars jadvali serverga saqlanmadi",
    });
    useTimetableStore.getState().seedIfEmpty();
    return sync.stop;
  }, [hydrated]);

  return null;
}

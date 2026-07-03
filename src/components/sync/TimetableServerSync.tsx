"use client";

import * as React from "react";
import { useTimetableStore } from "@/store/useTimetableStore";
import { useHydrateStore } from "@/hooks/useHydrateStore";
import { createServerSync } from "@/lib/sync/create-server-sync";
import { diffTimetable, type TimetableSnapshot } from "@/lib/sync/timetable-sync";
import { normalizeLegacyVersions, type TimetableVersion } from "@/lib/timetable-versions";
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

/** Fetch + eski raqamli classId'larni jonli id'ga oʻgirish (bir marta, hydration'da). */
async function fetchNormalized() {
  const payload = await fetchTimetableAction();
  if (payload && Array.isArray((payload as { versions?: TimetableVersion[] }).versions)) {
    return {
      ...payload,
      versions: normalizeLegacyVersions((payload as { versions: TimetableVersion[] }).versions),
    };
  }
  return payload;
}

export default function TimetableServerSync() {
  const hydrated = useHydrateStore(useTimetableStore, fetchNormalized);

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

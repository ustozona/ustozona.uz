"use client";

import * as React from "react";
import { useClassStore } from "@/store/useClassStore";
import { useHydrateStore } from "@/hooks/useHydrateStore";
import { createServerSync } from "@/lib/sync/create-server-sync";
import { bootstrapSlice } from "@/lib/sync/bootstrap-client";
import { saveClassPrefsAction } from "@/server/actions/class-prefs";

/* Class prefs (selectedClassId + journalScale) ↔ server koʻprigi.
   teachers.prefs.classPrefs hujjati — diff'siz snapshot rejimi.
   Yangi oʻqituvchida server null qaytaradi → store defaultda qoladi. */

type ClassState = ReturnType<typeof useClassStore.getState>;

function selectSnapshot(s: ClassState) {
  return {
    selectedClassId: s.selectedClassId,
    journalScale: s.journalScale,
  };
}

/** Mount hydration umumiy bootstrap javobidan oʻqiladi (bitta soʻrov). */
const fetchSlice = bootstrapSlice("classPrefs");

export default function ClassPrefsServerSync() {
  const hydrated = useHydrateStore(useClassStore, fetchSlice);

  React.useEffect(() => {
    if (!hydrated) return;
    const sync = createServerSync({
      store: useClassStore,
      select: selectSnapshot,
      push: saveClassPrefsAction,
      errorMessage: "Sinf sozlamalari serverga saqlanmadi",
    });
    return sync.stop;
  }, [hydrated]);

  return null;
}

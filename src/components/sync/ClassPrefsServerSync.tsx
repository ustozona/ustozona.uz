"use client";

import * as React from "react";
import { useClassStore } from "@/store/useClassStore";
import { useHydrateStore } from "@/hooks/useHydrateStore";
import { createServerSync } from "@/lib/sync/create-server-sync";
import {
  fetchClassPrefsAction,
  saveClassPrefsAction,
} from "@/server/actions/class-prefs";

/* Class prefs (selectedClassId + journalScale) ↔ server koʻprigi.
   teachers.prefs.classPrefs hujjati — diff'siz snapshot rejimi.
   Yangi oʻqituvchida server null qaytaradi → store defaultda qoladi. */

type ClassState = ReturnType<typeof useClassStore.getState>;

function selectSnapshot(s: ClassState) {
  return {
    selectedClassId: s.selectedClassId,
    journalScale: s.journalScale,
    journalScaleByClass: s.journalScaleByClass,
  };
}

export default function ClassPrefsServerSync() {
  const hydrated = useHydrateStore(useClassStore, fetchClassPrefsAction);

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

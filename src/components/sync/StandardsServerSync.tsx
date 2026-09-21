"use client";

import * as React from "react";
import { useStandardsStore } from "@/store/useStandardsStore";
import { useHydrateStore } from "@/hooks/useHydrateStore";
import { createServerSync } from "@/lib/sync/create-server-sync";
import { bootstrapSlice } from "@/lib/sync/bootstrap-client";
import { diffStandards, type StandardsSnapshot } from "@/lib/sync/standards-sync";
import { syncStandardsAction } from "@/server/actions/standards";

/* Standards store ↔ server koʻprigi (renderi yoʻq). */

type StandardsState = ReturnType<typeof useStandardsStore.getState>;

function selectSnapshot(s: StandardsState): StandardsSnapshot {
  return { sets: s.sets, customSets: s.customSets };
}

/** Mount hydration umumiy bootstrap javobidan oʻqiladi (bitta soʻrov). */
const fetchSlice = bootstrapSlice("standards");

export default function StandardsServerSync() {
  const hydrated = useHydrateStore(useStandardsStore, fetchSlice);

  React.useEffect(() => {
    if (!hydrated) return;
    const sync = createServerSync({
      store: useStandardsStore,
      select: selectSnapshot,
      diff: diffStandards,
      push: syncStandardsAction,
      errorMessage: "Standartlar serverga saqlanmadi",
    });
    return sync.stop;
  }, [hydrated]);

  return null;
}

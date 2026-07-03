"use client";

import * as React from "react";
import { useStandardsStore } from "@/store/useStandardsStore";
import { useHydrateStore } from "@/hooks/useHydrateStore";
import { createServerSync } from "@/lib/sync/create-server-sync";
import { diffStandards, type StandardsSnapshot } from "@/lib/sync/standards-sync";
import { fetchStandardsAction, syncStandardsAction } from "@/server/actions/standards";

/* Standards store ↔ server koʻprigi (renderi yoʻq). */

type StandardsState = ReturnType<typeof useStandardsStore.getState>;

function selectSnapshot(s: StandardsState): StandardsSnapshot {
  return { sets: s.sets, customSets: s.customSets };
}

export default function StandardsServerSync() {
  const hydrated = useHydrateStore(useStandardsStore, fetchStandardsAction);

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

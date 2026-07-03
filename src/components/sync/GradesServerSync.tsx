"use client";

import * as React from "react";
import { useGradesStore } from "@/store/useGradesStore";
import { useHydrateStore } from "@/hooks/useHydrateStore";
import { createServerSync } from "@/lib/sync/create-server-sync";
import { diffGradesMap } from "@/lib/sync/grades-sync";
import { fetchGradesAction, syncGradesAction } from "@/server/actions/grades";

/* Grades store ↔ server koʻprigi (renderi yoʻq).
   Dashboard layoutda turadi: mount → hydration → sync.
   Murakkab store — granular diff (grades-sync.ts) bilan. */

export default function GradesServerSync() {
  const hydrated = useHydrateStore(useGradesStore, fetchGradesAction);

  React.useEffect(() => {
    if (!hydrated) return;
    const sync = createServerSync({
      store: useGradesStore,
      select: (s) => s.classDataMap,
      diff: diffGradesMap,
      push: syncGradesAction,
      errorMessage: "Baholar serverga saqlanmadi",
    });
    return sync.stop;
  }, [hydrated]);

  return null;
}

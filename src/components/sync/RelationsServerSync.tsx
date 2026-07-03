"use client";

import * as React from "react";
import { useRelationsStore } from "@/lib/relations-store";
import { useHydrateStore } from "@/hooks/useHydrateStore";
import { createServerSync } from "@/lib/sync/create-server-sync";
import {
  fetchRelationsAction,
  saveRelationsAction,
} from "@/server/actions/relations";

/* Relations store ↔ server koʻprigi (renderi yoʻq).
   Kichik juftlar roʻyxati — diff'siz snapshot rejimi. */

type RelationsState = ReturnType<typeof useRelationsStore.getState>;

function selectSnapshot(s: RelationsState) {
  return { links: s.links };
}

export default function RelationsServerSync() {
  const hydrated = useHydrateStore(useRelationsStore, fetchRelationsAction);

  React.useEffect(() => {
    if (!hydrated) return;
    const sync = createServerSync({
      store: useRelationsStore,
      select: selectSnapshot,
      push: saveRelationsAction,
      errorMessage: "Qarindoshlik bogʻlari serverga saqlanmadi",
    });
    return sync.stop;
  }, [hydrated]);

  return null;
}

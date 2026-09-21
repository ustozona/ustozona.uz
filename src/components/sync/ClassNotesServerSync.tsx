"use client";

import * as React from "react";
import { useClassNotesStore } from "@/store/useClassNotesStore";
import { useHydrateStore } from "@/hooks/useHydrateStore";
import { createServerSync } from "@/lib/sync/create-server-sync";
import { bootstrapSlice } from "@/lib/sync/bootstrap-client";
import { saveClassNotesAction } from "@/server/actions/class-notes";

/* Class notes store ↔ server koʻprigi (renderi yoʻq).
   Kichik Record — diff'siz snapshot rejimi (default shallowEqual). */

type ClassNotesState = ReturnType<typeof useClassNotesStore.getState>;

function selectSnapshot(s: ClassNotesState) {
  return { notes: s.notes };
}

/** Mount hydration umumiy bootstrap javobidan oʻqiladi (bitta soʻrov). */
const fetchSlice = bootstrapSlice("classNotes");

export default function ClassNotesServerSync() {
  const hydrated = useHydrateStore(useClassNotesStore, fetchSlice);

  React.useEffect(() => {
    if (!hydrated) return;
    const sync = createServerSync({
      store: useClassNotesStore,
      select: selectSnapshot,
      push: saveClassNotesAction,
      errorMessage: "Sinf eslatmalari serverga saqlanmadi",
    });
    return sync.stop;
  }, [hydrated]);

  return null;
}

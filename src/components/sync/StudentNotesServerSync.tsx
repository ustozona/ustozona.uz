"use client";

import * as React from "react";
import { useStudentNotesStore } from "@/store/useStudentNotesStore";
import { useHydrateStore } from "@/hooks/useHydrateStore";
import { createServerSync } from "@/lib/sync/create-server-sync";
import { diffStudentNotes, type StudentNotesSnapshot } from "@/lib/sync/student-notes-sync";
import { fetchStudentNotesAction, syncStudentNotesAction } from "@/server/actions/student-notes";

/* Student notes store ↔ server koʻprigi (renderi yoʻq). */

type StudentNotesState = ReturnType<typeof useStudentNotesStore.getState>;

function selectSnapshot(s: StudentNotesState): StudentNotesSnapshot {
  return { items: s.items };
}

export default function StudentNotesServerSync() {
  const hydrated = useHydrateStore(useStudentNotesStore, fetchStudentNotesAction);

  React.useEffect(() => {
    if (!hydrated) return;
    const sync = createServerSync({
      store: useStudentNotesStore,
      select: selectSnapshot,
      diff: diffStudentNotes,
      push: syncStudentNotesAction,
      errorMessage: "Oʻquvchi qaydi serverga saqlanmadi",
    });
    return sync.stop;
  }, [hydrated]);

  return null;
}

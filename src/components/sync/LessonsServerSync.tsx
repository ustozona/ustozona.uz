"use client";

import * as React from "react";
import { useLessonStore } from "@/store/useLessonStore";
import { useHydrateStore } from "@/hooks/useHydrateStore";
import { createServerSync } from "@/lib/sync/create-server-sync";
import { diffLessons, type LessonsSnapshot } from "@/lib/sync/lessons-sync";
import { fetchLessonsAction, syncLessonsAction } from "@/server/actions/lessons";

/* Lessons store ↔ server koʻprigi (renderi yoʻq). */

type LessonState = ReturnType<typeof useLessonStore.getState>;

function selectSnapshot(s: LessonState): LessonsSnapshot {
  return { units: s.units, lessons: s.lessons };
}

export default function LessonsServerSync() {
  const hydrated = useHydrateStore(useLessonStore, fetchLessonsAction);

  React.useEffect(() => {
    if (!hydrated) return;
    const sync = createServerSync({
      store: useLessonStore,
      select: selectSnapshot,
      diff: diffLessons,
      push: syncLessonsAction,
      errorMessage: "Darslar serverga saqlanmadi",
    });
    return sync.stop;
  }, [hydrated]);

  return null;
}

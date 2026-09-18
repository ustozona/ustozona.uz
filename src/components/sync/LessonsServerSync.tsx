"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { useLessonStore } from "@/store/useLessonStore";
import { useHydrateStore } from "@/hooks/useHydrateStore";
import { createServerSync } from "@/lib/sync/create-server-sync";
import { diffLessons, type LessonsSnapshot } from "@/lib/sync/lessons-sync";
import { fetchLessonsAction, syncLessonsAction } from "@/server/actions/lessons";

/* Lessons store ↔ server koʻprigi (renderi yoʻq). */

// Joriy sync instansining flush'i — "Saqlash" tugmasi darhol push qilishi uchun.
let flushRef: (() => Promise<void>) | null = null;
export function flushLessonsNow(): Promise<void> {
  return flushRef?.() ?? Promise.resolve();
}

type LessonState = ReturnType<typeof useLessonStore.getState>;

function selectSnapshot(s: LessonState): LessonsSnapshot {
  return { units: s.units, lessons: s.lessons };
}

export default function LessonsServerSync() {
  const t = useTranslations("LessonsServerSync");
  const hydrated = useHydrateStore(useLessonStore, fetchLessonsAction);

  React.useEffect(() => {
    if (!hydrated) return;
    // Hydration'dan keyin bir marta: aʼzo boʻlmagan sinfga osilib qolgan
    // jadval yozuvlari tozalanadi (plannerda koʻrinib, hech qaysi dars
    // roʻyxatida boʻlmagan «yetim» sessiyalar). Tozalash store'ni
    // oʻzgartiradi, sync esa uni oddiy tahrir sifatida serverga yozadi.
    const pruned = useLessonStore.getState().pruneOrphanSessions();
    if (pruned) console.info(`[lessons] ${pruned} ta yetim jadval yozuvi tozalandi`);
    const sync = createServerSync({
      store: useLessonStore,
      select: selectSnapshot,
      diff: diffLessons,
      push: syncLessonsAction,
      errorMessage: t("saveError"),
    });
    flushRef = sync.flush;
    return () => {
      flushRef = null;
      sync.stop();
    };
  }, [hydrated, t]);

  return null;
}

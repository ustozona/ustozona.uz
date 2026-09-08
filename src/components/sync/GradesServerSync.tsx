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

/** Faol sync nusxasi — `reloadGradesFromServer` uchun. Layoutda bitta
    `GradesServerSync` turadi, shuning uchun modul darajasidagi yagona
    havola yetarli. */
let active: ReturnType<typeof createServerSync> | null = null;

/**
 * Store'ni serverdan QAYTA yuklaydi va sync bazasini yangilaydi.
 *
 * ⚠️ Store'ni tashqaridan (oʻz server action'i bilan) oʻzgartirgan har
 * qanday amal shu funksiyani chaqirishi SHART, `setClassDataMap` ni
 * oʻzi emas. Sabab `rebase()` izohida: aks holda sync yangi serverdan
 * kelgan holatni foydalanuvchi tahriri deb oʻylab, amalni teskariga
 * qaytaruvchi batch yuboradi.
 */
export async function reloadGradesFromServer(): Promise<void> {
  const { classDataMap } = await fetchGradesAction();
  useGradesStore.getState().setClassDataMap(classDataMap);
  active?.rebase();
}

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
      // Topshiriq muharriridagi "Saqlanmadi" belgisi aynan shu boʻlakka
      // qaraydi (`useSyncFailing("grades")`).
      scope: "grades",
    });
    active = sync;
    return () => {
      active = null;
      sync.stop();
    };
  }, [hydrated]);

  return null;
}

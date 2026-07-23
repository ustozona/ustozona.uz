"use client";

import * as React from "react";
import { useLessonStore } from "@/store/useLessonStore";
import { useGradesStore } from "@/store/useGradesStore";
import { useTasksStore } from "@/store/useTasksStore";
import { todayKey } from "@/lib/date-keys";
import { reconcileLessonAndGradingTasks } from "@/lib/tasks-reconcile";

/* ════════════════════════════════════════════════════════════════════
   VAZIFALAR AVTO-RECONCILER (renderi yoʻq, dashboard layoutda) — B3.

   BehaviorAutoReconciler patterni: darslar/baholash oʻzgarishini kuzatib,
   "boʻlishi kerak boʻlgan" avto-vazifalarni hisoblaydi, faqat FARQNI
   tasks store'ga yozadi. Shu pastdagi effekt darsni ham "Completed"
   qiladi (barcha oynadagi sessiya-vazifalari done boʻlsa) — ikki
   tomonlama sinxron shu YAGONA joyda.

   Xavfsizlik: `useTasksStore.items` effekt dependency EMAS — oʻz
   yozuvimiz qayta tsikl qoʻzgʻatmasin deb `getState()`dan oʻqiladi
   (behavior reconciler bilan bir xil loop-qoʻriqchisi). `lessons` esa
   ham manba, ham yozuv nishoni — setStatus chaqiruvi bir marta qoʻshimcha
   tsikl qoʻzgʻatadi, lekin ikkinchi pass no-op (status allaqachon mos).
   ════════════════════════════════════════════════════════════════════ */

const DEBOUNCE_MS = 800;

export default function TasksAutoReconciler() {
  const lessonsHydrated = useLessonStore((s) => s._hasHydrated);
  const gradesHydrated = useGradesStore((s) => s._hasHydrated);
  const tasksHydrated = useTasksStore((s) => s._hasHydrated);
  const allHydrated = lessonsHydrated && gradesHydrated && tasksHydrated;

  const lessons = useLessonStore((s) => s.lessons);
  const classDataMap = useGradesStore((s) => s.classDataMap);

  React.useEffect(() => {
    if (!allHydrated) return;
    const timer = setTimeout(() => {
      const items = useTasksStore.getState().items;
      const { upserts, deleteIds, lessonsToComplete } = reconcileLessonAndGradingTasks(
        items,
        lessons,
        classDataMap,
        todayKey()
      );
      if (upserts.length > 0 || deleteIds.length > 0) {
        useTasksStore.getState().applyAutoReconcile(upserts, deleteIds);
      }
      if (lessonsToComplete.length > 0) {
        const setStatus = useLessonStore.getState().setStatus;
        for (const id of lessonsToComplete) setStatus(id, "Completed");
      }
    }, DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [allHydrated, lessons, classDataMap]);

  return null;
}

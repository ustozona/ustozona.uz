"use client";

import * as React from "react";
import { useLessonStore } from "@/store/useLessonStore";
import { useGradesStore } from "@/store/useGradesStore";
import { useTasksStore } from "@/store/useTasksStore";
import { useSettingsStore } from "@/store/useSettingsStore";
import { useNotificationsStore } from "@/store/useNotificationsStore";
import { todayKey } from "@/lib/date-keys";
import { reconcileLessonAndGradingTasks, reconcileBirthdayTasks } from "@/lib/tasks-reconcile";

/* ════════════════════════════════════════════════════════════════════
   VAZIFALAR AVTO-RECONCILER (renderi yoʻq, dashboard layoutda) — B3+B4.

   BehaviorAutoReconciler patterni: darslar/baholash oʻzgarishini kuzatib,
   "boʻlishi kerak boʻlgan" avto-vazifalarni hisoblaydi, faqat FARQNI
   tasks store'ga yozadi. Shu pastdagi effekt darsni ham «Oʻtildi»
   qiladi (barcha oynadagi sessiya-vazifalari done boʻlsa) yoki undan
   «Oʻtildi»ni oladi (vazifa qoʻlda qayta ochilsa) — ikki tomonlama
   sinxron shu YAGONA joyda.

   Xavfsizlik: `useTasksStore.items` effekt dependency EMAS — oʻz
   yozuvimiz qayta tsikl qoʻzgʻatmasin deb `getState()`dan oʻqiladi
   (behavior reconciler bilan bir xil loop-qoʻriqchisi). Faqat
   `lessonTaskEdits` hisoblagichi kuzatiladi — u dars vazifasi QOʻLDA
   belgilanganda oshadi, reconciler yozuvlari (`applyAutoReconcile`)
   uni oshirmaydi. `lessons` esa ham manba, ham yozuv nishoni —
   yozuvimiz bir marta qoʻshimcha pass qoʻzgʻatadi, lekin u no-op
   (holat allaqachon mos).
   ════════════════════════════════════════════════════════════════════ */

const DEBOUNCE_MS = 800;

export default function TasksAutoReconciler() {
  const lessonsHydrated = useLessonStore((s) => s._hasHydrated);
  const gradesHydrated = useGradesStore((s) => s._hasHydrated);
  const tasksHydrated = useTasksStore((s) => s._hasHydrated);
  const settingsHydrated = useSettingsStore((s) => s._hasHydrated);
  const allHydrated = lessonsHydrated && gradesHydrated && tasksHydrated && settingsHydrated;

  const lessons = useLessonStore((s) => s.lessons);
  // Dars vazifasini qoʻlda belgilash/qayta ochish darsga darhol yetsin.
  const lessonTaskEdits = useTasksStore((s) => s.lessonTaskEdits);
  const classDataMap = useGradesStore((s) => s.classDataMap);
  const tasksSettings = useSettingsStore((s) => s.tasksSettings);

  React.useEffect(() => {
    if (!allHydrated) return;
    const timer = setTimeout(() => {
      const items = useTasksStore.getState().items;
      const today = todayKey();
      const { upserts, deleteIds, lessonsToComplete, lessonsToUncomplete } = reconcileLessonAndGradingTasks(
        items,
        lessons,
        classDataMap,
        today
      );
      if (upserts.length > 0 || deleteIds.length > 0) {
        useTasksStore.getState().applyAutoReconcile(upserts, deleteIds);
      }
      const setTaught = useLessonStore.getState().setTaught;
      // Sinfdagi dars vazifalari hammasi bajarildi → mavzu shu sinfda «Oʻtildi».
      for (const { lessonId, classId } of lessonsToComplete) setTaught(lessonId, today, classId);
      // Oʻtilgan darsning vazifasi qoʻlda qayta ochildi → shu sinfda «Oʻtildi» olinadi.
      for (const { lessonId, classId } of lessonsToUncomplete) setTaught(lessonId, null, classId);

      // Bugungi holatga tayanadi — yuqoridagi upsert/delete'dan KEYINGI itemsni oling.
      const itemsAfter = useTasksStore.getState().items;
      const birthday = reconcileBirthdayTasks(itemsAfter, classDataMap, tasksSettings, today);
      if (birthday.upserts.length > 0 || birthday.deleteIds.length > 0) {
        useTasksStore.getState().applyAutoReconcile(birthday.upserts, birthday.deleteIds);
      }
      if (birthday.notify.length > 0) {
        const notify = useNotificationsStore.getState().notify;
        for (const n of birthday.notify) {
          notify({
            // Barqaror id — vazifa oʻchib qayta tugʻilsa ham xabar takrorlanmaydi.
            id: `ntf-${n.taskId}`,
            kind: "birthday",
            title: `${n.studentName}ning (${n.className}) tugʻilgan kuni`,
            body: "Vazifalar sahifasida tabriklangan deb belgilab qoʻying.",
            href: `/dashboard/students/${encodeURIComponent(n.studentId)}`,
          });
        }
      }
    }, DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [allHydrated, lessons, lessonTaskEdits, classDataMap, tasksSettings]);

  return null;
}

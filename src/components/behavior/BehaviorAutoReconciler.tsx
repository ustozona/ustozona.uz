"use client";

import * as React from "react";
import { deriveLessonDays } from "@/lib/attendance-data";
import { todayDateKey } from "@/lib/behavior-data";
import { inRange } from "@/lib/academic-calendar";
import { computeDesiredAutoEvents, reconcileAutoEvents } from "@/lib/behavior-auto";
import { useAttendanceStore } from "@/store/useAttendanceStore";
import { useBehaviorStore } from "@/store/useBehaviorStore";
import { useCalendarStore } from "@/store/useCalendarStore";
import { useGradesStore } from "@/store/useGradesStore";
import { useTimetableStore } from "@/store/useTimetableStore";

/* ════════════════════════════════════════════════════════════════════
   XULQ AVTO-BALL RECONCILER (renderi yoʻq, dashboard layoutda).

   Davomat/jurnal/sozlama oʻzgarishlarini kuzatib, har sinf uchun
   "boʻlishi kerak boʻlgan" avto-eventlarni hisoblaydi va faqat FARQNI
   behavior store'ga yozadi (u yerdan BehaviorServerSync serverga olib
   boradi). Mount'dagi birinchi tsikl offline oʻtgan muddatlarni ham
   qamraydi (ilova yopiqligida deadline oʻtgan boʻlsa).

   Xavfsizlik:
   - 5 store ham hydrate boʻlmaguncha ishlamaydi (aks holda boʻsh/default
     holat server maʼlumotidagi avto-eventlarni oʻchirib yuborar edi).
   - eventsByClass effekt dependency EMAS — oʻz yozuvimiz qayta tsikl
     qoʻzgʻatmaydi (loop qoʻriqchisi); joriy qiymat getState'dan olinadi.
   - Debounce ~800 ms — davomatni ketma-ket belgilashda bitta hisob.
   ════════════════════════════════════════════════════════════════════ */

const DEBOUNCE_MS = 800;

export default function BehaviorAutoReconciler() {
  const attHydrated = useAttendanceStore((s) => s._hasHydrated);
  const gradesHydrated = useGradesStore((s) => s._hasHydrated);
  const calHydrated = useCalendarStore((s) => s._hasHydrated);
  const ttHydrated = useTimetableStore((s) => s._hasHydrated);
  const behHydrated = useBehaviorStore((s) => s._hasHydrated);
  const allHydrated = attHydrated && gradesHydrated && calHydrated && ttHydrated && behHydrated;

  const recordsByClass = useAttendanceStore((s) => s.recordsByClass);
  const classDataMap = useGradesStore((s) => s.classDataMap);
  const years = useCalendarStore((s) => s.years);
  const versions = useTimetableStore((s) => s.versions);
  const autoSettings = useBehaviorStore((s) => s.autoSettings);
  const deletions = useBehaviorStore((s) => s.deletions);

  React.useEffect(() => {
    if (!allHydrated) return;
    const t = setTimeout(() => {
      const behavior = useBehaviorStore.getState();
      const todayKey = todayDateKey();
      // Dvigatel BUGUN tegishli boʻlgan yil kalendari bilan ishlaydi — koʻrilayotgan
      // (faol) yil bilan emas. Aks holda eski yilni koʻrish joriy seriya eventlarini
      // oʻchirib-qayta yaratardi (churn). Bugun hech bir yilga tushmasa — skip.
      const todayYear = years.find((y) => inRange(todayKey, y.calendar.range));
      if (!todayYear) return;
      const calendar = todayYear.calendar;
      const tombstones = new Set(behavior.deletions.map((d) => d.eventId));
      const end = todayKey < calendar.range.end ? todayKey : calendar.range.end;
      const needStreak = autoSettings.attendanceEnabled && autoSettings.streakEnabled;

      for (const [classId, cd] of Object.entries(classDataMap)) {
        const lessonDays =
          needStreak && versions.length > 0 && autoSettings.attendanceSince <= end
            ? deriveLessonDays(
                classId,
                { start: autoSettings.attendanceSince, end },
                calendar,
                versions
              )
            : [];
        const desired = computeDesiredAutoEvents(
          {
            classId,
            records: recordsByClass[classId] ?? [],
            lessonDays,
            students: cd.students,
            assignments: cd.assignments,
            grades: cd.grades,
          },
          autoSettings,
          todayKey
        );
        const changes = reconcileAutoEvents(
          behavior.eventsByClass[classId] ?? [],
          desired,
          autoSettings,
          tombstones
        );
        if (changes.toAdd.length > 0 || changes.toUpdate.length > 0 || changes.toRemoveIds.length > 0) {
          behavior.applyAutoReconcile(classId, changes);
        }
      }
    }, DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [allHydrated, recordsByClass, classDataMap, years, versions, autoSettings, deletions]);

  return null;
}

"use client";

import { useGradesStore } from "@/store/useGradesStore";
import { useLessonStore } from "@/store/useLessonStore";
import { useAttendanceStore } from "@/store/useAttendanceStore";
import { useSettingsStore } from "@/store/useSettingsStore";

/* ════════════════════════════════════════════════════════════════════
   BOSHLASH QADAMLARI — yagona hisoblash manbai.

   Suzuvchi karta (GettingStartedChecklist) ham, headerdagi Yoʻl-yoʻriq
   markazi (GuideHub) ham shu hookdan oʻqiydi. Bajarilganlik MAVJUD
   store'lardan hisoblanadi — alohida persisted holat yoʻq.
   ════════════════════════════════════════════════════════════════════ */

export type GettingStartedStep = {
  id: string;
  label: string;
  href: string;
  done: boolean;
};

export function useGettingStartedSteps() {
  const settingsHydrated = useSettingsStore((s) => s._hasHydrated);
  const onboarded = useSettingsStore((s) => s.onboardingCompleted);
  const classDataMap = useGradesStore((s) => s.classDataMap);
  const gradesHydrated = useGradesStore((s) => s._hasHydrated);
  const lessons = useLessonStore((s) => s.lessons);
  const recordsByClass = useAttendanceStore((s) => s.recordsByClass);
  const attendanceHydrated = useAttendanceStore((s) => s._hasHydrated);

  const classes = Object.values(classDataMap);
  const steps: GettingStartedStep[] = [
    {
      id: "class",
      label: "Birinchi sinfni yaratish",
      href: "/dashboard/classes?new=1",
      done: classes.length > 0,
    },
    {
      id: "students",
      label: "Oʻquvchilarni qoʻshish",
      href: "/dashboard/students",
      done: classes.some((c) => c.students.length > 0),
    },
    {
      id: "lessons",
      label: "Dars rejalashtirish",
      href: "/dashboard/lessons",
      done: lessons.length > 0,
    },
    {
      id: "attendance",
      label: "Birinchi davomatni belgilash",
      href: "/dashboard/attendance",
      done: Object.values(recordsByClass).some((r) => r.length > 0),
    },
  ];

  const doneCount = steps.filter((s) => s.done).length;
  return {
    steps,
    doneCount,
    allDone: doneCount === steps.length,
    ready: settingsHydrated && gradesHydrated && attendanceHydrated,
    onboarded,
  };
}

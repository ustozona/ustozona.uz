"use client";

import * as React from "react";
import { deriveLessonDays, type AttendanceRecord } from "@/lib/attendance-data";
import { todayDateKey } from "@/lib/behavior-data";
import { computeCurrentStreaks, type StreakState } from "@/lib/behavior-auto";
import { useAttendanceStore } from "@/store/useAttendanceStore";
import { useBehaviorStore } from "@/store/useBehaviorStore";
import { useCalendarStore } from "@/store/useCalendarStore";
import { useTimetableStore } from "@/store/useTimetableStore";

const EMPTY_RECORDS: AttendanceRecord[] = [];

/** Bitta sinf uchun joriy davomat seriyalari (StudentPointCard/StudentDialog
    chipi) — reconciler wiring bilan bir xil selectorlar, faqat event yozmaydi. */
export function useClassStreaks(classId: string): Map<string, StreakState> | null {
  const attHydrated = useAttendanceStore((s) => s._hasHydrated);
  const calHydrated = useCalendarStore((s) => s._hasHydrated);
  const ttHydrated = useTimetableStore((s) => s._hasHydrated);
  const behHydrated = useBehaviorStore((s) => s._hasHydrated);
  const allHydrated = attHydrated && calHydrated && ttHydrated && behHydrated;

  const records = useAttendanceStore((s) => s.recordsByClass[classId] ?? EMPTY_RECORDS);
  const calendar = useCalendarStore((s) => s.calendar);
  const versions = useTimetableStore((s) => s.versions);
  const autoSettings = useBehaviorStore((s) => s.autoSettings);

  return React.useMemo(() => {
    if (!allHydrated) return null;
    if (!autoSettings.attendanceEnabled || !autoSettings.streakEnabled) return null;
    const todayKey = todayDateKey();
    const end = todayKey < calendar.range.end ? todayKey : calendar.range.end;
    if (versions.length === 0 || autoSettings.attendanceSince > end) return null;
    const lessonDays = deriveLessonDays(
      classId,
      { start: autoSettings.attendanceSince, end },
      calendar,
      versions
    );
    return computeCurrentStreaks(records, lessonDays, autoSettings, todayKey);
  }, [allHydrated, records, calendar, versions, autoSettings, classId]);
}

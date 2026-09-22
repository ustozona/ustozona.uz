"use client";

import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { useLessonStore } from "@/store/useLessonStore";
import { useTimetableStore } from "@/store/useTimetableStore";
import { useCalendarStore } from "@/store/useCalendarStore";
import { resolveVersionForDate } from "@/lib/timetable-versions";
import { getHolidayForDate } from "@/lib/academic-calendar";
import { addDaysKey, todayKey } from "@/lib/date-keys";
import { invertMoves, planBump } from "@/lib/lesson-shift";

/** «Keyingi darsga sur» — surish dvigatelini joriy jadval va kalendar bilan
    ishga tushiradi, natijani bitta amalda qoʻllaydi va undo toast koʻrsatadi. */
export function useLessonBump() {
  const t = useTranslations("LessonCycle");
  const versions = useTimetableStore((s) => s.versions);
  const calendar = useCalendarStore((s) => s.calendar);
  const applySessionMoves = useLessonStore((s) => s.applySessionMoves);

  return (lessonId: string, classId: string) => {
    const moves = planBump({
      classId,
      lessons: useLessonStore.getState().lessons,
      fromLessonId: lessonId,
      eventsForDate: (key) => resolveVersionForDate(versions, key)?.events ?? [],
      isHoliday: (key) => !!getHolidayForDate(calendar, key),
      toKey: calendar.range.end || addDaysKey(todayKey(), 366),
    });
    if (moves.length === 0) {
      toast.info(t("bumpNothing"));
      return;
    }
    applySessionMoves(classId, moves);
    const lostTail = moves[moves.length - 1].to === null;
    const lessonsMoved = new Set(moves.map((m) => m.lessonId)).size;
    toast.success(t("bumpedToast", { count: lessonsMoved }), {
      description: lostTail ? t("bumpNoSlot") : undefined,
      action: { label: t("undo"), onClick: () => applySessionMoves(classId, invertMoves(moves)) },
    });
  };
}

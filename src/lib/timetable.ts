export type Shift = 1 | 2;

/**
 * Dars jadvali hodisasi — takrorlanuvchi haftalik shablon.
 * day: 1=Dushanba … 6=Shanba; startMin/endMin: 00:00 dan daqiqalar.
 * Umumiy tip — timetable, planner va PeriodGrid baham koʻradi.
 */
export type TimetableEvent = {
  id: string;
  classId: number;
  day: number;
  startMin: number;
  endMin: number;
};

export type LessonSlot = {
  /** 1..6 within the shift */
  index: number;
  /** Minutes from 00:00 */
  startMin: number;
  /** Minutes from 00:00 */
  endMin: number;
};

export type ShiftConfig = {
  /** Minutes from 00:00 — when first lesson starts */
  startMin: number;
  /** Number of lessons in this shift */
  lessonCount: number;
  /** Lesson length in minutes (default 45) */
  lessonMin: number;
  /** Default break in minutes between lessons (default 5) */
  breakMin: number;
  /** Some schools have a longer break after the 3rd lesson — extra minutes added */
  longBreakAfter: number; // 1-based lesson index after which the long break occurs (3 by default)
  longBreakExtraMin: number; // extra minutes added on top of breakMin (default 5 → total 10)
};

export type TimetableConfig = {
  shift1: ShiftConfig;
  shift2: ShiftConfig;
};

export type SchoolProfile = "single" | "double";

/** Defaults for a single-shift school: 10 min breaks, 15 min long break */
export const SINGLE_SHIFT_DEFAULTS: TimetableConfig = {
  shift1: {
    startMin: 8 * 60,
    lessonCount: 6,
    lessonMin: 45,
    breakMin: 10,
    longBreakAfter: 3,
    longBreakExtraMin: 5,
  },
  shift2: {
    startMin: 13 * 60,
    lessonCount: 6,
    lessonMin: 45,
    breakMin: 10,
    longBreakAfter: 3,
    longBreakExtraMin: 5,
  },
};

/** Defaults for a two-shift school: 5 min breaks, 10 min long break */
export const DOUBLE_SHIFT_DEFAULTS: TimetableConfig = {
  shift1: {
    startMin: 8 * 60,
    lessonCount: 6,
    lessonMin: 45,
    breakMin: 5,
    longBreakAfter: 3,
    longBreakExtraMin: 5,
  },
  shift2: {
    startMin: 13 * 60,
    lessonCount: 6,
    lessonMin: 45,
    breakMin: 5,
    longBreakAfter: 3,
    longBreakExtraMin: 5,
  },
};

export const DEFAULT_TIMETABLE_CONFIG: TimetableConfig = DOUBLE_SHIFT_DEFAULTS;

export function defaultsForProfile(profile: SchoolProfile): TimetableConfig {
  return profile === "single" ? SINGLE_SHIFT_DEFAULTS : DOUBLE_SHIFT_DEFAULTS;
}

export function fmtMin(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
}

export function buildSlots(cfg: ShiftConfig): LessonSlot[] {
  const slots: LessonSlot[] = [];
  let cursor = cfg.startMin;
  for (let i = 1; i <= cfg.lessonCount; i++) {
    const start = cursor;
    const end = start + cfg.lessonMin;
    slots.push({ index: i, startMin: start, endMin: end });
    cursor = end + cfg.breakMin;
    if (i === cfg.longBreakAfter) cursor += cfg.longBreakExtraMin;
  }
  return slots;
}

export function shiftFromHour(hour: number): Shift {
  return hour >= 13 ? 2 : 1;
}

export const DAYS = [
  { idx: 0, label: "Dushanba", short: "Du" },
  { idx: 1, label: "Seshanba", short: "Se" },
  { idx: 2, label: "Chorshanba", short: "Ch" },
  { idx: 3, label: "Payshanba", short: "Pa" },
  { idx: 4, label: "Juma", short: "Ju" },
  { idx: 5, label: "Shanba", short: "Sh" },
];

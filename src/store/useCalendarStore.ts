import { create } from "zustand";
import {
  DEFAULT_CALENDAR_2025_2026,
  type AcademicYearCalendar,
  type DateRange,
  type Holiday,
} from "@/lib/academic-calendar";

/* ════════════════════════════════════════════════════════════════════
   OʻQUV YILI KALENDARI STORE — server-backed (6-bosqich migratsiyasi)

   Bitta joriy oʻquv yili: chegaralar, 4 chorak, taʼtillar. 2025–2026
   rasmiy sanalari default — hammasi Sozlamalar → "Oʻquv yili"da
   tahrirlanadi.

   Manba endi Postgres: `CalendarServerSync` (dashboard layout)
   hydration + snapshot-sync qiladi (hujjat bitta — diff shart emas).
   localStorage persist OLIB TASHLANDI — eski `ustozona-calendar-v1`
   kaliti endi oʻqilmaydi (9-bosqichda tozalanadi). Serverda satr yoʻq
   boʻlsa store DEFAULT bilan qoladi.
   ════════════════════════════════════════════════════════════════════ */

function uid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `id-${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
}

interface CalendarState {
  calendar: AcademicYearCalendar;
  _hasHydrated: boolean;
  setHasHydrated: (v: boolean) => void;

  setYearLabel: (label: string) => void;
  setYearRange: (range: DateRange) => void;
  setQuarterRange: (id: string, range: DateRange) => void;
  /** Yangi taʼtil qoʻshadi va id'sini qaytaradi. */
  addHoliday: (name: string, range: DateRange) => string;
  updateHoliday: (id: string, patch: Partial<Omit<Holiday, "id">>) => void;
  removeHoliday: (id: string) => void;
  resetDefaults: () => void;
}

export const useCalendarStore = create<CalendarState>()((set) => ({
  calendar: DEFAULT_CALENDAR_2025_2026,
  _hasHydrated: false,
  setHasHydrated: (v) => set({ _hasHydrated: v }),

  setYearLabel: (label) =>
    set((s) => ({ calendar: { ...s.calendar, yearLabel: label } })),

  setYearRange: (range) =>
    set((s) => ({ calendar: { ...s.calendar, range } })),

  setQuarterRange: (id, range) =>
    set((s) => ({
      calendar: {
        ...s.calendar,
        quarters: s.calendar.quarters.map((q) => (q.id === id ? { ...q, range } : q)),
      },
    })),

  addHoliday: (name, range) => {
    const id = uid();
    set((s) => ({
      calendar: { ...s.calendar, holidays: [...s.calendar.holidays, { id, name, range }] },
    }));
    return id;
  },

  updateHoliday: (id, patch) =>
    set((s) => ({
      calendar: {
        ...s.calendar,
        holidays: s.calendar.holidays.map((h) => (h.id === id ? { ...h, ...patch } : h)),
      },
    })),

  removeHoliday: (id) =>
    set((s) => ({
      calendar: { ...s.calendar, holidays: s.calendar.holidays.filter((h) => h.id !== id) },
    })),

  resetDefaults: () => set({ calendar: DEFAULT_CALENDAR_2025_2026 }),
}));

/** Joriy kalendarni React'siz oʻqish — hook boʻlmagan kod (student-profile,
    timetable seed) uchun. Eski readCalendarFromStorage oʻrnini bosadi:
    manba localStorage emas, server-backed store. */
export function getCurrentCalendar(): AcademicYearCalendar {
  return useCalendarStore.getState().calendar;
}

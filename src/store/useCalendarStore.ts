import { create } from "zustand";
import {
  EMPTY_CALENDAR,
  currentAcademicStartYear,
  makeCalendarForYear,
  type AcademicYearCalendar,
  type DateRange,
  type Holiday,
} from "@/lib/academic-calendar";

/* ════════════════════════════════════════════════════════════════════
   OʻQUV YILI KALENDARI STORE — server-backed (6-bosqich migratsiyasi)

   Bitta joriy oʻquv yili: chegaralar, 4 chorak, taʼtillar. Yangi
   foydalanuvchi BOʻSH kalendar (EMPTY_CALENDAR) bilan boshlaydi —
   onboarding sehrgari yoki Sozlamalar → "Oʻquv yili" toʻldiradi.

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

  /** Butun kalendarni birdaniga oʻrnatadi (onboarding sehrgari yilni
      tanlab makeCalendarForYear natijasini yozadi). */
  setCalendar: (calendar: AcademicYearCalendar) => void;
  setYearLabel: (label: string) => void;
  setYearRange: (range: DateRange) => void;
  setQuarterRange: (id: string, range: DateRange) => void;
  /** Yangi taʼtil qoʻshadi va id'sini qaytaradi. */
  addHoliday: (name: string, range: DateRange) => string;
  updateHoliday: (id: string, patch: Partial<Omit<Holiday, "id">>) => void;
  removeHoliday: (id: string) => void;
  /** Joriy oʻquv yilini rasmiy shablon (4 chorak + 3 taʼtil) bilan qayta tiklaydi —
      yil sarlavhasi hardcoded emas, joriy kalendar boshlanish yilidan hisoblanadi. */
  resetToOfficialTemplate: () => void;
}

export const useCalendarStore = create<CalendarState>()((set) => ({
  calendar: EMPTY_CALENDAR,
  _hasHydrated: false,
  setHasHydrated: (v) => set({ _hasHydrated: v }),

  setCalendar: (calendar) => set({ calendar }),

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

  resetToOfficialTemplate: () =>
    set((s) => {
      const startYear = s.calendar.range.start
        ? Number(s.calendar.range.start.slice(0, 4)) -
          (Number(s.calendar.range.start.slice(5, 7)) >= 6 ? 0 : 1)
        : currentAcademicStartYear();
      return { calendar: makeCalendarForYear(startYear) };
    }),
}));

/** Joriy kalendarni React'siz oʻqish — hook boʻlmagan kod (student-profile,
    timetable seed) uchun. Eski readCalendarFromStorage oʻrnini bosadi:
    manba localStorage emas, server-backed store. */
export function getCurrentCalendar(): AcademicYearCalendar {
  return useCalendarStore.getState().calendar;
}

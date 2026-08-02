import { create } from "zustand";
import {
  EMPTY_CALENDAR,
  currentAcademicStartYear,
  makeCalendarForYear,
  type AcademicYearCalendar,
  type DateRange,
  type Holiday,
  type Quarter,
} from "@/lib/academic-calendar";
import type { AcademicYearEntry } from "@/lib/academic-years";

/* ════════════════════════════════════════════════════════════════════
   OʻQUV YILI KALENDARI STORE — server-backed, koʻp-yil (1-bosqich)

   `years` — barcha oʻquv yillari (har biri alohida yozuv). `calendar` —
   FAOL yilning KOʻZGUSI: oʻnlab mavjud `s.calendar` selektorlari va
   `getCurrentCalendar()` shu sabab OʻZGARMAYDI. Mavjud mutatorlar
   (setYearRange, addHoliday…) faol yil yozuviga write-through qiladi
   (mirror + years bir vaqtda yangilanadi).

   Yangi mutatorlar:
   - addYear(calendar): roʻyxatga qoʻshadi + faollashtiradi (almashtirmaydi).
   - activateYear(id): boshqa yilni faollashtiradi (arxivni koʻrish).
   - deleteYear(id): faol BOʻLMAGAN yilni oʻchiradi.

   Manba Postgres: `CalendarServerSync` hydration (fetchYears) + snapshot
   sync (saveYears — butun `years` roʻyxatini yuboradi). Serverda satr
   yoʻq boʻlsa store BOʻSH (`years: []`, `calendar: EMPTY_CALENDAR`) qoladi
   va eager-seed bitta faol yil yaratadi.
   ════════════════════════════════════════════════════════════════════ */

function uid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `id-${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
}

/** Faol yil kalendarini `nextCalendar`ga yozadi va mirror'ni yangilaydi.
    Faol yil boʻlmasa (degenerativ holat) faqat mirror yangilanadi. */
function writeActive(
  s: { years: AcademicYearEntry[] },
  nextCalendar: AcademicYearCalendar
): { years: AcademicYearEntry[]; calendar: AcademicYearCalendar } {
  return {
    years: s.years.map((y) => (y.isActive ? { ...y, calendar: nextCalendar } : y)),
    calendar: nextCalendar,
  };
}

interface CalendarState {
  years: AcademicYearEntry[];
  /** Faol yilning koʻzgusi (isteʼmolchilar shu maydonni oʻqiydi). */
  calendar: AcademicYearCalendar;
  _hasHydrated: boolean;
  setHasHydrated: (v: boolean) => void;

  /** Faol yil kalendarini butunligicha almashtiradi (onboarding tasdigʻi,
      eager-seed). Faol yil boʻlmasa — birinchi faol yilni yaratadi. */
  setCalendar: (calendar: AcademicYearCalendar) => void;
  setYearLabel: (label: string) => void;
  setYearRange: (range: DateRange) => void;
  setQuarterRange: (id: string, range: DateRange) => void;
  /** Davr nomini oʻzgartiradi ("1-chorak" → "1-blok"). */
  setQuarterName: (id: string, name: string) => void;
  /** Baholash davrlari roʻyxatini butunligicha almashtiradi (shablon
      qoʻllash: 4 chorak / 2 semestr / 3 trimestr / davrsiz). */
  setQuarters: (quarters: Quarter[]) => void;
  /** Roʻyxat oxiriga bitta davr qoʻshadi va id'sini qaytaradi. */
  addQuarter: (name: string, range: DateRange) => string;
  removeQuarter: (id: string) => void;
  /** Yangi taʼtil qoʻshadi va id'sini qaytaradi. */
  addHoliday: (name: string, range: DateRange) => string;
  updateHoliday: (id: string, patch: Partial<Omit<Holiday, "id">>) => void;
  removeHoliday: (id: string) => void;
  /** Bloklangan kunlar roʻyxatini butunligicha almashtiradi (taqvimdan
      belgilash oqimi — `applyBlockedDays` natijasi). */
  setHolidays: (holidays: Holiday[]) => void;
  /** Faol oʻquv yilini rasmiy shablon (4 chorak + 3 taʼtil) bilan qayta tiklaydi. */
  resetToOfficialTemplate: () => void;

  /** Yangi oʻquv yili — roʻyxatga qoʻshadi va FAOL qiladi (eskisini
      oʻchirmaydi). Yaratilgan yil id'sini qaytaradi. */
  addYear: (calendar: AcademicYearCalendar) => string;
  /** Boshqa (mavjud) yilni faollashtiradi — davomat/planner oynasi oʻsha
      yilga koʻchadi. */
  activateYear: (id: string) => void;
  /** Faol BOʻLMAGAN yilni oʻchiradi (faol yil oʻchirilmaydi). */
  deleteYear: (id: string) => void;
}

export const useCalendarStore = create<CalendarState>()((set) => ({
  years: [],
  calendar: EMPTY_CALENDAR,
  _hasHydrated: false,
  setHasHydrated: (v) => set({ _hasHydrated: v }),

  setCalendar: (calendar) =>
    set((s) => {
      if (s.years.some((y) => y.isActive)) return writeActive(s, calendar);
      // Faol yil yoʻq — birinchi faol yilni yaratamiz (mirror bilan).
      const entry: AcademicYearEntry = { id: uid(), isActive: true, calendar };
      return { years: [...s.years, entry], calendar };
    }),

  setYearLabel: (label) =>
    set((s) => writeActive(s, { ...s.calendar, yearLabel: label })),

  setYearRange: (range) =>
    set((s) => writeActive(s, { ...s.calendar, range })),

  setQuarterRange: (id, range) =>
    set((s) =>
      writeActive(s, {
        ...s.calendar,
        quarters: s.calendar.quarters.map((q) => (q.id === id ? { ...q, range } : q)),
      })
    ),

  setQuarterName: (id, name) =>
    set((s) =>
      writeActive(s, {
        ...s.calendar,
        quarters: s.calendar.quarters.map((q) => (q.id === id ? { ...q, name } : q)),
      })
    ),

  setQuarters: (quarters) => set((s) => writeActive(s, { ...s.calendar, quarters })),

  addQuarter: (name, range) => {
    const id = uid();
    set((s) =>
      writeActive(s, { ...s.calendar, quarters: [...s.calendar.quarters, { id, name, range }] })
    );
    return id;
  },

  removeQuarter: (id) =>
    set((s) =>
      writeActive(s, { ...s.calendar, quarters: s.calendar.quarters.filter((q) => q.id !== id) })
    ),

  addHoliday: (name, range) => {
    const id = uid();
    set((s) =>
      writeActive(s, { ...s.calendar, holidays: [...s.calendar.holidays, { id, name, range }] })
    );
    return id;
  },

  updateHoliday: (id, patch) =>
    set((s) =>
      writeActive(s, {
        ...s.calendar,
        holidays: s.calendar.holidays.map((h) => (h.id === id ? { ...h, ...patch } : h)),
      })
    ),

  removeHoliday: (id) =>
    set((s) =>
      writeActive(s, {
        ...s.calendar,
        holidays: s.calendar.holidays.filter((h) => h.id !== id),
      })
    ),

  setHolidays: (holidays) => set((s) => writeActive(s, { ...s.calendar, holidays })),

  resetToOfficialTemplate: () =>
    set((s) => {
      const startYear = s.calendar.range.start
        ? Number(s.calendar.range.start.slice(0, 4)) -
          (Number(s.calendar.range.start.slice(5, 7)) >= 6 ? 0 : 1)
        : currentAcademicStartYear();
      return writeActive(s, makeCalendarForYear(startYear));
    }),

  addYear: (calendar) => {
    const id = uid();
    set((s) => ({
      years: [...s.years.map((y) => ({ ...y, isActive: false })), { id, isActive: true, calendar }],
      calendar,
    }));
    return id;
  },

  activateYear: (id) =>
    set((s) => {
      const target = s.years.find((y) => y.id === id);
      if (!target || target.isActive) return s;
      return {
        years: s.years.map((y) => ({ ...y, isActive: y.id === id })),
        calendar: target.calendar,
      };
    }),

  deleteYear: (id) =>
    set((s) => {
      const target = s.years.find((y) => y.id === id);
      if (!target || target.isActive) return s; // faol yil oʻchirilmaydi
      return { years: s.years.filter((y) => y.id !== id) };
    }),
}));

/** Joriy (FAOL) kalendarni React'siz oʻqish — hook boʻlmagan kod
    (student-profile, timetable seed) uchun. Manba: faol yil koʻzgusi. */
export function getCurrentCalendar(): AcademicYearCalendar {
  return useCalendarStore.getState().calendar;
}

import { create } from "zustand";
import {
  BUILTIN_STATUSES,
  type AttendanceRecord,
  type AttendanceStatusDef,
} from "@/lib/attendance-data";

/* ════════════════════════════════════════════════════════════════════
   DAVOMAT — server-backed store (5-bosqich migratsiyasi).

   Manba endi Postgres: `AttendanceServerSync` (dashboard layout)
   mount'da serverdan {recordsByClass, statuses}ni yuklaydi (hydration),
   keyin har oʻzgarishni diff qilib server action'ga yuboradi (~1.5s
   debounce, optimistik).

   Lazy-seed fallback OLIB TASHLANDI (9-bosqich): serverda yozuvi yoʻq
   sinf boʻsh roʻyxatdan boshlanadi — demo yozuvlar endi faqat
   scripts/seed.ts'da (demo oʻqituvchi) yaratiladi.
   ════════════════════════════════════════════════════════════════════ */

interface AttendanceState {
  recordsByClass: Record<string, AttendanceRecord[]>;
  statuses: AttendanceStatusDef[];
  _hasHydrated: boolean;
  setHasHydrated: (v: boolean) => void;
  /** Sinfning davomat yozuvlari — qiymat yoki updater. */
  setRecords: (
    classId: string,
    next: AttendanceRecord[] | ((prev: AttendanceRecord[]) => AttendanceRecord[])
  ) => void;
  setStatuses: (next: AttendanceStatusDef[]) => void;
}

export const useAttendanceStore = create<AttendanceState>()((set) => ({
  recordsByClass: {},
  statuses: BUILTIN_STATUSES.map((s) => ({ ...s })),
  _hasHydrated: false,
  setHasHydrated: (v) => set({ _hasHydrated: v }),

  setRecords: (classId, next) =>
    set((s) => {
      const prev = s.recordsByClass[classId] ?? [];
      const value = typeof next === "function" ? next(prev) : next;
      return { recordsByClass: { ...s.recordsByClass, [classId]: value } };
    }),

  setStatuses: (next) => set({ statuses: next }),
}));

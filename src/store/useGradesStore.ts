import { create } from "zustand";
import type { ClassData } from "@/lib/grades-data";

/* ════════════════════════════════════════════════════════════════════
   BAHOLAR JURNALI — server-backed store (4-bosqich migratsiyasi).

   Manba endi Postgres: `GradesServerSync` (dashboard layout) mount'da
   serverdan butun `classDataMap`ni yuklaydi (hydration), keyin har
   oʻzgarishni diff qilib server action'ga yuboradi (~1.5s debounce,
   optimistik).

   Boshlangʻich holat BOʻSH (9-bosqich): statik CLASS_DATA seed olib
   tashlandi — yangi oʻqituvchi demo emas, oʻz (boʻsh) maʼlumotini
   koʻradi. Isteʼmolchilar `classDataMap[id]` yoʻqligiga chidamli
   boʻlishi shart; mount-gate'lar `_hasHydrated`ga qaraydi.
   ════════════════════════════════════════════════════════════════════ */

interface GradesState {
  classDataMap: Record<string, ClassData>;
  _hasHydrated: boolean;
  setHasHydrated: (v: boolean) => void;
  /** Bitta sinfni updater bilan yangilash (sinf yoʻq boʻlsa — no-op). */
  updateClass: (id: string, updater: (cd: ClassData) => ClassData) => void;
  /** Butun xaritani almashtirish — qiymat yoki updater funksiyasi. */
  setClassDataMap: (
    next:
      | Record<string, ClassData>
      | ((prev: Record<string, ClassData>) => Record<string, ClassData>)
  ) => void;
}

export const useGradesStore = create<GradesState>()((set) => ({
  classDataMap: {},
  _hasHydrated: false,
  setHasHydrated: (v) => set({ _hasHydrated: v }),

  updateClass: (id, updater) =>
    set((s) => {
      const cd = s.classDataMap[id];
      if (!cd) return s;
      return { classDataMap: { ...s.classDataMap, [id]: updater(cd) } };
    }),

  setClassDataMap: (next) =>
    set((s) => ({
      classDataMap: typeof next === "function" ? next(s.classDataMap) : next,
    })),
}));

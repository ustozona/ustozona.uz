import { create } from 'zustand';

/* ════════════════════════════════════════════════════════════════════
   SINF TANLOVI + JURNAL SHKALASI — server-backed store (8-bosqich)

   Persist boʻlagi (selectedClassId + journalScale) endi Postgres'da:
   teachers.prefs.classPrefs kaliti ostida. `ClassPrefsServerSync`
   (dashboard layout) mount'da yuklaydi, oʻzgarishni snapshot sifatida
   saqlaydi. (Oʻlik classDataMap maydoni 9-bosqichda olib tashlandi —
   baholar maʼlumoti yagona manbasi useGradesStore.)
   ════════════════════════════════════════════════════════════════════ */
import type { JournalScale } from '@/lib/grade-scale';
import { DEFAULT_JOURNAL_SCALE } from '@/lib/grade-scale';

export interface ClassState {
  selectedClassId: string;
  setSelectedClassId: (id: string) => void;

  // Jurnal ballik ko‘rinishi — o‘qituvchi standarti (barcha sinflar uchun
  // fallback). Display layer; ichki hisob (foiz) o‘zgarmaydi.
  journalScale: JournalScale;
  setJournalScale: (patch: Partial<JournalScale>) => void;

  // Sinf darajasidagi bekor qilish (C3, docs/grades-v1-spec.md §4): har sinf
  // o‘z shkalasini olishi mumkin (5-ballik va A–F bir hisobda birga yasha
  // oladi). Yo‘q bo‘lsa `journalScale` (standart) ishlatiladi — `journalScaleFor`.
  journalScaleByClass: Record<string, JournalScale>;
  setJournalScaleForClass: (classId: string, patch: Partial<JournalScale>) => void;
  clearJournalScaleForClass: (classId: string) => void;

  _hasHydrated: boolean;
  setHasHydrated: (state: boolean) => void;
}

export const useClassStore = create<ClassState>()(
    (set) => ({
      selectedClassId: '9-a',
      setSelectedClassId: (id) => set({ selectedClassId: id }),

      journalScale: DEFAULT_JOURNAL_SCALE,
      setJournalScale: (patch) =>
        set((state) => ({ journalScale: { ...state.journalScale, ...patch } })),

      journalScaleByClass: {},
      setJournalScaleForClass: (classId, patch) =>
        set((state) => ({
          journalScaleByClass: {
            ...state.journalScaleByClass,
            [classId]: { ...(state.journalScaleByClass[classId] ?? state.journalScale), ...patch },
          },
        })),
      clearJournalScaleForClass: (classId) =>
        set((state) => {
          const next = { ...state.journalScaleByClass };
          delete next[classId];
          return { journalScaleByClass: next };
        }),

      _hasHydrated: false,
      setHasHydrated: (state) => set({ _hasHydrated: state }),
    })
);

/** Sinfning haqiqiy jurnal shkalasi — bekor qilingan boʻlsa oʻshani, aks holda standartni. */
export function journalScaleFor(state: ClassState, classId: string): JournalScale {
  return state.journalScaleByClass[classId] ?? state.journalScale;
}

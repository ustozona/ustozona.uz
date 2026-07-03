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

interface ClassState {
  selectedClassId: string;
  setSelectedClassId: (id: string) => void;

  // Jurnal ballik ko‘rinishi — yagona jurnal shkalasi (docs/grades-scale-model.md).
  // Display layer; ichki hisob (foiz) o‘zgarmaydi.
  journalScale: JournalScale;
  setJournalScale: (patch: Partial<JournalScale>) => void;

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

      _hasHydrated: false,
      setHasHydrated: (state) => set({ _hasHydrated: state }),
    })
);

import { create } from "zustand";

/* ── Sinf eslatmalari — sinf (identity.id) boʻyicha erkin matn.
   Server-backed (8-bosqich): `ClassNotesServerSync` mount'da serverdan
   {notes}ni yuklaydi, oʻzgarishlar snapshot sifatida saqlanadi.
   localStorage persist OLIB TASHLANDI — eski `ustozona-class-notes-v1`
   kaliti endi oʻqilmaydi (9-bosqichda tozalanadi). ── */
interface ClassNotesState {
  notes: Record<string, string>;
  _hasHydrated: boolean;
  setHasHydrated: (v: boolean) => void;
  setNote: (classId: string, value: string) => void;
}

export const useClassNotesStore = create<ClassNotesState>()((set) => ({
  notes: {},
  _hasHydrated: false,
  setHasHydrated: (v) => set({ _hasHydrated: v }),
  setNote: (classId, value) =>
    set((s) => ({ notes: { ...s.notes, [classId]: value } })),
}));

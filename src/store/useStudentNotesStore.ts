import { create } from "zustand";

/* ════════════════════════════════════════════════════════════════════
   OʻQUVCHI QAYDLARI — profil sahifasi "Qaydlar" tab'i uchun store.

   Server-backed (useFeedbackStore uslubi): StudentNotesServerSync
   mount'da serverdan {items}ni yuklaydi, oʻzgarishlar diff bilan
   saqlanadi. Append-only — hozircha UI'da tahrirlash/oʻchirish yoʻq.
   ════════════════════════════════════════════════════════════════════ */

export type Sentiment = "positive" | "concern" | "neutral";

export type StudentNoteEntry = {
  id: string;
  studentId: string;
  text: string;
  sentiment: Sentiment;
  createdAt: string; // ISO
};

function uid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `id-${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
}

/** ISO → nisbiy: "Hozir / bugun / kecha / N kun oldin / N hafta oldin / …". */
export function formatNoteTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  if (Date.now() - d.getTime() < 60_000) return "Hozir";
  const dayMs = 86_400_000;
  const startOf = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const diff = Math.round((startOf(new Date()) - startOf(d)) / dayMs);
  if (diff <= 0) return "bugun";
  if (diff === 1) return "kecha";
  if (diff < 7) return `${diff} kun oldin`;
  if (diff < 30) return `${Math.floor(diff / 7)} hafta oldin`;
  if (diff < 365) return `${Math.floor(diff / 30)} oy oldin`;
  return `${Math.floor(diff / 365)} yil oldin`;
}

interface StudentNotesState {
  items: StudentNoteEntry[];
  _hasHydrated: boolean;
  setHasHydrated: (v: boolean) => void;
  addNote: (studentId: string, text: string, sentiment: Sentiment) => void;
}

export const useStudentNotesStore = create<StudentNotesState>()((set) => ({
  items: [],
  _hasHydrated: false,
  setHasHydrated: (v) => set({ _hasHydrated: v }),

  addNote: (studentId, text, sentiment) => {
    const note: StudentNoteEntry = {
      id: uid(),
      studentId,
      text: text.trim(),
      sentiment,
      createdAt: new Date().toISOString(),
    };
    set((s) => ({ items: [note, ...s.items] }));
  },
}));

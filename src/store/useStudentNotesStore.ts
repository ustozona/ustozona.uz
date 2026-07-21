import { create } from "zustand";

/* ════════════════════════════════════════════════════════════════════
   OʻQUVCHI QAYDLARI — profil sahifasi "Qaydlar" tab'i uchun store.

   Server-backed (useFeedbackStore uslubi): StudentNotesServerSync
   mount'da serverdan {items}ni yuklaydi, oʻzgarishlar diff bilan
   saqlanadi. Tahrirlash/oʻchirish — faqat oʻz qaydi ustida (DAL
   setWhere teacherId bilan himoyalangan).
   ════════════════════════════════════════════════════════════════════ */

export type Visibility = "teachers" | "guardians";

export type StudentNoteEntry = {
  id: string;
  studentId: string;
  /** Toʻliq qayd rejimida sarlavha; qisqa qaydda null. */
  title: string | null;
  text: string;
  tags: string[];
  color: string | null;
  visibility: Visibility;
  createdAt: string; // ISO
  /** Server javobida qoʻshiladi (join orqali) — clientda hech qachon yozilmaydi. */
  authorId?: string;
  authorName?: string;
  authorAvatarUrl?: string | null;
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
  addNote: (
    studentId: string,
    text: string,
    tags: string[],
    visibility: Visibility,
    title?: string | null,
    color?: string | null
  ) => void;
  updateNote: (id: string, text: string, tags: string[], title?: string | null) => void;
  deleteNote: (id: string) => void;
}

export const useStudentNotesStore = create<StudentNotesState>()((set) => ({
  items: [],
  _hasHydrated: false,
  setHasHydrated: (v) => set({ _hasHydrated: v }),

  addNote: (studentId, text, tags, visibility, title, color) => {
    const note: StudentNoteEntry = {
      id: uid(),
      studentId,
      title: title?.trim() || null,
      text: text.trim(),
      tags,
      color: color ?? null,
      visibility,
      createdAt: new Date().toISOString(),
    };
    set((s) => ({ items: [note, ...s.items] }));
  },

  updateNote: (id, text, tags, title) => {
    set((s) => ({
      items: s.items.map((n) =>
        n.id === id ? { ...n, text: text.trim(), tags, title: title?.trim() || null } : n
      ),
    }));
  },

  deleteNote: (id) => {
    set((s) => ({ items: s.items.filter((n) => n.id !== id) }));
  },
}));

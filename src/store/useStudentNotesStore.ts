import { create } from "zustand";

/* ════════════════════════════════════════════════════════════════════
   OʻQUVCHI QAYDLARI — profil sahifasi "Qaydlar" tab'i uchun store.

   Server-backed (useFeedbackStore uslubi): StudentNotesServerSync
   mount'da serverdan yuklaydi, oʻzgarishlar diff bilan saqlanadi.

   🔴 IKKI ROʻYXAT — VA BU ARXITEKTURA QARORI, QULAYLIK EMAS.

     items    — MENIKI. Tahrirlanadi, diffga tushadi, serverga yoziladi.
     foreign  — BOSHQANIKI. Faqat oʻqiladi, diffga HECH QACHON tushmaydi.

   ⛔ Bularni bitta roʻyxatga birlashtirmang. Ilgari yassi bitta roʻyxat
   edi va qaydlar ulashilgan kuni buziladigan holat tayyor turardi:
   boshqa oʻqituvchi qaydi roʻyxatga tushsa, uni tahrirlash server
   tomonda JIMGINA rad etilardi (`setWhere teacherId`) — UI esa
   muvaffaqiyat koʻrsatardi. Oʻchirish esa lokalda ishlab, serverda
   ishlamasdi: sahifa yangilanganda qayd ARVOH boʻlib qaytardi.

   ⭐ Yechim mudofaada emas, TUZILMADA: mutatorlar faqat `items` ustida
   ishlaydi, demak begona qaydni tahrirlash yoki oʻchirish texnik
   jihatdan imkonsiz. Serverdagi himoya oʻz joyida qoladi, lekin endi u
   IKKINCHI qator — birinchisi shu ajratilish.

   ⚠️ `foreign` hozir har doim boʻsh: qaydlarni ulashish hali yoqilmagan
   (arxitektura hujjati §8). Roʻyxat OLDIN qurildi — ulashish yoqilgan
   kuni bu fayl qayta yozilmasin.
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

/** Koʻrsatish uchun birlashtirilgan qayd — tahrirlanadimi, shu yerda. */
export type VisibleStudentNote = StudentNoteEntry & { canEdit: boolean };

/**
 * Bitta oʻquvchining barcha qaydlari — meniki va boshqanikisi birga,
 * yangisi birinchi.
 *
 * ⚠️ Birlashtirish FAQAT shu yerda, koʻrsatish uchun. Store ichida
 * ikkisi ajratilgan qoladi — aks holda yuqoridagi arvoh yozuv qaytadi.
 */
export function selectStudentNotes(
  s: { items: StudentNoteEntry[]; foreign: StudentNoteEntry[] },
  studentId: string
): VisibleStudentNote[] {
  const mine = s.items
    .filter((n) => n.studentId === studentId)
    .map((n) => ({ ...n, canEdit: true }));
  const others = s.foreign
    .filter((n) => n.studentId === studentId)
    .map((n) => ({ ...n, canEdit: false }));
  return [...mine, ...others].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

interface StudentNotesState {
  /** MENIKI — tahrirlanadi va serverga yoziladi. */
  items: StudentNoteEntry[];
  /** BOSHQANIKI — faqat oʻqiladi, diffga tushmaydi. */
  foreign: StudentNoteEntry[];
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
  foreign: [],
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

  /* ⛔ Ikkala mutator ham FAQAT `items` ustida ishlaydi. `foreign` ga
     tegmasligi tasodif emas: begona qaydni oʻzgartirish bu yerda
     texnik jihatdan imkonsiz boʻlishi kerak. */
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

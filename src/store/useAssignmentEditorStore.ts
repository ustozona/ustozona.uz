import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Assignment } from "@/lib/grades-data";
import { todayKey } from "@/lib/date-keys";

/* ════════════════════════════════════════════════════════════════════
   TOPSHIRIQ MUHARRIRI SESSIYASI — global, qurilma-lokal (localStorage).

   Nega store? Muharrir ilgari sahifa komponenti ichida chizilardi
   (GradesView / assignments/page.tsx), shuning uchun boshqa sahifaga
   oʻtish uni unmount qilib, yozilayotgan QORALAMANI izsiz yoʻqotardi.
   Endi u `dashboard/layout.tsx` darajasidagi `AssignmentEditorHost`da
   yashaydi — Gmail'ning "compose" oynasi kabi butun ilova boʻylab
   ochiq qolaveradi va sahifa almashinuvidan omon chiqadi.

   Bir vaqtda BITTA sessiya — chip ham bitta. Koʻp qoralama kerak
   boʻlsa (v2), `session` massivga aylanadi va chip stack'ga.

   Server sync YOʻQ: qoralama hali topshiriq emas, DB'ga faqat
   "Yaratish" bosilganda yoziladi (`useGradesStore`).
   ════════════════════════════════════════════════════════════════════ */

/** Qoralama sessiyasining tahrirlanadigan qismi — DB'da hali yoʻq. */
export interface DraftPayload {
  assignment: Assignment;
  /** Tanlangan sinflar (langar sinf doim ichida). */
  classIds: string[];
  /** Sana har sinfda oʻzi: sinf id → "yyyy-mm-dd". */
  dates: Record<string, string>;
  /** Sana rejimiga qoʻlda tegilganmi — tegilgan boʻlsa toifa uni oʻzgartirmaydi. */
  modeTouched: boolean;
}

/** Boʻsh qoralama — muharrir ochilganda shu holatdan boshlanadi. */
export function makeDraftPayload(classId: string, defaultTopicId: string | null): DraftPayload {
  const date = todayKey();
  return {
    assignment: {
      id: crypto.randomUUID(),
      title: "",
      maxScore: 100,
      topicId: defaultTopicId,
      date,
      kind: "manual",
    },
    classIds: [classId],
    dates: { [classId]: date },
    modeTouched: false,
  };
}

/** Qoralamada oʻqituvchi biror narsa yozganmi — "saqlaymizmi?" soʻrash uchun. */
export function isDraftDirty(p: DraftPayload): boolean {
  return (
    p.assignment.title.trim() !== "" ||
    p.classIds.length > 1 ||
    p.assignment.kind !== "manual"
  );
}

export type EditorSession =
  /** Yangi topshiriq — mazmuni shu yerda, DB'ga hali yozilmagan. */
  | { kind: "draft"; classId: string; manualCreate: boolean; payload: DraftPayload }
  /** Mavjud topshiriq — mazmuni `useGradesStore`da, bu yerda faqat havola. */
  | { kind: "edit"; classId: string; assignmentId: string };

interface AssignmentEditorState {
  session: EditorSession | null;
  /** Toʻliq ekran yopiq, pastda tiklash yorligʻi turibdi. */
  minimized: boolean;

  openDraft: (classId: string, manualCreate: boolean, payload: DraftPayload) => void;
  openEdit: (classId: string, assignmentId: string) => void;
  /** Qoralama mazmunini yangilaydi. Tahrir sessiyasida no-op. */
  patchDraft: (next: (prev: DraftPayload) => DraftPayload) => void;
  minimize: () => void;
  restore: () => void;
  /** Sessiyani butunlay tashlaydi (qoralama yoʻqoladi). */
  close: () => void;
}

export const useAssignmentEditorStore = create<AssignmentEditorState>()(
  persist(
    (set, get) => ({
      session: null,
      minimized: false,

      openDraft: (classId, manualCreate, payload) =>
        set({ session: { kind: "draft", classId, manualCreate, payload }, minimized: false }),

      openEdit: (classId, assignmentId) =>
        set({ session: { kind: "edit", classId, assignmentId }, minimized: false }),

      patchDraft: (next) => {
        const s = get().session;
        if (s?.kind !== "draft") return;
        set({ session: { ...s, payload: next(s.payload) } });
      },

      minimize: () => {
        if (!get().session) return;
        set({ minimized: true });
      },

      restore: () => set({ minimized: false }),

      close: () => set({ session: null, minimized: false }),
    }),
    {
      name: "ustozona-assignment-editor-v1",
      version: 1,
    }
  )
);

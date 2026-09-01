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

/** Qoralamada oʻqituvchi biror narsa yozganmi — "saqlaymizmi?" soʻrash uchun.
    `kind`/`setId` ham hisobga olinadi: mazmun tanlovi endi shu payload'da
    yashaydi (ilgari komponent ichidagi `useState` edi va bu tekshiruvga
    koʻrinmasdi — test tanlab `✕` bosilsa qoralama jimgina yoʻqolardi). */
export function isDraftDirty(p: DraftPayload): boolean {
  return (
    p.assignment.title.trim() !== "" ||
    (p.assignment.instructions ?? "").trim() !== "" ||
    p.classIds.length > 1 ||
    p.assignment.kind !== "manual" ||
    Boolean(p.assignment.setId)
  );
}

export type EditorSession =
  /** Yangi topshiriq — mazmuni shu yerda, DB'ga hali yozilmagan. */
  | { kind: "draft"; classId: string; payload: DraftPayload }
  /** Mavjud topshiriq — mazmuni `useGradesStore`da, bu yerda faqat havola. */
  | { kind: "edit"; classId: string; assignmentId: string };

interface AssignmentEditorState {
  session: EditorSession | null;
  /** Sessiya turibdi, lekin muharrir CHIZILMAYDI — qoralama "parkda".
      Ilgari bu `minimized` edi va pastda suzuvchi yorliq chizilardi;
      yorliq oʻrniga qoralama endi Topshiriqlar roʻyxatida karta boʻlib
      turadi (qoralama-kartochka naqshi). */
  parked: boolean;

  /** Yangi qoralama. Tugallanmagan qoralama bor boʻlsa — u TIKLANADI,
      ustiga yozilmaydi. Qaytadigan qiymat shuni bildiradi. */
  openDraft: (classId: string, payload: DraftPayload) => "created" | "restored";
  openEdit: (classId: string, assignmentId: string) => void;
  /** Qoralama mazmunini yangilaydi. Tahrir sessiyasida no-op. */
  patchDraft: (next: (prev: DraftPayload) => DraftPayload) => void;
  /** Muharrirni yopadi, sessiyani SAQLAB qoladi. */
  park: () => void;
  restore: () => void;
  /** Sessiyani butunlay tashlaydi (qoralama yoʻqoladi). */
  close: () => void;
}

export const useAssignmentEditorStore = create<AssignmentEditorState>()(
  persist(
    (set, get) => ({
      session: null,
      parked: false,

      openDraft: (classId, payload) => {
        /* ⚠️ Ilgari bu yerda shart yoʻq edi: parklangan qoralama ustiga
           jimgina yozilardi. Alomat: 5-A da qoralama qoldirib, 5-B da
           "+" bosilsa 5-A dagi ish izsiz yoʻqolardi. Endi tugallanmagan
           qoralama tiklanadi (Linear naqshi — avto-tiklash). */
        const s = get().session;
        if (s?.kind === "draft" && isDraftDirty(s.payload)) {
          set({ parked: false });
          return "restored";
        }
        set({ session: { kind: "draft", classId, payload }, parked: false });
        return "created";
      },

      openEdit: (classId, assignmentId) =>
        set({ session: { kind: "edit", classId, assignmentId }, parked: false }),

      patchDraft: (next) => {
        const s = get().session;
        if (s?.kind !== "draft") return;
        set({ session: { ...s, payload: next(s.payload) } });
      },

      park: () => {
        if (!get().session) return;
        set({ parked: true });
      },

      restore: () => set({ parked: false }),

      close: () => set({ session: null, parked: false }),
    }),
    {
      name: "ustozona-assignment-editor-v1",
      version: 2,
      migrate: (state, version) => {
        // v1 da bayroq `minimized` deb atalardi — maʼnosi oʻsha.
        if (version >= 2) return state as AssignmentEditorState;
        const old = state as { minimized?: boolean } & Partial<AssignmentEditorState>;
        return { ...old, parked: Boolean(old.minimized) } as AssignmentEditorState;
      },
    }
  )
);

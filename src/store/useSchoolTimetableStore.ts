import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  emptyDoc,
  indexDoc,
  slotKey,
  type Placement,
  type SchoolClass,
  type SchoolStaff,
  type SchoolSubject,
  type SchoolTimetableDoc,
} from "@/lib/school-timetable";

/* ════════════════════════════════════════════════════════════════════
   MAKTAB JADVALI STORE — `/jadval` ost-loyihasi.

   ⛔ DASHBOARD STORE'LARIGA TEGMAYDI. `useTimetableStore` (oʻqituvchi
   jadvali), `useGradesStore` va boshqalar bu yerdan import qilinmaydi
   va bu yerni import qilmaydi. Ikki mahsulot orasidagi yagona koʻprik —
   `src/server/actions/timetable-publish.ts`
   (docs/dars-jadvali-spec.md §9).

   Saqlash: birinchi seans `localStorage` da (mehmon rejimi — zavuch
   kirmasdan ish boshlaydi). «Saqlash» bosilganda roʻyxatdan oʻtish
   soʻraladi va hujjat serverga koʻchiriladi (§3.1).

   ⚠️ 1200 katakli hujjat brauzerda turadi — shuning uchun `dirty` va
   `savedAt` bor: sahifa ogohlantirish koʻrsatishi kerak.
   ════════════════════════════════════════════════════════════════════ */

function uid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `id-${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
}

/** Bitta amalni bekor qilish uchun snapshot (undo/redo). */
type Snapshot = { placements: Placement[] };

/** Chekli tarix — 1200 katakli hujjatda cheksiz tarix xotirani yeydi. */
const HISTORY_LIMIT = 60;

/**
 * «Qoʻlga olingan» dars — toʻr shu boʻyicha qoʻyish holatlarini yoqadi.
 *
 * ⭐ Ikki turi bir xil yoʻldan yuradi: yangi soat qoʻyish ham, mavjud
 * darsni koʻchirish ham «olib → katakka qoʻyish». Shu sabab sudrash,
 * klaviatura va bosish uchun UCHTA emas, BITTA mantiq bor.
 */
export type Armed =
  | { kind: "new"; classId: string; subjectId: string; staffId: string }
  | {
      kind: "move";
      placementId: string;
      classId: string;
      subjectId: string;
      staffId: string;
    }
  | null;

/** @deprecated eski nom — `Armed` ishlating. */
export type ArmedCard = Armed;

interface SchoolTimetableState {
  doc: SchoolTimetableDoc;
  /** Serverga yozilgan jadval id'si. `null` — hali faqat brauzerda. */
  remoteId: string | null;
  dirty: boolean;
  savedAt: number | null;
  _hasHydrated: boolean;

  /** Qoʻlga olingan dars — toʻr shu boʻyicha holat koʻrsatadi. */
  armed: Armed;

  past: Snapshot[];
  future: Snapshot[];

  setHasHydrated: (v: boolean) => void;
  loadDoc: (doc: SchoolTimetableDoc, remoteId?: string | null) => void;
  patchDoc: (patch: Partial<SchoolTimetableDoc>) => void;

  arm: (card: Armed) => void;

  place: (input: {
    classId: string;
    day: number;
    shift: 1 | 2;
    period: number;
    subjectId: string;
    staffId: string;
    group?: number;
  }) => void;
  move: (placementId: string, to: { classId: string; day: number; shift: 1 | 2; period: number }) => void;
  remove: (placementId: string) => void;
  toggleLock: (placementId: string) => void;

  upsertClass: (cls: SchoolClass) => void;
  upsertSubject: (subject: SchoolSubject) => void;
  upsertStaff: (staff: SchoolStaff) => void;
  setPlanHours: (classId: string, subjectId: string, hours: number) => void;

  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;

  markSaved: (remoteId: string) => void;
}

export const useSchoolTimetableStore = create<SchoolTimetableState>()(
  persist(
    (set, get) => {
      /** Har oʻzgarishdan OLDIN chaqiriladi — tarixga snapshot qoʻyadi. */
      function push(next: Placement[]) {
        const s = get();
        const past = [...s.past, { placements: s.doc.placements }].slice(-HISTORY_LIMIT);
        set({
          doc: { ...s.doc, placements: next },
          past,
          future: [],
          dirty: true,
        });
      }

      return {
        doc: emptyDoc(),
        remoteId: null,
        dirty: false,
        savedAt: null,
        _hasHydrated: false,
        armed: null,
        past: [],
        future: [],

        setHasHydrated: (v) => set({ _hasHydrated: v }),

        loadDoc: (doc, remoteId = null) =>
          set({ doc, remoteId, dirty: false, past: [], future: [], armed: null }),

        patchDoc: (patch) => set((s) => ({ doc: { ...s.doc, ...patch }, dirty: true })),

        arm: (card) => set({ armed: card }),

        place: ({ classId, day, shift, period, subjectId, staffId, group }) => {
          const s = get();
          const idx = indexDoc(s.doc);
          const here = idx.bySlot.get(slotKey(classId, day, shift, period)) ?? [];

          /* ⛔ Qulflangan katak — `remove` va `move` bilan bir xil qoida.
             Ilgari faqat oʻsha ikkisi tekshirardi va `place` qulfni
             jimgina bosib oʻtardi: qulf aynan avtomatik/ommaviy
             yoʻllardan himoya qilishi kerak edi (spec §10.1). */
          if (here.some((p) => p.locked)) return;

          /* Guruh berilmagan boʻlsa — katakdagi barcha darslar
             ALMASHTIRILADI (butun sinf darsi). Guruh berilgan boʻlsa
             faqat oʻsha guruh oʻrni egallanadi. */
          const keepIds = new Set(
            group == null ? [] : here.filter((p) => p.group !== group).map((p) => p.id)
          );
          const removedIds = new Set(here.filter((p) => !keepIds.has(p.id)).map((p) => p.id));

          const next = s.doc.placements.filter((p) => !removedIds.has(p.id));
          next.push({ id: uid(), classId, day, shift, period, subjectId, staffId, group });
          push(next);
          set({ armed: null });
        },

        move: (placementId, to) => {
          const s = get();
          const target = s.doc.placements.find((p) => p.id === placementId);
          if (!target || target.locked) return;

          const idx = indexDoc(s.doc);
          const here = (idx.bySlot.get(slotKey(to.classId, to.day, to.shift, to.period)) ?? []).filter(
            (p) => p.id !== placementId
          );
          if (here.some((p) => p.locked)) return;

          /* Almashish (swap): maqsad katagida bitta dars boʻlsa —
             oʻrinlarini almashtiramiz, oʻchirmaymiz. Zavuchning eng
             tez-tez qiladigan amali shu. */
          if (here.length === 1) {
            const other = here[0];
            const next = s.doc.placements.map((p) => {
              if (p.id === placementId) return { ...p, ...to };
              if (p.id === other.id) {
                return {
                  ...p,
                  classId: target.classId,
                  day: target.day,
                  shift: target.shift,
                  period: target.period,
                };
              }
              return p;
            });
            push(next);
            return;
          }

          const removed = new Set(here.map((p) => p.id));
          const next = s.doc.placements
            .filter((p) => !removed.has(p.id))
            .map((p) => (p.id === placementId ? { ...p, ...to } : p));
          push(next);
        },

        remove: (placementId) => {
          const s = get();
          const target = s.doc.placements.find((p) => p.id === placementId);
          if (!target || target.locked) return;
          push(s.doc.placements.filter((p) => p.id !== placementId));
        },

        toggleLock: (placementId) => {
          const s = get();
          push(
            s.doc.placements.map((p) => (p.id === placementId ? { ...p, locked: !p.locked } : p))
          );
        },

        upsertClass: (cls) =>
          set((s) => {
            const exists = s.doc.classes.some((c) => c.id === cls.id);
            return {
              doc: {
                ...s.doc,
                classes: exists
                  ? s.doc.classes.map((c) => (c.id === cls.id ? cls : c))
                  : [...s.doc.classes, cls],
              },
              dirty: true,
            };
          }),

        upsertSubject: (subject) =>
          set((s) => {
            const exists = s.doc.subjects.some((x) => x.id === subject.id);
            return {
              doc: {
                ...s.doc,
                subjects: exists
                  ? s.doc.subjects.map((x) => (x.id === subject.id ? subject : x))
                  : [...s.doc.subjects, subject],
              },
              dirty: true,
            };
          }),

        upsertStaff: (staff) =>
          set((s) => {
            const exists = s.doc.staff.some((x) => x.id === staff.id);
            return {
              doc: {
                ...s.doc,
                staff: exists
                  ? s.doc.staff.map((x) => (x.id === staff.id ? staff : x))
                  : [...s.doc.staff, staff],
              },
              dirty: true,
            };
          }),

        setPlanHours: (classId, subjectId, hours) =>
          set((s) => ({
            doc: {
              ...s.doc,
              classes: s.doc.classes.map((c) =>
                c.id === classId ? { ...c, plan: { ...c.plan, [subjectId]: hours } } : c
              ),
            },
            dirty: true,
          })),

        undo: () => {
          const s = get();
          const prev = s.past[s.past.length - 1];
          if (!prev) return;
          set({
            doc: { ...s.doc, placements: prev.placements },
            past: s.past.slice(0, -1),
            future: [{ placements: s.doc.placements }, ...s.future].slice(0, HISTORY_LIMIT),
            dirty: true,
            armed: null,
          });
        },

        redo: () => {
          const s = get();
          const next = s.future[0];
          if (!next) return;
          set({
            doc: { ...s.doc, placements: next.placements },
            past: [...s.past, { placements: s.doc.placements }].slice(-HISTORY_LIMIT),
            future: s.future.slice(1),
            dirty: true,
            armed: null,
          });
        },

        canUndo: () => get().past.length > 0,
        canRedo: () => get().future.length > 0,

        markSaved: (remoteId) => set({ remoteId, dirty: false, savedAt: Date.now() }),
      };
    },
    {
      name: "ustozona-school-timetable-v1",
      /* ⚠️ VERSIYA — demo maʼlumot yoki model oʻzgarganda OSHIRILADI.
         Aks holda brauzerdagi eski hujjat qolib ketadi va foydalanuvchi
         tuzatilgan xatolarni koʻrmaydi. Kuzatilgan holat: demo qayta
         yozilgandan keyin ham eski nusxa (14 oʻqituvchi, 159 ziddiyat,
         44 soat qoldiq) ochilaverardi.

         `migrate` eski qoralamani TASHLAMAYDI — faqat yaratilgan
         demoni yangilaydi. Zavuchning oʻz ishi (`remoteId` bor yoki
         maktab nomi oʻzgartirilgan) saqlanadi. */
      version: 2,
      migrate: (persisted, from) => {
        const p = (persisted ?? {}) as {
          doc?: SchoolTimetableDoc;
          remoteId?: string | null;
          dirty?: boolean;
          savedAt?: number | null;
        };
        if (from >= 2) return p as never;

        const isUntouchedDemo =
          p.remoteId == null && p.doc?.schoolName === "30-umumiy oʻrta taʼlim maktabi";

        return {
          ...p,
          doc: isUntouchedDemo ? emptyDoc() : p.doc,
        } as never;
      },
      /* Tarix saqlanmaydi — u seansga tegishli va hujjatni ikki barobar
         katta qiladi. `armed` ham vaqtinchalik holat. */
      partialize: (s) => ({
        doc: s.doc,
        remoteId: s.remoteId,
        dirty: s.dirty,
        savedAt: s.savedAt,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);

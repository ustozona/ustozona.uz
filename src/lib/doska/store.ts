"use client";

import { create } from "zustand";
import { persist, createJSONStorage, type StateStorage } from "zustand/middleware";

import type { DoskaDeck, DoskaScreen, DoskaWidget, WidgetKind } from "./types";
import { widgetMeta } from "./registry";
import { DEFAULT_BACKGROUND_ID } from "./backgrounds";

/* ════════════════════════════════════════════════════════════════════
   DOSKA STORE — mehmon rejimi (localStorage).

   `/doska` kirmasdan ochiladi: oʻqituvchi darsga kirdi, projektorni
   yoqdi, 3 soniyada taymer kerak (R134). Shu sababli hamma narsa
   avval lokal ishlaydi; server sinxronizatsiyasi keyingi bosqichda
   qoʻshiladi va lokal ekran **serverga koʻchiriladi** — yoʻqolmaydi.

   ⚠️ Kalit prefiksi `murabbiyona-` — mavjud kalitlar bilan izchil
   (brend nomi oʻzgargan, kalitlar ATAYLAB qoldirilgan).
   ════════════════════════════════════════════════════════════════════ */

const STORAGE_KEY = "murabbiyona-doska-v1";

/** Oxirgi oʻzgarishdan keyin diskka yozishni shuncha kutamiz. */
const SAVE_DELAY_MS = 350;

/* ────────────────────────────────────────────────────────────────────
   KECHIKTIRILGAN YOZUV.

   ⚠️ `localStorage.setItem` — SINXRON amal: u asosiy oqimni to'xtatadi.
   Persist esa har `set()` da yozadi, yaʼni tuzatishsiz:

     • har bosilgan harf   → butun deck JSON'ga oʻgiriladi va yoziladi
     • har `pointermove`   → sekundiga 60–120 marta oʻsha ish
     • har `bringToFront`  → yana bir marta

   Sinf ekranida bu «matn kechikib chiqadi, vidjet sudralganda
   tirmalaydi» boʻlib koʻrinadi — va ekran toʻlgani sayin yomonlashadi,
   chunki yozuv hajmi butun deckka bogʻliq.

   Yechim: oxirgi holatni ushlab turamiz va tinchlangach bir marta
   yozamiz. Oraliq holatlarni saqlashning maʼnosi ham yoʻq — vidjet
   sudralayotgan paytdagi 100 ta oraliq koordinata hech kimga kerak
   emas, faqat qoʻyilgan joyi kerak.

   ⚠️ Kutish paytida sahifa yopilishi mumkin, shuning uchun `pagehide`
   va `visibilitychange` da kutmasdan yoziladi — aks holda oʻqituvchi
   yozgan oxirgi jumla yoʻqolardi.
   ──────────────────────────────────────────────────────────────────── */
function deferredLocalStorage(delayMs: number): StateStorage {
  // ⚠️ Birinchi qator ATAYLAB shunday: serverda `localStorage` yoʻq va
  // bu chaqiruv xato beradi. `createJSONStorage` uni ushlaydi va
  // saqlashsiz davom etadi — aynan avvalgi `() => localStorage`
  // xatti-harakati.
  const store = localStorage;

  let timer: ReturnType<typeof setTimeout> | null = null;
  let pending: { name: string; value: string } | null = null;

  const flush = () => {
    if (timer !== null) {
      clearTimeout(timer);
      timer = null;
    }
    if (!pending) return;
    try {
      store.setItem(pending.name, pending.value);
    } catch {
      // Xotira toʻlgan yoki maxfiylik rejimi — ekran baribir
      // ishlayveradi, faqat saqlanmaydi.
    }
    pending = null;
  };

  window.addEventListener("pagehide", flush);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") flush();
  });

  return {
    getItem: (name) => store.getItem(name),
    setItem: (name, value) => {
      pending = { name, value };
      if (timer !== null) clearTimeout(timer);
      timer = setTimeout(flush, delayMs);
    },
    removeItem: (name) => {
      pending = null;
      if (timer !== null) {
        clearTimeout(timer);
        timer = null;
      }
      store.removeItem(name);
    },
  };
}

function newId() {
  return crypto.randomUUID();
}

function emptyScreen(ordinal: number): DoskaScreen {
  return { id: newId(), ordinal, background: DEFAULT_BACKGROUND_ID, widgets: [] };
}

function emptyDeck(): DoskaDeck {
  return {
    id: newId(),
    title: "Ekran",
    screens: [emptyScreen(0)],
    updatedAt: new Date().toISOString(),
  };
}

type DoskaState = {
  deck: DoskaDeck;
  activeScreenId: string;
  /** Tanlangan vidjet — chegara va oʻlcham tutqichlari shunga chiziladi. */
  selectedId: string | null;
  /**
   * Matni tahrirlanayotgan vidjet.
   *
   * ⚠️ Tanlovdan ALOHIDA holat: tanlangan vidjet sudraladi, tahrirdagi
   * vidjet esa yozuvni qabul qiladi va sudralmaydi. Ikkisi bitta
   * maydon boʻlsa, oʻqituvchi matn ichida soʻz belgilamoqchi
   * boʻlganda vidjet joyidan siljib ketardi.
   *
   * Efemer — `partialize` uni saqlamaydi: sahifa yangilanganda
   * kursor ochiq qolgan vidjet boʻlmasin.
   */
  editingId: string | null;
  /** localStorage oʻqilganini bildiradi; render mount-gate uchun. */
  hydrated: boolean;

  addWidget: (kind: WidgetKind, at?: { x: number; y: number }) => void;
  removeWidget: (id: string) => void;
  moveWidget: (id: string, x: number, y: number) => void;
  resizeWidget: (id: string, w: number, h: number, x: number, y: number) => void;
  patchWidgetState: (id: string, patch: Record<string, unknown>) => void;
  select: (id: string | null) => void;
  setEditing: (id: string | null) => void;
  bringToFront: (id: string) => void;

  setBackground: (backgroundId: string) => void;
  renameDeck: (title: string) => void;
  removeScreen: (id: string) => void;
  addScreen: () => void;
  setActiveScreen: (id: string) => void;
  clearScreen: () => void;
};

/** Joriy ekranni topib, uning vidjetlarini oʻzgartiruvchi yordamchi. */
function withActiveScreen(
  deck: DoskaDeck,
  activeScreenId: string,
  fn: (widgets: DoskaWidget[]) => DoskaWidget[],
): DoskaDeck {
  return {
    ...deck,
    screens: deck.screens.map((s) =>
      s.id === activeScreenId ? { ...s, widgets: fn(s.widgets) } : s,
    ),
    updatedAt: new Date().toISOString(),
  };
}

export const useDoskaStore = create<DoskaState>()(
  persist(
    (set, get) => {
      const initialDeck = emptyDeck();

      return {
        deck: initialDeck,
        activeScreenId: initialDeck.screens[0].id,
        selectedId: null,
        editingId: null,
        hydrated: false,

        addWidget: (kind, at) => {
          const meta = widgetMeta(kind);
          const { deck, activeScreenId } = get();
          const screen = deck.screens.find((s) => s.id === activeScreenId);
          const maxZ = screen?.widgets.reduce((m, w) => Math.max(m, w.z), 0) ?? 0;

          const widget: DoskaWidget = {
            id: newId(),
            kind,
            x: at?.x ?? 80 + (screen?.widgets.length ?? 0) * 28,
            y: at?.y ?? 80 + (screen?.widgets.length ?? 0) * 28,
            w: meta.defaultSize.w,
            h: meta.defaultSize.h,
            z: maxZ + 1,
            state: { ...meta.initialState },
          };

          set({
            deck: withActiveScreen(deck, activeScreenId, (ws) => [...ws, widget]),
            selectedId: widget.id,
            // Matn vidjeti darhol yozishga tayyor: oʻqituvchi «Matn»
            // tugmasini bosdi, demak yozmoqchi. Aks holda u qoʻyilgan
            // quti bilan yozish orasida ikkinchi qadam paydo boʻladi
            // va bu dars oʻrtasida sezilarli.
            editingId: meta.editable ? widget.id : null,
          });
        },

        removeWidget: (id) =>
          set((s) => ({
            deck: withActiveScreen(s.deck, s.activeScreenId, (ws) =>
              ws.filter((w) => w.id !== id),
            ),
            selectedId: s.selectedId === id ? null : s.selectedId,
            editingId: s.editingId === id ? null : s.editingId,
          })),

        moveWidget: (id, x, y) =>
          set((s) => ({
            deck: withActiveScreen(s.deck, s.activeScreenId, (ws) =>
              ws.map((w) => (w.id === id ? { ...w, x, y } : w)),
            ),
          })),

        resizeWidget: (id, w, h, x, y) =>
          set((s) => ({
            deck: withActiveScreen(s.deck, s.activeScreenId, (ws) =>
              ws.map((it) => (it.id === id ? { ...it, w, h, x, y } : it)),
            ),
          })),

        patchWidgetState: (id, patch) =>
          set((s) => ({
            deck: withActiveScreen(s.deck, s.activeScreenId, (ws) =>
              ws.map((w) =>
                w.id === id ? { ...w, state: { ...w.state, ...patch } } : w,
              ),
            ),
          })),

        select: (id) => set({ selectedId: id }),

        setEditing: (id) => set({ editingId: id }),

        bringToFront: (id) =>
          set((s) => {
            const screen = s.deck.screens.find((x) => x.id === s.activeScreenId);
            const maxZ = screen?.widgets.reduce((m, w) => Math.max(m, w.z), 0) ?? 0;
            const current = screen?.widgets.find((w) => w.id === id);
            if (!current || current.z === maxZ) return s;

            return {
              deck: withActiveScreen(s.deck, s.activeScreenId, (ws) =>
                ws.map((w) => (w.id === id ? { ...w, z: maxZ + 1 } : w)),
              ),
            };
          }),

        setBackground: (backgroundId) =>
          set((s) => ({
            deck: {
              ...s.deck,
              screens: s.deck.screens.map((x) =>
                x.id === s.activeScreenId ? { ...x, background: backgroundId } : x,
              ),
              updatedAt: new Date().toISOString(),
            },
          })),

        renameDeck: (title) =>
          set((s) => ({
            deck: { ...s.deck, title, updatedAt: new Date().toISOString() },
          })),

        /** Oxirgi ekran oʻchirilmaydi — doska hech qachon boʻsh qolmasin. */
        removeScreen: (id) =>
          set((s) => {
            if (s.deck.screens.length <= 1) return s;

            const rest = s.deck.screens
              .filter((x) => x.id !== id)
              .map((x, i) => ({ ...x, ordinal: i }));

            return {
              deck: { ...s.deck, screens: rest, updatedAt: new Date().toISOString() },
              activeScreenId: s.activeScreenId === id ? rest[0].id : s.activeScreenId,
              selectedId: null,
              editingId: null,
            };
          }),

        addScreen: () =>
          set((s) => {
            const screen = emptyScreen(s.deck.screens.length);
            return {
              deck: {
                ...s.deck,
                screens: [...s.deck.screens, screen],
                updatedAt: new Date().toISOString(),
              },
              activeScreenId: screen.id,
              selectedId: null,
              editingId: null,
            };
          }),

        setActiveScreen: (id) =>
          set({ activeScreenId: id, selectedId: null, editingId: null }),

        clearScreen: () =>
          set((s) => ({
            deck: withActiveScreen(s.deck, s.activeScreenId, () => []),
            selectedId: null,
            editingId: null,
          })),
      };
    },
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => deferredLocalStorage(SAVE_DELAY_MS)),
      partialize: (s) => ({ deck: s.deck, activeScreenId: s.activeScreenId }),
      onRehydrateStorage: () => (state) => {
        if (state) state.hydrated = true;
      },
    },
  ),
);

/** Joriy ekran — komponentlar shu selektor orqali oʻqiydi. */
export function useActiveScreen(): DoskaScreen | undefined {
  return useDoskaStore((s) => s.deck.screens.find((x) => x.id === s.activeScreenId));
}

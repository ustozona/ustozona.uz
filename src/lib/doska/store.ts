"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

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
  /** localStorage oʻqilganini bildiradi; render mount-gate uchun. */
  hydrated: boolean;

  addWidget: (kind: WidgetKind, at?: { x: number; y: number }) => void;
  removeWidget: (id: string) => void;
  moveWidget: (id: string, x: number, y: number) => void;
  resizeWidget: (id: string, w: number, h: number, x: number, y: number) => void;
  patchWidgetState: (id: string, patch: Record<string, unknown>) => void;
  select: (id: string | null) => void;
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
          });
        },

        removeWidget: (id) =>
          set((s) => ({
            deck: withActiveScreen(s.deck, s.activeScreenId, (ws) =>
              ws.filter((w) => w.id !== id),
            ),
            selectedId: s.selectedId === id ? null : s.selectedId,
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
            };
          }),

        setActiveScreen: (id) => set({ activeScreenId: id, selectedId: null }),

        clearScreen: () =>
          set((s) => ({
            deck: withActiveScreen(s.deck, s.activeScreenId, () => []),
            selectedId: null,
          })),
      };
    },
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
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

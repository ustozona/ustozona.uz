"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

import type { WidgetKind } from "./types";
import { TOOL_ORDER } from "./registry";

/* ════════════════════════════════════════════════════════════════════
   DOSKA SOZLAMALARI — oʻqituvchining koʻrinish tanlovi.

   Uch narsa (docs/doska-ux-tadqiqot.md Q1, Q3, §3 «Topish»):
     • uslub      — Sokin / Oʻyinchoq / Doska (faqat token qatlami);
     • panel joyi — past / chap / oʻng;
     • paneldagi vositalar — oʻqituvchi tuzadi, qolgani «Hammasi»da.

   ⚠️ Ekranlar storeʼidan (`store.ts`) ATAYLAB ALOHIDA:
     • bu toʻplamga emas, OʻQITUVCHIGA tegishli — yangi toʻplam ochilsa
       ham uslub oʻzgarmaydi; ekranlar serverga koʻchganda ham bu
       oʻqituvchi sozlamasi boʻlib qoladi;
     • qaytarish tarixiga kirmaydi — «Ctrl+Z» uslubni orqaga qaytarsa
       oʻqituvchi nima boʻlganini tushunmaydi.

   ⚠️ `skipHydration`: sozlama `localStorage` dan faqat MOUNTDAN KEYIN
   oʻqiladi (`DoskaShell`, `useLayoutEffect` — birinchi chizishdan
   oldin). Aks holda birinchi render server HTMLʼidan farq qiladi va
   React atributni tuzatmay qoldiradi — oʻqituvchi «Oʻyinchoq» tanlagan
   boʻlsa ham panel «Sokin» boʻlib qolardi. Oʻqilguncha boshqaruv
   chizilmaydi.
   ════════════════════════════════════════════════════════════════════ */

/** Kalit prefiksi — `store.ts` dagi kabi, mavjud kalitlar bilan izchil. */
const STORAGE_KEY = "murabbiyona-doska-prefs-v1";

export const DOSKA_STYLES = ["sokin", "oyinchoq", "doska"] as const;
export type DoskaStyle = (typeof DOSKA_STYLES)[number];

/**
 * Standart — Sokin. Foydalanuvchilarning 5% dan kami sozlamani
 * oʻzgartiradi (R329): 95% oʻqituvchi aynan shuni koʻradi, shuning uchun
 * u proyektorda eng aniq variant.
 */
export const DEFAULT_STYLE: DoskaStyle = "sokin";

export const DOCK_SIDES = ["bottom", "left", "right", "both"] as const;
export type DockSide = (typeof DOCK_SIDES)[number];

/**
 * Panelda bir vaqtda turadigan vositalar chegarasi. Koʻproq boʻlsa panel
 * 75″ doskada ham bir qarashda oʻqilmaydi (§3 «Topish»); qolgani
 * «Hammasi» oynasida.
 */
export const MAX_PINNED_TOOLS = 9;

type PrefsState = {
  style: DoskaStyle;
  dock: DockSide;
  /**
   * Paneldagi vositalar. `null` — oʻqituvchi hali tuzmagan, standart
   * roʻyxat (`DEFAULT_TOOLS`) koʻrinadi.
   */
  tools: WidgetKind[] | null;
  /**
   * Har vidjet turi uchun oxirgi sozlama (`WidgetMeta.remember`, R422).
   * Toʻplamga emas, oʻqituvchiga tegishli — shuning uchun shu yerda.
   */
  lastState: Partial<Record<WidgetKind, Record<string, unknown>>>;
  hydrated: boolean;

  setStyle: (style: DoskaStyle) => void;
  setDock: (dock: DockSide) => void;
  /** Vositani panelga qoʻshadi yoki olib tashlaydi. Chegaraga yetsa — rad. */
  togglePinned: (kind: WidgetKind) => void;
  rememberState: (kind: WidgetKind, values: Record<string, unknown>) => void;
};

export const useDoskaPrefs = create<PrefsState>()(
  persist(
    (set, get) => ({
      style: DEFAULT_STYLE,
      dock: "bottom",
      tools: null,
      lastState: {},
      hydrated: false,

      setStyle: (style) => set({ style }),
      setDock: (dock) => set({ dock }),
      rememberState: (kind, values) =>
        set((s) => ({ lastState: { ...s.lastState, [kind]: { ...s.lastState[kind], ...values } } })),
      togglePinned: (kind) => {
        const current = pinnedTools(get().tools);
        if (current.includes(kind)) {
          set({ tools: current.filter((k) => k !== kind) });
          return;
        }
        if (current.length >= MAX_PINNED_TOOLS) return;
        // Panel tartibi doim `TOOL_ORDER` boʻyicha — qoʻshilgan vosita
        // oxiriga emas, oʻz joyiga tushadi. Aks holda ikki oʻqituvchining
        // paneli bir xil vositalar bilan har xil tartibda boʻlardi.
        const next = new Set([...current, kind]);
        set({ tools: TOOL_ORDER.filter((k) => next.has(k)) });
      },
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ style: s.style, dock: s.dock, tools: s.tools, lastState: s.lastState }),
      // Eski yoki buzilgan yozuv (masalan olib tashlangan uslub nomi)
      // standartga qaytadi — notanish qiymat bilan panel chizilmaydi.
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<PrefsState>;
        return {
          ...current,
          style: DOSKA_STYLES.includes(p.style as DoskaStyle) ? (p.style as DoskaStyle) : current.style,
          dock: DOCK_SIDES.includes(p.dock as DockSide) ? (p.dock as DockSide) : current.dock,
          tools: Array.isArray(p.tools)
            ? TOOL_ORDER.filter((k) => (p.tools as string[]).includes(k)).slice(0, MAX_PINNED_TOOLS)
            : null,
          lastState:
            p.lastState && typeof p.lastState === "object" && !Array.isArray(p.lastState) ? p.lastState : {},
        };
      },
      skipHydration: true,
      onRehydrateStorage: () => () => {
        useDoskaPrefs.setState({ hydrated: true });
      },
    },
  ),
);

/**
 * Panelni tuzmagan oʻqituvchining standart vositalari — sinfni
 * boshqarishda eng koʻp kerak boʻladiganlari (vaqt, jadval, eʼtibor,
 * tasodif, ovoz berish, yozuv). Qolgani «Hammasi» oynasida.
 *
 * Ilgari standart `TOOL_ORDER` ning oʻzi edi. Vositalar 24 taga yetgach
 * panel ekranga sigʻmay qoldi va gorizontal aylanadigan boʻldi —
 * referensdagidek (docs/doska-referens-koriklari.md §4) panel bir qarashda
 * oʻqiladigan 8 ta vosita bilan chiqadi. Chegara (`MAX_PINNED_TOOLS`) 9 —
 * bitta joy boʻsh: oʻqituvchi «Hammasi» dan birinchi vositasini hech
 * narsani olib tashlamasdan qadaydi.
 */
export const DEFAULT_TOOLS: readonly WidgetKind[] = [
  "clock.v1",
  "timer.v1",
  "today.v1",
  "traffic-light.v1",
  "wheel.v1",
  "poll.v1",
  "text.v1",
  "card.v1",
];

/** Paneldagi vositalar, doim `TOOL_ORDER` tartibida. */
export function pinnedTools(tools: WidgetKind[] | null): WidgetKind[] {
  const list = tools ?? DEFAULT_TOOLS;
  return TOOL_ORDER.filter((k) => list.includes(k));
}

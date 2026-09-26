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

export const DOCK_SIDES = ["bottom", "left", "right"] as const;
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
   * roʻyxat (`TOOL_ORDER`) koʻrinadi. Shunda keyin qoʻshilgan yangi
   * vosita tuzmagan oʻqituvchining paneliga oʻzi chiqadi.
   */
  tools: WidgetKind[] | null;
  hydrated: boolean;

  setStyle: (style: DoskaStyle) => void;
  setDock: (dock: DockSide) => void;
  /** Vositani panelga qoʻshadi yoki olib tashlaydi. Chegaraga yetsa — rad. */
  togglePinned: (kind: WidgetKind) => void;
};

export const useDoskaPrefs = create<PrefsState>()(
  persist(
    (set, get) => ({
      style: DEFAULT_STYLE,
      dock: "bottom",
      tools: null,
      hydrated: false,

      setStyle: (style) => set({ style }),
      setDock: (dock) => set({ dock }),
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
      partialize: (s) => ({ style: s.style, dock: s.dock, tools: s.tools }),
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
 * Paneldagi vositalar. Tuzilmagan boʻlsa — `TOOL_ORDER` toʻliq: bugungi
 * panel bilan bir xil, yangilanishdan keyin oʻqituvchi tanish
 * vositalarini oʻz joyida topadi.
 */
export function pinnedTools(tools: WidgetKind[] | null): WidgetKind[] {
  return tools ?? TOOL_ORDER;
}

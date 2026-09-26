"use client";

import * as React from "react";

import type { DockSide } from "@/lib/doska/prefs";

/* ════════════════════════════════════════════════════════════════════
   PANEL JOYI — vidjet paneli qayerda turibdi va oynalari qayerga ochiladi.

   «Panel joyi: past / chap / oʻng» (docs/doska-ux-tadqiqot.md Q3) faqat
   JOYLASHUVNI oʻzgartiradi: tugmalar, tartib va xatti-harakat bir xil.
   Yon relsa interaktiv panelda oʻqituvchi yonida turib ishlashi uchun —
   qoʻli mazmunni yopmaydi va relsa oʻrtadan pastda, yetish zonasida.

   Kontekst — paneldagi tugmalar («Shakl», «Fon», «Hammasi») oʻz oynasini
   panel TOMONIDAN ochsin: pastki panelda tepaga, chap relsada oʻngga.
   Aks holda chap relsadan ochilgan oyna ekran chetidan chiqib ketardi.
   ════════════════════════════════════════════════════════════════════ */

export type DockLayout = {
  orientation: "horizontal" | "vertical";
  /** Paneldan ochiladigan oynaning tomoni (Radix `side`). */
  side: "top" | "left" | "right";
};

/**
 * Modul darajasidagi obyektlar — `DockContext` qiymati har renderda
 * yangi boʻlmasin: aks holda `DoskaShell` har yangilanganda panel
 * tugmalari va oynalari ham bekorga qayta chiziladi.
 */
const LAYOUTS: Record<DockSide, DockLayout> = {
  left: { orientation: "vertical", side: "right" },
  right: { orientation: "vertical", side: "left" },
  bottom: { orientation: "horizontal", side: "top" },
};

export function dockLayout(dock: DockSide): DockLayout {
  return LAYOUTS[dock];
}

export const DockContext = React.createContext<DockLayout>(dockLayout("bottom"));

export function useDockLayout(): DockLayout {
  return React.useContext(DockContext);
}

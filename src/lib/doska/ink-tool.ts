"use client";

import { create } from "zustand";

import {
  DEFAULT_INK_SIZE,
  DEFAULT_MARKER_COLOR,
  DEFAULT_PEN_COLOR,
  type InkSize,
  type MarkerColor,
  type PenColor,
} from "./ink";
import type { InkTool } from "./types";
import { useDoskaStore } from "./store";

/* ════════════════════════════════════════════════════════════════════
   QOʻLYOZMA ASBOBI — hozir qaysi rejim, qaysi rang, qaysi qalinlik.

   ⚠️ Ekranlar storeʼidan (`store.ts`) ALOHIDA va SAQLANMAYDI:
     • bu ekran mazmuni emas — «Ctrl+Z» asbobni orqaga qaytarmasin;
     • rejim dars paytiga tegishli: sahifa yangilanganda doska oddiy
       (tanlash) holatida ochiladi, oʻqituvchi taymerni darhol bosa oladi.

   REJIMLAR (docs/doska-qolyozma-tadqiqot.md §4.2):
     • `mode === null` — tanlash: vidjetlar odatdagidek ishlaydi;
     • `pen` / `marker` / `eraser` — butun ekran yozuv sirti.

   «FAQAT QALAM» (`penOnly`, R333): qalam yozish rejimida birinchi marta
   yozganda yoqiladi — shundan keyin faqat QALAM yozadi, kaft va barmoq
   chiziq qoldirmaydi, barmoq esa vidjetlarni boshqaraveradi (taymerni
   bosadi). Qalami yoʻq qurilmada (koʻp infraqizil panel qalamni ham
   barmoq deb yuboradi — R332) hamma teginish yozadi.

   ⚠️ Rejim QAYTA OʻCHIRILADI: qalam koʻrilgach siyoh panelida «Faqat
   qalam» tugmasi chiqadi (`penSeen`). Busiz qalamni bir marta ishlatgan
   oʻqituvchi barmoq bilan yoza olmay qolardi va sababini bilmasdi.
   Qalam tanlash rejimida tugma bosishi hisobga olinmaydi — faqat yozish.
   ════════════════════════════════════════════════════════════════════ */

export type InkMode = InkTool | "eraser";

type InkToolState = {
  mode: InkMode | null;
  /** Oxirgi yozuvchi asbob — oʻchirgichdan rang bosilganda shunga qaytadi. */
  lastTool: InkTool;
  penColor: PenColor;
  markerColor: MarkerColor;
  penSize: InkSize;
  markerSize: InkSize;
  eraserSize: InkSize;
  /** Shu sessiyada qalam yozdi — «Faqat qalam» tugmasi koʻrinadi. */
  penSeen: boolean;
  /** Faqat qalam yozadi, barmoq va kaft — yoʻq. */
  penOnly: boolean;

  /** `null` — tanlash rejimiga qaytish. */
  setMode: (mode: InkMode | null) => void;
  /** Rangni tanlaydi; oʻchirgichda turgan boʻlsa oxirgi asbobga qaytadi. */
  setColor: (color: string) => void;
  /** Joriy asbobning qalinligi. */
  setSize: (size: InkSize) => void;
  /** Qalam yozdi: birinchi marta boʻlsa «Faqat qalam» yoqiladi. */
  markPenSeen: () => void;
  togglePenOnly: () => void;
};

export const useInkTool = create<InkToolState>()((set, get) => ({
  mode: null,
  lastTool: "pen",
  penColor: DEFAULT_PEN_COLOR,
  markerColor: DEFAULT_MARKER_COLOR,
  penSize: DEFAULT_INK_SIZE,
  markerSize: DEFAULT_INK_SIZE,
  eraserSize: DEFAULT_INK_SIZE,
  penSeen: false,
  penOnly: false,

  setMode: (mode) => {
    if (mode !== null && get().mode === null) {
      // Yozishga oʻtildi — tanlov, tahrir va sozlama kartasi yopiladi:
      // yozuv ostida ochiq qolgan kontekst panel sinfga ham, yozuvga ham
      // xalaqit beradi.
      const doska = useDoskaStore.getState();
      doska.select(null);
      doska.setEditing(null);
      doska.closeSettings();
    }
    set((s) => ({
      mode,
      lastTool: mode === "pen" || mode === "marker" ? mode : s.lastTool,
    }));
  },

  setColor: (color) =>
    set((s) => {
      const tool = s.mode === "pen" || s.mode === "marker" ? s.mode : s.lastTool;
      return tool === "marker"
        ? { markerColor: color as MarkerColor, mode: "marker", lastTool: "marker" }
        : { penColor: color as PenColor, mode: "pen", lastTool: "pen" };
    }),

  setSize: (size) =>
    set((s) => {
      const mode = s.mode ?? s.lastTool;
      if (mode === "eraser") return { eraserSize: size };
      return mode === "marker" ? { markerSize: size } : { penSize: size };
    }),

  markPenSeen: () => {
    if (!get().penSeen) set({ penSeen: true, penOnly: true });
  },

  togglePenOnly: () => set((s) => ({ penOnly: !s.penOnly })),
}));

/** Joriy asbobning qalinligi — panel tugmalari va kursor uchun. */
export function currentSize(s: InkToolState): InkSize {
  const mode = s.mode ?? s.lastTool;
  if (mode === "eraser") return s.eraserSize;
  return mode === "marker" ? s.markerSize : s.penSize;
}

"use client";

import { create } from "zustand";

import {
  DEFAULT_INK_SIZE,
  DEFAULT_MARKER_COLOR,
  DEFAULT_PEN_COLOR,
  MARKER_COLORS,
  PEN_COLORS,
  visibleInk,
  type InkSize,
  type MarkerColor,
  type PenColor,
  type PlacedStroke,
} from "./ink";
import { PROTRACTOR_RADIUS, clampGuidePose, type GuideKind, type GuidePose } from "./guides";
import type { InkStroke, InkTool } from "./types";
import { getActiveScreen, useDoskaStore } from "./store";

/* ════════════════════════════════════════════════════════════════════
   QOʻLYOZMA ASBOBI — hozir qaysi rejim, qaysi rang, qaysi qalinlik.

   ⚠️ Ekranlar storeʼidan (`store.ts`) ALOHIDA va SAQLANMAYDI:
     • bu ekran mazmuni emas — «Ctrl+Z» asbobni orqaga qaytarmasin;
     • rejim dars paytiga tegishli: sahifa yangilanganda doska oddiy
       (tanlash) holatida ochiladi, oʻqituvchi taymerni darhol bosa oladi.

   REJIMLAR (docs/doska-qolyozma-tadqiqot.md §4.2):
     • `mode === null` — tanlash: vidjetlar odatdagidek ishlaydi;
     • `pen` / `marker` / `eraser` — butun ekran yozuv sirti;
     • `laser` — koʻrsatkich: iz soʻnadi, hech narsa saqlanmaydi (R335);
     • `lasso` — yozuvni halqa bilan belgilash (`selection`): surish,
       rang, qalinlik, oʻchirish (3-bosqich).

   CHIZGʻICH VA TRANSPORTIR (`ruler`, `protractor`, lib/doska/guides.ts)
   — yozish rejimidagi yordamchi asboblar. Rejimdan chiqilsa yashirinadi,
   qaytilsa oʻsha joyida chiqadi.

   OʻCHIRGʻICH ikki xil (R334): butun chiziq (standart — sinfda eng koʻp
   kerak) va qisman (`eraserPartial`) — faqat tekkan joy kesiladi.

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

export type InkMode = InkTool | "eraser" | "laser" | "lasso";

type InkToolState = {
  mode: InkMode | null;
  /** Oxirgi yozuvchi asbob — oʻchirgichdan rang bosilganda shunga qaytadi. */
  lastTool: InkTool;
  penColor: PenColor;
  markerColor: MarkerColor;
  penSize: InkSize;
  markerSize: InkSize;
  eraserSize: InkSize;
  /** Oʻchirgʻich faqat tekkan joyni kesadi — butun chiziqni emas. */
  eraserPartial: boolean;
  /** Shu sessiyada qalam yozdi — «Faqat qalam» tugmasi koʻrinadi. */
  penSeen: boolean;
  /** Faqat qalam yozadi, barmoq va kaft — yoʻq. */
  penOnly: boolean;
  /**
   * Lasso bilan belgilangan chiziqlar (`id`). Joriy ekrandagi KOʻRINIB
   * turgan chiziqlar bilan kesishtirib oʻqiladi (`selectedInk`):
   * «Qaytarish» chiziqni olib tashlasa yoki slayd almashsa, eski `id`
   * shunchaki hech narsaga tegmaydi.
   */
  selection: string[];
  ruler: GuidePose | null;
  protractor: GuidePose | null;

  /** `null` — tanlash rejimiga qaytish. */
  setMode: (mode: InkMode | null) => void;
  /** Rangni tanlaydi; oʻchirgichda turgan boʻlsa oxirgi asbobga qaytadi. */
  setColor: (color: string) => void;
  /** Joriy asbobning qalinligi. */
  setSize: (size: InkSize) => void;
  /** Qalam yozdi: birinchi marta boʻlsa «Faqat qalam» yoqiladi. */
  markPenSeen: () => void;
  togglePenOnly: () => void;
  toggleEraserPartial: () => void;
  setSelection: (ids: string[]) => void;
  /** Asbobni koʻrsatadi (oyna oʻrtasida) yoki yashiradi. */
  toggleGuide: (kind: GuideKind) => void;
  setGuidePose: (kind: GuideKind, pose: GuidePose) => void;
};

export const useInkTool = create<InkToolState>()((set, get) => ({
  mode: null,
  lastTool: "pen",
  penColor: DEFAULT_PEN_COLOR,
  markerColor: DEFAULT_MARKER_COLOR,
  penSize: DEFAULT_INK_SIZE,
  markerSize: DEFAULT_INK_SIZE,
  eraserSize: DEFAULT_INK_SIZE,
  eraserPartial: false,
  penSeen: false,
  penOnly: false,
  selection: [],
  ruler: null,
  protractor: null,

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
      // Belgilash faqat lasso rejimida yashaydi.
      selection: mode === "lasso" ? s.selection : [],
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
      const mode = sizedTool(s);
      if (mode === "eraser") return { eraserSize: size };
      return mode === "marker" ? { markerSize: size } : { penSize: size };
    }),

  markPenSeen: () => {
    if (!get().penSeen) set({ penSeen: true, penOnly: true });
  },

  togglePenOnly: () => set((s) => ({ penOnly: !s.penOnly })),

  toggleEraserPartial: () => set((s) => ({ eraserPartial: !s.eraserPartial })),

  setSelection: (ids) => set((s) => (ids.length === 0 && s.selection.length === 0 ? s : { selection: ids })),

  toggleGuide: (kind) =>
    set((s) => {
      if (s[kind]) return { [kind]: null };
      // Kanvas oʻrtasida (holat kanvas koordinatasida, oyna emas — panel
      // chapda boʻlsa ham): chizgʻich yuqoriroqda, transportir uning
      // ostida — ikkalasi birga ochilsa ustma-ust tushmasin.
      const { w, h } = canvasSize();
      const y = h * 0.35;
      const pose = { x: w / 2, y: kind === "ruler" ? y : y + 60 + PROTRACTOR_RADIUS, angle: 0 };
      return { [kind]: clampGuidePose(pose, w, h) };
    }),

  setGuidePose: (kind, pose) => set({ [kind]: pose }),
}));

/** Kanvas ildizining oʻlchami (`data-doska-canvas`); topilmasa — oyna. */
export function canvasSize(): { w: number; h: number } {
  const root = document.querySelector<HTMLElement>("[data-doska-canvas]");
  return root ? { w: root.clientWidth, h: root.clientHeight } : { w: window.innerWidth, h: window.innerHeight };
}

/** Qalinligi bor asbob: oʻchirgʻich yoki yozuvchi; lazer, lasso va tanlashda — oxirgi yozuvchi. */
function sizedTool(s: InkToolState): InkTool | "eraser" {
  return s.mode === "pen" || s.mode === "marker" || s.mode === "eraser" ? s.mode : s.lastTool;
}

/** Joriy asbobning qalinligi — panel tugmalari va kursor uchun. */
export function currentSize(s: InkToolState): InkSize {
  const mode = sizedTool(s);
  if (mode === "eraser") return s.eraserSize;
  return mode === "marker" ? s.markerSize : s.penSize;
}

/* ── Belgilangan yozuv ustidagi amallar ──────────────────────────────

   Har amal tarixda BITTA qadam va faqat haqiqatan oʻzgargan chiziqqa
   tegadi: rangi allaqachon qizil chiziqni «qizil» qilish tarixga bekor
   qadam qoʻshmaydi. Chiziq `id` si saqlanadi — belgilash amaldan keyin
   ham turadi, oʻqituvchi rangni ketma-ket almashtira oladi.
   ──────────────────────────────────────────────────────────────────── */

/** Belgilangan va hozir koʻrinib turgan chiziqlar. */
export function selectedInk(placed: readonly PlacedStroke[], ids: readonly string[]): PlacedStroke[] {
  if (!ids.length) return [];
  const set = new Set(ids);
  return placed.filter((p) => set.has(p.stroke.id));
}

/**
 * Koʻrinib turgan belgilash bormi. Xom `selection` emas: «Qaytarish»
 * chiziqni olib tashlasa yoki slayd almashsa eski `id` lar qoladi —
 * `Esc` va `Delete` ularga bosishni sarflamasin.
 */
export function hasVisibleSelection(): boolean {
  return selectedInk(visibleInk(getActiveScreen()), useInkTool.getState().selection).length > 0;
}

/** `fn` chiziqning yangi holatini qaytaradi: oʻzi — oʻzgarmadi, `null` — oʻchirilsin. */
function applyToSelection(fn: (p: PlacedStroke) => InkStroke | null): void {
  const changes = new Map<string, InkStroke[]>();
  for (const p of selectedInk(visibleInk(getActiveScreen()), useInkTool.getState().selection)) {
    const next = fn(p);
    if (next !== p.stroke) changes.set(p.stroke.id, next ? [next] : []);
  }
  if (!changes.size) return;
  const doska = useDoskaStore.getState();
  doska.beginGesture();
  doska.replaceStrokes(changes);
}

/** Palitra kaliti shu asbobda bormi — marker «qizil» boʻlmaydi. */
export function colorFits(tool: InkTool, color: string): boolean {
  return ((tool === "marker" ? MARKER_COLORS : PEN_COLORS) as readonly string[]).includes(color);
}

/**
 * Rang palitrada bor chiziqlarga qoʻllanadi: qalam va marker birga
 * belgilangan boʻlsa, «qizil» faqat qalamga tushadi — marker palitrasida
 * qizil yoʻq.
 */
export function recolorSelection(color: string): void {
  applyToSelection(({ stroke }) =>
    stroke.color !== color && colorFits(stroke.tool, color) ? { ...stroke, color } : stroke,
  );
}

export function resizeSelection(size: InkSize): void {
  applyToSelection(({ stroke }) => (stroke.size !== size ? { ...stroke, size } : stroke));
}

export function deleteSelection(): void {
  applyToSelection(() => null);
  useInkTool.getState().setSelection([]);
}

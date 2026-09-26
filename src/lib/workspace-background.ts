import type { CSSProperties } from "react";
import type { WorkspaceBackground as BgKind } from "@/store/useSettingsStore";

/* ════════════════════════════════════════════════════════════════════
   ISHCHI MAYDON FONI — SOF hisob, React va store'siz.

   Ilgari bu mantiq `components/WorkspaceBackground.tsx` ichida edi va u
   `useSettingsStore` ni ishga tushiradigan client komponenti. Shu sababli
   `/jadval` undan foydalana olmasdi: ost-loyiha dashboard store'lariga
   BOGʻLANMAYDI (docs/dars-jadvali-spec.md §9), demak fon ham yetib
   bormasdi va sahifa oq fonda oq kartalar boʻlib qolgandi.

   Endi naqsh hisobi shu yerda — dashboard uni store bilan, `/jadval` esa
   qatʼiy qiymat bilan chaqiradi. Ikkalasi bir xil funksiyadan chiqadi,
   demak fon ikkala mahsulotda AYNAN bir xil koʻrinadi.

   ⚠️ Tip import'i `import type` — kompilyatsiyada oʻchadi, store bundle'ga
   tortilmaydi. Bu fayl React'ga ham bogʻlanmaydi (faqat `CSSProperties`).
   ════════════════════════════════════════════════════════════════════ */

/** Monoxrom SVG naqsh — data-URI, `size`ga mos tile. */
function svgPattern(size: number, inner: string): string {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='${size}' height='${size}'>${inner}</svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}

export function backgroundStyle(
  kind: BgKind,
  dark: boolean,
  scalePercent: number
): CSSProperties {
  const f = scalePercent / 100;
  const lineColor = dark ? "#fff" : "#000";
  const lineOpacity = dark ? 0.12 : 0.1;

  switch (kind) {
    case "parchment": {
      const s = Math.round(14 * f);
      return {
        backgroundColor: dark ? "oklch(0.205 0 0)" : "oklch(0.97 0 0)",
        backgroundImage: dark
          ? `radial-gradient(rgba(255,255,255,0.09) 1px, transparent 1px)`
          : `radial-gradient(rgba(0,0,0,0.09) 1px, transparent 1px)`,
        backgroundSize: `${s}px ${s}px`,
      };
    }
    case "stripes": {
      const dash = Math.round(11 * f);
      return {
        backgroundColor: dark ? "oklch(0.205 0 0)" : "oklch(0.97 0 0)",
        backgroundImage: dark
          ? `repeating-linear-gradient(45deg, rgba(255,255,255,0.045) 0, rgba(255,255,255,0.045) 1px, transparent 1px, transparent ${dash}px)`
          : `repeating-linear-gradient(45deg, rgba(0,0,0,0.035) 0, rgba(0,0,0,0.035) 1px, transparent 1px, transparent ${dash}px)`,
      };
    }
    case "plain":
      return { backgroundColor: dark ? "oklch(0.205 0 0)" : "oklch(0.97 0 0)" };
    case "checker": {
      const s = Math.round(24 * f);
      const h = s / 2;
      return {
        backgroundColor: dark ? "oklch(0.205 0 0)" : "oklch(0.97 0 0)",
        backgroundImage: dark
          ? `repeating-linear-gradient(45deg, rgba(255,255,255,0.035) 25%, transparent 25%, transparent 75%, rgba(255,255,255,0.035) 75%, rgba(255,255,255,0.035)), repeating-linear-gradient(45deg, rgba(255,255,255,0.035) 25%, transparent 25%, transparent 75%, rgba(255,255,255,0.035) 75%, rgba(255,255,255,0.035))`
          : `repeating-linear-gradient(45deg, rgba(0,0,0,0.025) 25%, transparent 25%, transparent 75%, rgba(0,0,0,0.025) 75%, rgba(0,0,0,0.025)), repeating-linear-gradient(45deg, rgba(0,0,0,0.025) 25%, transparent 25%, transparent 75%, rgba(0,0,0,0.025) 75%, rgba(0,0,0,0.025))`,
        backgroundPosition: `0 0, ${h}px ${h}px`,
        backgroundSize: `${s}px ${s}px`,
      };
    }
    case "lined": {
      const s = Math.round(28 * f);
      return {
        backgroundColor: dark ? "oklch(0.205 0 0)" : "oklch(0.97 0 0)",
        backgroundImage: dark
          ? `linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px)`
          : `linear-gradient(rgba(0,0,0,0.08) 1px, transparent 1px)`,
        backgroundSize: `100% ${s}px`,
      };
    }
    case "graphDashed": {
      const s = Math.round(24 * f);
      return {
        backgroundColor: dark ? "oklch(0.205 0 0)" : "oklch(0.97 0 0)",
        backgroundImage: svgPattern(
          s,
          `<path d='M ${s} 0 L 0 0 0 ${s}' fill='none' stroke='${lineColor}' stroke-opacity='${lineOpacity}' stroke-width='1' stroke-dasharray='3 3'/>`
        ),
        backgroundSize: `${s}px ${s}px`,
      };
    }
    case "graph45": {
      const s = Math.round(12 * f);
      return {
        backgroundColor: dark ? "oklch(0.205 0 0)" : "oklch(0.97 0 0)",
        backgroundImage: dark
          ? `repeating-linear-gradient(45deg, rgba(255,255,255,0.06) 0 1px, transparent 1px ${s}px), repeating-linear-gradient(135deg, rgba(255,255,255,0.06) 0 1px, transparent 1px ${s}px)`
          : `repeating-linear-gradient(45deg, rgba(0,0,0,0.05) 0 1px, transparent 1px ${s}px), repeating-linear-gradient(135deg, rgba(0,0,0,0.05) 0 1px, transparent 1px ${s}px)`,
      };
    }
    case "circuit": {
      const s = Math.round(32 * f);
      const half = s / 2;
      return {
        backgroundColor: dark ? "oklch(0.205 0 0)" : "oklch(0.97 0 0)",
        backgroundImage: svgPattern(
          s,
          `<path d='M ${half} 0 V ${s} M 0 ${half} H ${s}' stroke='${lineColor}' stroke-opacity='${lineOpacity}' stroke-width='1'/>` +
            `<circle cx='${half}' cy='${half}' r='2' fill='${lineColor}' fill-opacity='${lineOpacity + 0.06}'/>`
        ),
        backgroundSize: `${s}px ${s}px`,
      };
    }
    case "grid":
    default: {
      const s = Math.round(24 * f);
      return {
        backgroundColor: dark ? "oklch(0.205 0 0)" : "oklch(0.97 0 0)",
        backgroundImage: dark
          ? `linear-gradient(rgba(255,255,255,0.055) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.055) 1px, transparent 1px)`
          : `linear-gradient(rgba(0,0,0,0.09) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.09) 1px, transparent 1px)`,
        backgroundSize: `${s}px ${s}px`,
      };
    }
  }
}

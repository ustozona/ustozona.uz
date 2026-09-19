/* ════════════════════════════════════════════════════════════════════
   LANDING BOʻLIM RANGLARI — yagona manba.

   Har mahsulot/boʻlimning oʻz rangi bor: ikonka qutisi, yorliq, havola,
   karta hoveri va vizual namuna foni shu yerdan olinadi. Ranglar header
   menyusidagi `PRODUCT_ICON_STYLE` bilan bir xil (baholash — binafsha,
   doska — zumrad, blog — kulrang); jurnal — brend sarigʻi, taqdimot —
   toʻq sariq (mahsulot kartasi yoʻq, lekin landingda alohida boʻlim).

   Nega xom Tailwind palitrasi, token emas: bu marketing qatlamining
   ongli qarori (2026-09-19, docs/landing-design.md §1). Kontent
   yuzalari (karta foni, matn) baribir tokenda qoladi — rang faqat
   urgʻu: ikonka, yorliq, chiziq.
   ════════════════════════════════════════════════════════════════════ */

export type LandingTone = "jurnal" | "baholash" | "taqdimot" | "doska" | "blog";

type ToneClasses = {
  /** Ikonka qutisi va rangli yorliq (badge). */
  soft: string;
  /** Havola / urgʻu matni. */
  text: string;
  /** Karta chegarasi hoverda. */
  hoverBorder: string;
  /** Vizual namuna (mock) orqa foni. */
  tint: string;
  /** Toʻyingan rang — mock ichidagi urgʻu elementlari. */
  solid: string;
};

export const LANDING_TONES: Record<LandingTone, ToneClasses> = {
  jurnal: {
    soft: "bg-[#FBC02D]/15 text-[#7a5c00] dark:text-[#FBC02D]",
    text: "text-[#7a5c00] dark:text-[#FBC02D]",
    hoverBorder: "hover:border-[#FBC02D]/60",
    tint: "bg-[#FBC02D]/10",
    solid: "bg-[#FBC02D]",
  },
  baholash: {
    soft: "bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-400",
    text: "text-violet-700 dark:text-violet-400",
    hoverBorder: "hover:border-violet-300 dark:hover:border-violet-500/40",
    tint: "bg-violet-50 dark:bg-violet-500/10",
    solid: "bg-violet-500",
  },
  taqdimot: {
    soft: "bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-400",
    text: "text-orange-700 dark:text-orange-400",
    hoverBorder: "hover:border-orange-300 dark:hover:border-orange-500/40",
    tint: "bg-orange-50 dark:bg-orange-500/10",
    solid: "bg-orange-500",
  },
  doska: {
    soft: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400",
    text: "text-emerald-700 dark:text-emerald-400",
    hoverBorder: "hover:border-emerald-300 dark:hover:border-emerald-500/40",
    tint: "bg-emerald-50 dark:bg-emerald-500/10",
    solid: "bg-emerald-500",
  },
  blog: {
    soft: "bg-slate-100 text-slate-700 dark:bg-slate-500/15 dark:text-slate-300",
    text: "text-slate-700 dark:text-slate-300",
    hoverBorder: "hover:border-slate-300 dark:hover:border-slate-500/40",
    tint: "bg-slate-50 dark:bg-slate-500/10",
    solid: "bg-slate-500",
  },
};

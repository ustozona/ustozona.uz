/* ════════════════════════════════════════════════════════════════════
   YANGI VIDJET QAYERGA TUSHADI — sof geometriya, DOM va Reactʼsiz.

   Avval har yangi vidjet oldingisidan 28 px siljib, uning USTIGA tushardi:
   uchinchi vidjetda birinchisi koʻrinmay qolardi va oʻqituvchi ularni
   qoʻlda ajratardi (docs/doska-referens-koriklari.md R429). Endi kanvas
   setka boʻylab chapdan oʻngga, tepadan pastga koʻriladi va hech qaysi
   vidjetga tegmaydigan birinchi joy olinadi.

   Pastki qism (boshqaruv paneli) va tepadagi tor qator (burchak
   tugmalari: bosh sahifa, toʻliq ekran, menyu) bandga hisoblanadi —
   vidjet ularning ostiga tushmasin. Panel chap yoki oʻng relsada boʻlsa,
   oʻsha chet ham band (`dock`). Joy topilmasa — eski zinapoya joylashuvi.
   ════════════════════════════════════════════════════════════════════ */

import { TOP_CHROME_PX } from "./chrome";

export type Rect = { x: number; y: number; w: number; h: number };

/** Kanvas chetidan va vidjetlar orasidagi boʻshliq. */
const MARGIN = 24;
const GAP = 16;
/** Setka qadami — kichik, shunda vidjetlar zich, lekin tez topiladi. */
const STEP = 40;
/** Pastki boshqaruv paneli egallaydigan balandlik. */
const BOTTOM_RESERVED = 120;
/** Yon relsa (panel chap/oʻngda) egallaydigan kenglik. */
const SIDE_RESERVED = 112;

function overlaps(a: Rect, b: Rect): boolean {
  return (
    a.x < b.x + b.w + GAP &&
    b.x < a.x + a.w + GAP &&
    a.y < b.y + b.h + GAP &&
    b.y < a.y + a.h + GAP
  );
}

type Dock = "bottom" | "left" | "right";

/**
 * Vidjetlar uchun maydon — kanvas chetlari va boshqaruv paneli
 * chiqarilgan. Boʻsh joy qidiruvi ham, shablon joylashuvi ham shu
 * chegarada ishlaydi: ikkalasi panel ostiga vidjet qoʻymaydi.
 */
export function usableArea(canvas: { w: number; h: number }, dock: Dock = "bottom"): Rect {
  const left = MARGIN + (dock === "left" ? SIDE_RESERVED : 0);
  const right = MARGIN + (dock === "right" ? SIDE_RESERVED : 0);
  return { x: left, y: TOP_CHROME_PX, w: canvas.w - left - right, h: canvas.h - TOP_CHROME_PX - BOTTOM_RESERVED };
}

/**
 * Burchak tugmalari ostidagi vidjetni pastga suradi — tugmalar qatori
 * paydo boʻlishidan oldin saqlangan ekranlar uchun (bir martalik
 * migratsiya, `store.ts`). Faqat `y` oʻzgaradi: tugmalar vidjet ustida
 * turadi va uning burchagini bosish bosh sahifaga olib ketardi.
 */
export function liftBelowChrome<T extends { y: number }>(widgets: readonly T[]): T[] {
  return widgets.map((w) => (w.y < TOP_CHROME_PX ? { ...w, y: TOP_CHROME_PX } : w));
}

/** `[lo, hi]` oraligʻiga; oraliq teskari boʻlsa (`hi < lo`) — `lo`. */
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(v, hi));

/**
 * Shablondagi joy (`area` ning ulushi, 0…1) → piksel
 * (docs/doska-referens-koriklari.md R452). Kichik ekranda vidjet oʻzining
 * eng kichik oʻlchamidan kichraymaydi — qoʻshnisiga sal kirsa ham ichi
 * buzilmaydi. Kattalashgan vidjet maydon ichiga qaytariladi: tor yoki tik
 * ekranda oʻng chetdagi vidjet ekrandan, pastdagisi panel ostiga chiqib
 * ketmasin.
 */
export function rectInArea(at: Rect, area: Rect, min: { w: number; h: number }): Rect {
  const w = Math.round(Math.max(min.w, at.w * area.w));
  const h = Math.round(Math.max(min.h, at.h * area.h));
  return {
    x: Math.round(clamp(area.x + at.x * area.w, area.x, area.x + area.w - w)),
    y: Math.round(clamp(area.y + at.y * area.h, area.y, area.y + area.h - h)),
    w,
    h,
  };
}

/** `size` uchun `area` ichida `others` ga tegmaydigan birinchi nuqta; yoʻq boʻlsa `null`. */
function freeSpotIn(size: { w: number; h: number }, others: readonly Rect[], area: Rect): { x: number; y: number } | null {
  const maxX = area.x + area.w - size.w;
  const maxY = area.y + area.h - size.h;
  for (let y = area.y; y <= maxY; y += STEP) {
    for (let x = area.x; x <= maxX; x += STEP) {
      const spot = { x, y, w: size.w, h: size.h };
      if (!others.some((o) => overlaps(spot, o))) return { x, y };
    }
  }
  return null;
}

/**
 * Shablon vidjetining joyi: ulushdagi joy (`rectInArea`). «Barcha
 * ekranlarda» vidjeti (`avoid`) shu joyda tursa — boʻsh joyga, chunki
 * qadalgan vidjet yangi ekranga oʻzi koʻchib keladi va ikkisi ustma-ust
 * tushardi. Boʻsh joy qolmagan boʻlsa — baribir ulushdagi joyida.
 * `placed` — shu shablondan oldin qoʻyilganlar (ularni ham chetlab oʻtadi).
 */
export function placeTemplateWidget(
  at: Rect,
  min: { w: number; h: number },
  area: Rect,
  avoid: readonly Rect[],
  placed: readonly Rect[],
): Rect {
  const rect = rectInArea(at, area, min);
  if (!avoid.some((o) => overlaps(rect, o))) return rect;
  const spot = freeSpotIn(rect, [...avoid, ...placed], area);
  return spot ? { ...rect, ...spot } : rect;
}

/**
 * Boʻsh joy: `size` oʻlchamdagi vidjet uchun `others` ga tegmaydigan
 * birinchi nuqta. `canvas` yoʻq (server) yoki joy qolmagan boʻlsa —
 * zinapoya: `others.length` ga qarab siljigan nuqta.
 */
export function findFreeSpot(
  size: { w: number; h: number },
  others: readonly Rect[],
  canvas: { w: number; h: number } | null,
  dock: Dock = "bottom",
): { x: number; y: number } {
  const fallback = { x: 80 + others.length * 28, y: 80 + others.length * 28 };
  if (!canvas) return fallback;
  return freeSpotIn(size, others, usableArea(canvas, dock)) ?? fallback;
}

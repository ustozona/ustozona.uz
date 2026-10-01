/* ════════════════════════════════════════════════════════════════════
   YANGI VIDJET QAYERGA TUSHADI — sof geometriya, DOM va Reactʼsiz.

   Avval har yangi vidjet oldingisidan 28 px siljib, uning USTIGA tushardi:
   uchinchi vidjetda birinchisi koʻrinmay qolardi va oʻqituvchi ularni
   qoʻlda ajratardi (docs/doska-referens-koriklari.md R429). Endi kanvas
   setka boʻylab chapdan oʻngga, tepadan pastga koʻriladi va hech qaysi
   vidjetga tegmaydigan birinchi joy olinadi.

   Pastki qism (boshqaruv paneli) bandga hisoblanadi — vidjet panel
   ostiga tushmasin. Panel chap yoki oʻng relsada boʻlsa, oʻsha chet ham
   band (`dock`). Joy topilmasa — eski zinapoya joylashuvi.
   ════════════════════════════════════════════════════════════════════ */

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

/**
 * Boʻsh joy: `size` oʻlchamdagi vidjet uchun `others` ga tegmaydigan
 * birinchi nuqta. `canvas` yoʻq (server) yoki joy qolmagan boʻlsa —
 * zinapoya: `others.length` ga qarab siljigan nuqta.
 */
export function findFreeSpot(
  size: { w: number; h: number },
  others: readonly Rect[],
  canvas: { w: number; h: number } | null,
  dock: "bottom" | "left" | "right" = "bottom",
): { x: number; y: number } {
  const fallback = { x: 80 + others.length * 28, y: 80 + others.length * 28 };
  if (!canvas) return fallback;

  const minX = MARGIN + (dock === "left" ? SIDE_RESERVED : 0);
  const maxX = canvas.w - MARGIN - (dock === "right" ? SIDE_RESERVED : 0) - size.w;
  const maxY = canvas.h - BOTTOM_RESERVED - size.h;
  for (let y = MARGIN; y <= maxY; y += STEP) {
    for (let x = minX; x <= maxX; x += STEP) {
      const spot = { x, y, w: size.w, h: size.h };
      if (!others.some((o) => overlaps(spot, o))) return { x, y };
    }
  }
  return fallback;
}

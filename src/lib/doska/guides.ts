/* ════════════════════════════════════════════════════════════════════
   CHIZGʻICH VA TRANSPORTIR — sof geometriya (docs/doska-qolyozma-
   tadqiqot.md §9, R335).

   Ikkalasi ham doskadagi shaffof «plastik» asbob: barmoq bilan suriladi,
   ikki barmoq yoki tutqich bilan buriladi. Qalam ularning TOʻGʻRI
   CHETI boʻylab yursa chiziq aynan shu chetga tushadi — xuddi haqiqiy
   chizgʻich yonidan yurgan boʻr kabi (`GUIDE_SNAP_PX` izohi).

   Siyoh emas: saqlanmaydi, tarixga kirmaydi, rasmga chiqmaydi. Joyi va
   burchagi `ink-tool.ts` da (sessiya holati).

   Bu faylda React ham, DOM ham YOʻQ — `ink.ts` bilan bir xil tamoyil.
   Koordinatalar kanvas ildiziga nisbatan (siyoh bilan bir tizim),
   burchak gradusda, soat mili yoʻnalishida (ekranda `y` pastga).
   ════════════════════════════════════════════════════════════════════ */

export type GuideKind = "ruler" | "protractor";

/**
 * Asbob holati. Chizgʻichda `x, y` — markazi; transportirda — toʻgʻri
 * chetining oʻrtasi (burchak shu nuqtadan oʻlchanadi).
 */
export type GuidePose = { x: number; y: number; angle: number };

export type PlacedGuide = { kind: GuideKind; pose: GuidePose };

/** Chizgʻich oʻlchami (px). Uzun — doskada jadval chizigʻi bir harakatda. */
export const RULER_LENGTH = 720;
export const RULER_WIDTH = 88;
/** Chizgʻich birligi (px) va chetdagi boʻsh joy — «0» chetga yopishmasin. */
export const RULER_UNIT = 40;
export const RULER_MARGIN = 20;

export const PROTRACTOR_RADIUS = 220;

/**
 * Qalam chetdan shu masofada (px) yozishni boshlasa chiziq chetga
 * yopishishi MUMKIN — barmoq bilan ham tushadigan kenglik.
 *
 * ⚠️ Faqat masofa yetmaydi: chizgʻich yonida oʻqituvchi yozuv ham yozadi
 * («AB = 5 sm»), va har harf toʻgʻri chiziqqa aylanib ketardi. Shuning
 * uchun qaror qalam `GUIDE_DECIDE_PX` yurgandan keyin qabul qilinadi:
 * yoʻnalishi chetga deyarli parallel boʻlsa (`GUIDE_PARALLEL`) — chet
 * boʻylab chiziq, aks holda oddiy qoʻlyozma (`isAlongEdge`).
 */
export const GUIDE_SNAP_PX = 32;
export const GUIDE_DECIDE_PX = 14;
/** cos 25° — shundan kichik ogʻish «chet boʻylab». */
const GUIDE_PARALLEL = Math.cos((25 * Math.PI) / 180);

/** Qalam `(dx, dy)` ga yurdi — bu harakat chetga parallelmi (ikki tomonga ham). */
export function isAlongEdge(e: GuideEdge, dx: number, dy: number): boolean {
  const ex = e.bx - e.ax;
  const ey = e.by - e.ay;
  const len = Math.hypot(dx, dy) * Math.hypot(ex, ey);
  return len > 0 && Math.abs(dx * ex + dy * ey) / len >= GUIDE_PARALLEL;
}

/**
 * Asbob markazi kanvas ichida qoladi — butunlay chetga surib yuborilgan
 * asbobni qaytarib boʻlmasdi (kanvas `overflow: hidden`).
 */
export function clampGuidePose(pose: GuidePose, width: number, height: number): GuidePose {
  return {
    ...pose,
    x: Math.min(Math.max(pose.x, 0), Math.max(0, width)),
    y: Math.min(Math.max(pose.y, 0), Math.max(0, height)),
  };
}

/** Burchak shunga karrali qiymatga yopishadi (gradus) — `ink.ts` dagi 15° bilan bir xil. */
const ANGLE_STEP = 15;
const ANGLE_SNAP = 2;

/** Burilishni (−180; 180] ga keltiradi va 15° ga yaqin boʻlsa aniq 15° qiladi. */
export function snapGuideAngle(angle: number): number {
  let a = ((angle % 360) + 360) % 360;
  if (a > 180) a -= 360;
  const snapped = Math.round(a / ANGLE_STEP) * ANGLE_STEP;
  return Math.abs(a - snapped) <= ANGLE_SNAP ? snapped : a;
}

/**
 * Koʻrsatiladigan burchak: chet gorizontal bilan qanday burchak hosil
 * qiladi, matematikadagidek soat miliga TESKARI, 0–179°. Chizgʻich
 * 30° ga koʻtarilsa «30°», pastga egilsa «150°».
 */
export function guideAngleLabel(angle: number): number {
  return Math.round(((((-angle) % 180) + 180) % 180)) % 180;
}

/** Asbobning oʻz koordinatasidagi nuqta → ekran. */
export function guideToScreen(pose: GuidePose, lx: number, ly: number): [number, number] {
  const r = (pose.angle * Math.PI) / 180;
  const cos = Math.cos(r);
  const sin = Math.sin(r);
  return [pose.x + lx * cos - ly * sin, pose.y + lx * sin + ly * cos];
}

/**
 * Chizish mumkin boʻlgan TOʻGʻRI chet: `a → b` kesma, `n` — tashqariga
 * qaragan normal, `depth` — asbob ICHIDA qancha chuqurlikdan qalam
 * shu chetga tortiladi (qalam asbob ustida boshlasa ham).
 */
export type GuideEdge = { ax: number; ay: number; bx: number; by: number; nx: number; ny: number; depth: number };

function edge(pose: GuidePose, x1: number, x2: number, y: number, ny: number, depth: number): GuideEdge {
  const [ax, ay] = guideToScreen(pose, x1, y);
  const [bx, by] = guideToScreen(pose, x2, y);
  const r = (pose.angle * Math.PI) / 180;
  return { ax, ay, bx, by, nx: -Math.sin(r) * ny, ny: Math.cos(r) * ny, depth };
}

/**
 * Chizgʻichda ikkala uzun chet; transportirda — faqat toʻgʻri cheti
 * (yoy boʻylab chizish yoʻq: u oʻlchash uchun).
 */
export function guideEdges({ kind, pose }: PlacedGuide): GuideEdge[] {
  if (kind === "ruler") {
    const hl = RULER_LENGTH / 2;
    const hw = RULER_WIDTH / 2;
    return [edge(pose, -hl, hl, -hw, -1, hw), edge(pose, -hl, hl, hw, 1, hw)];
  }
  return [edge(pose, -PROTRACTOR_RADIUS, PROTRACTOR_RADIUS, 0, 1, PROTRACTOR_RADIUS)];
}

/**
 * `(x, y)` da boshlangan chiziq qaysi chetga yopishadi; `null` — hech
 * biriga. Eng yaqin chet tanlanadi, faqat nuqtaning chetga proyeksiyasi
 * chet ichida boʻlsa: chizgʻich uchidan narida boshlangan yozuv tortilmaydi.
 */
export function snapToGuide(guides: readonly PlacedGuide[], x: number, y: number): GuideEdge | null {
  let best: GuideEdge | null = null;
  let bestD = Infinity;
  for (const g of guides) {
    for (const e of guideEdges(g)) {
      const dx = e.bx - e.ax;
      const dy = e.by - e.ay;
      const t = ((x - e.ax) * dx + (y - e.ay) * dy) / (dx * dx + dy * dy);
      if (t < 0 || t > 1) continue;
      const d = (x - e.ax) * e.nx + (y - e.ay) * e.ny;
      if (d > GUIDE_SNAP_PX || d < -e.depth) continue;
      if (Math.abs(d) < bestD) {
        bestD = Math.abs(d);
        best = e;
      }
    }
  }
  return best;
}

/**
 * Qalam nuqtasi chet boʻylab: chetga proyeksiya, chet uzunligi ichida,
 * tashqariga `offset` px (chiziq yarim qalinligi — siyoh chetga tegib
 * tursin, ostiga kirmasin).
 */
export function alongEdge(e: GuideEdge, x: number, y: number, offset: number): [number, number] {
  const dx = e.bx - e.ax;
  const dy = e.by - e.ay;
  const t = Math.min(1, Math.max(0, ((x - e.ax) * dx + (y - e.ay) * dy) / (dx * dx + dy * dy)));
  return [e.ax + dx * t + e.nx * offset, e.ay + dy * t + e.ny * offset];
}

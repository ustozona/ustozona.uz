import { CvImage, type Point } from "./cv";
import { OPTION_LABELS, getTableMetrics } from "./sheet-layout";

/* ════════════════════════════════════════════════════════════════════
   VARAQNI OʻQISH — sof funksiyalar, brauzerda ishlaydi

   Ikki bosqich:
     1. `findSheetCorners()` — QR joylashuvidan varaq burchaklarini
        hisoblaydi, keyin uchta qora burchak belgisini SURATDAN topib
        aniqlashtiradi.
     2. `readBubbles()` — toʻgʻrilangan (warp qilingan) tasvirdan har
        savol uchun qaysi katak belgilanganini aniqlaydi.

   NEGA SERVERDA EMAS, BRAUZERDA: dvigatelga surat yuborish har varaq
   uchun ~3-8 MB yuklash va bir necha soniya kutish demak. Oʻqituvchi
   30 ta varaqni birma-bir suratga olib oʻtirardi. Brauzerda esa
   kamera oqimi kadrma-kadr oʻqiladi — varaqni tutasiz, oʻzi topadi.

   ⚠️ BAHO BU YERDA HISOBLANMAYDI. Bu fayl faqat «qaysi katak
   belgilangan» deydi. Toʻgʻri javob mijozga umuman yuborilmaydi —
   ballash serverda, `scoreResponse()` da (docs §7). Aks holda
   oʻquvchi brauzer konsolidan javoblarni koʻra olardi.
   ════════════════════════════════════════════════════════════════════ */

/** Kamera kadridagi RGBA piksellar (canvas `getImageData`). */
export type Rgba = { data: Uint8ClampedArray; width: number; height: number };

export type QrLocation = {
  topLeftCorner: Point;
  topRightCorner: Point;
  bottomLeftCorner: Point;
  bottomRightCorner: Point;
};

function dist(a: Point, b: Point): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function luma(d: Uint8ClampedArray, i: number): number {
  return d[i] * 0.299 + d[i + 1] * 0.587 + d[i + 2] * 0.114;
}

/* ── 1-BOSQICH: varaq burchaklari ─────────────────────────────────── */

/**
 * QR dan boshlab varaqning toʻrt burchagini topadi.
 *
 * Nega QR dan: u varaqdagi YAGONA oʻlchami maʼlum obyekt. Uning
 * suratdagi kattaligi «bir mm nechta piksel» degan masshtabni beradi,
 * yoʻnalishi esa varaq qanchalik qiyshiq turganini. Shundan keyin
 * qolgan uchta burchak qayerda boʻlishi KERAKLIGI hisoblanadi va
 * suratdan aniq joyi qidiriladi.
 *
 * Qaytaradi: [chap-yuqori, oʻng-yuqori, oʻng-quyi, chap-quyi] yoki
 * `null` — varaq juda qiyshiq, kadrga sigʻmagan yoki belgilar
 * topilmagan boʻlsa.
 */
export function findSheetCorners(
  img: Rgba,
  qr: QrLocation,
  questionCount: number
): Point[] | null {
  const { dim, hdr } = getTableMetrics(questionCount);
  const w = img.width;
  const h = img.height;
  const src = img.data;

  const qrCx =
    (qr.topLeftCorner.x + qr.topRightCorner.x + qr.bottomLeftCorner.x + qr.bottomRightCorner.x) / 4;
  const qrCy =
    (qr.topLeftCorner.y + qr.topRightCorner.y + qr.bottomLeftCorner.y + qr.bottomRightCorner.y) / 4;

  const qrW = dist(qr.topLeftCorner, qr.topRightCorner);
  const qrH = dist(qr.topLeftCorner, qr.bottomLeftCorner);
  const qrSizePx = (qrW + qrH) / 2;
  // Juda kichik QR — varaq uzoqda, oʻlchov ishonchsiz.
  if (questionCount === 0 || qrSizePx < 20) return null;

  const mmPerPx = hdr.qrSize / qrSizePx;
  const angle = Math.atan2(
    qr.topRightCorner.y - qr.topLeftCorner.y,
    qr.topRightCorner.x - qr.topLeftCorner.x
  );
  const cosA = Math.cos(angle);
  const sinA = Math.sin(angle);

  // QR markazidan orqaga hisoblab varaqning chap-yuqori burchagi.
  const qrOffXpx = hdr.qrOffX / mmPerPx;
  const qrOffYpx = hdr.qrOffY / mmPerPx;
  const sheetTLx = qrCx - (cosA * qrOffXpx - sinA * qrOffYpx);
  const sheetTLy = qrCy - (sinA * qrOffXpx + cosA * qrOffYpx);

  /** Varaq koordinatasi (mm) → surat koordinatasi (piksel). */
  function sheetPt(xMm: number, yMm: number): Point {
    const px = xMm / mmPerPx;
    const py = yMm / mmPerPx;
    return {
      x: sheetTLx + cosA * px - sinA * py,
      y: sheetTLy + sinA * px + cosA * py,
    };
  }

  /* Burchak belgisini SURATDAN aniqlashtirish.

     Hisoblangan joy taxminiy: QR oʻlchovida bir necha piksel xato
     boʻlsa, varaq chetida u bir necha millimetrga aylanadi. Uch
     qadam: qoʻpol qidiruv → nozik qidiruv → ogʻirlik markazi
     (sub-piksel aniqlik). */
  const markerHalfPx = Math.max(4, Math.round(1.75 / mmPerPx));

  function refineCorner(estimate: Point, searchRadiusPx: number): Point {
    const r = Math.round(searchRadiusPx);
    const cx = Math.round(estimate.x);
    const cy = Math.round(estimate.y);

    let bestX = cx;
    let bestY = cy;
    let bestDark = 999;
    const step = Math.max(2, Math.round(r / 12));

    for (let dy = -r; dy <= r; dy += step) {
      for (let dx = -r; dx <= r; dx += step) {
        const sx = cx + dx;
        const sy = cy + dy;
        if (sx < markerHalfPx || sy < markerHalfPx || sx >= w - markerHalfPx || sy >= h - markerHalfPx) {
          continue;
        }
        let sum = 0;
        let cnt = 0;
        for (let py = -markerHalfPx; py <= markerHalfPx; py += 2) {
          for (let px = -markerHalfPx; px <= markerHalfPx; px += 2) {
            sum += luma(src, ((sy + py) * w + (sx + px)) * 4);
            cnt++;
          }
        }
        const avg = sum / cnt;
        if (avg < bestDark) {
          bestDark = avg;
          bestX = sx;
          bestY = sy;
        }
      }
    }

    // Oq qogʻoz ~200+. Bundan sezilarli qoraroq joy topilmasa —
    // belgi yoʻq, hisoblangan nuqta bilan qolamiz.
    if (bestDark >= 210) return estimate;

    const fineR = step + 2;
    let fineBest = bestDark;
    let fineX = bestX;
    let fineY = bestY;
    for (let dy = -fineR; dy <= fineR; dy++) {
      for (let dx = -fineR; dx <= fineR; dx++) {
        const sx = bestX + dx;
        const sy = bestY + dy;
        if (sx < markerHalfPx || sy < markerHalfPx || sx >= w - markerHalfPx || sy >= h - markerHalfPx) {
          continue;
        }
        let sum = 0;
        let cnt = 0;
        for (let py = -markerHalfPx; py <= markerHalfPx; py++) {
          for (let px = -markerHalfPx; px <= markerHalfPx; px++) {
            sum += luma(src, ((sy + py) * w + (sx + px)) * 4);
            cnt++;
          }
        }
        const avg = sum / cnt;
        if (avg < fineBest) {
          fineBest = avg;
          fineX = sx;
          fineY = sy;
        }
      }
    }

    // Qoralik boʻyicha ogʻirlik markazi — piksel oraligʻidagi aniqlik.
    let comX = 0;
    let comY = 0;
    let comW = 0;
    const comR = markerHalfPx + 2;
    for (let dy = -comR; dy <= comR; dy++) {
      for (let dx = -comR; dx <= comR; dx++) {
        const sx = fineX + dx;
        const sy = fineY + dy;
        if (sx < 0 || sy < 0 || sx >= w || sy >= h) continue;
        const weight = Math.max(0, 128 - luma(src, (sy * w + sx) * 4));
        comX += sx * weight;
        comY += sy * weight;
        comW += weight;
      }
    }
    return comW > 0 ? { x: comX / comW, y: comY / comW } : { x: fineX, y: fineY };
  }

  const searchR = qrSizePx * 0.8;
  const halfMk = 1.75; // belgi 3.5 mm — markazi chetdan 1.75 mm

  const refinedTR = refineCorner(sheetPt(dim.w - halfMk, halfMk), searchR);
  const refinedBL = refineCorner(sheetPt(halfMk, dim.h - halfMk), searchR);
  const refinedBR = refineCorner(sheetPt(dim.w - halfMk, dim.h - halfMk), searchR);

  function offsetPt(pt: Point, dxMm: number, dyMm: number): Point {
    const dxPx = dxMm / mmPerPx;
    const dyPx = dyMm / mmPerPx;
    return {
      x: pt.x + cosA * dxPx - sinA * dyPx,
      y: pt.y + sinA * dxPx + cosA * dyPx,
    };
  }

  // Belgi MARKAZI topildi — varaq burchagi undan yarim belgi narida.
  const cornerTR = offsetPt(refinedTR, halfMk, -halfMk);
  const cornerBL = offsetPt(refinedBL, -halfMk, halfMk);
  const cornerBR = offsetPt(refinedBR, halfMk, halfMk);

  /* Chap-yuqori burchakda belgi YOʻQ — u yerda QR turadi. Shuning
     uchun ikki manba oʻrtachasi olinadi: QR dan hisoblangan joy va
     parallelogramm qoidasi (TR + BL − BR). Ikkalasi mustaqil, xatosi
     turlicha — oʻrtachasi ikkalasidan aniqroq. */
  const computedTL = {
    x: cornerTR.x + cornerBL.x - cornerBR.x,
    y: cornerTR.y + cornerBL.y - cornerBR.y,
  };
  const estimateTL = sheetPt(0, 0);
  const cornerTL = {
    x: (estimateTL.x + computedTL.x) / 2,
    y: (estimateTL.y + computedTL.y) / 2,
  };

  /* Toʻrtburchak haqiqiy varaqqa oʻxshaydimi. Qarama-qarshi tomonlar
     uzunligi keskin farq qilsa — belgilardan biri notoʻgʻri topilgan
     (masalan qoʻl soyasi qora deb olingan). Bunday kadrni tashlash
     xato natijadan yaxshi. */
  const ratioTopBottom = dist(cornerTL, cornerTR) / dist(cornerBL, cornerBR);
  const ratioLeftRight = dist(cornerTL, cornerBL) / dist(cornerTR, cornerBR);
  if (
    ratioTopBottom < 0.6 ||
    ratioTopBottom > 1.7 ||
    ratioLeftRight < 0.6 ||
    ratioLeftRight > 1.7
  ) {
    return null;
  }
  // ~45° dan koʻp qiyshiqlik — qoʻlda ushlashda ham boʻlmaydi.
  if (Math.abs(angle) > 0.78) return null;

  return [cornerTL, cornerTR, cornerBR, cornerBL];
}

/* ── 2-BOSQICH: kataklarni oʻqish ─────────────────────────────────── */

/** Savol raqami → `A`|`B`|`C`|`D` | `X` (ikki katak) | `null` (boʻsh). */
export type SheetAnswers = Record<number, string | null>;

/**
 * Toʻgʻrilangan tasvirdan javoblarni oʻqiydi.
 *
 * Uch bosqich:
 *
 * 1. QATOR BELGILARI. Har savol qatorining chap chetida 2 mm qora
 *    kvadrat bor. Uni topib qatorning ANIQ Y oʻrni olinadi —
 *    hisoblangan oʻrin bilan farqi warp xatosini tuzatadi. Qogʻoz
 *    bir oz bukilgan boʻlsa, aynan shu qadam qutqaradi.
 *
 * 2. KATAK NAMUNASI. Har katak markazida ellips boʻylab piksellar
 *    oʻqiladi. «Yopishtirish» (snap): belgilangan katakda qora
 *    dogʻning markaziga siljiydi, boʻshida joyida qoladi.
 *
 * 3. QATOR ICHIDA SOLISHTIRISH. Global chegara YOʻQ — har katak oʻz
 *    qatoridagi uch qoʻshnisi bilan solishtiriladi. Belgilangan katak
 *    ~80-150, boʻshi ~210-230 yorugʻlikda: farq 60-150 birlik, yaʼni
 *    juda ishonchli signal. Qatorlararo yoritish farqi bu usulda
 *    umuman ahamiyatsiz.
 */
export function readBubbles(
  thres: CvImage,
  raw: CvImage,
  warpSize: number,
  questionCount: number
): SheetAnswers | null {
  if (questionCount === 0) return null;

  const { layout, dim, hdr, markerW, colW, rowH, bubbleR, optionSpacing } =
    getTableMetrics(questionCount);

  const pxW = warpSize / dim.w;
  const pxH = warpSize / dim.h;
  const WS = warpSize;
  const tD = thres.data;
  const rD = raw.data;

  /* ── 1: qator belgilari ── */
  const leftMkX = Math.round(1.3 * pxW);
  const mkRx = Math.max(3, Math.round(1.0 * pxW));
  const mkRy = Math.max(3, Math.round(1.0 * pxH));
  const yTol = Math.round(3.0 * pxH);

  // Moslashuvchan chegara: suratning umumiy yorugʻligidan olinadi,
  // shuning uchun qorongʻi xonada ham, quyoshda ham ishlaydi.
  let sampleSum = 0;
  let sampleCount = 0;
  for (let i = 0; i < WS * WS; i += 97) {
    sampleSum += rD[i];
    sampleCount++;
  }
  const markerThreshold = Math.min(180, (sampleSum / sampleCount) * 0.65);

  const rowCorr = new Array<number>(layout.rows).fill(0);
  const rowCorrFound = new Array<boolean>(layout.rows).fill(false);

  for (let row = 0; row < layout.rows; row++) {
    if (row + 1 > questionCount) break;
    const expectedY = Math.round((hdr.hdrH + (row + 1.5) * rowH) * pxH);

    let bestY = expectedY;
    let bestScore = 999;
    for (let y = expectedY - yTol; y <= expectedY + yTol; y += 2) {
      if (y < mkRy || y >= WS - mkRy) continue;
      let sum = 0;
      let cnt = 0;
      for (let dy = -mkRy; dy <= mkRy; dy += 2) {
        for (let dx = -mkRx; dx <= mkRx; dx += 2) {
          const px = leftMkX + dx;
          const py = y + dy;
          if (px >= 0 && py >= 0 && px < WS && py < WS) {
            sum += rD[py * WS + px];
            cnt++;
          }
        }
      }
      const avg = cnt > 0 ? sum / cnt : 255;
      if (avg < bestScore) {
        bestScore = avg;
        bestY = y;
      }
    }

    if (bestScore < markerThreshold) {
      rowCorr[row] = bestY - expectedY;
      rowCorrFound[row] = true;
    }
  }

  // Topilmagan qatorlar topilganlarning oʻrtachasi bilan toʻldiriladi.
  const found = rowCorr.filter((_, i) => rowCorrFound[i]);
  if (found.length >= 2) {
    const avg = Math.round(found.reduce((a, b) => a + b, 0) / found.length);
    for (let i = 0; i < layout.rows; i++) {
      if (!rowCorrFound[i]) rowCorr[i] = avg;
    }
  }

  /* ── 2: kataklarni oʻlchash ── */
  const sRx = Math.max(5, Math.round(bubbleR * pxW * 0.85));
  const sRy = Math.max(5, Math.round(bubbleR * pxH * 0.85));
  // Siljish radiusi katak oraligʻining 30% dan oshmaydi — aks holda
  // qoʻshni katakka yetib borib uni oʻqib qoʻyardi.
  const snapR = Math.min(
    Math.max(3, Math.round(1.2 * Math.min(pxW, pxH))),
    Math.round(optionSpacing * pxW * 0.3)
  );

  type Bubble = { q: number; opt: string; thresRatio: number; meanIntensity: number };
  const bubbles: Bubble[] = [];

  for (let col = 0; col < layout.cols; col++) {
    const colX = markerW + col * colW;
    for (let row = 0; row < layout.rows; row++) {
      const q = col * layout.rows + row + 1;
      if (q > questionCount) break;

      const yPx = Math.round((hdr.hdrH + (row + 1.5) * rowH) * pxH) + rowCorr[row];

      for (let oi = 0; oi < OPTION_LABELS.length; oi++) {
        const xPx = Math.round((colX + 7 + oi * optionSpacing + optionSpacing / 2) * pxW);

        let bx = xPx;
        let by = yPx;
        let bestSnap = -1;
        for (let dy = -snapR; dy <= snapR; dy += 3) {
          for (let dx = -snapR; dx <= snapR; dx += 3) {
            const tx = xPx + dx;
            const ty = yPx + dy;
            if (tx < sRx || ty < sRy || tx >= WS - sRx || ty >= WS - sRy) continue;
            let score = tD[ty * WS + tx] > 128 ? 2 : 0;
            score += tD[ty * WS + tx - 2] > 128 ? 1 : 0;
            score += tD[ty * WS + tx + 2] > 128 ? 1 : 0;
            score += tD[(ty - 2) * WS + tx] > 128 ? 1 : 0;
            score += tD[(ty + 2) * WS + tx] > 128 ? 1 : 0;
            if (score > bestSnap) {
              bestSnap = score;
              bx = tx;
              by = ty;
            }
          }
        }
        // Qora dogʻ topilmadi — katak boʻsh, hisoblangan joyda qolamiz.
        if (bestSnap < 3) {
          bx = xPx;
          by = yPx;
        }

        let dark = 0;
        let total = 0;
        let rawSum = 0;
        for (let dy = -sRy; dy <= sRy; dy += 2) {
          for (let dx = -sRx; dx <= sRx; dx += 2) {
            const ex = dx / sRx;
            const ey = dy / sRy;
            if (ex * ex + ey * ey > 1.0) continue; // ellips ichi
            const sx = bx + dx;
            const sy = by + dy;
            if (sx < 0 || sy < 0 || sx >= WS || sy >= WS) continue;
            const idx = sy * WS + sx;
            total++;
            if (tD[idx] > 128) dark++;
            rawSum += rD[idx];
          }
        }

        bubbles.push({
          q,
          opt: OPTION_LABELS[oi],
          thresRatio: total > 0 ? dark / total : 0,
          meanIntensity: total > 0 ? rawSum / total : 200,
        });
      }
    }
  }

  /* ── 3: qator ichida solishtirish ── */
  const byQuestion = new Map<number, Bubble[]>();
  for (const b of bubbles) {
    const list = byQuestion.get(b.q) ?? [];
    list.push(b);
    byQuestion.set(b.q, list);
  }

  const answers: SheetAnswers = {};
  for (let q = 1; q <= questionCount; q++) {
    const list = byQuestion.get(q);
    if (!list || list.length < OPTION_LABELS.length) {
      answers[q] = null;
      continue;
    }

    // Eng qorasi birinchi.
    list.sort((a, b) => a.meanIntensity - b.meanIntensity);
    const darkest = list[0];
    const restIntensity =
      (list[1].meanIntensity + list[2].meanIntensity + list[3].meanIntensity) / 3;
    const intensityGap = restIntensity - darkest.meanIntensity;
    const restThres = (list[1].thresRatio + list[2].thresRatio + list[3].thresRatio) / 3;
    const thresGap = darkest.thresRatio - restThres;

    /* Bir nechta dalil birlashtiriladi. Bitta oʻlchov yetarli emas:
       yengil qalam belgisi yorugʻlik farqiga oʻxshab ketishi mumkin,
       shuning uchun ikkinchi oʻlchov (chegaralangan tasvirdagi qora
       piksellar ulushi) tasdiqlaydi. */
    let filled = false;
    if (intensityGap >= 30) filled = true;
    else if (intensityGap >= 20 && thresGap >= 0.15) filled = true;
    else if (intensityGap >= 15 && darkest.thresRatio >= 0.4) filled = true;
    else if (darkest.thresRatio >= 0.5 && thresGap >= 0.25) filled = true;
    // Ikkala signal ham kuchsiz — belgilanmagan deb qaraymiz.
    if (intensityGap < 12 && thresGap < 0.08) filled = false;

    if (!filled) {
      answers[q] = null;
      continue;
    }

    /* Ikkinchi katak ham belgilanganmi. Belgilangan boʻlsa javob
       noaniq — `X`. Server uni XATO deb yozadi, boʻsh deb emas: bola
       javob bergan, lekin qaysi biri ekani bilinmaydi. */
    const bottomTwoAvg = (list[2].meanIntensity + list[3].meanIntensity) / 2;
    const secondGap = bottomTwoAvg - list[1].meanIntensity;
    answers[q] = secondGap >= intensityGap * 0.45 && secondGap >= 15 ? "X" : darkest.opt;
  }

  return answers;
}

/** Ikki oʻqish bir xilmi — ketma-ket kadrlar kelishuvi uchun. */
export function answersMatch(a: SheetAnswers, b: SheetAnswers, questionCount: number): boolean {
  for (let q = 1; q <= questionCount; q++) {
    if ((a[q] ?? null) !== (b[q] ?? null)) return false;
  }
  return true;
}

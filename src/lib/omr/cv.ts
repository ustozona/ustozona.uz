/* ════════════════════════════════════════════════════════════════════
   CV — js-aruco kutubxonasining KERAKLI QISMI

   Manba: https://github.com/jcmellado/js-aruco (Juan Mellado, MIT).
   Litsenziya matni quyida saqlangan — oʻchirmang.

   NEGA BUTUN KUTUBXONA EMAS: LessonLab skaneri 950 satrlik `cv.js` ni
   yuklaydi, lekin undan ATIGI UCHTA narsani ishlatadi — `Image`,
   `warp`, `adaptiveThreshold`. Qolgani (contour topish, gauss, CLAHE,
   morfologiya) skanerlash yoʻlida umuman chaqirilmaydi. Ishlatilmagan
   kodni koʻchirish — oʻqilmaydigan, sinalmaydigan va yangilanmaydigan
   yuk. Shuning uchun faqat chaqiriladigani olindi.

   Kod uslubi ataylab asl holicha (`var`, indeksli sikllar): bu issiq
   sikl, har freymda 600×600 piksel aylanadi. Uni "zamonaviylashtirish"
   (map/filter, obyekt yaratish) sekinlashtiradi va asl bilan
   solishtirishni qiyinlashtiradi.
   ════════════════════════════════════════════════════════════════════

   Copyright (c) 2011 Juan Mellado

   Permission is hereby granted, free of charge, to any person obtaining
   a copy of this software and associated documentation files (the
   "Software"), to deal in the Software without restriction, including
   without limitation the rights to use, copy, modify, merge, publish,
   distribute, sublicense, and/or sell copies of the Software, and to
   permit persons to whom the Software is furnished to do so, subject to
   the following conditions:

   The above copyright notice and this permission notice shall be
   included in all copies or substantial portions of the Software.

   THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
   EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
   MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
   NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS
   BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN
   ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
   CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
   SOFTWARE.
   ════════════════════════════════════════════════════════════════════ */

export type Point = { x: number; y: number };

/** Bir kanalli (kulrang) tasvir. */
export class CvImage {
  width: number;
  height: number;
  data: Uint8Array;

  constructor(width: number, height: number, data?: Uint8Array) {
    this.width = width;
    this.height = height;
    this.data = data ?? new Uint8Array(width * height);
  }
}

/* ── Stack box blur — `adaptiveThreshold` uchun ────────────────────── */

const BLUR_MULT = [1, 171, 205, 293, 57, 373, 79, 137, 241, 27, 391, 357, 41, 19, 283, 265];
const BLUR_SHIFT = [0, 9, 10, 11, 9, 12, 10, 11, 12, 9, 13, 13, 10, 9, 13, 13];

class BlurStack {
  color = 0;
  next: BlurStack | null = null;
}

function stackBoxBlur(src: CvImage, dst: CvImage, kernelSize: number): CvImage {
  const s = src.data;
  const d = dst.data;
  const height = src.height;
  const width = src.width;
  const heightMinus1 = height - 1;
  const widthMinus1 = width - 1;
  const size = kernelSize + kernelSize + 1;
  const radius = kernelSize + 1;
  const mult = BLUR_MULT[kernelSize];
  const shift = BLUR_SHIFT[kernelSize];

  let stack: BlurStack = new BlurStack();
  const stackStart = stack;
  for (let i = 1; i < size; i++) {
    stack.next = new BlurStack();
    stack = stack.next;
  }
  stack.next = stackStart;

  let pos = 0;
  let color: number;
  let sum: number;
  let start: number;
  let p: number;

  for (let y = 0; y < height; y++) {
    start = pos;
    color = s[pos];
    sum = radius * color;

    stack = stackStart;
    for (let i = 0; i < radius; i++) {
      stack.color = color;
      stack = stack.next as BlurStack;
    }
    for (let i = 1; i < radius; i++) {
      stack.color = s[pos + i];
      sum += stack.color;
      stack = stack.next as BlurStack;
    }

    stack = stackStart;
    for (let x = 0; x < width; x++) {
      d[pos++] = (sum * mult) >>> shift;
      p = x + radius;
      p = start + (p < widthMinus1 ? p : widthMinus1);
      sum -= stack.color - s[p];
      stack.color = s[p];
      stack = stack.next as BlurStack;
    }
  }

  for (let x = 0; x < width; x++) {
    pos = x;
    start = pos + width;
    color = d[pos];
    sum = radius * color;

    stack = stackStart;
    for (let i = 0; i < radius; i++) {
      stack.color = color;
      stack = stack.next as BlurStack;
    }
    for (let i = 1; i < radius; i++) {
      stack.color = d[start];
      sum += stack.color;
      stack = stack.next as BlurStack;
      start += width;
    }

    stack = stackStart;
    for (let y = 0; y < height; y++) {
      d[pos] = (sum * mult) >>> shift;
      p = y + radius;
      p = x + (p < heightMinus1 ? p : heightMinus1) * width;
      sum -= stack.color - d[p];
      stack.color = d[p];
      stack = stack.next as BlurStack;
      pos += width;
    }
  }

  return dst;
}

/** Lokal (moslashuvchan) chegaralash.

    Global chegara qogʻoz varaqda ishlamaydi: bir burchagi soyada, bir
    burchagi yorugʻ boʻladi. Bu yerda har piksel OʻZ ATROFI bilan
    solishtiriladi — soya butun blokni birdek qoraytirgani uchun
    natijaga taʼsir qilmaydi. */
export function adaptiveThreshold(
  src: CvImage,
  dst: CvImage,
  kernelSize: number,
  threshold: number
): CvImage {
  const s = src.data;
  const d = dst.data;
  const len = s.length;
  const tab = new Uint8Array(768);

  stackBoxBlur(src, dst, kernelSize);

  for (let i = 0; i < 768; i++) {
    tab[i] = i - 255 <= -threshold ? 255 : 0;
  }
  for (let i = 0; i < len; i++) {
    d[i] = tab[s[i] - d[i] + 255];
  }

  dst.width = src.width;
  dst.height = src.height;
  return dst;
}

/** Otsu — tasvirni ikkiga ajratadigan ENG YAXSHI chegarani topadi.

    `adaptiveThreshold` dan farqi muhim: u har pikselni ATROFI bilan
    solishtiradi va katta bir tekis qora maydonning faqat CHEKKASINI
    belgilaydi (ichkarisi «atrofidan farq qilmaydi»). Kichik, bir xil
    yoritilgan yamoqda — masalan toʻgʻrilangan belgi — aynan toʻldirilgan
    shakl kerak, shuning uchun u yerda global chegara ishlatiladi.

    Chegara gistogrammadan hisoblanadi: sinflararo dispersiyani
    maksimallashtiradigan qiymat tanlanadi. */
export function otsu(img: CvImage): number {
  const src = img.data;
  const len = src.length;
  const hist = new Int32Array(256);
  for (let i = 0; i < len; i++) hist[src[i]]++;

  let sum = 0;
  for (let i = 0; i < 256; i++) sum += hist[i] * i;

  let threshold = 0;
  let sumB = 0;
  let wB = 0;
  let max = 0;
  for (let i = 0; i < 256; i++) {
    wB += hist[i];
    if (wB === 0) continue;
    const wF = len - wB;
    if (wF === 0) break;
    sumB += hist[i] * i;
    const mu = sumB / wB - (sum - sumB) / wF;
    const between = wB * wF * mu * mu;
    if (between > max) {
      max = between;
      threshold = i;
    }
  }
  return threshold;
}

/** Global chegaralash. Chegaradan past (qora) → 255, aks holda 0 —
    `adaptiveThreshold` bilan bir xil qutblanish. */
export function threshold(src: CvImage, dst: CvImage, level: number): CvImage {
  const s = src.data;
  const d = dst.data;
  for (let i = 0; i < s.length; i++) d[i] = s[i] <= level ? 255 : 0;
  dst.width = src.width;
  dst.height = src.height;
  return dst;
}

/* ── Perspektiv toʻgʻrilash ────────────────────────────────────────── */

function square2quad(src: Point[]): number[] {
  const sq: number[] = [];
  const px = src[0].x - src[1].x + src[2].x - src[3].x;
  const py = src[0].y - src[1].y + src[2].y - src[3].y;

  if (px === 0 && py === 0) {
    sq[0] = src[1].x - src[0].x;
    sq[1] = src[2].x - src[1].x;
    sq[2] = src[0].x;
    sq[3] = src[1].y - src[0].y;
    sq[4] = src[2].y - src[1].y;
    sq[5] = src[0].y;
    sq[6] = 0;
    sq[7] = 0;
    sq[8] = 1;
  } else {
    const dx1 = src[1].x - src[2].x;
    const dx2 = src[3].x - src[2].x;
    const dy1 = src[1].y - src[2].y;
    const dy2 = src[3].y - src[2].y;
    const den = dx1 * dy2 - dx2 * dy1;

    sq[6] = (px * dy2 - dx2 * py) / den;
    sq[7] = (dx1 * py - px * dy1) / den;
    sq[8] = 1;
    sq[0] = src[1].x - src[0].x + sq[6] * src[1].x;
    sq[1] = src[3].x - src[0].x + sq[7] * src[3].x;
    sq[2] = src[0].x;
    sq[3] = src[1].y - src[0].y + sq[6] * src[1].y;
    sq[4] = src[3].y - src[0].y + sq[7] * src[3].y;
    sq[5] = src[0].y;
  }
  return sq;
}

function getPerspectiveTransform(src: Point[], size: number): number[] {
  const rq = square2quad(src);
  rq[0] /= size;
  rq[1] /= size;
  rq[3] /= size;
  rq[4] /= size;
  rq[6] /= size;
  rq[7] /= size;
  return rq;
}

/** Qiyshiq suratdagi toʻrtburchakni tik kvadratga yoyadi.

    `contour` — varaq burchaklari [chap-yuqori, oʻng-yuqori,
    oʻng-quyi, chap-quyi] tartibida. Natija har doim `warpSize`
    kvadrat: shundan keyin katak koordinatalari oddiy arifmetika
    bilan hisoblanadi, chunki varaq endi "tik yotibdi". */
export function warp(src: CvImage, dst: CvImage, contour: Point[], warpSize: number): CvImage {
  const s = src.data;
  const d = dst.data;
  const width = src.width;
  const height = src.height;
  let pos = 0;

  const m = getPerspectiveTransform(contour, warpSize - 1);
  let r = m[8];
  let sVal = m[2];
  let t = m[5];

  for (let i = 0; i < warpSize; i++) {
    r += m[7];
    sVal += m[1];
    t += m[4];

    let u = r;
    let v = sVal;
    let w = t;

    for (let j = 0; j < warpSize; j++) {
      u += m[6];
      v += m[0];
      w += m[3];

      const x = v / u;
      const y = w / u;

      const sx1 = x >>> 0;
      const sx2 = sx1 === width - 1 ? sx1 : sx1 + 1;
      const dx1 = x - sx1;
      const dx2 = 1.0 - dx1;

      const sy1 = y >>> 0;
      const sy2 = sy1 === height - 1 ? sy1 : sy1 + 1;
      const dy1 = y - sy1;
      const dy2 = 1.0 - dy1;

      const p1 = sy1 * width;
      const p3 = sy2 * width;

      // Bilinear interpolatsiya — piksel oraligʻidagi qiymat.
      d[pos++] =
        (dy2 * (dx2 * s[p1 + sx1] + dx1 * s[p1 + sx2]) +
          dy1 * (dx2 * s[p3 + sx1] + dx1 * s[p3 + sx2])) &
        0xff;
    }
  }

  dst.width = warpSize;
  dst.height = warpSize;
  return dst;
}

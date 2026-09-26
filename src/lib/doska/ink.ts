import { getStroke, type StrokeOptions } from "perfect-freehand";

import type { InkStroke, InkTool } from "./types";

/* ════════════════════════════════════════════════════════════════════
   QOʻLYOZMA — sof geometriya (docs/doska-qolyozma-tadqiqot.md).

   Bu faylda React ham, store ham, DOM ham YOʻQ — `interaction.ts` bilan
   bir xil tamoyil: chiziq qanday koʻrinishi, qanday saqlanishi va
   oʻchirgich unga tegdimi — bularning hammasi maʼlumot va matematika.

   Chizish (kanvas, hodisalar) — `src/components/doska/InkLayer.tsx`.
   ════════════════════════════════════════════════════════════════════ */

/* ── Palitra ─────────────────────────────────────────────────────────

   Ranglar kam va katta: proyektorda yaqin ranglar farqlanmaydi (R324,
   R335). Qiymat — `src/styles/doska.css` dagi token; bu yerda faqat
   KALIT. `"auto"` — `--doska-ink`: och fonda siyoh, toʻq fonda boʻr.
   ──────────────────────────────────────────────────────────────────── */

export const PEN_COLORS = ["auto", "red", "blue", "green", "orange", "violet"] as const;
export const MARKER_COLORS = ["yellow", "green", "pink", "blue"] as const;

export type PenColor = (typeof PEN_COLORS)[number];
export type MarkerColor = (typeof MARKER_COLORS)[number];

export const DEFAULT_PEN_COLOR: PenColor = "auto";
export const DEFAULT_MARKER_COLOR: MarkerColor = "yellow";

/** Chiziq rangining CSS tokeni. Notanish kalit — asosiy siyoh. */
export function inkColorVar(tool: InkTool, color: string): string {
  if (tool === "marker") {
    return (MARKER_COLORS as readonly string[]).includes(color)
      ? `--doska-marker-${color}`
      : `--doska-marker-${DEFAULT_MARKER_COLOR}`;
  }
  if (color === "auto" || !(PEN_COLORS as readonly string[]).includes(color)) return "--doska-ink";
  return `--doska-pen-${color}`;
}

/**
 * Marker shaffofligi — ostidagi yozuv koʻrinib tursin (R335). Tokenda
 * emas: kanvas `globalAlpha` bilan chizadi, CSS rang shaffofligi esa
 * bitta chiziq ichida ustma-ust tushgan joyni qoraytirardi.
 */
export const MARKER_ALPHA = 0.42;

/* ── Qalinlik ────────────────────────────────────────────────────────

   Uch daraja — oʻqituvchi pikselni emas, «ingichka / oʻrta / qalin»ni
   tanlaydi. Qiymatlar 1080p doskada oʻlchangan: oʻrta qalam oddiy
   yozuv, qalin — sarlavha va tagiga chizish.
   ──────────────────────────────────────────────────────────────────── */

export const INK_SIZES = [1, 2, 3] as const;
export type InkSize = (typeof INK_SIZES)[number];
export const DEFAULT_INK_SIZE: InkSize = 2;

const PEN_PX = [4, 7, 12];
const MARKER_PX = [18, 28, 42];
/** Oʻchirgich radiusi — barmoq bilan ham aniq tegadigan boʻlsin. */
const ERASER_RADIUS_PX = [10, 20, 40];

function level(size: number): number {
  return Math.min(3, Math.max(1, Math.round(size))) - 1;
}

export function strokeWidthPx(tool: InkTool, size: number): number {
  return (tool === "marker" ? MARKER_PX : PEN_PX)[level(size)];
}

export function eraserRadiusPx(size: number): number {
  return ERASER_RADIUS_PX[level(size)];
}

/* ── Bosim ───────────────────────────────────────────────────────────

   Siyoh tezlikka qarab qalinlashadi/ingichkalashadi: sekin — qalin,
   tez — ingichka, xuddi ruchka kabi (R331).

   ⚠️ Bosimni kutubxonaning oʻzi ham simulyatsiya qila oladi, lekin u
   NUQTALAR ORASIDAGI MASOFADAN hisoblaydi. Saqlashda nuqtalar
   soddalashtiriladi (R340) — masofa oʻzgaradi va qoʻyib yuborilgan
   chiziq yozilayotgandagidan boshqacha qalinlikda «qurib» qolardi.
   Shuning uchun bosim YOZISH PAYTIDA hisoblanadi va nuqta bilan birga
   saqlanadi; kutubxona esa uni tayyor holda oladi.
   ──────────────────────────────────────────────────────────────────── */

/** Shu tezlikda (px/ms) chiziq eng ingichka boʻladi. */
const FAST_SPEED = 3;
/** Bosimning oldingi qiymatga yaqinlashish ulushi — keskin sakrash yoʻq. */
const PRESSURE_EASE = 0.25;

/** Bosim yoʻq qurilmada (barmoq, sichqoncha) keyingi nuqtaning bosimi. */
export function simulatedPressure(prev: number, distance: number, dt: number): number {
  const speed = dt > 0 ? distance / dt : 0;
  const target = 0.75 - 0.5 * Math.min(1, speed / FAST_SPEED);
  return prev + (target - prev) * PRESSURE_EASE;
}

/** Boshlangʻich bosim — oʻrtacha qalinlik. */
export const START_PRESSURE = 0.5;

/**
 * Shu nuqtadagi bosim haqiqiymi.
 *
 * Faqat qalamga ishonamiz: sichqoncha bosilganda doim 0,5 yuboradi,
 * koʻp sensorli panel esa 0, 1 yoki yana 0,5 (R332) — bular «maʼlumot
 * yoʻq» degani. Aynan 0,5 — standartdagi «bosim bilinmaydi» qiymati.
 *
 * ⚠️ Chiziq boshida EMAS, har nuqtada tekshiriladi: koʻp qalam birinchi
 * teginishda 0 yuboradi va bosim keyingi nuqtalarda paydo boʻladi.
 * Faqat birinchi nuqtaga qaralsa butun chiziq simulyatsiyada qolardi.
 */
export function isRealPressureSample(pointerType: string, pressure: number): boolean {
  return pointerType === "pen" && pressure > 0 && pressure !== 0.5;
}

/* ── Kanvas uchun rang ───────────────────────────────────────────────

   Tokenlar `oklch()` da. Kanvas `fillStyle` notanish rang satrini
   JIMGINA rad etadi va oldingi rangda chizaveradi — eski brauzerli
   panelda hamma siyoh bir rangda chiqardi. Shuning uchun `oklch` bu
   yerda sRGB `rgba()` ga oʻgiriladi: u har brauzerda ishlaydi.
   ──────────────────────────────────────────────────────────────────── */

const OKLCH_RE =
  /^oklch\(\s*([\d.]+)(%?)\s+([\d.]+)\s+([\d.]+)(?:deg)?\s*(?:\/\s*([\d.]+)(%?))?\s*\)$/i;

function srgbChannel(linear: number): number {
  const v = linear <= 0.0031308 ? 12.92 * linear : 1.055 * Math.pow(linear, 1 / 2.4) - 0.055;
  return Math.round(Math.min(1, Math.max(0, v)) * 255);
}

/** CSS rang satri → kanvas ishonchli qabul qiladigan satr. */
export function canvasColor(value: string): string {
  const m = OKLCH_RE.exec(value.trim());
  if (!m) return value;

  const L = parseFloat(m[1]) / (m[2] ? 100 : 1);
  const C = parseFloat(m[3]);
  const h = (parseFloat(m[4]) * Math.PI) / 180;
  const alpha = m[5] === undefined ? 1 : parseFloat(m[5]) / (m[6] ? 100 : 1);

  // OKLab → chiziqli sRGB (B. Ottosson, 2020).
  const a = C * Math.cos(h);
  const b = C * Math.sin(h);
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const mm = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;

  const r = srgbChannel(4.0767416621 * l - 3.3077115913 * mm + 0.2309699292 * s);
  const g = srgbChannel(-1.2684380046 * l + 2.6097574011 * mm - 0.3413193965 * s);
  const bl = srgbChannel(-0.0041960863 * l - 0.7034186147 * mm + 1.707614701 * s);
  return `rgba(${r}, ${g}, ${bl}, ${alpha})`;
}

/* ── Kontur ──────────────────────────────────────────────────────────

   Chiziq `lineTo` bilan emas, silliq kontur (poligon) sifatida chiziladi
   va toʻldiriladi: uchlari yumaloq, burchaklari keskin, qalinligi bosimga
   qarab (R331).

   ⚠️ `streamline: 0` — ATAYLAB. Silliqlash oldingi nuqtaga tortadi va
   natija nuqtalar zichligiga bogʻliq: yozilayotgan (zich) va saqlangan
   (soddalashtirilgan) chiziq har xil chiqardi. Titrashni soddalashtirish
   oʻzi yutadi.
   ──────────────────────────────────────────────────────────────────── */

function strokeOptions(tool: InkTool, size: number, last: boolean): StrokeOptions {
  const px = strokeWidthPx(tool, size);
  if (tool === "marker") {
    return { size: px, thinning: 0, smoothing: 0.5, streamline: 0, simulatePressure: false, last };
  }
  return { size: px, thinning: 0.55, smoothing: 0.5, streamline: 0, simulatePressure: false, last };
}

/** Tekis `[x, y, p, …]` → kutubxona kutgan `[x, y, bosim 0–1][]`. */
function toInput(points: ArrayLike<number>, pressureScale: number): number[][] {
  const out: number[][] = [];
  for (let i = 0; i + 2 < points.length; i += 3) {
    out.push([points[i], points[i + 1], points[i + 2] / pressureScale]);
  }
  return out;
}

/** Kontur nuqtalari → SVG yoʻl satri (kvadratik egri chiziqlar bilan). */
function outlineToPath(outline: number[][]): string {
  const n = outline.length;
  if (n < 2) return "";
  const r = (v: number) => Math.round(v * 100) / 100;

  let d = `M${r(outline[0][0])} ${r(outline[0][1])}Q`;
  for (let i = 0; i < n; i++) {
    const [x0, y0] = outline[i];
    const [x1, y1] = outline[(i + 1) % n];
    d += `${r(x0)} ${r(y0)} ${r((x0 + x1) / 2)} ${r((y0 + y1) / 2)} `;
  }
  return d + "Z";
}

/**
 * Chiziq konturi — kanvas toʻldiradigan yoʻl.
 *
 * `livePoints` — hali yozilayotgan chiziq (yoki uning boʻlagi): bosim
 * 0–1 kasr. `last` — boʻlak tugagan (uchi yopiladi). Saqlangan chiziq
 * uchun `strokePath` ishlatiladi (u keshlaydi).
 */
export function livePath(
  tool: InkTool,
  size: number,
  livePoints: ArrayLike<number>,
  last = false,
): Path2D | null {
  const d = outlineToPath(getStroke(toInput(livePoints, 1), strokeOptions(tool, size, last)));
  return d ? new Path2D(d) : null;
}

/**
 * Saqlangan chiziq bir marta hisoblanadi: kontur geometriyasi rangga ham,
 * fonga ham bogʻliq emas, chiziq obyekti esa oʻzgarmas (store uni doim
 * yangisi bilan almashtiradi). 500 chiziqli ekranni qayta chizish shunda
 * faqat tayyor yoʻllarni toʻldirish boʻladi (R341).
 */
const pathCache = new WeakMap<InkStroke, Path2D | null>();

export function strokePath(stroke: InkStroke): Path2D | null {
  let path = pathCache.get(stroke);
  if (path === undefined) {
    const d = outlineToPath(
      getStroke(toInput(stroke.points, 100), strokeOptions(stroke.tool, stroke.size, true)),
    );
    path = d ? new Path2D(d) : null;
    pathCache.set(stroke, path);
  }
  return path;
}

/* ── Saqlash: soddalashtirish ────────────────────────────────────────

   Qalam 120–240 Hz: 2 soniyalik chiziq 250–500 nuqta. Ramer–Douglas–
   Peucker ~0,5 px toleransda nuqtalarning koʻpini olib tashlaydi, koʻzga
   farqi yoʻq (R340).

   ⚠️ Bosim ham masofaga qoʻshiladi (uchinchi oʻlcham): aks holda tez
   chizilgan toʻgʻri chiziq ikki nuqtaga tushib, uning ingichkalashgan
   joylari yoʻqolardi.
   ──────────────────────────────────────────────────────────────────── */

const SIMPLIFY_TOLERANCE = 0.5;
/** Bosimdagi 0,1 farq ≈ 1 px masofa. */
const PRESSURE_WEIGHT = 10;

function segmentDistance3(
  px: number, py: number, pz: number,
  ax: number, ay: number, az: number,
  bx: number, by: number, bz: number,
): number {
  const dx = bx - ax;
  const dy = by - ay;
  const dz = bz - az;
  const len = dx * dx + dy * dy + dz * dz;
  let t = len > 0 ? ((px - ax) * dx + (py - ay) * dy + (pz - az) * dz) / len : 0;
  t = Math.max(0, Math.min(1, t));
  const ex = ax + t * dx - px;
  const ey = ay + t * dy - py;
  const ez = az + t * dz - pz;
  return Math.sqrt(ex * ex + ey * ey + ez * ez);
}

/**
 * Yozilgan nuqtalar (`[x, y, bosim 0–1, …]`, kasr) → saqlanadigan
 * ixcham massiv (`[x, y, bosim 0–100, …]`, butun son).
 *
 * Takrorlanuvchi (rekursiyasiz) — uzun chiziqda stek toʻlmasin.
 */
export function compactPoints(raw: number[]): number[] {
  const n = Math.floor(raw.length / 3);
  if (n === 0) return [];

  const keep = new Uint8Array(n);
  keep[0] = 1;
  keep[n - 1] = 1;

  const stack: [number, number][] = [[0, n - 1]];
  while (stack.length) {
    const [a, b] = stack.pop()!;
    let maxD = 0;
    let index = -1;
    const az = raw[a * 3 + 2] * PRESSURE_WEIGHT;
    const bz = raw[b * 3 + 2] * PRESSURE_WEIGHT;
    for (let i = a + 1; i < b; i++) {
      const d = segmentDistance3(
        raw[i * 3], raw[i * 3 + 1], raw[i * 3 + 2] * PRESSURE_WEIGHT,
        raw[a * 3], raw[a * 3 + 1], az,
        raw[b * 3], raw[b * 3 + 1], bz,
      );
      if (d > maxD) {
        maxD = d;
        index = i;
      }
    }
    if (index !== -1 && maxD > SIMPLIFY_TOLERANCE) {
      keep[index] = 1;
      stack.push([a, index], [index, b]);
    }
  }

  const out: number[] = [];
  for (let i = 0; i < n; i++) {
    if (!keep[i]) continue;
    out.push(Math.round(raw[i * 3]), Math.round(raw[i * 3 + 1]), Math.round(raw[i * 3 + 2] * 100));
  }
  return out;
}

/* ── Oʻchirgich: urilish ─────────────────────────────────────────────

   Butun chiziq oʻchadi — sinfda eng koʻp kerak boʻlgani va eng aniqi
   (R334). Avval chegaraviy toʻrtburchak, keyin kesmalar boʻyicha masofa.
   ──────────────────────────────────────────────────────────────────── */

type Bounds = { minX: number; minY: number; maxX: number; maxY: number };
const boundsCache = new WeakMap<InkStroke, Bounds>();

function strokeBounds(stroke: InkStroke): Bounds {
  let b = boundsCache.get(stroke);
  if (!b) {
    const p = stroke.points;
    b = { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity };
    for (let i = 0; i + 1 < p.length; i += 3) {
      if (p[i] < b.minX) b.minX = p[i];
      if (p[i] > b.maxX) b.maxX = p[i];
      if (p[i + 1] < b.minY) b.minY = p[i + 1];
      if (p[i + 1] > b.maxY) b.maxY = p[i + 1];
    }
    boundsCache.set(stroke, b);
  }
  return b;
}

function segmentDistance(px: number, py: number, ax: number, ay: number, bx: number, by: number): number {
  return segmentDistance3(px, py, 0, ax, ay, 0, bx, by, 0);
}

/** Oʻchirgich `(x, y)` nuqtada `radius` bilan shu chiziqqa tegadimi. */
export function strokeHit(stroke: InkStroke, x: number, y: number, radius: number): boolean {
  const reach = radius + strokeWidthPx(stroke.tool, stroke.size) / 2;
  const b = strokeBounds(stroke);
  if (x < b.minX - reach || x > b.maxX + reach || y < b.minY - reach || y > b.maxY + reach) {
    return false;
  }

  const p = stroke.points;
  if (p.length < 6) return Math.hypot(p[0] - x, p[1] - y) <= reach;
  for (let i = 0; i + 5 < p.length; i += 3) {
    if (segmentDistance(x, y, p[i], p[i + 1], p[i + 3], p[i + 4]) <= reach) return true;
  }
  return false;
}

import { getStroke, type StrokeOptions } from "perfect-freehand";

import { widgetMeta } from "./registry";
import type { DoskaScreen, DoskaWidget, InkAnchor, InkShape, InkStroke, InkTool } from "./types";

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

/** Bosim qalinlikka qanchalik taʼsir qiladi. Marker bir xil enli — haqiqiy marker kabi. */
function thinningOf(tool: InkTool): number {
  return tool === "marker" ? 0 : 0.55;
}

function strokeOptions(tool: InkTool, size: number, last: boolean): StrokeOptions {
  return {
    size: strokeWidthPx(tool, size),
    thinning: thinningOf(tool),
    smoothing: 0.5,
    streamline: 0,
    simulatePressure: false,
    last,
  };
}

/**
 * Shu bosimdagi chiziq eni (px) — kutubxona formulasi bilan bir xil:
 * `size · (1 − 2 · thinning · (0,5 − bosim))`. Tizimning siyoh izi
 * (`InkLayer`) qalam uchida aynan shu qalinlikda chizsin.
 */
export function inkWidthAt(tool: InkTool, size: number, pressure: number): number {
  return strokeWidthPx(tool, size) * (1 - 2 * thinningOf(tool) * (0.5 - pressure));
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
 */
export function compactPoints(raw: number[]): number[] {
  return simplify(raw, 1);
}

/**
 * RDP soddalashtirish. `pressureScale` — kirishdagi bosim shkalasi:
 * yozilgan nuqtada 1, saqlangan chiziqdan kesilgan boʻlakda 100.
 *
 * Takrorlanuvchi (rekursiyasiz) — uzun chiziqda stek toʻlmasin.
 */
function simplify(raw: ArrayLike<number>, pressureScale: number, tolerance = SIMPLIFY_TOLERANCE): number[] {
  const n = Math.floor(raw.length / 3);
  if (n === 0) return [];

  const keep = new Uint8Array(n);
  keep[0] = 1;
  keep[n - 1] = 1;
  const weight = PRESSURE_WEIGHT / pressureScale;

  const stack: [number, number][] = [[0, n - 1]];
  while (stack.length) {
    const [a, b] = stack.pop()!;
    let maxD = 0;
    let index = -1;
    const az = raw[a * 3 + 2] * weight;
    const bz = raw[b * 3 + 2] * weight;
    for (let i = a + 1; i < b; i++) {
      const d = segmentDistance3(
        raw[i * 3], raw[i * 3 + 1], raw[i * 3 + 2] * weight,
        raw[a * 3], raw[a * 3 + 1], az,
        raw[b * 3], raw[b * 3 + 1], bz,
      );
      if (d > maxD) {
        maxD = d;
        index = i;
      }
    }
    if (index !== -1 && maxD > tolerance) {
      keep[index] = 1;
      stack.push([a, index], [index, b]);
    }
  }

  const out: number[] = [];
  for (let i = 0; i < n; i++) {
    if (!keep[i]) continue;
    out.push(
      Math.round(raw[i * 3]),
      Math.round(raw[i * 3 + 1]),
      Math.round((raw[i * 3 + 2] * 100) / pressureScale),
    );
  }
  return out;
}

/* ── Tekislangan shakllar (R336) ─────────────────────────────────────

   Shakl kontur bilan emas, kanvas `stroke()` bilan chiziladi: toʻgʻri
   chiziq aniq toʻgʻri, aylana aniq aylana boʻlsin. Qalinligi — oʻrtacha
   bosimdagi qoʻlyozma bilan bir xil (`strokeWidthPx`), yaʼni qoʻlda
   chizilgani bilan yonma-yon bir xil koʻrinadi.

   Oʻchirgich va chegara uchun shakl SINIQ CHIZIQQA aylantiriladi
   (`strokePolyline`) — urilish va kesish qoʻlyozma bilan bir xil kod.
   ──────────────────────────────────────────────────────────────────── */

const ELLIPSE_SEGMENTS = 64;
/** Shakl nuqtalaridagi bosim (0–100) — kesilsa oʻrtacha qalinlikda qoladi. */
const SHAPE_PRESSURE = 50;

type Box = { x1: number; y1: number; x2: number; y2: number };

function shapeBox(p: ArrayLike<number>): Box {
  return { x1: p[0], y1: p[1], x2: p[3] ?? p[0], y2: p[4] ?? p[1] };
}

function buildShapePolyline(shape: InkShape, p: ArrayLike<number>): number[] {
  const { x1, y1, x2, y2 } = shapeBox(p);
  const z = SHAPE_PRESSURE;
  if (shape === "line") return [x1, y1, z, x2, y2, z];
  if (shape === "rect") return [x1, y1, z, x2, y1, z, x2, y2, z, x1, y2, z, x1, y1, z];

  const cx = (x1 + x2) / 2;
  const cy = (y1 + y2) / 2;
  const rx = Math.abs(x2 - x1) / 2;
  const ry = Math.abs(y2 - y1) / 2;
  const out: number[] = [];
  for (let i = 0; i <= ELLIPSE_SEGMENTS; i++) {
    const a = (i / ELLIPSE_SEGMENTS) * Math.PI * 2;
    out.push(cx + rx * Math.cos(a), cy + ry * Math.sin(a), z);
  }
  return out;
}

function buildShapePath(shape: InkShape, p: ArrayLike<number>): Path2D {
  const { x1, y1, x2, y2 } = shapeBox(p);
  const path = new Path2D();
  if (shape === "line") {
    path.moveTo(x1, y1);
    path.lineTo(x2, y2);
  } else if (shape === "rect") {
    path.rect(Math.min(x1, x2), Math.min(y1, y2), Math.abs(x2 - x1), Math.abs(y2 - y1));
  } else {
    path.ellipse((x1 + x2) / 2, (y1 + y2) / 2, Math.abs(x2 - x1) / 2, Math.abs(y2 - y1) / 2, 0, 0, Math.PI * 2);
  }
  return path;
}

const shapePathCache = new WeakMap<InkStroke, Path2D>();

/**
 * Shakl yoʻli — kanvas uni `strokeWidthPx` qalinlikda `stroke()` qiladi.
 * Saqlangan chiziqning AYNAN oʻzi berilsin (nusxasi emas) — kesh shunga
 * bogʻlangan.
 */
export function shapePath(stroke: InkStroke): Path2D {
  let path = shapePathCache.get(stroke);
  if (!path) {
    path = buildShapePath(stroke.shape ?? "line", stroke.points);
    shapePathCache.set(stroke, path);
  }
  return path;
}

const polylineCache = new WeakMap<InkStroke, number[]>();

/** Chiziqning oʻrta chizigʻi `[x, y, bosim 0–100, …]` — shakl ham siniq chiziq boʻlib. */
export function strokePolyline(stroke: InkStroke): number[] {
  if (!stroke.shape) return stroke.points;
  let p = polylineCache.get(stroke);
  if (!p) {
    p = buildShapePolyline(stroke.shape, stroke.points);
    polylineCache.set(stroke, p);
  }
  return p;
}

/* ── «Chiz va ushlab tur» → shakl (R336) ─────────────────────────────

   Oʻqituvchi chiziq chizib, oxirida qalamni toʻxtatib tursa, chiziq
   tanib olinadi:

     • TOʻGʻRI CHIZIQ — uchlar orasidagi masofa yoʻl uzunligiga yaqin va
       hech bir nuqta uchlarni tutashtiruvchi kesmadan uzoqlashmagan;
     • YOPIQ SHAKL — oxiri boshiga yaqin qaytgan. Toʻrtburchakmi yoki
       ellipsmi — chegaraviy qutining BURCHAKLARIGA qarab: toʻrtburchak
       toʻrt burchakdan ham oʻtadi, aylana esa burchakdan tomonning
       ~0,2 qismi uzoqda qoladi. Oʻrtacha masofa bilan solishtirish bu
       farqni sezmaydi: qoʻlda chizilgan aylana ham qutiga ancha yaqin.

   Tanilmasa `null` — chiziq qoʻlyozmaligicha qoladi. Yarim tanish
   (masalan uchburchakni toʻrtburchakka aylantirish) yozuvni buzgandan
   koʻra hech narsa qilmagan maʼqul.
   ──────────────────────────────────────────────────────────────────── */

/** Shundan qisqa chiziq tanilmaydi — nuqta yoki vergul shaklga aylanmasin. */
const MIN_SHAPE_LENGTH = 32;
/** Toʻgʻri chiziq: nuqtaning kesmadan ogʻishi — uzunlikka nisbatan va kamida px. */
const LINE_DEVIATION = 0.07;
const LINE_DEVIATION_MIN_PX = 6;
/** Yopiq shakl: uchlar orasidagi masofa yoʻl uzunligining shu qismidan kam. */
const CLOSED_GAP = 0.2;
/** Ellips: oʻrtacha radial ogʻish (qutining oʻrtacha tomoniga nisbatan). */
const ELLIPSE_TOLERANCE = 0.07;
/** Toʻrtburchak: har burchakdan shu masofada (tomonga nisbatan) nuqta bor. */
const RECT_CORNER = 0.14;
/** Tomonlari shuncha farq qilsa — aylana yoki kvadrat qilib tekislanadi. */
const SQUARE_SNAP = 0.12;

/**
 * Qoʻl titrashi yutiladigan ogʻish (px). Xom nuqtalarda 240 Hz qalamning
 * ±1–2 px titrashi yoʻl uzunligini ikki barobargacha oshiradi va toʻgʻri
 * chiziq «egri» boʻlib chiqardi — shuning uchun oʻlchovlar
 * soddalashtirilgan siniq chiziqda olinadi.
 */
const RECOGNIZE_TOLERANCE = 3;

/**
 * Yozilgan nuqtalar (`[x, y, bosim, …]`, har qanday bosim shkalasi) →
 * tanilgan shakl va uning ikki nuqtasi `[x1, y1, 50, x2, y2, 50]`.
 *
 * ⚠️ Chaqiruvchi ushlab turish paytidagi nuqtalarni BERMASIN (qalam
 * joyida titragan davr) — ular shaklning oxiriga bir toʻda shovqin
 * qoʻshadi. `InkLayer` qalam toʻxtagan nuqtagacha kesib beradi.
 */
export function recognizeShape(input: ArrayLike<number>): { shape: InkShape; points: number[] } | null {
  // Bosim tanishga taʼsir qilmasin — faqat shakl.
  const flat: number[] = [];
  for (let i = 0; i + 2 < input.length; i += 3) flat.push(input[i], input[i + 1], 0);
  const raw = simplify(flat, 1, RECOGNIZE_TOLERANCE);
  const n = Math.floor(raw.length / 3);
  if (n < 2) return null;

  let length = 0;
  let minX = raw[0];
  let maxX = raw[0];
  let minY = raw[1];
  let maxY = raw[1];
  for (let i = 1; i < n; i++) {
    const x = raw[i * 3];
    const y = raw[i * 3 + 1];
    length += Math.hypot(x - raw[i * 3 - 3], y - raw[i * 3 - 2]);
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  }
  if (length < MIN_SHAPE_LENGTH) return null;

  const x0 = raw[0];
  const y0 = raw[1];
  const xn = raw[(n - 1) * 3];
  const yn = raw[(n - 1) * 3 + 1];
  const chord = Math.hypot(xn - x0, yn - y0);
  const z = SHAPE_PRESSURE;

  // Toʻgʻri chiziq.
  const allowed = Math.max(LINE_DEVIATION_MIN_PX, chord * LINE_DEVIATION);
  let straight = chord > length * 0.8;
  for (let i = 1; straight && i < n - 1; i++) {
    if (segmentDistance(raw[i * 3], raw[i * 3 + 1], x0, y0, xn, yn) > allowed) straight = false;
  }
  if (straight) return { shape: "line", points: [x0, y0, z, xn, yn, z] };

  // Yopiq shakl.
  const w = maxX - minX;
  const h = maxY - minY;
  if (chord > length * CLOSED_GAP || Math.min(w, h) < MIN_SHAPE_LENGTH / 2) return null;

  const side = (w + h) / 2;
  const corners = [
    [minX, minY],
    [maxX, minY],
    [maxX, maxY],
    [minX, maxY],
  ];
  const nearest = corners.map(() => Infinity);
  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;
  let radial = 0;
  for (let i = 0; i < n; i++) {
    const x = raw[i * 3];
    const y = raw[i * 3 + 1];
    corners.forEach(([qx, qy], k) => {
      nearest[k] = Math.min(nearest[k], Math.hypot(x - qx, y - qy));
    });
    radial += Math.abs(Math.hypot((x - cx) / (w / 2), (y - cy) / (h / 2)) - 1);
  }
  radial = (radial / n) * (side / 2);

  let shape: InkShape;
  if (nearest.every((d) => d < side * RECT_CORNER)) shape = "rect";
  else if (radial < side * ELLIPSE_TOLERANCE) shape = "ellipse";
  else return null;

  // Deyarli teng tomonlar — aniq aylana / kvadrat.
  let bx1 = minX;
  let by1 = minY;
  let bx2 = maxX;
  let by2 = maxY;
  if (Math.abs(w - h) < Math.max(w, h) * SQUARE_SNAP) {
    bx1 = cx - side / 2;
    bx2 = cx + side / 2;
    by1 = cy - side / 2;
    by2 = cy + side / 2;
  }
  return { shape, points: [bx1, by1, z, bx2, by2, z] };
}

/** Burchak shunga karrali yoʻnalishga yopishadi (R336). */
const ANGLE_STEP = Math.PI / 12; // 15°
const ANGLE_SNAP = (4 * Math.PI) / 180;

/**
 * Tekislangan chiziq uchini qalam ortidan olib boradi: boshi joyida,
 * uchi qalamda; yoʻnalish 15° ga yaqin boʻlsa aniq 15° ga yopishadi —
 * gorizontal, vertikal va 45° qoʻlda chizilganda ham aniq chiqadi.
 */
export function snapLineEnd(x1: number, y1: number, x: number, y: number): [number, number] {
  const length = Math.hypot(x - x1, y - y1);
  const angle = Math.atan2(y - y1, x - x1);
  const snapped = Math.round(angle / ANGLE_STEP) * ANGLE_STEP;
  if (Math.abs(angle - snapped) > ANGLE_SNAP) return [x, y];
  return [x1 + Math.cos(snapped) * length, y1 + Math.sin(snapped) * length];
}

/* ── Vidjet sahifasiga bogʻlash (R338) ───────────────────────────────

   Taqdimot slaydi ustida BOSHLANGAN chiziq shu slaydga bogʻlanadi.
   Mezon — boshlangan nuqta: slayddan tashqaridan ichiga chizilgan
   strelka ekranniki boʻlib qoladi, slayd almashsa ham koʻrinadi.

   Nuqta ustida eng yuqori vidjet olinadi. U sahifasiz boʻlsa (taqdimot
   ustiga qoʻyilgan taymer) — bogʻlanmaydi: oʻqituvchi taymer ustiga
   yozdi, slaydga emas.
   ──────────────────────────────────────────────────────────────────── */

/** Chiziqni ekranga chizish uchun siljish va masshtab. */
export type InkPlacement = { x: number; y: number; scale: number };

const SCREEN_PLACEMENT: InkPlacement = { x: 0, y: 0, scale: 1 };

export function widgetInkPage(widget: DoskaWidget): string | null {
  return widgetMeta(widget.kind)?.inkPage?.(widget.state) ?? null;
}

/** `(x, y)` da boshlangan chiziq qaysi sahifaga bogʻlanadi; `origin` — vidjet burchagi. */
/** Shu vidjetning hozirgi sahifasiga bogʻlash; sahifasi boʻlmasa `null`. */
export function inkAnchorFor(
  widget: DoskaWidget | undefined,
): { anchor: InkAnchor; originX: number; originY: number } | null {
  const page = widget && widgetInkPage(widget);
  if (!widget || !page) return null;
  return { anchor: { widgetId: widget.id, page, w: widget.w }, originX: widget.x, originY: widget.y };
}

export function inkAnchorAt(
  widgets: readonly DoskaWidget[],
  x: number,
  y: number,
): { anchor: InkAnchor; originX: number; originY: number } | null {
  let top: DoskaWidget | null = null;
  for (const w of widgets) {
    if (x < w.x || x > w.x + w.w || y < w.y || y > w.y + w.h) continue;
    if (!top || w.z > top.z) top = w;
  }
  return inkAnchorFor(top ?? undefined);
}

/**
 * Chiziq hozir qayerda chiziladi. `null` — koʻrinmaydi: boshqa slayd
 * ochiq, toʻplam almashtirilgan yoki vidjet yoʻq.
 */
export function strokePlacement(
  stroke: InkStroke,
  widgets: ReadonlyMap<string, DoskaWidget>,
): InkPlacement | null {
  const a = stroke.anchor;
  if (!a) return SCREEN_PLACEMENT;
  const w = widgets.get(a.widgetId);
  if (!w || widgetInkPage(w) !== a.page) return null;
  return { x: w.x, y: w.y, scale: a.w > 0 ? w.w / a.w : 1 };
}

export type PlacedStroke = { stroke: InkStroke; place: InkPlacement };

/** Ekranda hozir koʻrinadigan chiziqlar — chizish, oʻchirish va «Tozalash» shularga. */
export function visibleInk(screen: DoskaScreen | undefined): PlacedStroke[] {
  if (!screen?.ink?.length) return [];
  const ink = screen.ink;
  const widgets = new Map(screen.widgets.map((w) => [w.id, w]));
  const out: PlacedStroke[] = [];
  for (const stroke of ink) {
    const place = strokePlacement(stroke, widgets);
    if (place) out.push({ stroke, place });
  }
  return out;
}

/**
 * Bogʻlangan chiziqlar joyini belgilovchi kalit — vidjet surilsa,
 * kattalashsa yoki slayd almashsa oʻzgaradi, qatlam shunda qayta chiziladi.
 * Bogʻlangan chiziq yoʻq boʻlsa boʻsh satr.
 */
export function anchorsKey(screen: DoskaScreen | undefined): string {
  const ids = new Set<string>();
  for (const s of screen?.ink ?? []) if (s.anchor) ids.add(s.anchor.widgetId);
  if (!ids.size || !screen) return "";
  let key = "";
  for (const w of screen.widgets) {
    if (ids.has(w.id)) key += `${w.id}:${w.x},${w.y},${w.w}:${widgetInkPage(w)};`;
  }
  return key;
}

/** Ekran nuqtasi → chiziqning oʻz koordinatasi. */
function toLocal(place: InkPlacement, x: number, y: number): [number, number] {
  return [(x - place.x) / place.scale, (y - place.y) / place.scale];
}

/* ── Oʻchirgich: urilish ─────────────────────────────────────────────

   Ikki xil (R334):
     • BUTUN CHIZIQ — tekkan chiziq toʻliq oʻchadi. Sinfda eng koʻp
       kerak boʻlgani va eng aniqi.
     • QISMAN — faqat oʻchirgʻich oʻtgan joy ketadi, chiziq boʻlaklarga
       boʻlinadi. Harfning bir qismini tuzatish, jadval chizigʻini
       qisqartirish uchun.

   Ikkalasi ham oʻchirgʻichning YOʻLI bilan ishlaydi (hodisadagi barcha
   nuqtalar): tez harakatda nuqtalar oraligʻidagi chiziq ham oʻchsin.
   ──────────────────────────────────────────────────────────────────── */

type Bounds = { minX: number; minY: number; maxX: number; maxY: number };
const boundsCache = new WeakMap<InkStroke, Bounds>();

function strokeBounds(stroke: InkStroke): Bounds {
  let b = boundsCache.get(stroke);
  if (!b) {
    const p = strokePolyline(stroke);
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

/** Nuqtadan siniq chiziqqa (`[x, y, x, y, …]`) masofa. */
function pathDistance(x: number, y: number, path: readonly number[]): number {
  if (path.length < 4) return Math.hypot(path[0] - x, path[1] - y);
  let best = Infinity;
  for (let i = 0; i + 3 < path.length; i += 2) {
    best = Math.min(best, segmentDistance(x, y, path[i], path[i + 1], path[i + 2], path[i + 3]));
  }
  return best;
}

/**
 * Oʻchirgʻich yoʻli ekran koordinatasida → chiziqning oʻz koordinatasida
 * yoʻl va radius. Chegara boʻyicha tez rad etish ham shu yerda.
 */
function localEraser(
  placed: PlacedStroke,
  path: readonly number[],
  radius: number,
): { path: number[]; reach: number } | null {
  const { stroke, place } = placed;
  const local: number[] = [];
  for (let i = 0; i + 1 < path.length; i += 2) local.push(...toLocal(place, path[i], path[i + 1]));
  const reach = radius / place.scale + strokeWidthPx(stroke.tool, stroke.size) / 2;

  const b = strokeBounds(stroke);
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (let i = 0; i + 1 < local.length; i += 2) {
    minX = Math.min(minX, local[i]);
    maxX = Math.max(maxX, local[i]);
    minY = Math.min(minY, local[i + 1]);
    maxY = Math.max(maxY, local[i + 1]);
  }
  if (maxX < b.minX - reach || minX > b.maxX + reach || maxY < b.minY - reach || minY > b.maxY + reach) {
    return null;
  }
  return { path: local, reach };
}

function cross(ax: number, ay: number, bx: number, by: number, cx: number, cy: number): number {
  return (bx - ax) * (cy - ay) - (by - ay) * (cx - ax);
}

/** Ikki kesma orasidagi eng qisqa masofa (kesishsa 0). */
function segmentsDistance(
  ax: number, ay: number, bx: number, by: number,
  cx: number, cy: number, dx: number, dy: number,
): number {
  const d1 = cross(ax, ay, bx, by, cx, cy);
  const d2 = cross(ax, ay, bx, by, dx, dy);
  const d3 = cross(cx, cy, dx, dy, ax, ay);
  const d4 = cross(cx, cy, dx, dy, bx, by);
  if (((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) && ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0))) return 0;
  return Math.min(
    segmentDistance(ax, ay, cx, cy, dx, dy),
    segmentDistance(bx, by, cx, cy, dx, dy),
    segmentDistance(cx, cy, ax, ay, bx, by),
    segmentDistance(dx, dy, ax, ay, bx, by),
  );
}

/** Oʻchirgʻich yoʻli (`[x, y, …]`, ekran) `radius` bilan shu chiziqqa tegadimi. */
export function strokeHit(placed: PlacedStroke, path: readonly number[], radius: number): boolean {
  const e = localEraser(placed, path, radius);
  return !!e && touches(placed.stroke, e);
}

/** Chiziq oʻrta chizigʻi oʻchirgʻich yoʻliga `reach` dan yaqin keladimi (oʻz koordinatasida). */
function touches(stroke: InkStroke, e: { path: number[]; reach: number }): boolean {
  const p = strokePolyline(stroke);
  const q = e.path;
  if (p.length < 6) return pathDistance(p[0], p[1], q) <= e.reach;
  for (let i = 0; i + 5 < p.length; i += 3) {
    if (q.length < 4) {
      if (segmentDistance(q[0], q[1], p[i], p[i + 1], p[i + 3], p[i + 4]) <= e.reach) return true;
      continue;
    }
    for (let j = 0; j + 3 < q.length; j += 2) {
      const d = segmentsDistance(p[i], p[i + 1], p[i + 3], p[i + 4], q[j], q[j + 1], q[j + 2], q[j + 3]);
      if (d <= e.reach) return true;
    }
  }
  return false;
}

/**
 * Qisman oʻchirish: oʻchirgʻich yoʻli tekkan joy kesib tashlanadi.
 *
 * Qaytaradi: `null` — chiziqqa tegmadi; aks holda qolgan boʻlaklar
 * (boʻsh massiv — butunlay oʻchdi). Boʻlaklar asl chiziqning rangi,
 * qalinligi va bogʻlanishini oladi; shakl esa oddiy chiziqqa aylanadi
 * (kesilgan aylana endi aylana emas).
 *
 * Chiziq avval zichlashtiriladi: saqlangan chiziqda nuqtalar siyrak
 * (RDP), toʻgʻri chiziq esa atigi ikki nuqta — ularsiz kesish joyi
 * oʻchirgʻichdan ancha uzoqda boʻlib qolardi.
 */
export function eraseAlong(
  placed: PlacedStroke,
  path: readonly number[],
  radius: number,
  newId: () => string,
): InkStroke[] | null {
  const e = localEraser(placed, path, radius);
  // Avval arzon tekshiruv: tegmagan chiziq zichlashtirilmaydi.
  if (!e || !touches(placed.stroke, e)) return null;

  const { stroke } = placed;
  const p = strokePolyline(stroke);
  const n = Math.floor(p.length / 3);
  const step = Math.max(1, e.reach / 3);

  const dense: number[] = [p[0], p[1], p[2]];
  for (let i = 1; i < n; i++) {
    const [ax, ay, ap] = [p[i * 3 - 3], p[i * 3 - 2], p[i * 3 - 1]];
    const [bx, by, bp] = [p[i * 3], p[i * 3 + 1], p[i * 3 + 2]];
    const steps = Math.max(1, Math.ceil(Math.hypot(bx - ax, by - ay) / step));
    for (let k = 1; k <= steps; k++) {
      const t = k / steps;
      dense.push(ax + (bx - ax) * t, ay + (by - ay) * t, ap + (bp - ap) * t);
    }
  }

  const pieces: number[][] = [];
  let run: number[] = [];
  let touched = false;
  for (let i = 0; i + 2 < dense.length; i += 3) {
    if (pathDistance(dense[i], dense[i + 1], e.path) <= e.reach) {
      touched = true;
      if (run.length) pieces.push(run);
      run = [];
    } else {
      run.push(dense[i], dense[i + 1], dense[i + 2]);
    }
  }
  if (!touched) return null;
  if (run.length) pieces.push(run);

  // Yakka nuqta qolsa tashlanadi — kesilgan joyda mayda dogʻ qolmasin.
  return pieces
    .filter((piece) => piece.length >= 6)
    .map((piece) => ({
      id: newId(),
      tool: stroke.tool,
      color: stroke.color,
      size: stroke.size,
      points: simplify(piece, 100),
      ...(stroke.anchor ? { anchor: stroke.anchor } : {}),
    }));
}

/* ── Lasso: belgilash va surish (3-bosqich) ──────────────────────────

   Oʻqituvchi yozuv atrofini halqa bilan oʻraydi — ichidagi chiziqlar
   belgilanadi, keyin ular suriladi, rangi yoki qalinligi almashadi,
   oʻchiriladi. Qisqa bosish (halqa chizilmadi) — ostidagi bitta chiziq.

   Chiziq halqa ichida deb hisoblanadi, agar uning nuqtalarining
   `LASSO_SHARE` qismi ichida boʻlsa: qoʻlda chizilgan halqa harfning
   dumini kesib oʻtsa ham harf belgilansin, lekin halqaga tegib oʻtgan
   qoʻshni soʻz belgilanmasin.
   ──────────────────────────────────────────────────────────────────── */

const LASSO_SHARE = 0.6;
/** Shundan kichik halqa (px) — halqa emas, bosish. */
export const LASSO_TAP_PX = 10;

export type InkBounds = Bounds;

/** Nuqta koʻpburchak (`[x, y, …]`) ichidami — nur usuli. */
function insidePolygon(x: number, y: number, poly: readonly number[]): boolean {
  let inside = false;
  for (let i = 0, j = poly.length - 2; i + 1 < poly.length; j = i, i += 2) {
    const [xi, yi, xj, yj] = [poly[i], poly[i + 1], poly[j], poly[j + 1]];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

/** Ulush shu qadamda (px, ekran) olingan nuqtalar boʻyicha oʻlchanadi. */
const LASSO_SAMPLE_PX = 4;

/**
 * Halqa (`[x, y, …]`, ekran) ichidagi chiziqlar.
 *
 * ⚠️ Ulush NUQTALAR SONI boʻyicha emas, UZUNLIK boʻyicha: saqlangan
 * chiziq soddalashtirilgan (RDP) — toʻgʻri boʻlak atigi ikki nuqta,
 * egilgan joyda esa nuqta zich. Nuqta sanalsa, uzun toʻgʻri chiziqning
 * yarmini oʻragan halqa uni butunlay «olgan» boʻlib chiqardi.
 */
export function lassoPick(placed: readonly PlacedStroke[], polygon: readonly number[]): string[] {
  if (polygon.length < 6) return [];
  const out: string[] = [];
  for (const { stroke, place } of placed) {
    const p = strokePolyline(stroke);
    const at = (i: number): [number, number] => [place.x + p[i] * place.scale, place.y + p[i + 1] * place.scale];
    let inside = 0;
    let total = 0;
    for (let i = 0; i + 5 < p.length; i += 3) {
      const [ax, ay] = at(i);
      const [bx, by] = at(i + 3);
      const length = Math.hypot(bx - ax, by - ay);
      const steps = Math.max(1, Math.ceil(length / LASSO_SAMPLE_PX));
      for (let k = 0; k < steps; k++) {
        const t = (k + 0.5) / steps;
        total += length / steps;
        if (insidePolygon(ax + (bx - ax) * t, ay + (by - ay) * t, polygon)) inside += length / steps;
      }
    }
    // Nuqta (bosib qoʻyilgan dogʻ) — uzunligi yoʻq, oʻzi ichidami.
    if (total === 0) {
      total = 1;
      inside = insidePolygon(...at(0), polygon) ? 1 : 0;
    }
    if (inside / total >= LASSO_SHARE) out.push(stroke.id);
  }
  return out;
}

/** `(x, y)` ostidagi eng ustki chiziq; yoʻq boʻlsa `null`. */
export function strokeAt(placed: readonly PlacedStroke[], x: number, y: number, radius: number): string | null {
  for (let i = placed.length - 1; i >= 0; i--) {
    if (strokeHit(placed[i], [x, y], radius)) return placed[i].stroke.id;
  }
  return null;
}

/** Belgilangan chiziqlarning ekrandagi chegarasi — qalinligi bilan; boʻlmasa `null`. */
export function selectionBounds(placed: readonly PlacedStroke[], ids: ReadonlySet<string>): InkBounds | null {
  let out: InkBounds | null = null;
  for (const { stroke, place } of placed) {
    if (!ids.has(stroke.id)) continue;
    const b = strokeBounds(stroke);
    const pad = (strokeWidthPx(stroke.tool, stroke.size) / 2) * place.scale;
    const minX = place.x + b.minX * place.scale - pad;
    const minY = place.y + b.minY * place.scale - pad;
    const maxX = place.x + b.maxX * place.scale + pad;
    const maxY = place.y + b.maxY * place.scale + pad;
    out = out
      ? {
          minX: Math.min(out.minX, minX),
          minY: Math.min(out.minY, minY),
          maxX: Math.max(out.maxX, maxX),
          maxY: Math.max(out.maxY, maxY),
        }
      : { minX, minY, maxX, maxY };
  }
  return out;
}

/**
 * Ekranda `dx, dy` ga surilgan chiziq. Bogʻlangan chiziq oʻz
 * koordinatasida suriladi (vidjet masshtabiga boʻlinib) va bogʻlanishi
 * saqlanadi — slayddagi belgi surilsa ham oʻsha slaydniki.
 */
export function movedStroke({ stroke, place }: PlacedStroke, dx: number, dy: number): InkStroke {
  const lx = dx / place.scale;
  const ly = dy / place.scale;
  const points = stroke.points.slice();
  for (let i = 0; i + 1 < points.length; i += 3) {
    points[i] = Math.round(points[i] + lx);
    points[i + 1] = Math.round(points[i + 1] + ly);
  }
  return { ...stroke, points };
}

/* ── Lazer koʻrsatkich (R335) ────────────────────────────────────────

   Siyoh emas: SAQLANMAYDI, tarixga yozilmaydi. Iz «kometa» kabi —
   boshi yoʻgʻon va yorqin, dumi ingichkalashib yoʻqoladi. Har nuqta
   `LASER_LIFE_MS` yashaydi: aylanani bir soniyada chizsa butun aylana
   koʻrinadi, qoʻyib yuborgach iz oʻzi soʻnadi.
   ──────────────────────────────────────────────────────────────────── */

export const LASER_LIFE_MS = 1100;
const LASER_PX = 7;

/** Lazer izi `[x, y, vaqt ms, …]` → `now` paytidagi kontur. */
export function laserPath(trail: readonly number[], now: number): Path2D | null {
  const input: number[][] = [];
  for (let i = 0; i + 2 < trail.length; i += 3) {
    const age = now - trail[i + 2];
    if (age < LASER_LIFE_MS) input.push([trail[i], trail[i + 1], 1 - age / LASER_LIFE_MS]);
  }
  if (!input.length) return null;
  const d = outlineToPath(
    getStroke(input, { size: LASER_PX, thinning: 0.9, smoothing: 0.5, streamline: 0.3, simulatePressure: false }),
  );
  return d ? new Path2D(d) : null;
}

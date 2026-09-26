/* ════════════════════════════════════════════════════════════════════
   GEOMETRIK SHAKLLAR — sof maʼlumot (React yoʻq).

   Har shakl BIRLIK KVADRATDA (0…1) taʼriflanadi va vidjet oʻlchamiga
   choʻziladi. Shuning uchun kvadrat kengaytirilsa toʻgʻri toʻrtburchak,
   aylana esa ellips boʻladi — bu ATAYLAB: oʻqituvchi bitta shaklni
   sudrab kerakli figurani oladi, katalogda ikki nusxa saqlanmaydi.

   ⚠️ Uchlar tartibi TASODIFIY EMAS — undan `A, B, C…` harflari
   chiqadi. Tartibni oʻzgartirsangiz oʻqituvchining «AB tomon» degani
   boshqa tomonni koʻrsatib qoladi.

   ⚠️ Yagona aylanish qoidasi YOʻQ va bu ataylab — har shakl oʻz
   darslik anʼanasi boʻyicha raqamlanadi, chunki ular bir-biriga zid:

     • uchburchak — A tepada, B chapda, C oʻngda (soat miliga teskari).
       Asosdagi harflar chapdan oʻngga alifbo tartibida oʻqilsin.
     • toʻgʻri burchakli — A tepada, B toʻgʻri burchakda, C oʻngda.
     • toʻrtburchak, parallelogram, trapetsiya, romb va muntazam
       koʻpburchaklar — chap-yuqoridan SOAT MILI boʻyicha. Bu ABCD
       toʻrtburchagining standart yozuvi.

   Sunʼiy bir xillik kiritilsa, shakllarning yarmi darslikdagidan
   boshqacha harflanardi — oʻqituvchi esa doskadagi figurani kitobdagi
   masala bilan solishtiradi.

   Bu yerda `kind` versiyalanmaydi (R131 vidjetga tegishli): shakl
   vidjetning HOLATIDA yashaydi (`state.shape`), shuning uchun yangi
   shakl qoʻshish eski ekranlarga umuman tegmaydi.
   ════════════════════════════════════════════════════════════════════ */

export type ShapeId =
  | "triangle"
  | "right-triangle"
  | "rectangle"
  | "parallelogram"
  | "trapezoid"
  | "rhombus"
  | "circle"
  | "pentagon"
  | "hexagon";

/** Birlik kvadratdagi nuqta: `[0…1, 0…1]`. */
export type ShapePoint = readonly [number, number];

export type ShapeDef = {
  /** Nomi tarjimada: `Doska.shapes.<id>` (tanlash paneli va `aria-label`). */
  id: ShapeId;
  /** `null` — koʻpburchak emas (aylana). */
  points: readonly ShapePoint[] | null;
  /**
   * Toʻgʻri burchak qaysi uchda (uch indeksi). Oʻsha uchda kichik
   * kvadratcha chiziladi.
   *
   * ⚠️ Bu bezak emas — aynan shu belgi figurani «toʻgʻri burchakli»
   * qiladi. Belgisiz chizma oddiy uchburchakdan farq qilmaydi va
   * masala shartini yoʻqotadi.
   */
  rightAngleAt?: number;
};

/**
 * Muntazam koʻpburchak uchlari.
 *
 * Boshlangʻich burchak −90° — birinchi uch TEPADA boʻlsin: beshburchak
 * ham, oltiburchak ham darslikda uchi bilan yuqoriga qarab chiziladi.
 */
function regular(sides: number): ShapePoint[] {
  return Array.from({ length: sides }, (_, i) => {
    const angle = ((-90 + (360 / sides) * i) * Math.PI) / 180;
    return [0.5 + 0.5 * Math.cos(angle), 0.5 + 0.5 * Math.sin(angle)] as ShapePoint;
  });
}

export const SHAPES: Record<ShapeId, ShapeDef> = {
  triangle: {
    id: "triangle",
    // A tepada, B chap-pastda, C oʻng-pastda.
    points: [
      [0.5, 0],
      [0, 1],
      [1, 1],
    ],
  },
  "right-triangle": {
    id: "right-triangle",
    // Toʻgʻri burchak B da — katetlar vertikal va gorizontal, yaʼni
    // darslikdagi standart holat.
    points: [
      [0, 0],
      [0, 1],
      [1, 1],
    ],
    rightAngleAt: 1,
  },
  rectangle: {
    id: "rectangle",
    points: [
      [0, 0],
      [1, 0],
      [1, 1],
      [0, 1],
    ],
    rightAngleAt: 0,
  },
  parallelogram: {
    id: "parallelogram",
    points: [
      [0.28, 0],
      [1, 0],
      [0.72, 1],
      [0, 1],
    ],
  },
  trapezoid: {
    id: "trapezoid",
    points: [
      [0.25, 0],
      [0.75, 0],
      [1, 1],
      [0, 1],
    ],
  },
  rhombus: {
    id: "rhombus",
    points: [
      [0.5, 0],
      [1, 0.5],
      [0.5, 1],
      [0, 0.5],
    ],
  },
  circle: {
    id: "circle",
    points: null,
  },
  pentagon: {
    id: "pentagon",
    points: regular(5),
  },
  hexagon: {
    id: "hexagon",
    points: regular(6),
  },
};

/** Tanlash panelidagi tartib — soddadan murakkabga. */
export const SHAPE_ORDER: ShapeId[] = [
  "triangle",
  "right-triangle",
  "rectangle",
  "parallelogram",
  "trapezoid",
  "rhombus",
  "circle",
  "pentagon",
  "hexagon",
];

/**
 * Uch harflari. Lotin bosh harflari — oʻzbek darsliklarida ham
 * shunday (ABC uchburchak, ABCD toʻrtburchak).
 */
export const VERTEX_LETTERS = ["A", "B", "C", "D", "E", "F", "G", "H"] as const;

export function shapeById(id: unknown): ShapeDef {
  return (typeof id === "string" && SHAPES[id as ShapeId]) || SHAPES.triangle;
}

/**
 * Birlik koordinatalarni pikselga oʻgiradi.
 *
 * `pad` — chetdagi zaxira: yorliqlar shakldan TASHQARIDA turadi,
 * shuning uchun shaklning oʻzi ichkariga siqiladi.
 */
export function toPixels(
  points: readonly ShapePoint[],
  width: number,
  height: number,
  pad: number,
): [number, number][] {
  const innerW = Math.max(1, width - pad * 2);
  const innerH = Math.max(1, height - pad * 2);
  return points.map(([x, y]) => [pad + x * innerW, pad + y * innerH]);
}

/** Ogʻirlik markazi — yorliqni qaysi tomonga surishni shu belgilaydi. */
export function centroid(points: readonly [number, number][]): [number, number] {
  const sx = points.reduce((s, p) => s + p[0], 0);
  const sy = points.reduce((s, p) => s + p[1], 0);
  return [sx / points.length, sy / points.length];
}

/**
 * `from` dan `to` ga birlik vektor. Nuqtalar ustma-ust tushsa `[0, -1]`
 * qaytadi — yorliq baribir bir joyga qoʻyilsin, NaN chiqmasin.
 */
export function unitVector(
  from: readonly [number, number],
  to: readonly [number, number],
): [number, number] {
  const dx = to[0] - from[0];
  const dy = to[1] - from[1];
  const length = Math.hypot(dx, dy);
  if (length < 0.0001) return [0, -1];
  return [dx / length, dy / length];
}

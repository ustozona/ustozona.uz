import { CvImage, adaptiveThreshold, otsu, threshold, warp, type Point } from "@/lib/omr/cv";
import { GRID_WITH_BORDER, MARKER_GRID, matchMarker, type MarkerMatch } from "./marker";

/* ════════════════════════════════════════════════════════════════════
   KARTALARNI ANIQLASH — bitta kadrda butun sinf

   Varaq skaneridan farqi: u BITTA katta varaqni QR orqali topadi, bu
   esa bir kadrda OʻNLAB kichik belgini qidiradi va hech qanday QR
   yoʻq. Shuning uchun boshqa yoʻl — kontur (chegara) qidirish:

     kadr → kulrang → lokal chegaralash → konturlar
          → toʻrtburchakka soddalashtirish
          → nomzodni filtrlash (qavariq, oʻlchami, tomonlar nisbati)
          → toʻgʻrilash (warp) → ramka qora ekanini tekshirish
          → 5×5 katakni oʻqish → lugʻatga solishtirish

   Bu ArUco aniqlagichining klassik quvuri. `findContours` va
   `approxPolyDP` js-aruco (MIT) dan koʻchirilgan — jonli varaq
   skaneriga ular kerak boʻlmagani uchun oʻshanda olinmagan edi.

   ⚠️ NOTOʻGʻRI OʻQISHDAN KOʻRA RAD ETISH. Har filtr shubhalini
   tashlaydi: sinfda devordagi plakat, kitob muqovasi, deraza
   romi — hammasi toʻrtburchak. Ulardan biri kartaga oʻxshab qolsa,
   baho begona bolaga tushardi.
   ════════════════════════════════════════════════════════════════════ */

export type DetectedCard = {
  match: MarkerMatch;
  /** Kadrdagi burchaklar — ekranda belgilash uchun. */
  corners: Point[];
};

/* ── Konturlar (js-aruco, MIT — `@/lib/omr/cv.ts` dagi izohga qarang) ── */

const NEIGHBORHOOD = [
  [1, 0], [1, -1], [0, -1], [-1, -1], [-1, 0], [-1, 1], [0, 1], [1, 1],
] as const;

function neighborhoodDeltas(width: number): number[] {
  const deltas = NEIGHBORHOOD.map(([dx, dy]) => dx + dy * width);
  return deltas.concat(deltas);
}

function binaryBorder(src: CvImage, dst: Int32Array): Int32Array {
  const s = src.data;
  const { width, height } = src;
  let posSrc = 0;
  let posDst = 0;
  for (let j = -2; j < width; j++) dst[posDst++] = 0;
  for (let i = 0; i < height; i++) {
    dst[posDst++] = 0;
    for (let j = 0; j < width; j++) dst[posDst++] = s[posSrc++] === 0 ? 0 : 1;
    dst[posDst++] = 0;
  }
  for (let j = -2; j < width; j++) dst[posDst++] = 0;
  return dst;
}

type Contour = Point[] & { hole?: boolean };

function borderFollowing(
  src: Int32Array,
  pos: number,
  nbd: number,
  point: Point,
  hole: boolean,
  deltas: number[]
): Contour {
  const contour: Contour = [];
  contour.hole = hole;

  let s = hole ? 0 : 4;
  const sEnd = s;
  let pos1 = 0;
  do {
    s = (s - 1) & 7;
    pos1 = pos + deltas[s];
    if (src[pos1] !== 0) break;
  } while (s !== sEnd);

  if (s === sEnd) {
    src[pos] = -nbd;
    contour.push({ x: point.x, y: point.y });
    return contour;
  }

  let pos3 = pos;
  let pos4 = 0;
  for (;;) {
    const localEnd = s;
    do {
      pos4 = pos3 + deltas[++s];
    } while (src[pos4] === 0);
    s &= 7;

    if ((s - 1) >>> 0 < localEnd >>> 0) src[pos3] = -nbd;
    else if (src[pos3] === 1) src[pos3] = nbd;

    contour.push({ x: point.x, y: point.y });
    point.x += NEIGHBORHOOD[s][0];
    point.y += NEIGHBORHOOD[s][1];

    if (pos4 === pos && pos3 === pos1) break;
    pos3 = pos4;
    s = (s + 4) & 7;
  }
  return contour;
}

function findContours(img: CvImage, scratch: Int32Array): Contour[] {
  const { width, height } = img;
  const contours: Contour[] = [];
  const src = binaryBorder(img, scratch);
  const deltas = neighborhoodDeltas(width + 2);

  let pos = width + 3;
  let nbd = 1;
  for (let i = 0; i < height; i++, pos += 2) {
    for (let j = 0; j < width; j++, pos++) {
      const pix = src[pos];
      if (pix === 0) continue;
      const outer = pix === 1 && src[pos - 1] === 0;
      const hole = pix >= 1 && src[pos + 1] === 0;
      if (outer || hole) {
        nbd++;
        contours.push(borderFollowing(src, pos, nbd, { x: j, y: i }, hole, deltas));
      }
    }
  }
  return contours;
}

/** Konturni koʻpburchakka soddalashtirish (Ramer-Douglas-Peucker).

    Soddalashtirilgan koʻpburchakda toʻrtta nuqta qolsa — bu
    toʻrtburchak nomzodi. */
function approxPolyDP(contour: Contour, epsilon: number): Point[] {
  if (contour.length < 4) return [];
  const eps2 = epsilon * epsilon;
  const n = contour.length;

  // Eng uzoq nuqtalar juftini topib boshlangʻich kesmalarni olamiz.
  let startIdx = 0;
  let farIdx = 0;
  let maxDist = -1;
  for (let i = 1; i < n; i++) {
    const dx = contour[i].x - contour[0].x;
    const dy = contour[i].y - contour[0].y;
    const d = dx * dx + dy * dy;
    if (d > maxDist) {
      maxDist = d;
      farIdx = i;
    }
  }
  maxDist = -1;
  for (let i = 0; i < n; i++) {
    const dx = contour[i].x - contour[farIdx].x;
    const dy = contour[i].y - contour[farIdx].y;
    const d = dx * dx + dy * dy;
    if (d > maxDist) {
      maxDist = d;
      startIdx = i;
    }
  }

  const out: Point[] = [];
  const stack: [number, number][] = [
    [startIdx, farIdx],
    [farIdx, startIdx],
  ];

  while (stack.length > 0) {
    const [from, to] = stack.pop() as [number, number];
    const a = contour[from];
    const b = contour[to];
    const dx = b.x - a.x;
    const dy = b.y - a.y;

    let worst = -1;
    let worstIdx = -1;
    let i = (from + 1) % n;
    while (i !== to) {
      const p = contour[i];
      const dist = Math.abs((p.y - a.y) * dx - (p.x - a.x) * dy);
      if (dist > worst) {
        worst = dist;
        worstIdx = i;
      }
      i = (i + 1) % n;
    }

    if (worstIdx >= 0 && worst * worst > eps2 * (dx * dx + dy * dy)) {
      stack.push([worstIdx, to]);
      stack.push([from, worstIdx]);
    } else {
      out.push({ x: a.x, y: a.y });
    }
    // Koʻpburchak juda murakkab — bu karta emas, vaqt sarflamaymiz.
    if (out.length > 8) return out;
  }
  return out;
}

function isConvex(poly: Point[]): boolean {
  let orientation = 0;
  const len = poly.length;
  let prev = poly[len - 1];
  let cur = poly[0];
  let dx0 = cur.x - prev.x;
  let dy0 = cur.y - prev.y;

  for (let i = 0, j = 0; i < len; i++) {
    if (++j === len) j = 0;
    prev = cur;
    cur = poly[j];
    const dx = cur.x - prev.x;
    const dy = cur.y - prev.y;
    const cross1 = dx * dy0;
    const cross2 = dy * dx0;
    orientation |= cross2 > cross1 ? 1 : cross2 < cross1 ? 2 : 3;
    if (orientation === 3) return false;
    dx0 = dx;
    dy0 = dy;
  }
  return true;
}

function perimeter(poly: Point[]): number {
  let p = 0;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    p += Math.hypot(poly[i].x - poly[j].x, poly[i].y - poly[j].y);
  }
  return p;
}

function minEdge(poly: Point[]): number {
  let min = Infinity;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    min = Math.min(min, Math.hypot(poly[i].x - poly[j].x, poly[i].y - poly[j].y));
  }
  return min;
}

/** Burchaklarni soat yoʻnalishida tartiblaydi.

    Belgi burilishi MAʼNO tashiydi, shuning uchun tartib barqaror
    boʻlishi shart: aks holda bir xil karta goh A, goh C deb oʻqilardi. */
function orderCorners(poly: Point[]): Point[] {
  const cx = (poly[0].x + poly[1].x + poly[2].x + poly[3].x) / 4;
  const cy = (poly[0].y + poly[1].y + poly[2].y + poly[3].y) / 4;
  return [...poly].sort(
    (a, b) => Math.atan2(a.y - cy, a.x - cx) - Math.atan2(b.y - cy, b.x - cx)
  );
}

/* ── Aniqlagich ───────────────────────────────────────────────────── */

/** Toʻgʻrilangan belgi tomoni: har katakka 8 piksel. */
const WARP = GRID_WITH_BORDER * 8;

export type DetectOptions = {
  /** Kartaning kadrdagi eng kichik tomoni (piksel). Undan kichigi
      shovqin deb qaraladi — sinfda toʻrtburchak koʻp. */
  minEdgePx?: number;
};

/** Bitta kadrdan barcha kartalarni oʻqiydi. */
export function detectCards(
  gray: CvImage,
  buffers: { thres: CvImage; scratch: Int32Array; warped: CvImage; warpThres: CvImage },
  options: DetectOptions = {}
): DetectedCard[] {
  const minEdgePx = options.minEdgePx ?? 20;

  /* Lokal chegaralash: sinfda yorugʻlik notekis — deraza yonidagi
     bola yorugʻ, burchakdagisi soyada. Global chegara ulardan birini
     yoʻqotardi. */
  adaptiveThreshold(gray, buffers.thres, 9, 7);

  const contours = findContours(buffers.thres, buffers.scratch);
  const found: DetectedCard[] = [];
  const seen = new Set<number>();

  for (const contour of contours) {
    if (contour.length < 4 * 4) continue; // juda kichik — shovqin
    const poly = approxPolyDP(contour, perimeter(contour) * 0.02);
    if (poly.length !== 4) continue;
    if (!isConvex(poly)) continue;
    if (minEdge(poly) < minEdgePx) continue;

    const corners = orderCorners(poly);
    warp(gray, buffers.warped, corners, WARP);
    /* Toʻgʻrilangan yamoqda GLOBAL chegara (Otsu), lokal emas.

       Lokal chegara pikselni ATROFI bilan solishtiradi va katta bir
       tekis qora maydonning faqat chekkasini belgilaydi — ramka
       ichi «boʻsh» boʻlib chiqadi va tekshiruv har doim yiqiladi.
       Yamoq kichik va bir xil yoritilgan, shuning uchun bu yerda
       global chegara ham toʻgʻri, ham aniqroq. */
    threshold(buffers.warped, buffers.warpThres, otsu(buffers.warped));

    const bits = readMarkerBits(buffers.warpThres, WARP);
    if (bits === null) continue;

    const match = matchMarker(bits);
    if (!match) continue;
    // Bitta karta ikki kontur bergan boʻlishi mumkin (tashqi va
    // ichki chegara) — birinchisini olamiz.
    if (seen.has(match.studentNo)) continue;
    seen.add(match.studentNo);

    found.push({ match, corners });
  }

  return found;
}

/** Toʻgʻrilangan tasvirdan 5×5 bitni oʻqiydi.

    Avval RAMKA tekshiriladi: chetdagi katak halqasi qora boʻlishi
    shart. Bu eng arzon va eng kuchli filtr — sinfdagi tasodifiy
    toʻrtburchaklarning deyarli hammasi shu yerda tushib qoladi. */
function readMarkerBits(img: CvImage, size: number): number | null {
  const cell = size / GRID_WITH_BORDER;
  const data = img.data;

  /** Katakning oʻrtasidagi qora piksellar ulushi. */
  function fill(row: number, col: number): number {
    const x0 = Math.round(col * cell + cell * 0.25);
    const y0 = Math.round(row * cell + cell * 0.25);
    const x1 = Math.round(col * cell + cell * 0.75);
    const y1 = Math.round(row * cell + cell * 0.75);
    let dark = 0;
    let total = 0;
    for (let y = y0; y < y1; y++) {
      for (let x = x0; x < x1; x++) {
        total++;
        if (data[y * size + x] > 128) dark++;
      }
    }
    return total > 0 ? dark / total : 0;
  }

  for (let i = 0; i < GRID_WITH_BORDER; i++) {
    if (fill(0, i) < 0.6) return null;
    if (fill(GRID_WITH_BORDER - 1, i) < 0.6) return null;
    if (fill(i, 0) < 0.6) return null;
    if (fill(i, GRID_WITH_BORDER - 1) < 0.6) return null;
  }

  let bits = 0;
  for (let r = 0; r < MARKER_GRID; r++) {
    for (let c = 0; c < MARKER_GRID; c++) {
      const ratio = fill(r + 1, c + 1);
      /* Oraliq qiymat = shubha. Katak yo aniq qora, yo aniq oq
         boʻlishi kerak; oradagi holat qiyshiq burchak yoki xira
         suratdan darak beradi va bunday oʻqish tashlanadi. */
      if (ratio > 0.35 && ratio < 0.65) return null;
      if (ratio >= 0.65) bits |= 1 << (r * MARKER_GRID + c);
    }
  }
  return bits;
}

/** Aniqlagich uchun buferlar — har kadrda qayta ajratilmasin. */
export function makeDetectBuffers(width: number, height: number) {
  return {
    thres: new CvImage(width, height, new Uint8Array(width * height)),
    scratch: new Int32Array((width + 2) * (height + 2)),
    warped: new CvImage(WARP, WARP, new Uint8Array(WARP * WARP)),
    warpThres: new CvImage(WARP, WARP, new Uint8Array(WARP * WARP)),
  };
}

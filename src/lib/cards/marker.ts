import {
  MARKER_DICTIONARY,
  MARKER_GRID,
  MARKER_MIN_CROSS_DISTANCE,
  MARKER_MIN_SELF_DISTANCE,
} from "./marker-dictionary";

/* ════════════════════════════════════════════════════════════════════
   JAVOB KARTASI BELGISI — ArUco maktabi

   ── NEGA QR EMAS ────────────────────────────────────────────────────

   Karta Plickers naqshida ishlaydi: oʻqituvchi butun sinfni BITTA
   suratga oladi. Orqa qatordagi bola 5-6 metrda, uning kartasi kadrda
   ~40×40 piksel boʻladi. QR ning eng kichik varianti 21×21 modul —
   har modulga ikki pikseldan kam tushadi, yaʼni oʻqib boʻlmaydi.

   Shuning uchun yirik katakli OʻZ belgimiz: 5×5 maʼlumot katagi +
   qora ramka = 7×7. Plickers ham, ArUco ham aynan shu yoʻldan boradi.

   ── UCH TALAB ───────────────────────────────────────────────────────

   1. HAR BURILISH FARQLI. Karta burab koʻtariladi, burilish javobni
      bildiradi. 180° burilganda belgi oʻziga oʻxshasa — javob
      aniqlanmaydi. Lugʻatda burilishlar masofasi ${" "}
      `MARKER_MIN_SELF_DISTANCE` bit.

   2. BELGILAR BIR-BIRIGA OʻXSHAMASIN. Ikki oʻquvchi kartasi chalkashsa
      baho notoʻgʻri bolaga yoziladi — eng qimmat xato. Masofa BARCHA
      burilishlar boʻyicha hisoblangan: Aliyevning kartasi Valiyevning
      90° burilgan kartasiga ham oʻxshamaydi.

   3. XATOGA CHIDAM. Karta bukiladi, soya tushadi, katak notoʻgʻri
      oʻqiladi. Minimal masofa `d` boʻlsa `(d-1)/2` bit xato
      tuzatiladi.

   Bu uchtasi ArUco lugʻatlarining qurilish tamoyili (Garrido-Jurado
   va b., 2014). Tayyor ArUco lugʻati olinmadi, chunki u burilishni
   ANIQLAYDI, lekin lugʻatni burilishga nisbatan tanlamaydi — bizda
   esa burilishning oʻzi maʼno tashiydi.

   Lugʻat `marker-dictionary.ts` da MUZLATILGAN: u kartaga bosiladi va
   skanerda solishtiriladi, yaʼni chizuvchi bilan oʻquvchi orasidagi
   shartnoma. Ishga tushish paytida hisoblash sekin ham, xavfli ham
   boʻlardi (algoritm tegilsa eski kartalar jimgina buzilardi).
   ════════════════════════════════════════════════════════════════════ */

export { MARKER_DICTIONARY, MARKER_GRID } from "./marker-dictionary";

/** Ramka bilan birga umumiy katak soni. */
export const GRID_WITH_BORDER = MARKER_GRID + 2;
const BITS = MARKER_GRID * MARKER_GRID;

/** Belgi — `BITS` bitli butun son. Bit `i` = katak (i/GRID, i%GRID). */
export type MarkerBits = number;

/** Kartani burash javobni bildiradi. Tartib SOAT YOʻNALISHIDA:
    0° = A (kartada yozilgani tepada), 90° = B, 180° = C, 270° = D. */
export const ROTATION_ANSWERS = ["A", "B", "C", "D"] as const;
export type CardAnswer = (typeof ROTATION_ANSWERS)[number];

/** Nechta oʻquvchiga yetadi. */
export const MARKER_CAPACITY = MARKER_DICTIONARY.length;

/** Belgini 90° soat yoʻnalishida buradi. */
export function rotate90(bits: MarkerBits): MarkerBits {
  let out = 0;
  for (let r = 0; r < MARKER_GRID; r++) {
    for (let c = 0; c < MARKER_GRID; c++) {
      if (bits & (1 << (r * MARKER_GRID + c))) {
        out |= 1 << (c * MARKER_GRID + (MARKER_GRID - 1 - r));
      }
    }
  }
  return out;
}

/** Toʻrt burilish: [0°, 90°, 180°, 270°]. */
export function allRotations(bits: MarkerBits): MarkerBits[] {
  const r0 = bits;
  const r1 = rotate90(r0);
  const r2 = rotate90(r1);
  const r3 = rotate90(r2);
  return [r0, r1, r2, r3];
}

/** Nechta bit farq qiladi. */
export function hamming(a: MarkerBits, b: MarkerBits): number {
  let x = a ^ b;
  let n = 0;
  while (x) {
    x &= x - 1;
    n++;
  }
  return n;
}

/** Belgi katagi toʻlami — chizish va oʻqish uchun umumiy geometriya.

    Bitta joyda turishi SHART: chizuvchi bilan oʻquvchi bir xil
    tartibda oʻqishi kerak, aks holda karta 90° burilgandek koʻrinadi. */
export function isCellFilled(bits: MarkerBits, row: number, col: number): boolean {
  return (bits & (1 << (row * MARKER_GRID + col))) !== 0;
}

/** Sinf roʻyxatidagi tartib raqami (1..N) → belgi.

    `null` — lugʻat tugagan. Chaqiruvchi buni oʻqituvchiga AYTISHI
    kerak: jimgina takroriy karta chizish ikki bolaga bir xil karta
    berish demak, yaʼni baho notoʻgʻri odamga tushadi. */
export function markerForStudent(no: number): MarkerBits | null {
  if (!Number.isInteger(no) || no < 1 || no > MARKER_CAPACITY) return null;
  return MARKER_DICTIONARY[no - 1];
}

/* ── Oʻqish tomoni ────────────────────────────────────────────────── */

export type MarkerMatch = {
  /** Sinf roʻyxatidagi tartib raqami. */
  studentNo: number;
  /** Karta necha marta 90° burilgan. */
  rotation: number;
  /** Shu burilish bildiradigan javob. */
  answer: CardAnswer;
  /** Nechta bit xato tuzatildi (0 = mukammal oʻqish). */
  corrected: number;
};

/** Nazariy chegara: lugʻat masofasi 8 → 3 bitgacha tuzatsa boʻladi. */
export const THEORETICAL_CORRECTABLE = Math.floor((MARKER_MIN_CROSS_DISTANCE - 1) / 2);

/** AMALDA ishlatiladigan chegara — nazariydan PAST, ataylab.

    ⚠️ Bu qiymat oʻlchov natijasi, taxmin emas
    (`scripts/verify-card-markers.ts`). 12 600 sinovda ogʻir shikast
    (4-8 bit) berilganda:

        tuzatish 3 bit  → 253 marta NOTOʻGʻRI oʻquvchi · shovqin 2,97%
        tuzatish 2 bit  →  28 marta NOTOʻGʻRI oʻquvchi · shovqin 0,33%
        tuzatish 1 bit  →   1 marta NOTOʻGʻRI oʻquvchi · shovqin 0,03%

    Nazariy chegarani toʻliq ishlatish notoʻgʻri oʻquvchi berish
    xavfini 250 barobar oshiradi. Rad etish esa deyarli bepul: karta
    jonli kameradan sekundiga oʻnlab marta oʻqiladi, bitta kadr rad
    etilsa keyingisi oʻqiydi. Notoʻgʻri oʻqish — boshqa bolaning
    jurnalidagi baho, va uni hech kim sezmaydi.

    Shu sababli oʻquvchi ham KETMA-KET IKKI KADR bir xil natija
    bergandagina qabul qilinishi kerak — qolgan 0,03% ham shunda
    kvadratga koʻtarilib yoʻqoladi. */
export const MAX_CORRECTABLE = 1;

/** Eng yaqin va ikkinchi nomzod orasidagi eng kam farq.

    Hozirgi lugʻatda bu shart `maxErrors` dan KELIB CHIQADI (masofa 8
    boʻlgani uchun), yaʼni amalda hech narsani rad etmaydi. U baribir
    qoldirildi: lugʻat kelajakda kengaytirilsa (masofa kamayishi
    mumkin) shart oʻzi ishlay boshlaydi va notoʻgʻri oʻqishning oldini
    oladi. Tekin xavfsizlik toʻri. */
const MIN_MARGIN = 4;

/**
 * Oʻqilgan bitlarni lugʻatga solishtiradi.
 *
 * Ikki bosqichli tekshiruv:
 *   1. eng yaqin nomzodgacha masofa `maxErrors` dan oshmasin;
 *   2. BOSHQA OʻQUVCHINING eng yaqin varianti kamida `MIN_MARGIN`
 *      bit uzoqroq boʻlsin.
 *
 * «Eng yaqini» yolgʻiz yetarli emas: devordagi plakat yoki kitob
 * muqovasi ham kimgadir eng yaqin boʻlib chiqadi.
 */
export function matchMarker(
  bits: MarkerBits,
  maxErrors: number = MAX_CORRECTABLE
): MarkerMatch | null {
  let best: MarkerMatch | null = null;
  let bestDistance = Number.POSITIVE_INFINITY;

  for (let i = 0; i < MARKER_DICTIONARY.length; i++) {
    const rots = allRotations(MARKER_DICTIONARY[i]);
    for (let r = 0; r < 4; r++) {
      const d = hamming(bits, rots[r]);
      if (d < bestDistance) {
        bestDistance = d;
        best = { studentNo: i + 1, rotation: r, answer: ROTATION_ANSWERS[r], corrected: d };
      }
    }
  }

  if (!best || bestDistance > maxErrors) return null;

  /* Ikkinchi tekshiruv BOSHQA oʻquvchilar boʻyicha. Bir oʻquvchining
     oʻz burilishlari yaqin boʻlsa muammo yoʻq (u baribir oʻsha bola),
     xavf faqat begona kartaga oʻxshab qolishda. */
  let otherBest = Number.POSITIVE_INFINITY;
  for (let i = 0; i < MARKER_DICTIONARY.length; i++) {
    if (i + 1 === best.studentNo) continue;
    for (const rotated of allRotations(MARKER_DICTIONARY[i])) {
      const d = hamming(bits, rotated);
      if (d < otherBest) otherBest = d;
    }
  }
  if (otherBest - bestDistance < MIN_MARGIN) return null;

  return best;
}

/** Lugʻat sifati — hujjat va sinov uchun. */
export const MARKER_QUALITY = {
  size: MARKER_DICTIONARY.length,
  grid: MARKER_GRID,
  bits: BITS,
  minSelfRotationDistance: MARKER_MIN_SELF_DISTANCE,
  minCrossDistance: MARKER_MIN_CROSS_DISTANCE,
  correctableBits: MAX_CORRECTABLE,
} as const;

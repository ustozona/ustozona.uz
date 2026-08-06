/* ════════════════════════════════════════════════════════════════════
   KARTA BELGILARI LUGʻATINI YARATISH

   Ishga tushirish:  npx tsx scripts/gen-card-markers.ts

   Natija `src/lib/cards/marker-dictionary.ts` ga yoziladi.

   ⚠️ LUGʻAT — SHARTNOMA. U kartaga bosiladi va skanerda solishtiriladi.
   Chop etilgan karta yillab ishlatiladi, demak lugʻat OʻZGARMASLIGI
   kerak: bir marta yaratilib faylga muzlatiladi va koʻrib chiqiladi.
   Ishga tushish paytida hisoblash ikki sababdan yomon — sekin (~3 s)
   va xavfli (algoritm tegilsa eski kartalar jimgina buziladi).

   Qayta yaratish FAQAT ongli qaror bilan: eski kartalar yaroqsiz
   boʻladi va butun maktab qaytadan chop etishi kerak.
   ════════════════════════════════════════════════════════════════════ */
import { writeFileSync } from "node:fs";

const GRID = 5;
const BITS = GRID * GRID;

/** Nechta belgi kerak. Plickers 63 ta karta bilan ishlaydi — jahon
    amaliyotidagi shu chegara olindi, u har qanday sinfga yetadi. */
const TARGET = 63;

/** Burilishlar orasidagi eng kam masofa — javob aniqligi. */
const MIN_SELF = 9;
/** Belgilar orasidagi eng kam masofa — kim ekanligi aniqligi. */
const MIN_CROSS = 8;
/** Katak zichligi: juda boʻsh yoki juda toʻla belgi ramkaga qoʻshilib
    ketadi va yorugʻlik oʻzgarishiga sezgir boʻladi. */
const MIN_ONES = 9;
const MAX_ONES = 16;

function rotate90(bits: number): number {
  let out = 0;
  for (let r = 0; r < GRID; r++) {
    for (let c = 0; c < GRID; c++) {
      if (bits & (1 << (r * GRID + c))) out |= 1 << (c * GRID + (GRID - 1 - r));
    }
  }
  return out;
}

function rotations(bits: number): number[] {
  const out = [bits];
  for (let i = 0; i < 3; i++) out.push(rotate90(out[out.length - 1]));
  return out;
}

function hamming(a: number, b: number): number {
  let x = a ^ b;
  let n = 0;
  while (x) {
    x &= x - 1;
    n++;
  }
  return n;
}

function popcount(x: number): number {
  let v = x;
  let n = 0;
  while (v) {
    v &= v - 1;
    n++;
  }
  return n;
}

function selfDistance(bits: number): number {
  const r = rotations(bits);
  let min = BITS;
  for (let i = 0; i < 4; i++) {
    for (let j = i + 1; j < 4; j++) min = Math.min(min, hamming(r[i], r[j]));
  }
  return min;
}

function crossDistance(rotsA: number[], b: number): number {
  const rotsB = rotations(b);
  let min = BITS;
  for (const x of rotsA) {
    for (const y of rotsB) min = Math.min(min, hamming(x, y));
  }
  return min;
}

const dict: number[] = [];
const dictRots: number[][] = [];

for (let cand = 0; cand < 1 << BITS; cand++) {
  const ones = popcount(cand);
  if (ones < MIN_ONES || ones > MAX_ONES) continue;
  if (selfDistance(cand) < MIN_SELF) continue;

  let ok = true;
  for (let i = 0; i < dictRots.length; i++) {
    if (crossDistance(dictRots[i], cand) < MIN_CROSS) {
      ok = false;
      break;
    }
  }
  if (!ok) continue;

  dict.push(cand);
  dictRots.push(rotations(cand));
  if (dict.length >= TARGET) break;
}

// Haqiqiy erishilgan masofalar — qurilish shartidan yaxshiroq boʻlishi
// mumkin, hujjatga aynan shu yoziladi.
let minSelf = BITS;
let minCross = BITS;
for (let i = 0; i < dict.length; i++) {
  minSelf = Math.min(minSelf, selfDistance(dict[i]));
  for (let j = i + 1; j < dict.length; j++) {
    minCross = Math.min(minCross, crossDistance(dictRots[i], dict[j]));
  }
}

const header = `/* ════════════════════════════════════════════════════════════════════
   KARTA BELGILARI LUGʻATI — AVTOMATIK YARATILGAN, QOʻLDA TAHRIRLAMANG

   Yaratuvchi: scripts/gen-card-markers.ts
   Qayta yaratish ESKI KARTALARNI YAROQSIZ QILADI — faqat ongli qaror
   bilan (butun maktab qaytadan chop etishi kerak boʻladi).

   Katak:                 ${GRID}×${GRID} (+ qora ramka = ${GRID + 2}×${GRID + 2})
   Belgilar soni:         ${dict.length}
   Burilishlar masofasi:  ${minSelf} bit  (javob aniqligi)
   Belgilar masofasi:     ${minCross} bit  (kim ekanligi aniqligi)
   Tuzatiladigan xato:    ${Math.floor((minCross - 1) / 2)} bit

   «Belgilar masofasi» BARCHA burilishlar boʻyicha hisoblangan: bitta
   oʻquvchining kartasi boshqasining burilgan kartasiga ham oʻxshamaydi.
   ════════════════════════════════════════════════════════════════════ */

/** Belgi — ${BITS} bitli butun son. Bit i = katak (i/${GRID}, i%${GRID}). */
export const MARKER_GRID = ${GRID};
export const MARKER_MIN_SELF_DISTANCE = ${minSelf};
export const MARKER_MIN_CROSS_DISTANCE = ${minCross};

export const MARKER_DICTIONARY: readonly number[] = [
`;

const body = dict
  .map((m, i) => `  0b${m.toString(2).padStart(BITS, "0")}, // #${i + 1}`)
  .join("\n");

writeFileSync(
  "src/lib/cards/marker-dictionary.ts",
  `${header}${body}\n];\n`,
  "utf8"
);

console.log(
  `${dict.length} belgi · burilish masofasi ${minSelf} · belgilar masofasi ${minCross} · ` +
    `${Math.floor((minCross - 1) / 2)} bit xato tuzatiladi`
);

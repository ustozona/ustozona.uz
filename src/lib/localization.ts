// Oʻzbekcha lokalizatsiya — kun/oy nomlari uchun yagona manba.
// Apostrof konvensiyasi: ʻ (U+02BB) Oʻ/Gʻ uchun, ʼ (U+02BC) tutuq belgisi.
//
// DIQQAT — ikki xil kun tartibi bor:
//  • DAYS_UZ*     → DUSHANBA-birinchi (timetable/jadval konvensiyasi, Dushanba = index 0).
//  • DAYS_UZ_SUN  → YAKSHANBA-birinchi (JS `Date.getDay()` bilan mos, Yakshanba = index 0).
// Massivни ishlatishдан oldin qaysi tartib kerakligiga ishonch hosil qiling.

// `readonly string[]` — oʻzgarmas, lekin `.indexOf(someString)` kabi umumiy
// string amallariga ruxsat beradi (`as const` tor literal-union berib, uni buzardi).

/** Kun nomlari (toʻliq) — DUSHANBA-birinchi. `dayOfWeek` 1–7 uchun `[day - 1]`. */
export const DAYS_UZ: readonly string[] = [
  "Dushanba", "Seshanba", "Chorshanba", "Payshanba", "Juma", "Shanba", "Yakshanba",
];

/** Kun nomlari (qisqa) — DUSHANBA-birinchi. */
export const DAYS_UZ_SHORT: readonly string[] = ["Du", "Se", "Ch", "Pa", "Ju", "Sha", "Yak"];

/** Kun nomlari (toʻliq) — YAKSHANBA-birinchi. `Date.getDay()` (0=Yakshanba) uchun. */
export const DAYS_UZ_SUN: readonly string[] = [
  "Yakshanba", "Dushanba", "Seshanba", "Chorshanba", "Payshanba", "Juma", "Shanba",
];

/** Kun nomlari (2 harf, tor kalendar katakchalariga moslashtirilgan) — YAKSHANBA-birinchi. */
export const DAYS_UZ_SUN_SHORT: readonly string[] = ["Ya", "Du", "Se", "Ch", "Pa", "Ju", "Sh"];

/** Oy nomlari (toʻliq, bosh harf) — 0=Yanvar … 11=Dekabr. */
export const MONTHS_UZ: readonly string[] = [
  "Yanvar", "Fevral", "Mart", "Aprel", "May", "Iyun",
  "Iyul", "Avgust", "Sentabr", "Oktabr", "Noyabr", "Dekabr",
];

/** Oy nomlari (qisqa, kichik harf). */
export const MONTHS_UZ_SHORT: readonly string[] = [
  "yan", "fev", "mar", "apr", "may", "iyun",
  "iyul", "avg", "sen", "okt", "noy", "dek",
];

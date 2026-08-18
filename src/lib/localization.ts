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

/**
 * Nisbiy vaqt: "hozir / 5 daq oldin / 3 soat oldin / 2 kun oldin / 12 avg".
 *
 * Nega nisbiy: takrorlanuvchi aniq sanalar (`2026-08-11` yetti marta)
 * koʻzga ilashmaydi — roʻyxatda «qaysi biri yangiroq» degan savol
 * muhim, aniq sana emas. Bir haftadan oshgach aniq kunga oʻtiladi,
 * chunki «47 kun oldin» ni odam baribir sanaga aylantirib oʻylaydi.
 * Aniq sanani chaqiruvchi `title` (tooltip) da koʻrsatsin.
 *
 * ⚠️ Bu funksiya `NotificationsBell` dagi mahalliy nusxadan koʻchirildi —
 * u yerda `MONTHS_SHORT` ham qaytadan yozilgan edi. Yagona manba shu yer.
 */
export function timeAgoUz(value: Date | string): string {
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  const min = Math.floor((Date.now() - d.getTime()) / 60_000);
  if (min < 1) return "hozir";
  if (min < 60) return `${min} daq oldin`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} soat oldin`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day} kun oldin`;
  return `${d.getDate()} ${MONTHS_UZ_SHORT[d.getMonth()]}`;
}

/**
 * `yyyy-mm-dd` → "Dushanba, 14-sentabr" — hafta kuni bilan.
 * Muddat/sana maydonlarida ishlatiladi: oʻqituvchi kunni sana emas, hafta
 * kuni boʻyicha eslaydi ("dushanbagacha"), shuning uchun kun nomi oldinda.
 * Boshqa yil boʻlsa yil ham qoʻshiladi.
 */
export function formatDayLabelUz(key: string): string {
  const [y, m, d] = key.split("-").map(Number);
  if (!y || !m || !d) return key;
  const weekday = DAYS_UZ_SUN[new Date(y, m - 1, d).getDay()];
  const month = MONTHS_UZ[(m - 1) % 12].toLowerCase();
  const year = y === new Date().getFullYear() ? "" : `, ${y}`;
  return `${weekday}, ${d}-${month}${year}`;
}

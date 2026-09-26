/* ════════════════════════════════════════════════════════════════════
   USTOZONA-GAMES — oʻyinlar roʻyxati (yagona manba).

   Oʻyinlarning oʻzi LessonLab serverida yashaydi (`LESSONLAB_GAMES_BASE`,
   odatda https://lessonlab.uz/edugames) — `/games` sahifasi ularni
   iframe orqali Ustozona qobigʻida koʻrsatadi. Nega proksi emas:
   jonli oʻyin WebSocket, QR skaner kamera va oʻyin API'lari oʻsha
   domenda ishlaydi; proksi ularni sindirardi.

   Bu roʻyxat — ruxsat etilgan fayl nomlari. `/games/<nom>` manzili va
   iframe'dan keladigan `postMessage` faqat shu nomlarni qabul qiladi:
   aks holda manzil orqali iframe'ga ixtiyoriy yoʻl (masalan
   `../lessonplanner`) yuborib boʻlardi.

   `server-only` EMAS: sahifa (server) ham, iframe qobigʻi (klient) ham
   oʻqiydi. Sof maʼlumot, I/O yoʻq.
   ════════════════════════════════════════════════════════════════════ */

export const GAME_FILES = [
  "arqon",
  "poyga",
  "piyoda-poyga",
  "live-host",
  "live-play",
  "host",
  "xotira",
  "qaysi-katta",
  "so-z-topish",
  "krossvord",
] as const;

export type GameFile = (typeof GAME_FILES)[number];

const SET = new Set<string>(GAME_FILES);

export function isGameFile(value: unknown): value is GameFile {
  return typeof value === "string" && SET.has(value);
}

/** Standart manzil — `.env` da `LESSONLAB_GAMES_BASE` boʻlmasa. */
export const DEFAULT_GAMES_BASE = "https://lessonlab.uz/edugames";

/** `/games` yoki `/games/<oʻyin>` — Ustozona tomonidagi manzil. */
export function gamePath(game: GameFile | null): string {
  return game ? `/games/${game}` : "/games";
}

/** iframe manzili: katalog uchun `<base>/`, oʻyin uchun `<base>/<nom>.html`. */
export function gameFrameUrl(base: string, game: GameFile | null, pin?: string | null): string {
  const root = base.replace(/\/+$/, "");
  const url = game ? `${root}/${game}.html` : `${root}/`;
  // Jonli oʻyin PIN'i (QR kod `/games/live-play?pin=123456` ga olib keladi).
  // Faqat 6 raqam — boshqa hech narsa iframe manziliga oʻtmaydi.
  if (game === "live-play" && pin && /^\d{6}$/.test(pin)) return `${url}?pin=${pin}`;
  return url;
}

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

/** `LESSONLAB_GAMES_BASE` ni tekshirib qaytaradi. Faqat https (yoki lokal
    ishlab chiqishda http) — `javascript:` kabi sxema env xatosi bilan
    iframe'ga tushmasin. Server ham (sahifa), test ham chaqiradi. */
export function resolveGamesBase(raw: string | undefined): string {
  try {
    const url = new URL((raw ?? "").trim() || DEFAULT_GAMES_BASE);
    if (url.protocol !== "https:" && url.protocol !== "http:") throw new Error("scheme");
    return url.toString().replace(/\/+$/, "");
  } catch {
    return DEFAULT_GAMES_BASE;
  }
}

/** Oʻyinlar ikki joyda ochiladi:
      · `/dashboard/games` — oʻqituvchi, Ustozona'ning oʻz yon paneli va
        sarlavhasi ichida (bitta brend — bitta panel);
      · `/games` — mehmon va oʻquvchi (PIN bilan qoʻshilish), kirishsiz. */
export type GamesRoot = "/games" | "/dashboard/games";

/** `<root>` yoki `<root>/<oʻyin>` — Ustozona tomonidagi manzil. */
export function gamePath(game: GameFile | null, root: GamesRoot = "/games"): string {
  return game ? `${root}/${game}` : root;
}

/** Oʻyin nomlari — `messages/*.json` → `RouteLabels` kalitlari
    (breadcrumb, panel sarlavhasi). Tartib — `GAME_FILES` bilan bir xil. */
export const GAME_LABEL_KEYS: Record<GameFile, string> = {
  arqon: "gameArqon",
  poyga: "gamePoyga",
  "piyoda-poyga": "gamePiyodaPoyga",
  "live-host": "gameLiveHost",
  "live-play": "gameLivePlay",
  host: "gameHost",
  xotira: "gameXotira",
  "qaysi-katta": "gameQaysiKatta",
  "so-z-topish": "gameSozTopish",
  krossvord: "gameKrossvord",
};

/* ── Qidiruv (SEO) ────────────────────────────────────────────────────
   `/games/<oʻyin>` — har biri oʻz sarlavha, tavsif va canonical bilan
   indekslanadi («arqon tortish oʻyini», «onlayn krossvord» kabi qidiruvdan
   kirish). Bu roʻyxatda YOʻQ sahifalar (`live-play` — PIN bilan qoʻshilish,
   `host`, `piyoda-poyga` — Poyganing koʻrinishi) `noindex` boʻladi.

   ⚠️ Matn haqiqatga mos boʻlishi shart: «roʻyxatsiz» faqat mehmon HOZIR
   qila oladigan ishga aytiladi — oʻynash. Jonli xonani ochish (mezbon) va
   oʻz testlari kirishni talab qiladi, shuning uchun `live-host` matnida
   «oʻqituvchi kirib» deyilgan. Sarlavha oxiriga « — Ustozona» root
   layout'dagi `title.template` bilan qoʻshiladi. */
export const GAME_SEO = {
  arqon: {
    title: "Arqon tortish — jamoaviy taʼlimiy oʻyin",
    description:
      "Ikki jamoa savollarga tez javob berib, arqonni oʻz tomoniga tortadi. Tayyor fan testlari bilan roʻyxatsiz oʻynash mumkin.",
  },
  poyga: {
    title: "Poyga — savolga javob berib oldinga oʻting",
    description:
      "Toʻgʻri javob mashinani marra tomon suradi. Ikki kishilik duel yoki turnir; tayyor fan testlari bilan roʻyxatsiz oʻynash mumkin.",
  },
  "live-host": {
    title: "Jonli oʻyin — PIN bilan sinf viktorinasi",
    description:
      "Oʻqituvchi kirib, testdan xona ochadi; oʻquvchilar PIN kod bilan roʻyxatsiz qoʻshilib, bir vaqtda savollarga javob beradi.",
  },
  xotira: {
    title: "Xotira — juftlarni topish oʻyini",
    description:
      "Kartalarni oching va juftlarni toping — diqqat va xotirani mashq qiladi. Roʻyxatsiz oʻynash mumkin.",
  },
  "qaysi-katta": {
    title: "Qaysi katta? — sonlarni solishtirish oʻyini",
    description:
      "Ikki sondan kattasini tez tanlang — sanoq va solishtirishni mashq qiladi. Roʻyxatsiz oʻynash mumkin.",
  },
  "so-z-topish": {
    title: "Soʻz topish — harflardan soʻz tuzing",
    description:
      "Berilgan harflardan soʻzlar tuzing — lugʻat va imloni mashq qiladi. Roʻyxatsiz oʻynash mumkin.",
  },
  krossvord: {
    title: "Krossvord — soʻzlarni katakka joylashtiring",
    description:
      "Soʻzlarni krossvord katagiga joylashtiring — lugʻatni mashq qiladi. Roʻyxatsiz oʻynash mumkin.",
  },
} as const satisfies Partial<Record<GameFile, { title: string; description: string }>>;

export type IndexableGame = keyof typeof GAME_SEO;

/** Qidiruvga ochiq oʻyinlar — sitemap va `generateMetadata` shundan oʻqiydi. */
export const INDEXABLE_GAMES = Object.keys(GAME_SEO) as IndexableGame[];

/** Oʻyinning qidiruv matni; `noindex` sahifalar uchun `null`. */
export function gameSeo(game: GameFile): { title: string; description: string } | null {
  return game in GAME_SEO ? GAME_SEO[game as IndexableGame] : null;
}

/** iframe manzili: katalog uchun `<base>/`, oʻyin uchun `<base>/<nom>.html`.
    `lang` — Ustozona tili (oʻyinlar oʻz matnlarini shu tilda koʻrsatadi,
    `edugames/eg-i18n.js`). */
export function gameFrameUrl(
  base: string,
  game: GameFile | null,
  pin?: string | null,
  lang?: string | null
): string {
  const root = base.replace(/\/+$/, "");
  const url = new URL(game ? `${root}/${game}.html` : `${root}/`);
  if (lang && /^[a-zA-Z-]{2,8}$/.test(lang)) url.searchParams.set("lang", lang);
  // Jonli oʻyin PIN'i (QR kod `/games/live-play?pin=123456` ga olib keladi).
  // Faqat 6 raqam — boshqa hech narsa iframe manziliga oʻtmaydi.
  if (game === "live-play" && pin && /^\d{6}$/.test(pin)) url.searchParams.set("pin", pin);
  return url.toString();
}

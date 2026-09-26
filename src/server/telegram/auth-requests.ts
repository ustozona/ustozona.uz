import "server-only";
import { createHash, randomBytes, randomInt } from "node:crypto";

/* ════════════════════════════════════════════════════════════════════
   KIRISH SOʻROVLARI — sirlar va kodlar (sayt, bot va auth plagini
   uchun umumiy)

   Soʻrov oqimi `schema/telegram.ts` dagi `tgAuthRequests` izohida.
   ════════════════════════════════════════════════════════════════════ */

/** Soʻrov umri. Yangi akkaunt ochishda odam botda raqam yuboradi —
    shuncha vaqt yetarli boʻlishi kerak, lekin havola uzoq yashamasin. */
export const REQUEST_TTL_MS = 15 * 60_000;

/** Brauzer siri shu cookie'da: `<id>.<secret>`, httpOnly. */
export const TG_AUTH_COOKIE = "uz_tg_auth";

/** `start` payload prefikslari. Telegram payload'i 64 belgigacha va
    faqat `A-Za-z0-9_-` — `a_` + 24 belgi = 26, sigʻadi. */
export const START_PREFIX = { login: "a_", link: "l_" } as const;

/** 18 bayt → base64url 24 belgi. Payload'ga ham, callback_data'ga ham sigʻadi. */
export function newRequestId(): string {
  return randomBytes(18).toString("base64url");
}

export function newBrowserSecret(): string {
  return randomBytes(32).toString("base64url");
}

/** Bazada faqat xesh — jadval sizib chiqsa ham sessiya olib boʻlmaydi. */
export function hashSecret(secret: string): string {
  return createHash("sha256").update(secret).digest("hex");
}

export function newCode(): string {
  return String(randomInt(1000, 10000));
}

/** Toʻgʻri kod + ikkita chalgʻituvchi, aralash tartibda.

    Chalgʻituvchilar toʻgʻri koddan KAMIDA ikki raqami bilan farq
    qiladi — «4821» va «4827» ni koʻz bilan adashtirish oson, bunda
    notoʻgʻri bosish soʻrovni bekorga yopardi. */
export function codeChoices(correct: string): string[] {
  const out = new Set<string>([correct]);
  while (out.size < 3) {
    const c = newCode();
    let diff = 0;
    for (let i = 0; i < 4; i++) if (c[i] !== correct[i]) diff++;
    if (diff >= 2) out.add(c);
  }
  const arr = [...out];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = randomInt(0, i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/** User-Agent'dan qisqa tavsif — botda «qaysi qurilmadan» deb koʻrsatiladi.
    Aniqlik shart emas: maqsad odam «bu men emas» deyishiga imkon berish. */
export function describeClient(ua: string | null): string {
  if (!ua) return "";
  const browser =
    /YaBrowser/i.test(ua) ? "Yandex" :
    /Edg\//i.test(ua) ? "Edge" :
    /OPR\/|Opera/i.test(ua) ? "Opera" :
    /Firefox\//i.test(ua) ? "Firefox" :
    /Chrome\//i.test(ua) ? "Chrome" :
    /Safari\//i.test(ua) ? "Safari" : "";
  const os =
    /Windows/i.test(ua) ? "Windows" :
    /Android/i.test(ua) ? "Android" :
    /iPhone|iPad|iPod/i.test(ua) ? "iOS" :
    /Mac OS X|Macintosh/i.test(ua) ? "macOS" :
    /Linux/i.test(ua) ? "Linux" : "";
  return [browser, os].filter(Boolean).join(" · ");
}

/** Telegram `phone_number` — ba'zan `+` bilan, ba'zan usiz. E.164 ga keltiramiz. */
export function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  return digits ? `+${digits}` : "";
}

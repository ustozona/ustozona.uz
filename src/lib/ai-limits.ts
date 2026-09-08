/* ════════════════════════════════════════════════════════════════════
   AI KUNLIK KVOTA — kun hisobi va limitlar YAGONA MANBADA.

   Kun Asia/Tashkent (UTC+5) boʻyicha, chunki oʻqituvchi uchun "bugun"
   Toshkent kuni. Ilgari `todayTashkent()` faqat route ichida edi va
   admin statistikasi uni takrorlashi kerak boʻlardi — ikki joyda ikki
   xil kun chegarasi esa hisobotni jimgina siljitadi.
   ════════════════════════════════════════════════════════════════════ */

const TASHKENT_OFFSET_MS = 5 * 3600_000;

/** Asia/Tashkent boʻyicha YYYY-MM-DD. */
export function todayTashkent(): string {
  return new Date(Date.now() + TASHKENT_OFFSET_MS).toISOString().slice(0, 10);
}

/** Bugundan `days` kun oldingi Toshkent kuni (YYYY-MM-DD). */
export function tashkentDaysAgo(days: number): string {
  return new Date(Date.now() + TASHKENT_OFFSET_MS - days * 86_400_000)
    .toISOString()
    .slice(0, 10);
}

/** Har foydalanuvchi uchun kunlik AI xabar limiti (AI_DAILY_LIMIT, default 30). */
export function aiDailyLimit(): number {
  return Math.max(1, Number(process.env.AI_DAILY_LIMIT) || 30);
}

/** Kunlik hujjat yuklash limiti (AI_DOC_DAILY_LIMIT, default 5). */
export function aiDocDailyLimit(): number {
  return Math.max(1, Number(process.env.AI_DOC_DAILY_LIMIT) || 5);
}

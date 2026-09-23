import "server-only";

/* ════════════════════════════════════════════════════════════════════
   USTOZONA BOTI — muhit sozlamalari

     TELEGRAM_BOT_TOKEN       BotFather bergan token (SIR)
     TELEGRAM_BOT_USERNAME    @ siz, masalan `ustozona_bot`
     TELEGRAM_WEBHOOK_SECRET  Telegram har webhook soʻrovida
                              `X-Telegram-Bot-Api-Secret-Token` sarlavhasida
                              qaytaradi — soxta update'larni toʻsadi (SIR)

   Uchalasi ham qoʻyilmaguncha bot OʻCHIQ: kirish sahifasi eski
   (LessonLab boti) havolasiga qaytadi, webhook 404 beradi. Yaʼni
   token Vercel'ga qoʻyilishidan oldin deploy qilinsa ham hech narsa
   buzilmaydi.

   ⚠️ Hech biri NEXT_PUBLIC emas — mijozga faqat prop orqali uzatiladi.
   ════════════════════════════════════════════════════════════════════ */

export type TelegramConfig = {
  token: string;
  username: string;
  webhookSecret: string;
};

export function telegramConfig(): TelegramConfig | null {
  const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
  const username = process.env.TELEGRAM_BOT_USERNAME?.trim().replace(/^@/, "");
  const webhookSecret = process.env.TELEGRAM_WEBHOOK_SECRET?.trim();
  if (!token || !username || !webhookSecret) return null;
  return { token, username, webhookSecret };
}

/** Bot sozlanganmi — kirish sahifasi qaysi tugmani koʻrsatishini hal qiladi. */
export function isTelegramBotEnabled(): boolean {
  return telegramConfig() !== null;
}

/** `https://t.me/<bot>?start=<payload>` — payload 64 belgigacha, `A-Za-z0-9_-`. */
export function botStartUrl(payload: string): string | null {
  const cfg = telegramConfig();
  return cfg ? `https://t.me/${cfg.username}?start=${payload}` : null;
}

/** Botning oʻz sahifasi (payload'siz). */
export function botUrl(): string | null {
  const cfg = telegramConfig();
  return cfg ? `https://t.me/${cfg.username}` : null;
}

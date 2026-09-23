import "server-only";
import { telegramConfig } from "./config";

/* ════════════════════════════════════════════════════════════════════
   BOT API — yupqa fetch qatlami (kutubxonasiz)

   Bizga Bot API'ning oʻnga yaqin metodi kerak, xolos. Toʻliq freymvork
   (sessiya, middleware, polling) serversiz webhook'da ortiqcha — har
   update alohida funksiya chaqiruvi, holat esa bazada.

   Xatolar OTILMAYDI, `{ ok: false }` qaytadi: webhook ichida bitta
   yuborilmagan xabar butun update'ni yiqitmasligi kerak (Telegram 200
   olmasa update'ni qayta-qayta yuboradi). Chaqiruvchi natijaga qarab
   qaror qiladi — masalan 403 da suhbatni «bloklangan» deb belgilaydi.
   ════════════════════════════════════════════════════════════════════ */

export type TgResult<T> =
  | { ok: true; result: T }
  | { ok: false; status: number; description: string };

/** Bot API javobi kelmasa webhook ham, cron ham osilib qolmasin. */
const TIMEOUT_MS = 10_000;

export async function tgCall<T = unknown>(
  method: string,
  body: Record<string, unknown>
): Promise<TgResult<T>> {
  const cfg = telegramConfig();
  if (!cfg) return { ok: false, status: 0, description: "bot sozlanmagan" };

  try {
    const res = await fetch(`https://api.telegram.org/bot${cfg.token}/${method}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(TIMEOUT_MS),
      cache: "no-store",
    });
    const json = (await res.json().catch(() => null)) as
      | { ok: boolean; result?: T; description?: string; error_code?: number }
      | null;
    if (json?.ok) return { ok: true, result: json.result as T };
    return {
      ok: false,
      status: json?.error_code ?? res.status,
      description: json?.description ?? res.statusText,
    };
  } catch (err) {
    // ⚠️ Xato matnida URL (demak token) boʻlishi mumkin — logga faqat nomi.
    const name = err instanceof Error ? err.name : "Error";
    return { ok: false, status: 0, description: `${method}: ${name}` };
  }
}

/* ── Tiplar — faqat bizga kerak boʻlgan qismi ─────────────────────── */

export type TgUser = {
  id: number;
  is_bot?: boolean;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
};

export type TgChat = { id: number; type: string };

export type TgContact = {
  phone_number: string;
  first_name?: string;
  user_id?: number;
};

export type TgMessage = {
  message_id: number;
  from?: TgUser;
  chat: TgChat;
  text?: string;
  contact?: TgContact;
};

export type TgCallbackQuery = {
  id: string;
  from: TgUser;
  message?: TgMessage;
  data?: string;
};

export type TgChatMemberUpdated = {
  chat: TgChat;
  from: TgUser;
  new_chat_member: { status: string };
};

export type TgUpdate = {
  update_id: number;
  message?: TgMessage;
  callback_query?: TgCallbackQuery;
  my_chat_member?: TgChatMemberUpdated;
};

export type InlineButton =
  | { text: string; callback_data: string }
  | { text: string; url: string };

export type InlineKeyboard = { inline_keyboard: InlineButton[][] };

export type ReplyMarkup =
  | InlineKeyboard
  | {
      keyboard: { text: string; request_contact?: boolean }[][];
      resize_keyboard?: boolean;
      one_time_keyboard?: boolean;
      is_persistent?: boolean;
    }
  | { remove_keyboard: true };

/* ── Qulay oʻramlar ──────────────────────────────────────────────── */

export function sendMessage(
  chatId: string | number,
  text: string,
  replyMarkup?: ReplyMarkup
) {
  return tgCall<TgMessage>("sendMessage", {
    chat_id: chatId,
    text,
    parse_mode: "HTML",
    link_preview_options: { is_disabled: true },
    ...(replyMarkup ? { reply_markup: replyMarkup } : {}),
  });
}

export function editMessageText(
  chatId: string | number,
  messageId: number,
  text: string,
  replyMarkup?: InlineKeyboard
) {
  return tgCall("editMessageText", {
    chat_id: chatId,
    message_id: messageId,
    text,
    parse_mode: "HTML",
    link_preview_options: { is_disabled: true },
    ...(replyMarkup ? { reply_markup: replyMarkup } : {}),
  });
}

export function answerCallbackQuery(id: string, text?: string) {
  return tgCall("answerCallbackQuery", {
    callback_query_id: id,
    ...(text ? { text } : {}),
  });
}

/** HTML parse_mode uchun — foydalanuvchi matni (ism, sinf nomi) xabarni buzmasin. */
export function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

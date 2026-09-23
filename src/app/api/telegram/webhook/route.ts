import { timingSafeEqual } from "node:crypto";
import { telegramConfig } from "@/server/telegram/config";
import { handleUpdate } from "@/server/telegram/bot";
import type { TgUpdate } from "@/server/telegram/api";

/* POST /api/telegram/webhook — Ustozona botining update'lari.

   Webhook `scripts/telegram-setup.ts` bilan oʻrnatiladi va Telegram
   har soʻrovda `X-Telegram-Bot-Api-Secret-Token` sarlavhasini yuboradi.
   Sarlavhasiz yoki notoʻgʻri soʻrov — begona: 401.

   ⚠️ Ichki xatoda ham 200 qaytadi. Telegram 200 olmaguncha AYNI
   update'ni qayta-qayta yuboradi va keyingilarini ushlab turadi —
   yaʼni bitta buzuq update butun botni toʻxtatib qoʻyardi. Xato
   logga yoziladi, update tashlab ketiladi. */

export const dynamic = "force-dynamic";
export const maxDuration = 30;

function sameSecret(a: string, b: string): boolean {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

export async function POST(request: Request) {
  const cfg = telegramConfig();
  if (!cfg) return new Response("not found", { status: 404 });

  const got = request.headers.get("x-telegram-bot-api-secret-token") ?? "";
  if (!sameSecret(got, cfg.webhookSecret)) {
    return new Response("unauthorized", { status: 401 });
  }

  let update: TgUpdate;
  try {
    update = (await request.json()) as TgUpdate;
  } catch {
    return new Response("ok");
  }

  try {
    await handleUpdate(update);
  } catch (err) {
    console.error("[tg-webhook] update yiqildi:", update.update_id, err);
  }
  return new Response("ok");
}

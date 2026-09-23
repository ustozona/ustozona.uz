import { timingSafeEqual } from "node:crypto";
import { isTelegramBotEnabled } from "@/server/telegram/config";
import { runDigests } from "@/server/telegram/digest";

/* /api/cron/telegram — kunlik Telegram xabarlari.

   Supabase `pg_cron` + `pg_net` har 15 daqiqada chaqiradi (sozlash:
   docs/telegram-bot.md). Darvoza — `Authorization: Bearer <CRON_SECRET>`.
   Sessiya yoʻq, odam chaqirmaydi.

   Natija JSON'da (nechta yuborildi / oʻtkazildi) — `net._http_response`
   jadvalida koʻrinadi, nosozlikni shu yerdan kuzatish mumkin. */

export const dynamic = "force-dynamic";
export const maxDuration = 60;

function authorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return false;
  const got = Buffer.from(request.headers.get("authorization") ?? "");
  const want = Buffer.from(`Bearer ${secret}`);
  return got.length === want.length && timingSafeEqual(got, want);
}

async function handle(request: Request) {
  if (!authorized(request)) return new Response("unauthorized", { status: 401 });
  if (!isTelegramBotEnabled()) return Response.json({ ok: false, reason: "bot sozlanmagan" });

  try {
    const result = await runDigests();
    return Response.json({ ok: true, ...result });
  } catch (err) {
    console.error("[cron/telegram] yiqildi:", err);
    return Response.json({ ok: false }, { status: 500 });
  }
}

export const GET = handle;
export const POST = handle;

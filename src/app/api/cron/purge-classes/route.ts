import { timingSafeEqual } from "node:crypto";
import { purgeExpiredClasses } from "@/server/dal/class-trash";

/* /api/cron/purge-classes — savatda 7 kundan oshgan sinflarni butunlay
   oʻchiradi (dal/class-trash.ts).

   Supabase `pg_cron` + `pg_net` kuniga bir marta chaqiradi — telegram
   cron'i bilan bir xil naqsh va bir xil `CRON_SECRET` (docs/telegram-bot.md):

     select cron.schedule(
       'ustozona-purge-classes', '30 21 * * *',   -- 02:30 Toshkent
       $$ select net.http_post(
            url := 'https://www.ustozona.uz/api/cron/purge-classes',
            headers := jsonb_build_object('Authorization', 'Bearer ' ||
              (select decrypted_secret from vault.decrypted_secrets
               where name = 'ustozona_cron_secret')),
            body := '{}'::jsonb,
            timeout_milliseconds := 60000
          ) $$
     );

   Chaqiruv qolib ketsa xavf yoʻq: savatdagi sinf baribir koʻrinmaydi,
   keyingi chaqiruv qolganini oladi. */

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
  try {
    return Response.json({ ok: true, ...(await purgeExpiredClasses()) });
  } catch (err) {
    console.error("[cron/purge-classes] yiqildi:", err);
    return Response.json({ ok: false }, { status: 500 });
  }
}

export const GET = handle;
export const POST = handle;

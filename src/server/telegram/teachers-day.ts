import "server-only";
import { sql } from "drizzle-orm";
import { db } from "@/server/db/client";
import { esc, sendMessage } from "./api";

/* ════════════════════════════════════════════════════════════════════
   OʻQITUVCHILAR KUNI TABRIGI (1-oktyabr) — botdan, bir martalik.

   Telegram xabarni rejalashtira olmaydi, shuning uchun mavjud 15
   daqiqalik cron (`/api/cron/telegram`) ichidan chaqiriladi: faqat
   tabrik kuni, Toshkent vaqti bilan 08:00–12:00 oraligʻida ishlaydi.
   Oyna keng — 08:00 dagi chaqiruv oʻtib ketsa, keyingisi yuboradi.

   Takror yubormaslik: `teachers.prefs.campaigns.ok1tg` — atomik BAND
   QILISH (UPDATE … WHERE yoʻq RETURNING), ikki parallel cron ham bitta
   ustozga ikki marta yubormaydi. Vaqtinchalik xatoda band qilish bekor
   qilinadi (keyingi chaqiruvda qayta uriniladi).

   Kimga: Ustozona botini ochgan, bloklamagan, marketing xabaridan
   chiqmagan oʻqituvchi. Skript (`scripts/campaign-oqituvchilar-kuni.ts`)
   xuddi shu matnni qoʻlda yuborish/sinash uchun ishlatadi.
   ════════════════════════════════════════════════════════════════════ */

export const TABRIK_SANASI = "2026-10-01";
const OYNA_BOSHI_MIN = 8 * 60;
const OYNA_OXIRI_MIN = 12 * 60;
const TZ_OFFSET_MIN = 5 * 60; // Asia/Tashkent, yozgi vaqt yoʻq
const SITE = (process.env.BETTER_AUTH_URL || "https://www.ustozona.uz").replace(/\/$/, "");

/** Xabar matni va (jadvali yoʻq boʻlsa) tugma. Tashqi kopirayt matni. */
export function tabrikXabari(
  name: string | null,
  jadvalli: boolean,
): { text: string; button: { text: string; url: string } | null } {
  const ism = name?.trim().split(/\s+/)[0] ?? null;
  const salom = ism ? `Hurmatli ${esc(ism)}` : "Hurmatli ustoz";
  if (jadvalli) {
    return {
      text:
        `${salom}, sizni 1-oktyabr — Oʻqituvchi va murabbiylar kuni bilan samimiy tabriklaymiz! 🌷 ` +
        `Kelajak avlodni tarbiyalashdek masʼuliyatli ishingizda doimo zafarlar yor boʻlsin. ` +
        `Doimo sogʻ-salomat boʻling, mehnatingiz rohatini koʻring. Bayramingiz muborak boʻlsin!`,
      button: null,
    };
  }
  return {
    text:
      `${salom}, sizni 1-oktyabr — kasb bayramingiz bilan samimiy muborakbod etamiz! 🌷 ` +
      `Mashaqqatli va sharafli yoʻlingizda doim omad yor boʻlsin. ` +
      `Tizimga dars jadvalingizni kiritsangiz, botimiz har kech ertangi darslaringizni eslatib turadi.`,
    button: { text: "Jadvalni kiritish", url: `${SITE}/dashboard/timetable` },
  };
}

export type TabrikResult = { ran: boolean; sent: number; failed: number; deferred: number };

type Row = { id: string; name: string | null; chat_id: string; jadvalli: boolean };

export async function runTeachersDayGreeting(now = new Date()): Promise<TabrikResult> {
  const result: TabrikResult = { ran: false, sent: 0, failed: 0, deferred: 0 };

  const t = new Date(now.getTime() + TZ_OFFSET_MIN * 60_000);
  const todayKey = `${t.getUTCFullYear()}-${String(t.getUTCMonth() + 1).padStart(2, "0")}-${String(t.getUTCDate()).padStart(2, "0")}`;
  const nowMin = t.getUTCHours() * 60 + t.getUTCMinutes();
  if (todayKey !== TABRIK_SANASI || nowMin < OYNA_BOSHI_MIN || nowMin >= OYNA_OXIRI_MIN) return result;
  result.ran = true;

  // Postgres-js `db.execute()` natijani toʻgʻridan-toʻgʻri massiv qilib qaytaradi.
  const rows = (await db.execute(sql`
    SELECT u.id, u.name, c.chat_id,
           EXISTS (SELECT 1 FROM timetable_versions tv
                    WHERE tv.teacher_id = u.id AND jsonb_array_length(tv.events) > 0) AS jadvalli
      FROM "user" u
      JOIN teachers t ON t.id = u.id AND t.exclude_from_metrics = false
      JOIN user_telegram ut ON ut.user_id = u.id
      JOIN tg_chats c ON c.telegram_id = ut.telegram_id
     WHERE c.blocked_at IS NULL
       AND c.marketing_opt_out_at IS NULL
       AND COALESCE(u.banned, false) = false
       AND (t.prefs -> 'campaigns' -> 'ok1tg') IS NULL
     ORDER BY u.created_at
  `)) as unknown as Row[];

  // KETMA-KET (Supavisor: parallel soʻrovlar osilib qoladi — digest.ts izohi).
  for (const r of rows) {
    const claimed = (await db.execute(sql`
      UPDATE teachers
         SET prefs = jsonb_set(COALESCE(prefs, '{}'::jsonb), '{campaigns}',
               COALESCE(prefs -> 'campaigns', '{}'::jsonb) || jsonb_build_object('ok1tg', now()::text)),
             updated_at = now()
       WHERE id = ${r.id} AND (prefs -> 'campaigns' -> 'ok1tg') IS NULL
       RETURNING id
    `)) as unknown as Array<{ id: string }>;
    if (!claimed.length) continue;

    const { text, button } = tabrikXabari(r.name, r.jadvalli);
    const res = await sendMessage(
      r.chat_id,
      text,
      button ? { inline_keyboard: [[{ text: button.text, url: button.url }]] } : undefined,
    );
    if (res.ok) {
      result.sent++;
    } else if (res.status === 0 || res.status === 429 || res.status >= 500) {
      // Vaqtinchalik — band qilish bekor, keyingi chaqiruvda qayta.
      await db.execute(sql`
        UPDATE teachers SET prefs = prefs #- '{campaigns,ok1tg}' WHERE id = ${r.id}
      `);
      result.deferred++;
    } else {
      if (res.status === 403) {
        await db.execute(sql`
          UPDATE tg_chats SET blocked_at = now(), updated_at = now() WHERE chat_id = ${r.chat_id}
        `);
      }
      console.error("[tabrik] yuborilmadi:", r.id, res.status, res.description);
      result.failed++;
    }
    await new Promise((ok) => setTimeout(ok, 100)); // Telegram limiti: sekundiga ~30 ta
  }
  return result;
}

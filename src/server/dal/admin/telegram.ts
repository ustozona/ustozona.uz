import "server-only";
import { sql } from "drizzle-orm";
import { db } from "@/server/db/client";
import { requireAdmin } from "@/server/session";

/* ════════════════════════════════════════════════════════════════════
   ADMIN → TELEGRAM KOʻRSATKICHLARI

   Savol: ustozlarning qanchasi botdan haqiqatan foyda olyapti? Ulashni
   majburiy qilish-qilmaslik shu raqamlarga qarab hal qilinadi
   (docs/telegram-bot.md).

   ⚠️ «ULANGAN» ≠ «BOT ISHLAYAPTI». `user_telegram` boshqa bot bilan
   umumiy jadval: u orqali ulangan ustoz bizning botni hech ochmagan
   boʻlishi mumkin — unga xabar ketmaydi. Shuning uchun ikki bosqich alohida
   sanaladi va oraligʻi («botni ochmagan») alohida koʻrsatiladi.

   Maxraj — voronka bilan bir xil: `exclude_from_metrics = false`
   boʻlgan oʻqituvchilar (stats.ts).
   ════════════════════════════════════════════════════════════════════ */

export type TelegramStats = {
  teachers: number;
  /** `user_telegram` da bogʻlanish bor (qaysi bot orqali boʻlishidan qatʼi nazar). */
  linked: number;
  /** Ulangan, lekin Ustozona botida `/start` yoʻq — xabar olmaydi. */
  linkedNoBot: number;
  /** Bot ochilgan va bloklanmagan — xabar yetib boradi. */
  botActive: number;
  /** Botni bloklagan. */
  blocked: number;
  withPhone: number;
  marketingYes: number;
  /** Oxirgi 7 kunda kamida bitta kunlik xabar olgan. */
  digestWeek: number;
};

export async function getTelegramStats(): Promise<TelegramStats> {
  await requireAdmin();

  /* Bitta ustozda bir nechta `user_telegram` qatori boʻlishi mumkin
     (PK — telegram_id), shuning uchun avval ustoz boʻyicha yigʻiladi:
     aks holda JOIN sanoqni shishirardi. */
  const rows = (await db.execute(sql`
    WITH scoped AS (
      SELECT t.id FROM teachers t WHERE t.exclude_from_metrics = false
    ),
    tg AS (
      SELECT ut.user_id,
             bool_or(c.telegram_id IS NOT NULL AND c.blocked_at IS NULL) AS active,
             bool_or(c.blocked_at IS NOT NULL)                           AS blocked,
             bool_or(c.telegram_id IS NOT NULL)                          AS has_chat,
             bool_or(c.phone IS NOT NULL)                                AS phone,
             bool_or(c.marketing_consent_at IS NOT NULL
                     AND c.marketing_opt_out_at IS NULL)                 AS marketing
      FROM user_telegram ut
      LEFT JOIN tg_chats c ON c.telegram_id = ut.telegram_id
      GROUP BY ut.user_id
    ),
    digest AS (
      SELECT DISTINCT user_id FROM tg_notify_log
      WHERE status = 'sent' AND created_at > now() - interval '7 days'
    )
    SELECT
      COUNT(*)::int                                          AS teachers,
      COUNT(tg.user_id)::int                                 AS linked,
      COUNT(*) FILTER (WHERE tg.user_id IS NOT NULL
                       AND NOT tg.has_chat)::int             AS linked_no_bot,
      COUNT(*) FILTER (WHERE tg.active)::int                 AS bot_active,
      COUNT(*) FILTER (WHERE tg.blocked AND NOT tg.active)::int AS blocked,
      COUNT(*) FILTER (WHERE tg.phone)::int                  AS with_phone,
      COUNT(*) FILTER (WHERE tg.marketing)::int              AS marketing_yes,
      COUNT(d.user_id)::int                                  AS digest_week
    FROM scoped s
    LEFT JOIN tg ON tg.user_id = s.id
    LEFT JOIN digest d ON d.user_id = s.id
  `)) as unknown as Array<Record<string, number>>;

  const r = rows[0] ?? {};
  return {
    teachers: r.teachers ?? 0,
    linked: r.linked ?? 0,
    linkedNoBot: r.linked_no_bot ?? 0,
    botActive: r.bot_active ?? 0,
    blocked: r.blocked ?? 0,
    withPhone: r.with_phone ?? 0,
    marketingYes: r.marketing_yes ?? 0,
    digestWeek: r.digest_week ?? 0,
  };
}

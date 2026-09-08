import "server-only";
import { desc, eq, gte, sql } from "drizzle-orm";
import { db } from "@/server/db/client";
import { aiUsage, user, teachers } from "@/server/db/schema";
import { requireAdmin } from "@/server/session";
import {
  aiCredits,
  monthStartTashkent,
  tashkentDaysAgo,
  todayTashkent,
} from "@/lib/ai-limits";

/* ════════════════════════════════════════════════════════════════════
   ADMIN → USTOZONA AI FOYDALANISHI (kross-tenant).

   Manba — `ai_usage` (bitta qator = bitta foydalanuvchining bitta kuni).
   Yozuv chat soʻrovi kelganda INKREMENT qilinadi, javob muvaffaqiyatli
   boʻlishidan QATʼI NAZAR. Yaʼni `count` — "yuborilgan xabar", "olingan
   javob" emas. Provayder zanjiri butunlay yiqilgan kunda ham raqam
   oʻsadi; farqni `providers` ustuni koʻrsatadi (u faqat birinchi delta
   kelganda yoziladi).

   ⚠️ Shu sababli `messages` va `providers` yigʻindisi teng emas —
   ayirma = javobsiz qolgan soʻrovlar. Panelda shu ataylab koʻrsatiladi,
   chunki 2026-09 dagi Groq nosozligi aynan shu ayirmada koʻrinardi.
   ════════════════════════════════════════════════════════════════════ */

/** Panel oynasi — necha kunlik kesim koʻrsatiladi. */
export const AI_STATS_DAYS = 30;

export type AiProviderCount = { provider: string; count: number };

export type AiDailyPoint = {
  day: string; // YYYY-MM-DD (Asia/Tashkent)
  messages: number;
  users: number;
};

export type AiUsageOverview = {
  days: number;
  /** Free taʼrifning oylik krediti — panelda mezon sifatida koʻrsatiladi. */
  monthCredit: number;
  /** Bugungi kesim. */
  today: { messages: number; docs: number; users: number };
  /** Oyna boʻyicha jami. */
  window: { messages: number; docs: number; users: number };
  /** Javob bergan provayderlar (oyna boʻyicha). */
  providers: AiProviderCount[];
  /** Provayder yozilmagan soʻrovlar — yaʼni javobsiz qolganlar. */
  unanswered: number;
  /** JORIY OYDA krediti tugagan oʻqituvchilar soni.

      ⚠️ Shart qatʼiy ">", ">=" emas — route ham aynan shunday toʻsadi
      (`used <= credit` → ruxsat). Kreditga tekis tegib turgan oʻqituvchi
      hali rad etilmagan: 300-xabar oddiy uzatiladi, 429 faqat 301-sida
      chiqadi. ">=" bilan bunday holatlar ham "toʻxtatilgan" boʻlib
      koʻrinar va admin yoʻq muammo uchun kreditni koʻtarishga undalardi.

      Bu raqam oyna (30 kun) emas, JORIY OY boʻyicha — kredit ham aynan
      oy chegarasida tiklanadi, boshqa oyna bilan solishtirish yolgʻon
      chiqardi. */
  creditExhausted: number;
  trend: AiDailyPoint[];
};

export type AiUserRow = {
  userId: string;
  name: string;
  email: string;
  plan: string | null;
  messages: number;
  docs: number;
  /** Nechta kunda ishlatgan — bir kunlik portlash bilan shishmaydi. */
  activeDays: number;
  /** Joriy oyda sarflangan xabar (kredit aynan shunga qaraydi). */
  monthMessages: number;
  /** Shu oʻqituvchining taʼrifiga tegishli oylik kredit. */
  credit: number;
  todayMessages: number;
  lastDay: string;
};

/** Umumiy kesim: bugun, oyna, provayderlar, kunlik grafik. */
export async function getAiUsageOverview(
  days: number = AI_STATS_DAYS,
): Promise<AiUsageOverview> {
  await requireAdmin();

  const today = todayTashkent();
  const monthFrom = monthStartTashkent();
  const from = tashkentDaysAgo(days - 1);

  /* Kunlik qator — grafik uchun. Bir soʻrovda oyna jamisi ham chiqadi,
     shuning uchun alohida agregat soʻrov yozilmaydi. */
  const trendRows = await db
    .select({
      day: aiUsage.day,
      messages: sql<number>`sum(${aiUsage.count})::int`,
      docs: sql<number>`sum(${aiUsage.docCount})::int`,
      users: sql<number>`count(*)::int`,
    })
    .from(aiUsage)
    .where(gte(aiUsage.day, from))
    .groupBy(aiUsage.day)
    .orderBy(aiUsage.day);

  /* Oynadagi noyob foydalanuvchilar — kunlik `users` yigʻindisi EMAS
     (bir odam 30 kun ishlatsa 30 marta sanaladi). */
  const [uniq] = await db
    .select({ users: sql<number>`count(distinct ${aiUsage.userId})::int` })
    .from(aiUsage)
    .where(gte(aiUsage.day, from));

  /* Provayder taqsimoti — jsonb kalitlarini yoyib yigʻamiz. Kalitlar
     kodda qatʼiy roʻyxat emas: eski qatorlarda olib tashlangan
     provayder nomi ham uchraydi, panel uni baribir koʻrsatsin. */
  const providerRes = await db.execute<{ provider: string; count: number }>(
    sql`select key as provider, sum(value::int)::int as count
        from ${aiUsage}, jsonb_each(${aiUsage.providers})
        where ${aiUsage.day} >= ${from}
        group by key
        order by count desc`,
  );
  const providers: AiProviderCount[] = Array.from(providerRes).map((r) => ({
    provider: String(r.provider),
    count: Number(r.count),
  }));

  /* Krediti tugaganlar — JORIY OY yigʻindisi taʼrif kreditidan oshganlar.
     Kredit env orqali taʼrifga qarab oʻzgaradi, shuning uchun taqqoslash
     SQL'da emas, bu yerda: `aiCredits()` yagona manba boʻlib qolsin. */
  const monthRows = await db
    .select({
      plan: teachers.plan,
      used: sql<number>`sum(${aiUsage.count})::int`,
    })
    .from(aiUsage)
    .leftJoin(teachers, eq(teachers.id, aiUsage.userId))
    .where(gte(aiUsage.day, monthFrom))
    .groupBy(aiUsage.userId, teachers.plan);
  const creditExhausted = monthRows.filter(
    (r) => r.used > aiCredits(r.plan).messages,
  ).length;

  const todayRow = trendRows.find((r) => r.day === today);
  const windowMessages = trendRows.reduce((n, r) => n + r.messages, 0);
  const answered = providers.reduce((n, p) => n + p.count, 0);

  /* Grafikda boʻsh kunlar ham koʻrinsin — aks holda uzilish kuni
     shunchaki yoʻqoladi va chiziq silliq boʻlib qoladi. */
  const byDay = new Map(trendRows.map((r) => [r.day, r]));
  const trend: AiDailyPoint[] = Array.from({ length: days }, (_, i) => {
    const day = tashkentDaysAgo(days - 1 - i);
    const row = byDay.get(day);
    return { day, messages: row?.messages ?? 0, users: row?.users ?? 0 };
  });

  return {
    days,
    monthCredit: aiCredits("free").messages,
    today: {
      messages: todayRow?.messages ?? 0,
      docs: todayRow?.docs ?? 0,
      users: todayRow?.users ?? 0,
    },
    window: {
      messages: windowMessages,
      docs: trendRows.reduce((n, r) => n + r.docs, 0),
      users: uniq?.users ?? 0,
    },
    providers,
    unanswered: Math.max(0, windowMessages - answered),
    creditExhausted,
    trend,
  };
}

/** Kim qancha ishlatgan — xabar soni boʻyicha kamayish tartibida. */
export async function listAiUsers(params: {
  days?: number;
  limit?: number;
} = {}): Promise<AiUserRow[]> {
  await requireAdmin();

  const days = params.days ?? AI_STATS_DAYS;
  const rowLimit = Math.min(200, Math.max(1, params.limit ?? 50));
  const today = todayTashkent();
  const from = tashkentDaysAgo(days - 1);
  const monthFrom = monthStartTashkent();

  const rows = await db
    .select({
      userId: aiUsage.userId,
      name: user.name,
      email: user.email,
      plan: teachers.plan,
      messages: sql<number>`sum(${aiUsage.count})::int`,
      docs: sql<number>`sum(${aiUsage.docCount})::int`,
      activeDays: sql<number>`count(*)::int`,
      monthMessages: sql<number>`coalesce(sum(${aiUsage.count}) filter (where ${aiUsage.day} >= ${monthFrom}), 0)::int`,
      todayMessages: sql<number>`coalesce(sum(${aiUsage.count}) filter (where ${aiUsage.day} = ${today}), 0)::int`,
      lastDay: sql<string>`max(${aiUsage.day})`,
    })
    .from(aiUsage)
    .innerJoin(user, eq(user.id, aiUsage.userId))
    .leftJoin(teachers, eq(teachers.id, aiUsage.userId))
    .where(gte(aiUsage.day, from))
    .groupBy(aiUsage.userId, user.name, user.email, teachers.plan)
    .orderBy(desc(sql`sum(${aiUsage.count})`))
    .limit(rowLimit);

  /* Kredit taʼrifga bogʻliq — SQL'da CASE yozish oʻrniga shu yerda
     qoʻshiladi (`aiCredits` yagona manba, env bilan oʻzgaradi). */
  return rows.map((r) => ({ ...r, credit: aiCredits(r.plan).messages }));
}

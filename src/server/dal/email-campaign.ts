import "server-only";
import { eq, sql } from "drizzle-orm";
import { db } from "@/server/db/client";
import { teachers } from "@/server/db/schema";

/* ════════════════════════════════════════════════════════════════════
   KAMPANIYA JURNALI — `teachers.prefs.campaigns` (sessiyasiz, tizim).

   ⚠️ `email_activation` EMAS: uning `stage` ustuni aktivatsiya zanjiri
   holati. Kampaniya u yerda qator yaratsa, standart `a1` bilan
   yaratilardi va sinfi bor eski ustozga keyingi jurnal saqlanishida
   zanjir (`onClassPresent`) ishga tushib ketardi.
   ════════════════════════════════════════════════════════════════════ */

export type CampaignId = "tg1";

type CampaignLog = Partial<Record<CampaignId, string>>;

/** `null` — oʻqituvchi qatori yoʻq. */
export async function readCampaignLog(userId: string): Promise<CampaignLog | null> {
  const [row] = await db
    .select({ prefs: teachers.prefs })
    .from(teachers)
    .where(eq(teachers.id, userId));
  if (!row) return null;
  return ((row.prefs ?? {}) as { campaigns?: CampaignLog }).campaigns ?? {};
}

/* `jsonb_set` — `||` emas: `||` butun `campaigns` kalitini almashtirib,
   oldingi kampaniyalar jurnalini oʻchirib yuborardi. */
export async function markCampaignSent(userId: string, id: CampaignId): Promise<void> {
  const entry = JSON.stringify({ [id]: new Date().toISOString() });
  await db
    .update(teachers)
    .set({
      prefs: sql`jsonb_set(${teachers.prefs}, '{campaigns}', COALESCE(${teachers.prefs} -> 'campaigns', '{}'::jsonb) || ${entry}::jsonb)`,
      updatedAt: new Date(),
    })
    .where(eq(teachers.id, userId));
}

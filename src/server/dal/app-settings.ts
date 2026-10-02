import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/server/db/client";
import { appSettings } from "@/server/db/schema";
import { requireAdmin } from "@/server/session";
import { writeAuditLog } from "@/server/dal/admin/audit";
import { normalizeExternalSites, parseExternalSites, type ExternalSite } from "@/lib/studio-advice";

/* ════════════════════════════════════════════════════════════════════
   ILOVA SOZLAMALARI (`app_settings`) — oʻqish hamma uchun, yozish
   faqat super-admin.

   Oʻqish xatosi (jadval hali prodda yoʻq, vaqtinchalik uzilish) sahifani
   YIQITMAYDI: `undefined` qaytadi va chaqiruvchi zaxiraga — muhit
   sozlamasiga — oʻtadi. Studiya bu roʻyxatsiz ham ishlayveradi.
   ════════════════════════════════════════════════════════════════════ */

export const SETTING_KEYS = {
  studioExternalSites: "studio.externalSites",
} as const;

type SettingKey = (typeof SETTING_KEYS)[keyof typeof SETTING_KEYS];

async function readSetting(key: SettingKey): Promise<{ value: unknown; updatedAt: Date } | undefined> {
  try {
    const [row] = await db
      .select({ value: appSettings.value, updatedAt: appSettings.updatedAt })
      .from(appSettings)
      .where(eq(appSettings.key, key))
      .limit(1);
    return row;
  } catch (err) {
    console.error(`[app-settings] ${key} oʻqilmadi`, err);
    return undefined;
  }
}

/** Dars studiyasi: tashqi saytlar. Bazada yozuv boʻlmasa — muhit sozlamasi. */
export async function studioExternalSites(): Promise<ExternalSite[]> {
  const row = await readSetting(SETTING_KEYS.studioExternalSites);
  if (row) return normalizeExternalSites(row.value);
  return parseExternalSites(process.env.STUDIO_EXTERNAL_SITES);
}

export type StudioSitesSource = "db" | "env" | "none";

/** Admin sahifasi uchun: roʻyxat va u qayerdan kelayotgani. */
export async function adminStudioExternalSites(): Promise<{
  sites: ExternalSite[];
  source: StudioSitesSource;
  updatedAt: string | null;
}> {
  await requireAdmin();
  const row = await readSetting(SETTING_KEYS.studioExternalSites);
  if (row) {
    return { sites: normalizeExternalSites(row.value), source: "db", updatedAt: row.updatedAt.toISOString() };
  }
  const env = parseExternalSites(process.env.STUDIO_EXTERNAL_SITES);
  return { sites: env, source: env.length ? "env" : "none", updatedAt: null };
}

export async function saveStudioExternalSites(sites: ExternalSite[]): Promise<ExternalSite[]> {
  const { actor } = await requireAdmin();
  const clean = normalizeExternalSites(sites);
  const key = SETTING_KEYS.studioExternalSites;
  await db
    .insert(appSettings)
    .values({ key, value: clean, updatedBy: actor.id })
    .onConflictDoUpdate({
      target: appSettings.key,
      set: { value: clean, updatedAt: new Date(), updatedBy: actor.id },
    });
  await writeAuditLog(actor, {
    action: "settings.update",
    targetType: "setting",
    targetId: key,
    targetLabel: "Studiya: tashqi saytlar",
    meta: { count: clean.length, names: clean.map((s) => s.name) },
  });
  return clean;
}

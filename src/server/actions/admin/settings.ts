"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { saveStudioExternalSites } from "@/server/dal/app-settings";
import { externalSiteProblem, MAX_EXTERNAL_SITES } from "@/lib/studio-advice";

/* Admin sozlamalari. Ruxsat (`requireAdmin`) va audit — DAL ichida.
   ⚠️ Tip eksporti yoʻq (AGENTS.md). */

const siteSchema = z.object({
  name: z.string().trim().min(1).max(40),
  search: z.string().trim().min(1).max(500),
});

const sitesSchema = z.array(siteSchema).max(MAX_EXTERNAL_SITES);

export async function saveStudioSitesAction(input: unknown) {
  const parsed = sitesSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, reason: "invalid" as const, index: -1 };
  // Jimgina tashlab yubormaymiz: admin qaysi qator notoʻgʻriligini koʻrsin.
  const bad = parsed.data.findIndex((s) => externalSiteProblem(s.name, s.search));
  if (bad >= 0) {
    const { name, search } = parsed.data[bad];
    return { ok: false as const, reason: externalSiteProblem(name, search)!, index: bad };
  }
  const sites = await saveStudioExternalSites(parsed.data);
  revalidatePath("/admin/settings");
  return { ok: true as const, sites };
}

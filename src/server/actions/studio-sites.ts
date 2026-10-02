"use server";

import { requireTeacher } from "@/server/session";
import { parseExternalSites } from "@/lib/studio-advice";

/* Dars studiyasi — tashqi oʻyin/mashq saytlari roʻyxati (muhit
   sozlamasi `STUDIO_EXTERNAL_SITES`, JSON: [{"name","search"}], qidiruv
   qolipida `{q}`). Nomlar kodda emas — loyiha egasi sozlaydi.
   ⚠️ Tip eksporti yoʻq (AGENTS.md) — tip `@/lib/studio-advice` da. */

export async function studioExternalSitesAction() {
  await requireTeacher();
  return parseExternalSites(process.env.STUDIO_EXTERNAL_SITES);
}

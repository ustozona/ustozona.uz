"use server";

import { requireTeacher } from "@/server/session";
import { studioExternalSites } from "@/server/dal/app-settings";

/* Dars studiyasi — tashqi oʻyin/mashq saytlari roʻyxati. Nomlar kodda
   emas — super-admin `/admin/settings` da tahrirlaydi (`app_settings`);
   bazada yozuv boʻlmasa muhit sozlamasi `STUDIO_EXTERNAL_SITES`
   (JSON: [{"name","search"}], qidiruv qolipida `{q}`).
   ⚠️ Tip eksporti yoʻq (AGENTS.md) — tip `@/lib/studio-advice` da. */

export async function studioExternalSitesAction() {
  await requireTeacher();
  return studioExternalSites();
}

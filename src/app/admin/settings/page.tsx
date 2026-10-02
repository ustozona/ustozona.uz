import { adminStudioExternalSites } from "@/server/dal/app-settings";
import StudioSitesForm from "./_components/StudioSitesForm";

/* Admin sozlamalari — deploysiz oʻzgaradigan platforma qiymatlari
   (`app_settings`). Hozircha bitta boʻlim: Dars studiyasidagi tashqi
   oʻyin/mashq saytlari (nomlar kodda yozilmaydi — AGENTS.md). */

export default async function AdminSettingsPage() {
  const studio = await adminStudioExternalSites();
  return (
    <div className="flex flex-col gap-5 p-4 md:p-6">
      <StudioSitesForm initial={studio.sites} source={studio.source} updatedAt={studio.updatedAt} />
    </div>
  );
}

import { AppSidebar } from "@/components/app-sidebar";
import { listMyWorkspaces } from "@/server/workspace";

/**
 * `AppSidebar` uchun maʼlumot yigʻuvchi server qobigʻi.
 *
 * Alohida fayl — layout sinxron qolsin uchun: butun dashboard maketini
 * `async` qilib qoʻyish bitta soʻrov uchun qimmat.
 *
 * ⚠️ Xato yutiladi: maydonlar roʻyxati — ikkinchi darajali qulaylik.
 * U yuklanmagani uchun butun dashboard qulashi mumkin emas; eng yomoni
 * almashtirgich koʻrinmay qoladi.
 */
export default async function AppSidebarServer() {
  try {
    const workspaces = await listMyWorkspaces();
    return <AppSidebar workspaces={workspaces} />;
  } catch {
    return <AppSidebar />;
  }
}

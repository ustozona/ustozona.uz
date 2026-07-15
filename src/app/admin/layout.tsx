import { redirect } from "next/navigation";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { getSession } from "@/server/session";
import { isSuperAdmin } from "@/lib/auth-roles";
import AdminSidebar from "./_components/AdminSidebar";
import AdminHeader from "./_components/AdminHeader";

/* ════════════════════════════════════════════════════════════════════
   ADMIN QOBIQ — /admin/* uchun yengil shell.

   Dashboard'dagi 17 ta *ServerSync, OnboardingGate, TourProvider
   ATAYLAB mount qilinmaydi — bular oʻqituvchi store'lariga tegishli.

   Rol tekshiruvi shu yerda (UX) + har bir admin DAL funksiyasida
   requireAdmin() (haqiqiy himoya).
   ════════════════════════════════════════════════════════════════════ */

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (!isSuperAdmin(session.user)) redirect("/dashboard");

  return (
    <SidebarProvider
      className="h-svh min-h-[600px]"
      style={{ "--top-header-height": "3.8rem" } as React.CSSProperties}
    >
      <AdminSidebar />
      <SidebarInset className="min-h-0 overflow-hidden">
        <AdminHeader />
        <div className="relative flex-1 min-w-0 min-h-0 overflow-auto">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

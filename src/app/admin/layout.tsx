import Link from "next/link";
import { redirect } from "next/navigation";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { getSession } from "@/server/session";
import { isSuperAdmin } from "@/lib/auth-roles";
import NotificationsServerSync from "@/components/sync/NotificationsServerSync";
import ImpersonationBanner from "@/components/ImpersonationBanner";
import AdminSidebar from "./_components/AdminSidebar";
import AdminHeader from "./_components/AdminHeader";
import StopImpersonationButton from "./_components/StopImpersonationButton";

/* ════════════════════════════════════════════════════════════════════
   ADMIN QOBIQ — /admin/* uchun yengil shell.

   Dashboard'dagi *ServerSync'lar, OnboardingGate, TourProvider ATAYLAB
   mount qilinmaydi — bular oʻqituvchi store'lariga tegishli. YAGONA
   istisno: NotificationsServerSync — admin panelidagi qoʻngʻiroq
   (yangi fikr/javob xabari) shusiz jonli boʻlmaydi.

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

  /* Ruxsat yo'q — JIMGINA ULOQTIRMAYMIZ, sababini aytamiz.

     Ilgari bu yerda `redirect("/dashboard")` turardi. Xavfsizlik
     jihatidan to'g'ri, lekin foydalanuvchi uchun jumboq: havolani
     bosadi va o'zini boshqaruv panelida ko'radi — nega, bilmaydi.
     2026-08-08 da loyiha egasining o'zi shu holatga tushdi
     («admin paneli bor edi, nega hozir yo'q?»): u ilgari super_admin
     akkaunt bilan kirgan, keyin boshqa akkauntga o'tgan va farqni
     ko'rmagan.

     ⚠️ `children` ATAYLAB render qilinmaydi — shunda sahifa
     komponenti umuman bajarilmaydi va undagi `requireAdmin()`
     istisno otmaydi. Ya'ni bu ekran haqiqiy darvozani ALMASHTIRMAYDI,
     faqat undan oldin turadi: himoya avvalgidek har admin DAL
     funksiyasida `requireAdmin()` bilan ta'minlanadi.

     ⛔ Bu yerda kim ekanini yoki qanday rol kerakligini batafsil
     yozmaymiz — begona odamga tizim tuzilishi haqida ma'lumot
     bermaslik kerak. */
  if (!isSuperAdmin(session.user)) {
    /* ⛔ ENG KO'P UCHRAGAN SABAB — IMPERSONATSIYA, "boshqa hisob" EMAS.

       Admin o'zi `/admin/users` dan «... sifatida ko'rish» tugmasini
       bosadi; bu joriy cookie'ni impersonatsiya sessiyasiga ALMASHTIRADI
       va uning roli — o'sha odamniki, ya'ni odatda oddiy `teacher`
       (`src/server/session.ts` dagi izoh). Shundan keyin `/admin` ga
       qaytilsa mana shu ekran chiqadi.

       2026-08-09 da loyiha egasi aynan shunga tushdi: `ustozona@gmail.com`
       soat 18:05 da Otabekni impersonate qilgan (bu tugmaning o'zi
       super_admin talab qiladi, ya'ni huquq JOYIDA edi), 18:33 da esa
       «super admin bo'lsam ham admin panelga kirolmayapman» degan
       xulosaga keldi. Yechim bir bosish edi, lekin ko'rinmasdi:
       «Chiqish» tugmasi faqat `dashboard/layout.tsx` dagi qizil
       chiziqda, bu yerda esa yo'q edi. Yuqoridagi umumiy matn
       («boshqa hisob bilan kiring») bunday holatda NOTO'G'RI maslahat.

       Shuning uchun sababni ajratib aytamiz va chiqish yo'lini SHU
       YERGA qo'yamiz. */
    if (session.session.impersonatedBy) {
      return (
        <div className="flex min-h-svh items-center justify-center p-6">
          <div className="max-w-md rounded-xl border bg-card p-6 shadow-sm">
            <h1 className="text-lg font-semibold">
              Siz hozir boshqa hisobni ko&apos;rib turibsiz
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              <strong>{session.user.name}</strong> sifatida ko&apos;rmoqdasiz.
              Administrator bo&apos;limi bu rejimda yopiq — chunki hozirgi
              sessiya o&apos;sha hisobning huquqlari bilan ishlaydi.
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Admin huquqingiz joyida. Impersonatsiyani to&apos;xtatsangiz
              darhol qaytadi.
            </p>
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <StopImpersonationButton />
              <Link
                href="/dashboard"
                className="text-sm text-muted-foreground underline underline-offset-4"
              >
                Boshqaruv paneliga qaytish
              </Link>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="flex min-h-svh items-center justify-center p-6">
        <div className="max-w-md rounded-xl border bg-card p-6 shadow-sm">
          <h1 className="text-lg font-semibold">Bu bo&apos;lim yopiq</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Administrator bo&apos;limi faqat tizim administratorlari uchun.
            Hozirgi hisobingizda bu huquq yo&apos;q.
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Agar sizda administrator huquqi bo&apos;lgan boshqa hisob bo&apos;lsa —
            o&apos;sha hisob bilan kiring.
          </p>
          <div className="mt-5">
            <Link
              href="/dashboard"
              className="inline-flex rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
            >
              Boshqaruv paneliga qaytish
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider
      className="h-svh min-h-[600px]"
      style={{ "--top-header-height": "3.8rem" } as React.CSSProperties}
    >
      <NotificationsServerSync />
      <AdminSidebar />
      <SidebarInset className="min-h-0 overflow-hidden">
        {/* Admin BOSHQA ADMINNI impersonate qilsa yuqoridagi darvoza o'tib
            ketadi (rol baribir super_admin) va panel ochiq qoladi — hech
            qanday belgisiz. Chiziq impersonatsiya bo'lmasa `null`
            qaytaradi, ya'ni oddiy holatda hech narsa qo'shmaydi.
            Joylashuvi `dashboard/layout.tsx` bilan bir xil: SidebarInset
            ichida, sarlavhadan OLDIN. */}
        <ImpersonationBanner />
        <AdminHeader />
        <div className="relative flex-1 min-w-0 min-h-0 scrollbar-hover overflow-auto">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

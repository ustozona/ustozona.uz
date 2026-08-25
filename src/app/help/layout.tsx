import Link from "next/link";
import { LayoutDashboard } from "lucide-react";
import { BrandWordmark } from "@/assets/logo/brand-wordmark";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import Footer from "@/components/shadcn-space/blocks/footer-01/footer";
import { getSession } from "@/server/session";
import { HelpNav } from "./_components/HelpNav";
import { HelpSearchInput } from "./_components/HelpSearchInput";
import { HelpSearchProvider } from "./_components/HelpSearchContext";

/* Yordam markazi — LOGIN TALAB QILMAYDI (proxy.ts matcher'ida "/help" yo'q,
   demak PROTECTED_PREFIXES bekor qilinadi — [[../../../proxy.ts]] bilan bir
   xil naqsh: /blog ham shu tarzda ochiq). Shuning uchun bu yerda dashboard
   Header/AppSidebar EMAS, o'z yengil sarlavhasi bor — mavzu Google'da
   qidirilganda ham, mijoz hali ro'yxatdan o'tmasdan turib ham ochilishi
   kerak (jahon tajribasi: Notion/Slack/Stripe yordam markazlari xuddi
   shunday — public.help.md dagi tadqiqotga qarang).

   Header — Stripe/Linear/Notion docs andozasi: qidiruv sidebar emas,
   headerda (o'ng-chapdagi HelpSearchProvider orqali HelpNav bilan
   ulashiladi); logo dashboard bilan bir xil o'lchamda. O'ng taraf —
   `getSession()`ga qarab IKKI HOLATDAN BIRI (ikkalasi birga emas):
   sessiya bor → faqat "Boshqaruv paneli"; yo'q → "Kirish" (matn) +
   "Ro'yxatdan o'tish" (toʻldirilgan CTA). Layout login talab qilmaydi
   (yuqoridagi izoh), shuning uchun `getSession()` shu yerda faqat
   KOʻRINISH uchun ishlatiladi — himoya qatlami emas.

   Sahifa shakli: jahon tajribasi (Stripe/GitHub/Mintlify Docs) — yon
   panellar QATTIQ piksel kenglikda (menyu 18rem), markaz esa moslashuvchan
   (`1fr`) va ichidagi matn oʻzining `max-w-[680px]`i bilan chegaralangan.
   Nisbat emas — aks holda katta monitorda yon panellar ham choʻzilib
   ketardi; faqat boʻsh joy markazga (whitespace) qoʻshiladi.

   Scroll arxitekturasi: BUTUN sahifa (header + nav + kontent) bitta
   `ScrollArea` ichida — TimeGrid'dagi kabi header `sticky` boʻlib,
   kontent uning ostidan xira fon (backdrop-blur) bilan sirpanib oʻtadi.
   Shuning uchun har bir sahifa (`page.tsx`, `[slug]/page.tsx`) oʻz
   ScrollArea'sini OLIB TASHLADI — ArticleToc'ning faol-boʻlim aniqlash
   mantigʻi eng yaqin `[data-radix-scroll-area-viewport]`ni root sifatida
   qidiradi, shu bitta ScrollArea shu vazifani bajaradi. */
export default async function HelpLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();

  return (
    <HelpSearchProvider>
      <ScrollArea className="h-svh min-h-[600px] bg-background">
        <div className="flex min-h-svh flex-col">
          <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center gap-6 border-b border-border/60 bg-background/70 px-4 backdrop-blur-md md:px-6">
            <Link href="/" className="shrink-0">
              <BrandWordmark shieldClassName="size-[30px]" textClassName="text-base" gapClassName="gap-3" rollerSize="base" />
            </Link>

            <div className="hidden flex-1 justify-center sm:flex">
              <HelpSearchInput />
            </div>

            <div className="ml-auto flex shrink-0 items-center gap-3">
              {session ? (
                <Button asChild variant="ghost" size="sm" className="text-muted-foreground">
                  <Link href="/dashboard">
                    <LayoutDashboard className="size-4" />
                    Boshqaruv paneli
                  </Link>
                </Button>
              ) : (
                <>
                  <Button asChild variant="ghost" size="sm" className="text-muted-foreground">
                    <Link href="/login">Kirish</Link>
                  </Button>
                  <Button asChild size="sm">
                    <Link href="/register">Roʻyxatdan oʻtish</Link>
                  </Button>
                </>
              )}
            </div>
          </header>

          <div className="sticky top-14 z-20 border-b border-border/60 bg-background/70 p-3 backdrop-blur-md sm:hidden">
            <HelpSearchInput />
          </div>

          <div className="grid flex-1 grid-cols-1 lg:grid-cols-[18rem_1fr]">
            <HelpNav />
            <div className="min-w-0">{children}</div>
          </div>

          {/* Butun kenglikda — grid'dan TASHQARIDA, faqat kontent ustuni
              ostida emas (chap "Mavzular" ustuni ham shu qatorga kiradi).
              `mt-*` YOʻQ: Footer'ning oʻzida yetarli ichki boʻshliq bor. */}
          <div className="border-t border-border">
            <Footer />
          </div>
        </div>
      </ScrollArea>
    </HelpSearchProvider>
  );
}

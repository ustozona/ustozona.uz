import Link from "next/link";
import { LayoutDashboard, PenLine } from "lucide-react";
import { BrandWordmark } from "@/assets/logo/brand-wordmark";
import { Button } from "@/components/ui/button";
import { getSession } from "@/server/session";

/* Blog sarlavhasi — yordam markazi (`app/help/layout.tsx`) bilan AYNAN bir
   naqsh, chunki ikkalasi ham bir turdagi sahifa: login talab qilmaydigan,
   Google'dan toʻgʻridan-toʻgʻri ochiladigan ommaviy kontent. Oʻng taraf
   sessiyaga qarab IKKI HOLATDAN BIRI: bor → «Mening maqolalarim» +
   «Boshqaruv paneli», yoʻq → «Kirish» + «Roʻyxatdan oʻtish» (CTA).
   `getSession()` bu yerda faqat KOʻRINISH uchun — himoya qatlami emas.

   ⚠️ Nega layout EMAS, komponent. `/blog` ostida muharrir ham bor
   (`/blog/studio/[id]`) — u toʻliq ekranli (`h-dvh`), oʻz yuqori paneli
   bilan. `blog/layout.tsx` ga qoʻyilsa bu sarlavha muharrir ustiga ham
   chiqib, uning balandligini buzardi. Shuning uchun u faqat OʻQISH
   sahifalariga qoʻlda qoʻyiladi. */
export async function BlogHeader() {
  const session = await getSession();

  return (
    <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center gap-6 border-b border-border/60 bg-background/70 px-4 backdrop-blur-md md:px-6">
      <Link href="/blog" className="shrink-0">
        <BrandWordmark
          shieldClassName="size-[30px]"
          textClassName="text-base"
          gapClassName="gap-3"
          word="blog"
        />
      </Link>

      <div className="ml-auto flex shrink-0 items-center gap-2 sm:gap-3">
        {session ? (
          <>
            <Button asChild variant="ghost" size="sm" className="text-muted-foreground">
              <Link href="/blog/studio">
                <PenLine className="size-4" />
                <span className="hidden sm:inline">Mening maqolalarim</span>
              </Link>
            </Button>
            <Button asChild variant="ghost" size="sm" className="text-muted-foreground">
              <Link href="/dashboard">
                <LayoutDashboard className="size-4" />
                <span className="hidden sm:inline">Boshqaruv paneli</span>
              </Link>
            </Button>
          </>
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
  );
}

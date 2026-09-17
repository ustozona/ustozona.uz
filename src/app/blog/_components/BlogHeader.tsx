import Link from "next/link";
import { redirect } from "next/navigation";
import { PenLine } from "lucide-react";
import { BrandWordmark } from "@/assets/logo/brand-wordmark";
import { Button } from "@/components/ui/button";
import { createPostAction } from "@/server/actions/blog";
import { listPublishedPosts } from "@/server/dal/blog";
import { getSession } from "@/server/session";
import { BlogAccountMenu } from "./BlogAccountMenu";
import { BlogMobileMenu, type BlogViewer } from "./BlogMobileMenu";
import { BlogSearch } from "./BlogSearch";
import { BLOG_NAV } from "./blog-nav";

/* Blog sarlavhasi — uch holatli moslashuvchan tuzilish:

   · Desktop (`lg`+): logo · navigatsiya (oʻrtada) · qidiruv ikonkasi +
     «Yozish» (toʻldirilgan — sahifadagi yagona asosiy harakat) + avatar.
     Mehmon: qidiruv + «Kirish» + «Bepul boshlash».
   · Planshet (`sm`–`lg`): navigatsiya ☰ menyuga oʻtadi; «Yozish»/«Bepul
     boshlash» va avatar joyida qoladi.
   · Mobil (`sm` dan kichik): faqat logo, qidiruv ikonkasi va ☰ — hisob
     va asosiy tugma menyu ichida.

   `xl` da ichki boʻshliq olinadi: logo, hero sarlavhasi va footer matni
   maqolalar setkasining chap chizigʻiga toʻgʻri tekislanadi (setkadan
   yuqori/pastda vertikal chiziq yoʻq — ular faqat kartalarni ajratadi).

   Oʻng tomonda koʻpi bilan uchta element — asosiy harakat bitta.
   `getSession()` bu yerda faqat KOʻRINISH uchun — himoya qatlami emas.

   ⚠️ Nega layout EMAS, komponent. `/blog` ostida muharrir ham bor
   (`/blog/studio/[id]`) — u toʻliq ekranli (`h-dvh`), oʻz yuqori paneli
   bilan. `blog/layout.tsx` ga qoʻyilsa bu sarlavha muharrir ustiga ham
   chiqib, uning balandligini buzardi. Shuning uchun u faqat OʻQISH
   sahifalariga qoʻlda qoʻyiladi. */
export async function BlogHeader() {
  const [session, posts] = await Promise.all([getSession(), listPublishedPosts()]);

  async function handleWrite() {
    "use server";
    const { id } = await createPostAction();
    redirect(`/blog/studio/${id}`);
  }

  const viewer: BlogViewer = session
    ? {
        name: session.user.name ?? "",
        email: session.user.email ?? "",
        avatarUrl: session.user.image ?? null,
      }
    : null;

  const searchItems = posts.map((p) => ({
    slug: p.slug,
    title: p.title,
    excerpt: p.excerpt,
    authorName: p.authorName,
  }));

  return (
    <header className="sticky top-0 z-20 h-14 shrink-0 border-b border-border/40 bg-background/60 backdrop-blur-md backdrop-saturate-150">
      <div className="mx-auto grid h-full w-full max-w-7xl grid-cols-[1fr_auto] items-center gap-4 px-4 sm:px-6 xl:px-0 lg:grid-cols-[1fr_auto_1fr]">
        <Link href="/blog" className="w-fit shrink-0">
          <BrandWordmark
            shieldClassName="size-[30px]"
            textClassName="text-base"
            gapClassName="gap-3"
            word="blog"
          />
        </Link>

        <nav className="hidden items-center gap-6 text-sm lg:flex">
          {BLOG_NAV.map((item, i) => (
            <Link
              key={item.href}
              href={item.href}
              className={
                i === 0
                  ? "font-medium text-foreground"
                  : "text-muted-foreground transition-colors hover:text-foreground"
              }
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center justify-end gap-1.5 sm:gap-2">
          <BlogSearch posts={searchItems} />

          {viewer ? (
            <>
              <form action={handleWrite} className="hidden sm:block">
                <Button type="submit" size="sm" className="h-9">
                  <PenLine className="size-4" />
                  Yozish
                </Button>
              </form>
              <div className="hidden sm:block">
                <BlogAccountMenu name={viewer.name} email={viewer.email} avatarUrl={viewer.avatarUrl} />
              </div>
            </>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm" className="hidden h-9 text-muted-foreground lg:inline-flex">
                <Link href="/login">Kirish</Link>
              </Button>
              <Button asChild size="sm" className="hidden h-9 sm:inline-flex">
                <Link href="/register">Bepul boshlash</Link>
              </Button>
            </>
          )}

          <BlogMobileMenu viewer={viewer} writeAction={handleWrite} />
        </div>
      </div>
    </header>
  );
}

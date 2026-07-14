import Header from "@/components/shadcn-space/blocks/hero-01/header";
import { PAGE_NAV } from "@/lib/landing-nav";
import Footer from "@/components/shadcn-space/blocks/footer-01/footer";
import Blog from "@/components/shadcn-space/blocks/blog-01/blog";
import Newsletter from "@/components/shadcn-space/blocks/newsletter-01/newsletter";
import { CookieConsent } from "@/components/landing/CookieConsent";
import { Badge } from "@/components/ui/badge";
import { LandingGlow } from "@/components/landing/LandingGlow";

export const metadata = {
  title: "Blog — Ustozona",
  description: "Taʼlim, baholash va raqamli oʻqitish boʻyicha maqolalar.",
};

export default function BlogPage() {
  return (
    <div className="min-h-screen flex flex-col theme-landing-mono">
      <Header navigationData={PAGE_NAV} />
      <main className="flex-1">
        <section className="relative">
          <LandingGlow className="left-1/2 top-12 -translate-x-1/2 w-[70%] h-[40%]" />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-4 sm:pt-20 flex flex-col items-center gap-4 text-center">
            <Badge variant="outline" className="px-3 py-1 h-auto text-sm font-normal">
              Blog
            </Badge>
            <h1 className="text-4xl md:text-5xl font-medium">
              Taʼlim va raqamli oʻqitish
            </h1>
            <p className="text-base text-muted-foreground max-w-xl">
              Baholash, oʻzlashtirish va tizimdan samarali foydalanish boʻyicha
              maqolalar va maslahatlar.
            </p>
          </div>
        </section>
        <Blog />
        <Newsletter />
      </main>
      <Footer />
      <CookieConsent />
    </div>
  );
}

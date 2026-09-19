import Header from "@/components/shadcn-space/blocks/hero-01/header";
import AgencyHeroSection from "@/components/shadcn-space/blocks/hero-01";
import { ProductTabs } from "@/components/landing/ProductTabs";
import { ProductsSection } from "@/components/landing/ProductsSection";
import Pricing from "@/components/shadcn-space/blocks/pricing-02/pricing";
import { FaqCta } from "@/components/landing/FaqCta";
import Footer from "@/components/shadcn-space/blocks/footer-01/footer";
import { CookieConsent } from "@/components/landing/CookieConsent";
import type { Metadata } from "next";

/* Sarlavha/tavsif ildizdan meros — bosh sahifa uchun ular aynan toʻgʻri.
   Canonical esa endi har sahifada oʻzi belgilanadi (layout.tsx dagi
   izohga qarang), shuning uchun bu yerda ham aniq yoziladi.

   ⚠️ Bu yerga `openGraph` QOʻSHMANG: sayoz birlashish tufayli u ildizdagi
   butun `openGraph` obyektini (siteName, locale, type, title) almashtirib
   yuboradi — `og:url` bitta maydon uchun qolgani yoʻqoladi. */
export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

/* Tuzilma (docs/landing-design.md §7): vaʼda emas, mahsulotning oʻzi.
   Hero — vazifa tanlash va ikki rol (oʻqituvchi / oʻquvchi); keyin
   mahsulot tablari — har mahsulotga bitta tab, ichida namuna va 4 fakt;
   oxirida narx va FAQ + yopishgan chaqiriq. Umumiy «faktlar / nega biz /
   kimlar uchun» boʻlimlari va alohida Jurnal boʻlimi olib tashlandi —
   mazmuni tablarga tarqatildi. `#jurnal`, `#baholash` … langarlari
   endi tablar ichida (`ProductTabs`). */
export default function LandingPage() {
  return (
    <div id="top" className="min-h-screen flex flex-col theme-landing-mono scroll-smooth">
      <Header />
      <AgencyHeroSection />
      <main className="flex-1">
        <div id="features" className="scroll-mt-24">
          <ProductTabs />
        </div>
        <div id="products" className="scroll-mt-24">
          <ProductsSection />
        </div>
        <div id="pricing" className="scroll-mt-24">
          <Pricing />
        </div>
        <div id="faq" className="scroll-mt-24">
          <FaqCta />
        </div>
      </main>
      <Footer />
      <CookieConsent />
    </div>
  );
}

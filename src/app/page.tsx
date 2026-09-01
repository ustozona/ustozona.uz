import Header from "@/components/shadcn-space/blocks/hero-01/header";
import { LANDING_NAV } from "@/lib/landing-nav";
import AgencyHeroSection from "@/components/shadcn-space/blocks/hero-01";
import AboutAndStats01 from "@/components/shadcn-space/blocks/about-us-01";
import Feature from "@/components/shadcn-space/blocks/feature-01";
import Services from "@/components/shadcn-space/blocks/services-02/services";
import { ProductsSection } from "@/components/landing/ProductsSection";
import HowItWorks from "@/components/shadcn-space/blocks/how-it-works/how-it-works";
import Personas from "@/components/shadcn-space/blocks/personas-01/personas";
import Pricing from "@/components/shadcn-space/blocks/pricing-02/pricing";
import CTA from "@/components/shadcn-space/blocks/cta-01/cta";
import Faq from "@/components/shadcn-space/blocks/faq-01/faq";
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

export default function LandingPage() {
  return (
    <div id="top" className="min-h-screen flex flex-col theme-landing-mono scroll-smooth">
      <Header navigationData={LANDING_NAV} />
      <AgencyHeroSection />
      <main className="flex-1">
        <AboutAndStats01 />
        <Feature />
        <div id="features" className="scroll-mt-24">
          <Services />
        </div>
        <div id="products" className="scroll-mt-24">
          <ProductsSection />
        </div>
        <HowItWorks />
        <Personas />
        <div id="pricing" className="scroll-mt-24">
          <Pricing />
        </div>
        <div id="faq" className="scroll-mt-24">
          <Faq />
        </div>
        <CTA />
      </main>
      <Footer />
      <CookieConsent />
    </div>
  );
}

import Header, { type NavigationSection } from "@/components/shadcn-space/blocks/hero-01/header";
import AgencyHeroSection from "@/components/shadcn-space/blocks/hero-01";
import LogoCloud from "@/components/shadcn-space/blocks/logo-cloud-01/logo-cloud";
import AboutAndStats01 from "@/components/shadcn-space/blocks/about-us-01";
import Services from "@/components/shadcn-space/blocks/services-01/services";
import Feature from "@/components/shadcn-space/blocks/feature-01";
import Personas from "@/components/shadcn-space/blocks/personas-01/personas";
import Bentogrid from "@/components/shadcn-space/blocks/bento-grid-01/bentogrid";
import Pricing from "@/components/shadcn-space/blocks/pricing-01/pricing";
import CTA from "@/components/shadcn-space/blocks/cta-01/cta";
import Faq from "@/components/shadcn-space/blocks/faq-01/faq";
import Footer from "@/components/shadcn-space/blocks/footer-01/footer";
import { CookieConsent } from "@/components/landing/CookieConsent";

const navigationData: NavigationSection[] = [
  { title: "Asosiy", href: "#", isActive: true },
  { title: "Imkoniyatlar", href: "#features" },
  { title: "Narxlar", href: "#pricing" },
  { title: "Blog", href: "/blog" },
  { title: "FAQ", href: "#faq" },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col theme-landing-mono">
      <Header navigationData={navigationData} />
      <AgencyHeroSection />
      <main className="flex-1">
        <LogoCloud />
        <AboutAndStats01 />
        <div id="features" className="scroll-mt-24">
          <Services />
        </div>
        <Feature />
        <Bentogrid />
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

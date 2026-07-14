import Header from "@/components/shadcn-space/blocks/hero-01/header";
import Footer from "@/components/shadcn-space/blocks/footer-01/footer";
import { CookieConsent } from "@/components/landing/CookieConsent";
import { PAGE_NAV } from "@/lib/landing-nav";

/** Yuridik sahifalar (shartlar, maxfiylik) uchun umumiy qobiq. */
export function LegalPage({
  title,
  updatedAt,
  children,
}: {
  title: string;
  /** Oxirgi yangilangan sana — oʻzbekcha, toʻliq shaklda. */
  updatedAt: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col theme-landing-mono">
      <Header navigationData={PAGE_NAV} />
      <main className="flex-1">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <div className="flex flex-col gap-2 mb-10">
            <h1 className="text-3xl sm:text-4xl font-semibold text-foreground">
              {title}
            </h1>
            <p className="text-sm text-muted-foreground">
              Oxirgi yangilanish: {updatedAt}
            </p>
          </div>

          <div
            className="flex flex-col gap-6 text-base leading-relaxed text-muted-foreground
              [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-foreground [&_h2]:mt-6
              [&_ul]:flex [&_ul]:flex-col [&_ul]:gap-2 [&_ul]:pl-5 [&_li]:list-disc
              [&_strong]:text-foreground [&_strong]:font-medium
              [&_a]:text-foreground [&_a]:underline [&_a]:underline-offset-4"
          >
            {children}
          </div>
        </div>
      </main>
      <Footer />
      <CookieConsent />
    </div>
  );
}

export default LegalPage;

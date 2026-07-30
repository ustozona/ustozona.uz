import { Check, Info, ArrowUpRight } from "lucide-react";
import Header from "@/components/shadcn-space/blocks/hero-01/header";
import Footer from "@/components/shadcn-space/blocks/footer-01/footer";
import { CookieConsent } from "@/components/landing/CookieConsent";
import { Badge } from "@/components/ui/badge";
import { InterestButton } from "@/components/landing/InterestButton";
import { PAGE_NAV, PRODUCTS, type Product } from "@/lib/landing-nav";

/**
 * Ost-loyihalar (Baholash/Doska/Shogird/Boshqaruv) uchun umumiy sahifa
 * qobigʻi — LegalPage.tsx naqshi (Header + Footer + CookieConsent), lekin
 * mahsulot tuzilmasi bilan. "Holat bloki" MAJBURIY — hech biri hali
 * tayyor emas, docs/marketing-brief.md oltin qoidasiga mos ochiq yoziladi.
 */
export function ProductPage({
  slug,
  capabilities,
  differentiator,
  plannedNote,
}: {
  slug: Product["slug"];
  /** Imkoniyatlar roʻyxati — hammasi kelasi zamonda, hali qilingan emas. */
  capabilities: string[];
  /** Bu mahsulotni boshqalardan ajratadigan 1-2 xatboshi. */
  differentiator: string;
  /** Ochiq holat bloki matni — "hozircha nima yoʻq" halol izohi. */
  plannedNote: string;
}) {
  const product = PRODUCTS.find((p) => p.slug === slug)!;
  const others = PRODUCTS.filter((p) => p.slug !== slug);

  return (
    <div className="min-h-screen flex flex-col theme-landing-mono">
      <Header navigationData={PAGE_NAV} />
      <main className="flex-1">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          {/* Hero */}
          <div className="flex flex-col gap-3 mb-10">
            <Badge variant="outline" className="w-fit gap-1.5 text-muted-foreground">
              {product.statusLabel}
            </Badge>
            <h1 className="text-3xl sm:text-4xl font-semibold text-foreground">
              {product.name}
            </h1>
            <p className="text-lg text-muted-foreground">{product.tagline}</p>
          </div>

          {/* Imkoniyatlar */}
          <div className="flex flex-col gap-3 mb-10">
            <h2 className="text-xl font-semibold text-foreground">
              Nima rejalashtirilgan
            </h2>
            <ul className="flex flex-col gap-2.5">
              {capabilities.map((c) => (
                <li key={c} className="flex items-start gap-2.5 text-base text-muted-foreground">
                  <Check className="mt-1 size-4 shrink-0 text-muted-foreground" />
                  {c}
                </li>
              ))}
            </ul>
          </div>

          {/* Farqi */}
          <div className="flex flex-col gap-3 mb-10">
            <h2 className="text-xl font-semibold text-foreground">Farqi</h2>
            <p className="text-base leading-relaxed text-muted-foreground">
              {differentiator}
            </p>
          </div>

          {/* Holat bloki — majburiy, ochiq */}
          <div className="flex items-start gap-3 rounded-xl border border-border bg-muted/40 px-4 py-3.5 mb-10">
            <Info className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
            <p className="text-sm leading-relaxed text-muted-foreground">
              <strong className="text-foreground">Bu hali tayyor emas.</strong>{" "}
              {plannedNote}
            </p>
          </div>

          <InterestButton product={slug} />

          {/* Boshqa mahsulotlar */}
          <div className="mt-16 pt-10 border-t border-border">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-4">
              Boshqa mahsulotlar
            </h2>
            <div className="flex flex-col gap-1">
              {others.map((p) => (
                <a
                  key={p.slug}
                  href={`/${p.slug}`}
                  className="group flex items-center justify-between gap-3 rounded-lg px-3 py-2.5 -mx-3 transition-colors hover:bg-muted"
                >
                  <span className="text-sm font-medium text-foreground">
                    {p.name}
                  </span>
                  <ArrowUpRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </a>
              ))}
            </div>
          </div>
        </div>
      </main>
      <Footer />
      <CookieConsent />
    </div>
  );
}

export default ProductPage;

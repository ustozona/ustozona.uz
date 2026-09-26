import { Check, Info, ArrowUpRight } from "lucide-react";
import { useTranslations } from "next-intl";
import Header from "@/components/shadcn-space/blocks/hero-01/header";
import Footer from "@/components/shadcn-space/blocks/footer-01/footer";
import { CookieConsent } from "@/components/landing/CookieConsent";
import { Badge } from "@/components/ui/badge";
import { InterestButton } from "@/components/landing/InterestButton";
import ButtonWithIcon from "@/components/shadcn-space/button/button-01";
import { PRODUCTS, type Product } from "@/lib/landing-nav";

/**
 * Ost-loyihalar (Baholash/Doska/Shogird/Boshqaruv) uchun umumiy sahifa
 * qobigʻi — LegalPage.tsx naqshi (Header + Footer + CookieConsent), lekin
 * mahsulot tuzilmasi bilan.
 *
 * Ikki holat `PRODUCTS` dagi `status` dan olinadi:
 * • `soon` — «Nima rejalashtirilgan» + MAJBURIY holat bloki («Bu hali
 *   tayyor emas») + «Qiziqish bildirish». docs/marketing-brief.md oltin
 *   qoidasi: tayyor boʻlmagan narsa tayyor deb koʻrsatilmaydi.
 * • `live` — «Nima qila olasiz» + roʻyxatdan oʻtish tugmasi. Holat bloki
 *   chiqmaydi: ishlaydigan mahsulotga «tayyor emas» deyish ham yolgʻon.
 */
export function ProductPage({
  slug,
  capabilities,
  differentiator,
  plannedNote,
}: {
  slug: Product["slug"];
  /** Imkoniyatlar roʻyxati: `soon` da kelasi zamonda, `live` da bugun ishlaydigani. */
  capabilities: string[];
  /** Bu mahsulotni boshqalardan ajratadigan 1-2 xatboshi. */
  differentiator: string;
  /** Ochiq holat bloki matni — "hozircha nima yoʻq" halol izohi. Faqat `soon` da. */
  plannedNote?: string;
}) {
  const t = useTranslations("Landing.common");
  const product = PRODUCTS.find((p) => p.slug === slug)!;
  const others = PRODUCTS.filter((p) => p.slug !== slug);
  const live = product.status === "live";

  return (
    <div className="min-h-screen flex flex-col theme-landing-mono">
      <Header />
      <main className="flex-1">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          {/* Hero */}
          <div className="flex flex-col gap-3 mb-10">
            <Badge variant="outline" className="w-fit gap-1.5 text-muted-foreground">
              {product.statusLabel}
            </Badge>
            <h1 className="text-landing-5 font-semibold text-foreground">
              {product.name}
            </h1>
            <p className="text-lg text-muted-foreground">{product.tagline}</p>
          </div>

          {/* Imkoniyatlar */}
          <div className="flex flex-col gap-3 mb-10">
            <h2 className="text-landing-1 font-semibold text-foreground">
              {live ? "Nima qila olasiz" : "Nima rejalashtirilgan"}
            </h2>
            <ul className="flex flex-col gap-3">
              {capabilities.map((c) => (
                <li key={c} className="flex items-start gap-2 text-base text-muted-foreground">
                  <Check className="mt-1 size-4 shrink-0 text-muted-foreground" />
                  {c}
                </li>
              ))}
            </ul>
          </div>

          {/* Farqi */}
          <div className="flex flex-col gap-3 mb-10">
            <h2 className="text-landing-1 font-semibold text-foreground">Farqi</h2>
            <p className="text-base leading-relaxed text-muted-foreground">
              {differentiator}
            </p>
          </div>

          {live ? (
            <div className="flex flex-col items-start gap-3">
              <ButtonWithIcon href="/register">Bepul roʻyxatdan oʻtish</ButtonWithIcon>
              <p className="text-sm text-muted-foreground">
                {t("freeNote")}{" "}
                <a href="/login" className="font-medium text-foreground underline underline-offset-4">
                  Akkauntingiz bormi? Kiring
                </a>
              </p>
            </div>
          ) : (
            <>
              {/* Holat bloki — majburiy, ochiq */}
              <div className="flex items-start gap-3 rounded-xl border border-border bg-muted/40 px-4 py-3 mb-10">
                <Info className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                <p className="text-sm leading-relaxed text-muted-foreground">
                  <strong className="text-foreground">Bu hali tayyor emas.</strong>{" "}
                  {plannedNote}
                </p>
              </div>

              <InterestButton product={slug} />
            </>
          )}

          {/* Boshqa mahsulotlar */}
          <div className="mt-16 pt-10 border-t border-border">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-4">
              Boshqa mahsulotlar
            </h2>
            <div className="flex flex-col gap-1">
              {others.map((p) => (
                <a
                  key={p.slug}
                  href={p.href}
                  className="group flex items-center justify-between gap-3 rounded-lg px-3 py-3 -mx-3 transition-colors hover:bg-muted"
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

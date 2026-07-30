import { Badge } from "@/components/ui/badge";
import { ArrowUpRight } from "lucide-react";
import { PRODUCTS } from "@/lib/landing-nav";

/**
 * "Mahsulotlar" boʻlimi — Ustozona ustiga quriladigan ost-loyihalar
 * (docs/ost-loyihalar-arxitektura.md). Asosiy Ustozona birinchi karta,
 * ATAYLAB boshqacha koʻrinishda: kirgan odam bir qarashda nima tayyor,
 * nima yoʻqligini koʻrsin (docs/marketing-brief.md oltin qoidasi).
 */
export function ProductsSection() {
  return (
    <section className="bg-background">
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 lg:py-20 sm:py-16 py-8">
        <div className="flex flex-col sm:gap-16 gap-8">
          <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-left-10 duration-1000 delay-200 ease-in-out fill-mode-both">
            <Badge
              variant="outline"
              className="py-1 px-3 h-auto text-sm font-normal border-0 outline outline-border w-fit"
            >
              Ekotizim
            </Badge>
            <h2 className="sm:text-5xl text-3xl text-foreground font-semibold">
              Mahsulotlar
            </h2>
            <p className="max-w-2xl text-muted-foreground sm:text-lg text-base">
              Ustozona ustiga quriladigan yoʻnalishlar. Bittasi ishlayapti,
              qolganlari yoʻlda.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <a
              href="#features"
              className="group flex flex-col gap-4 rounded-2xl border border-border bg-card p-6 transition-colors hover:border-foreground/20 sm:col-span-2 sm:row-span-1"
              style={{ backgroundColor: "color-mix(in oklch, #FBC02D 8%, var(--card))" }}
            >
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-xl font-semibold text-foreground">
                  Ustozona
                </h3>
                <Badge className="gap-1.5 border-success/30 bg-success/10 text-success hover:bg-success/10">
                  Ishlayapti
                </Badge>
              </div>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Oʻqituvchi paneli — jurnal, davomat, xulq, jadval, dars
                ishlanmasi. Bugun ishlatishingiz mumkin.
              </p>
              <span className="mt-auto flex items-center gap-1 text-sm font-medium text-foreground">
                Imkoniyatlarni koʻrish
                <ArrowUpRight className="size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </span>
            </a>

            {PRODUCTS.map((p) => (
              <a
                key={p.slug}
                href={`/${p.slug}`}
                className="group flex flex-col gap-4 rounded-2xl border border-border bg-card p-6 transition-colors hover:border-foreground/20"
              >
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-lg font-semibold text-foreground">
                    {p.name}
                  </h3>
                  <Badge variant="outline" className="shrink-0 text-muted-foreground">
                    {p.statusLabel}
                  </Badge>
                </div>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {p.tagline}
                </p>
                <span className="mt-auto flex items-center gap-1 text-sm font-medium text-foreground">
                  Batafsil
                  <ArrowUpRight className="size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </span>
              </a>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export default ProductsSection;

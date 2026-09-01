"use client";

import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { GlowBadge } from "@/components/shadcn-space/badge/glow-badge";
import { MagicCard } from "@/components/ui/magic-card";
import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { BrandShield } from "@/assets/logo/brand-shield";
import {
  PRODUCT_ICONS,
  PRODUCT_ICON_STYLE,
} from "@/components/shadcn-space/blocks/hero-01/product-icons";
import { PRODUCTS, type Product } from "@/lib/landing-nav";

/**
 * Har ost-loyihaga oʻz tusi — MagicCard porlashi va hover tugmasi shu
 * rangda. Ranglar header dropdown'idagi `PRODUCT_ICON_STYLE` bilan bir
 * xil (blog=slate, baholash=binafsha, doska=zumrad, shogird=koʻk,
 * boshqaruv=kahrabo). `from`/`to` — MagicCard chegara gradienti,
 * `spot` — ichki xira dogʻ, `cta` — tugma hoverida toʻluvchi gradient
 * (matn oq boʻlgani uchun toʻqroq pogʻonalar).
 */
const CARD_FX: Record<Product["slug"], { from: string; to: string; spot: string }> = {
  blog: { from: "#94a3b8", to: "#64748b", spot: "#64748b" },
  baholash: { from: "#a78bfa", to: "#8b5cf6", spot: "#8b5cf6" },
  doska: { from: "#34d399", to: "#10b981", spot: "#10b981" },
  shogird: { from: "#60a5fa", to: "#3b82f6", spot: "#3b82f6" },
  boshqaruv: { from: "#fbbf24", to: "#f59e0b", spot: "#f59e0b" },
};

/** Asosiy Ustozona kartasi — brend sarigʻi. */
const MAIN_FX = { from: "#fde68a", to: "#fbc02d", spot: "#fbc02d" };

/**
 * CTA hoverida — matn + xira fon loyihaning toʻq tusiga oʻtadi
 * (`PRODUCT_ICON_STYLE` bilan bir xil 700 pogʻona). Asosiy karta — neytral.
 */
const CTA_HOVER: Record<Product["slug"], string> = {
  blog: "hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-500/15 dark:hover:text-slate-300",
  baholash: "hover:bg-violet-50 hover:text-violet-700 dark:hover:bg-violet-500/15 dark:hover:text-violet-400",
  doska: "hover:bg-emerald-50 hover:text-emerald-700 dark:hover:bg-emerald-500/15 dark:hover:text-emerald-400",
  shogird: "hover:bg-blue-50 hover:text-blue-700 dark:hover:bg-blue-500/15 dark:hover:text-blue-400",
  boshqaruv: "hover:bg-amber-50 hover:text-amber-700 dark:hover:bg-amber-500/15 dark:hover:text-amber-400",
};

/** Asosiy karta — brend sarigʻi (hardcoded, mavzudan qatʼi nazar — design-system §4). */
const CTA_HOVER_MAIN =
  "hover:bg-[#FBC02D]/15 hover:text-[#7a5c00] dark:hover:text-[#FBC02D]";

/** Kartadagi CTA — oddiy ghost havola + strelka, hoverda loyiha ranggida. */
function CardCta({
  href,
  hover,
  children,
}: {
  href: string;
  hover: string;
  children: string;
}) {
  return (
    <a
      href={href}
      className={cn(
        "mt-auto -ml-2.5 inline-flex h-8 w-fit items-center gap-1.5 rounded-md px-2.5 text-sm font-medium text-muted-foreground transition-colors duration-fast ease-standard focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        hover,
      )}
    >
      {children}
      <ArrowUpRight className="size-4" />
    </a>
  );
}

/** Ost-loyiha ikona-sloti — 36px rangli quti (header dropdown bilan bir xil). */
function ProductMark({ slug }: { slug: Product["slug"] }) {
  const Icon = PRODUCT_ICONS[slug];
  return (
    <span
      className={cn(
        "flex size-9 shrink-0 items-center justify-center rounded-lg",
        PRODUCT_ICON_STYLE[slug],
      )}
    >
      <Icon className="size-[18px] text-current" />
    </span>
  );
}

/**
 * Bitta karta — barcha oʻlchamlar shu yerda (bir marta), 4pt-grid:
 * padding 20 · ustun gap 12 · icon-row gap 12 · iconbox 36 · sarlavha 16/600
 * · tavsif 14/400 (2 qatorga muzlatilgan) · CTA 14/500.
 */
function ProductCard({
  mark,
  title,
  desc,
  statusTone,
  statusLabel,
  href,
  ctaLabel,
  ctaHover,
  fx,
}: {
  /** 36px ikona-slot — ost-loyihalarda rangli quti, asosiy kartada brend qalqoni. */
  mark: ReactNode;
  title: string;
  desc: string;
  statusTone: "success" | "pending";
  statusLabel: string;
  href: string;
  ctaLabel: string;
  ctaHover: string;
  fx: { from: string; to: string; spot: string };
}) {
  return (
    <MagicCard
      className="rounded-2xl"
      gradientFrom={fx.from}
      gradientTo={fx.to}
      gradientColor={fx.spot}
      gradientOpacity={0.08}
    >
      <div className="flex h-full flex-col gap-3 p-5">
        <div className="flex items-center gap-3">
          {mark}
          <h3 className="min-w-0 flex-1 truncate text-base font-semibold text-foreground">
            {title}
          </h3>
          <GlowBadge tone={statusTone} size="sm" className="shrink-0">
            {statusLabel}
          </GlowBadge>
        </div>
        <p className="line-clamp-2 min-h-[2.625rem] text-sm leading-normal text-muted-foreground">
          {desc}
        </p>
        <CardCta href={href} hover={ctaHover}>
          {ctaLabel}
        </CardCta>
      </div>
    </MagicCard>
  );
}

/**
 * "Mahsulotlar" boʻlimi — Ustozona ustiga quriladigan ost-loyihalar
 * (docs/ost-loyihalar-arxitektura.md). Asosiy Ustozona birinchi karta,
 * ATAYLAB boshqacha koʻrinishda: kirgan odam bir qarashda nima tayyor,
 * nima yoʻqligini koʻrsin (docs/marketing-brief.md oltin qoidasi).
 */
export function ProductsSection() {
  const t = useTranslations("Landing.products");
  return (
    <section className="bg-background">
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 lg:py-20 sm:py-16 py-8">
        <div className="flex flex-col sm:gap-16 gap-8">
          <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-left-10 duration-1000 delay-200 ease-in-out fill-mode-both">
            <Badge
              variant="outline"
              className="py-1 px-3 h-auto text-sm font-normal border-0 outline outline-border w-fit"
            >
              {t("badge")}
            </Badge>
            <h2 className="sm:text-5xl text-3xl text-foreground font-semibold">
              {t("heading")}
            </h2>
            <p className="max-w-2xl text-muted-foreground sm:text-lg text-base">
              {t("desc")}
            </p>
          </div>

          <div className="grid gap-4 sm:auto-rows-fr sm:grid-cols-2 lg:grid-cols-3">
            <ProductCard
              mark={
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[#FBC02D]/15">
                  <BrandShield className="size-[18px]" />
                </span>
              }
              title={t("mainTitle")}
              desc={t("mainDesc")}
              statusTone="success"
              statusLabel={t("mainStatus")}
              href="#features"
              ctaLabel={t("mainCta")}
              ctaHover={CTA_HOVER_MAIN}
              fx={MAIN_FX}
            />

            {PRODUCTS.map((p) => (
              <ProductCard
                key={p.slug}
                mark={<ProductMark slug={p.slug} />}
                title={p.name}
                desc={p.tagline}
                statusTone={p.status === "live" ? "success" : "pending"}
                statusLabel={p.statusLabel}
                href={p.href}
                ctaLabel={t("detailCta")}
                ctaHover={CTA_HOVER[p.slug]}
                fx={CARD_FX[p.slug]}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export default ProductsSection;

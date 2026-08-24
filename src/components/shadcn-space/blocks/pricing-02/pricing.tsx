"use client";

import { useTranslations } from "next-intl";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GlowBadge } from "@/components/shadcn-space/badge/glow-badge";
import ButtonWithIcon from "@/components/shadcn-space/button/button-01";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { Check, Clock } from "lucide-react";
import { motion } from "motion/react";
import { CLASS_COLOR_BASE } from "@/lib/class-colors";

type RawPlan = {
  name: string;
  status: string;
  descp: string;
  price: string;
  cta: string;
  features: string[];
};

type PricingPlan = {
  plan_name: string;
  plan_status: string;
  /** true = bugun ishlaydi; false = sentabr rejasi (halol yorliq bilan) */
  plan_live: boolean;
  plan_descp: string;
  plan_price: string;
  plan_price_note?: string;
  plan_cta: string;
  plan_href: string;
  plan_feature: string[];
  plan_recommended: boolean;
};

const PLAN_META: { live: boolean; recommended: boolean }[] = [
  { live: false, recommended: false },
  { live: true, recommended: true },
  { live: false, recommended: false },
];

// Aylanuvchi chegara ranglari — dizayn-tizimi palitrasidan (class-colors),
// blokning xom `from-blue-500 via-red-500` ranglari oʻrniga.
const featuredBorderGradient = `conic-gradient(from 0deg, ${CLASS_COLOR_BASE.blue}, ${CLASS_COLOR_BASE.violet}, ${CLASS_COLOR_BASE.teal}, ${CLASS_COLOR_BASE.blue})`;

const Pricing = () => {
  const t = useTranslations("Landing.pricing");
  const rawPlans = t.raw("plans") as RawPlan[];
  // Tarjima massivi uzunligi/tartibi mos kelmasa (index chegaradan chiqsa)
  // xato ravishda "live/recommended" deb koʻrsatilmasin — xavfsiz standart.
  const SAFE_META = { live: false, recommended: false };
  const pricingData: PricingPlan[] = rawPlans.map((p, i) => ({
    plan_name: p.name,
    plan_status: p.status,
    plan_live: (PLAN_META[i] ?? SAFE_META).live,
    plan_descp: p.descp,
    plan_price: p.price,
    plan_cta: p.cta,
    plan_href: "/register",
    plan_feature: p.features,
    plan_recommended: (PLAN_META[i] ?? SAFE_META).recommended,
  }));
  const pricingCardVariants = {
    hidden: {
      opacity: 0,
      y: 24,
    },
    visible: (index: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: index * 0.08,
        duration: 0.5,
        ease: "easeInOut" as const,
      },
    }),
  };

  return (
    <section className="bg-background py-10 lg:py-0">
      <div className="max-w-7xl mx-auto px-4 xl:px-16 lg:py-20 sm:py-16 py-8">
        <div className="flex flex-col gap-8 md:gap-12 items-center justify-center w-full">
          {/* Heading */}
          <div className="flex flex-col gap-4 justify-center items-center">
            {/* Badge */}
            <Badge
              variant={"outline"}
              className="py-1 px-3 text-sm font-normal leading-5 w-fit h-7"
            >
              {t("badge")}
            </Badge>
            {/* Heading */}
            <div className="max-w-md sm:max-w-2xl mx-auto text-center flex flex-col gap-3">
              <h2 className="text-foreground text-3xl sm:text-5xl font-medium">
                {t("heading")}
              </h2>
              <p className="text-muted-foreground text-base">
                {t("desc")}
              </p>
            </div>
          </div>
          {/*  */}
          <div className="flex flex-col lg:flex-row gap-6 items-stretch h-full w-full">
            {pricingData.map((plan: PricingPlan, index: number) => {
              const isFeatured = plan.plan_recommended;

              return (
                <motion.div
                  key={index}
                  variants={pricingCardVariants}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, amount: 0.1 }}
                  custom={index}
                  className={cn(
                    "relative flex-1 flex flex-col w-full",
                    isFeatured && "z-10 scale-102"
                  )}
                >
                  {/* GRADIENT BORDER */}
                  {isFeatured && (
                    <div className="absolute -inset-0.5 rounded-2xl overflow-hidden">
                      {/* Animated conic-gradient border */}
                      <div
                        className="absolute -inset-full blur-xs animate-spin [animation-duration:2s] motion-reduce:animate-none"
                        style={{ background: featuredBorderGradient }}
                      />

                      {/* Inner mask */}
                      <div className="absolute inset-0.5 rounded-2xl bg-card" />
                    </div>
                  )}

                  {/* CARD */}
                  <Card
                    className={cn(
                      "relative flex-1 flex flex-col rounded-2xl p-8 gap-8",
                      isFeatured ? "border-0 ring-0" : "border border-border"
                    )}
                  >
                    <CardHeader className="p-0">
                      <div className="flex flex-col items-center text-center gap-3 self-stretch">
                        {/* Holat yorligʻi eng tepada — oʻqituvchi nima bugun
                            ishlashini birinchi boʻlib koʻrsin. */}
                        <GlowBadge tone={plan.plan_live ? "success" : "pending"}>
                          {plan.plan_status}
                        </GlowBadge>
                        <CardTitle className="text-2xl font-medium text-primary">
                          {plan.plan_name}
                        </CardTitle>
                        <CardDescription className="text-base font-normal">
                          {plan.plan_descp}
                        </CardDescription>
                      </div>
                    </CardHeader>

                    <CardContent className="flex flex-col flex-1 gap-8 p-0">
                      <div className="flex items-baseline justify-center gap-1">
                        <span className="text-foreground text-4xl sm:text-5xl font-medium">
                          {plan.plan_price}
                        </span>
                        {plan.plan_price_note && (
                          <span className="text-muted-foreground text-base font-normal">
                            /{plan.plan_price_note}
                          </span>
                        )}
                      </div>

                      <Separator orientation="horizontal" />

                      <ul className="flex flex-col gap-4 flex-1">
                        {plan.plan_feature.map((feature, idx) => (
                          <li
                            key={idx}
                            className="flex items-center gap-3 text-base font-normal text-muted-foreground"
                          >
                            {plan.plan_live ? (
                              <Check className="size-4 text-primary shrink-0" />
                            ) : (
                              <Clock className="size-4 text-muted-foreground/60 shrink-0" />
                            )}
                            {feature}
                          </li>
                        ))}
                      </ul>

                      <ButtonWithIcon
                        href={plan.plan_href}
                        fullWidth
                        variant={plan.plan_live ? "solid" : "outline"}
                      >
                        {plan.plan_cta}
                      </ButtonWithIcon>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Pricing;

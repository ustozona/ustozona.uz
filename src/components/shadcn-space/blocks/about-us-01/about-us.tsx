"use client"

import { Badge } from "@/components/ui/badge";
import { motion, useInView } from "motion/react";
import { useRef } from "react";
import { useTranslations } from "next-intl";
import { LandingGlow } from "@/components/landing/LandingGlow";
import { AnimatedCounter } from "@/components/dashboard/AnimatedCounter";

/**
 * Raqamlar — MAHSULOT faktlari, foydalanuvchi statistikasi EMAS.
 * Mahsulot yangi: "500+ oʻqituvchi" kabi soxta ijtimoiy dalil ishlatilmaydi
 * (docs/marketing-brief.md, 4-boʻlim).
 *
 * `value` — sanaladigan son; `display` — sanab boʻlmaydigan belgi (∞).
 * `unit` — son YONIDA turadigan kichik oʻlchov soʻzi ("daqiqa", "marta").
 * Ilgari u `suffix` sifatida sonning ichida edi va "0 daqiqa" ikki qatorga
 * sinib, butun qatorni qiyshaytirardi.
 */
export type StatItem = {
  value?: number;
  display?: string;
  unit?: string;
  title: string;
  descp: string;
};

const AboutUs = ({ stats }: { stats: StatItem[] }) => {
  const t = useTranslations("Landing.stats");
  const statsRef = useRef(null);
  const isInView = useInView(statsRef, { once: true, margin: "-100px" });

  return (
    <section className="relative lg:py-20 sm:py-16 py-8">
      <LandingGlow className="left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[60%] opacity-60 dark:opacity-40" />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-16">
        <div className="flex flex-col items-center justify-center gap-8 md:gap-14">
          <motion.div
            initial={{ y: -24, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true, amount: 0.1 }}
            transition={{ duration: 0.5, ease: [0.21, 0.47, 0.32, 0.98] }}
            className="flex flex-col items-center justify-center gap-4 text-center"
          >
            <Badge
              variant="outline"
              className="py-1 px-3 h-auto text-sm font-normal w-fit"
            >
              {t("badge")}
            </Badge>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-medium text-foreground tracking-tight max-w-2xl text-balance">
              {t("heading")}
            </h2>
          </motion.div>

          <div
            ref={statsRef}
            className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-y-10 lg:gap-y-0"
          >
            {stats.map((stat, index) => (
              <div
                key={stat.title}
                className="relative flex flex-col items-center text-center px-8"
              >
                {/* Ustunlar orasidagi nozik ajratgich (toʻliq balandlikda) */}
                {index > 0 && (
                  <span className="hidden lg:block absolute inset-y-0 left-0 w-px bg-border" />
                )}

                {/* Tartib: sarlavha → raqam → oʻlchov birligi → tavsif */}
                <p className="text-sm font-semibold uppercase tracking-wide text-foreground">
                  {stat.title}
                </p>

                <span className="mt-5 text-6xl sm:text-7xl font-medium text-foreground tabular-nums leading-none">
                  {stat.display ? (
                    stat.display
                  ) : isInView ? (
                    <AnimatedCounter value={stat.value ?? 0} />
                  ) : (
                    0
                  )}
                </span>

                {/* Birlik raqam ostida — boʻsh boʻlsa ham joyi saqlanadi,
                    shunda "∞" ustuni qolganlari bilan tekis turadi. */}
                <span className="mt-2 h-5 text-sm font-normal text-muted-foreground">
                  {stat.unit ?? ""}
                </span>

                <p className="mt-4 text-sm leading-relaxed text-muted-foreground text-balance max-w-[16rem]">
                  {stat.descp}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutUs;

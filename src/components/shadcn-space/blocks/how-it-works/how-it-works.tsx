"use client";

import { Badge } from "@/components/ui/badge";
import { motion } from "motion/react";
import { useTranslations } from "next-intl";
import { UserPlus, Users, GraduationCap } from "lucide-react";
import { CLASS_COLOR_BASE, type ClassColor } from "@/lib/class-colors";

type Step = {
  icon: typeof UserPlus;
  title: string;
  descp: string;
  color: ClassColor;
};

const STEP_META: { icon: Step["icon"]; color: ClassColor }[] = [
  { icon: UserPlus, color: "blue" },
  { icon: Users, color: "teal" },
  { icon: GraduationCap, color: "orange" },
];

const HowItWorks = () => {
  const t = useTranslations("Landing.howItWorks");
  const rawSteps = t.raw("steps") as { title: string; descp: string }[];
  // `STEP_META[i] ?? STEP_META[0]` — tarjima massivi uzunligi mos kelmasa
  // ikona/rang undefined boʻlib <step.icon> render qulamasin.
  const steps: Step[] = rawSteps.map((s, i) => ({ ...s, ...(STEP_META[i] ?? STEP_META[0]) }));
  return (
    <section className="bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 lg:py-20 sm:py-16 py-8">
        <div className="flex flex-col gap-8 md:gap-12 items-center">
          <div className="flex flex-col gap-4 items-center text-center">
            <Badge
              variant="outline"
              className="py-1 px-3 h-auto text-sm font-normal w-fit"
            >
              {t("badge")}
            </Badge>
            <h2 className="text-3xl sm:text-5xl font-medium text-foreground max-w-2xl">
              {t("heading")}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
            {steps.map((step, index) => {
              const c = CLASS_COLOR_BASE[step.color];
              return (
                <motion.div
                  key={step.title}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{
                    duration: 0.5,
                    delay: index * 0.12,
                    ease: "easeInOut",
                  }}
                  className="relative flex flex-col gap-4 rounded-xl border border-border bg-card p-6 h-full"
                >
                  <div className="flex items-center justify-between">
                    <div
                      className="w-fit rounded-lg p-3"
                      style={{
                        backgroundColor: `color-mix(in oklch, ${c} 12%, var(--card))`,
                        color: c,
                      }}
                    >
                      <step.icon className="h-6 w-6" />
                    </div>
                    <span className="text-4xl font-medium text-muted-foreground/25 tabular-nums">
                      {index + 1}
                    </span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <h3 className="text-lg font-semibold text-foreground">
                      {step.title}
                    </h3>
                    <p className="text-sm text-muted-foreground">{step.descp}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;

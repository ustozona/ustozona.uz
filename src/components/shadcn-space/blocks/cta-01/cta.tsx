"use client";
import { useRef } from "react";
import { motion } from "motion/react";
import { useTranslations } from "next-intl";
import ButtonWithIcon from "@/components/shadcn-space/button/button-01";

type CTAProps = {
  className?: string;
};

const CTA = ({ className }: CTAProps) => {
  const t = useTranslations("Landing");
  const ref = useRef(null);

  const bottomAnimation = {
    initial: { y: "5%", opacity: 0 },
    animate: { y: 0, opacity: 1 },
    transition: { duration: 1, delay: 0.8 },
  };

  return (
    <section>
      <div className="sm:py-20 py-8">
        <div className="max-w-7xl mx-auto sm:px-16 px-4">
          <div
            ref={ref}
            className="relative overflow-hidden min-h-96 flex items-center justify-center px-6 border border-border rounded-3xl before:absolute before:w-full before:h-4/5 before:bg-linear-to-r before:from-sky-100 before:from-15% before:via-white before:via-55% before:to-amber-100 before:to-90% before:rounded-full before:top-24 before:blur-3xl before:-z-10 dark:before:from-sky-400/10 dark:before:from-40% dark:before:via-black dark:before:via-55% dark:before:to-amber-300/10 dark:before:to-60% dark:before:rounded-full dark:before:-z-10"
          >
            <motion.div
              {...bottomAnimation}
              className="flex flex-col gap-6 items-center mx-auto"
            >
              <div className="flex flex-col gap-3 items-center text-center">
                <h2 className="text-3xl md:text-5xl font-medium text-center">
                  {t("cta.headingLine1")}
                  <br />
                  {t("cta.headingLine2")}
                </h2>
                <p className="max-w-2xl mx-auto">
                  {t("cta.desc")}
                </p>
              </div>
              <div className="flex flex-col items-center gap-3">
                <ButtonWithIcon href="/register">{t("cta.ctaLabel")}</ButtonWithIcon>
                <p className="text-sm text-muted-foreground">
                  {t("common.freeNote")}
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTA;

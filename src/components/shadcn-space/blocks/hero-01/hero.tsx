"use client";

import { Instrument_Serif } from "next/font/google";
import { motion } from "motion/react";
import ButtonWithIcon from "@/components/shadcn-space/button/button-01";

const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: ["400"],
  style: ["italic"],
});

function HeroSection() {
  return (
    <section>
      <div className="w-full h-full relative">
        <div className="relative w-full pt-0 md:pt-20 pb-6 md:pb-10 before:absolute before:w-full before:h-full before:bg-linear-to-r before:from-sky-100 before:via-white before:to-amber-100 before:rounded-full before:top-24 before:blur-3xl before:-z-10 dark:before:from-slate-800 dark:before:via-black dark:before:to-stone-700 dark:before:rounded-full dark:before:blur-3xl dark:before:-z-10">
          <div className="container mx-auto relative z-10">
            <div className="flex flex-col max-w-5xl mx-auto gap-8">
              <div className="relative flex flex-col text-center items-center sm:gap-6 gap-4">
                <motion.div
                  initial={{ opacity: 0, y: 32 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 1, ease: "easeInOut" }}
                  className="inline-flex items-center gap-2 rounded-full border border-border bg-muted/50 px-4 py-1.5 text-sm font-medium text-muted-foreground"
                >
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary/60" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
                  </span>
                  Yangi — endigina ishga tushdi
                </motion.div>
                <motion.h1
                  initial={{ opacity: 0, y: 32 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 1, ease: "easeInOut" }}
                  className="lg:text-8xl md:text-7xl text-5xl font-medium leading-14 md:leading-20 lg:leading-24"
                >
                  Baholar, davomat va jurnallar endi oʻzini oʻzi{" "}
                  <span
                    className={`${instrumentSerif.className} tracking-tight text-primary`}
                  >
                    hisoblaydi
                  </span>
                </motion.h1>
                <motion.p
                  initial={{ opacity: 0, y: 32 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 1, delay: 0.1, ease: "easeInOut" }}
                  className="text-base font-normal max-w-2xl text-muted-foreground"
                >
                  Siz jurnalga faqat baho va davomatni kiritasiz — yakuniy baho, xulq-atvor bali va choraklik hisobotlar soniyalar ichida oʻzi tayyor boʻladi.
                </motion.p>
              </div>
              <motion.div
                initial={{ opacity: 0, y: 32 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, delay: 0.2, ease: "easeInOut" }}
                className="flex items-center flex-col gap-3"
              >
                <div className="flex flex-col sm:flex-row items-center gap-3">
                  <ButtonWithIcon href="/register">Bepul boshlash</ButtonWithIcon>
                  <ButtonWithIcon href="#features" variant="outline">
                    Imkoniyatlarni koʻrish
                  </ButtonWithIcon>
                </div>
                <p className="text-sm font-normal text-muted-foreground">
                  Oʻqituvchilar uchun bepul. Bank kartasi talab qilinmaydi.
                </p>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default HeroSection;

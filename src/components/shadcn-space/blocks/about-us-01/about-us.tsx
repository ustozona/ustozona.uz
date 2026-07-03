"use client"

import { cn } from "@/lib/utils";
import { CLASS_COLOR_BASE, type ClassColor } from "@/lib/class-colors";
import { LucideIcon } from "lucide-react";
import { Instrument_Serif } from "next/font/google";
import { motion } from "motion/react";
import { LandingGlow } from "@/components/landing/LandingGlow";

const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: ["400"],
  style: ["italic"],
});

type aboutusData = {
  icon: LucideIcon;
  title: string;
  color: ClassColor;
}[];

const AboutUs = ({ aboutusData }: { aboutusData: aboutusData }) => {
  return (
    <section className="relative lg:py-20 sm:py-16 py-8">
      <LandingGlow className="left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[60%] opacity-60 dark:opacity-40" />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-16">
        <div className="flex flex-col items-center justify-center gap-8 md:gap-16">
          <motion.div
            initial={{ y: -40, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{
              duration: 0.8,
              ease: [0.21, 0.47, 0.32, 0.98],
            }}
            className="flex flex-col items-center justify-center gap-4"
          >
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-medium text-foreground text-center tracking-tight">
              Taʼlim sifatini oshirish va boshqaruvni osonlashtirish uchun yagona platforma:
            </h2>
            <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-4">
              {aboutusData.map((item, index) => {
                // rang dizayn-tizimi yagona manbasidan (class-colors)
                const c = CLASS_COLOR_BASE[item.color];
                return (

                <div
                  key={index}
                  className="flex items-center gap-3 px-6 py-2 rounded-full"
                  style={{
                    backgroundColor: `color-mix(in oklch, ${c} 12%, var(--card))`,
                    color: c,
                  }}
                >
                  <item.icon className="w-6 h-6 sm:w-8 sm:h-8 lg:w-10 lg:h-10" />
                  <span
                    className={cn(
                      "text-4xl font-normal",
                      instrumentSerif.className
                    )}
                  >
                    {item.title}
                  </span>
                </div>
                );
              })}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default AboutUs;

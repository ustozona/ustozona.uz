"use client";

import { Badge } from "@/components/ui/badge";
import { motion } from "motion/react";
import { Users, Clock3, GraduationCap, Check } from "lucide-react";
import { LandingGlow } from "@/components/landing/LandingGlow";

/**
 * Fokus: MAKTAB OʻQITUVCHISI (docs/marketing-brief.md, 4-boʻlim).
 * Avvalgi 4 auditoriyali variant (repetitor / kurs / oʻquv markazi) olib
 * tashlandi — "hammaga moʻljallangan" xabari pozitsiyani yemiradi.
 */

const STATS = [
  { icon: GraduationCap, label: "5–11-sinf" },
  { icon: Users, label: "30+ oʻquvchi" },
  { icon: Clock3, label: "45 daqiqa" },
];

const Personas = () => {
  return (
    <section className="relative bg-background overflow-hidden">
      <LandingGlow className="right-0 top-1/2 -translate-y-1/2 w-[45%] h-[70%]" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 lg:py-20 sm:py-16 py-8">
        <div className="grid lg:grid-cols-2 items-center gap-10 lg:gap-16">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.1 }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
            className="flex flex-col items-start gap-5 text-left"
          >
            <Badge
              variant="outline"
              className="py-1 px-3 h-auto text-sm font-normal w-fit"
            >
              Kimlar uchun
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-semibold text-foreground">
              Maktab oʻqituvchisi uchun yaratilgan
            </h2>
            <p className="text-muted-foreground sm:text-lg">
              Ustozona birinchi navbatda 5–11-sinflarga dars beradigan, har
              sinfida 30 dan ortiq oʻquvchisi bor ustozlar uchun. 45 daqiqalik
              darsining har bir soniyasini qogʻozbozlikka emas, taʼlimga
              sarflashni xohlaydiganlar uchun shaxsiy yordamchi.
            </p>
            <div className="flex flex-wrap gap-3 pt-1">
              {STATS.map((s) => (
                <span
                  key={s.label}
                  className="flex items-center gap-2 rounded-full border border-border bg-muted/60 pl-2.5 pr-4 py-2"
                >
                  <span
                    className="flex size-7 items-center justify-center rounded-full"
                    style={{ backgroundColor: "color-mix(in oklch, #FBC02D 30%, transparent)" }}
                  >
                    <s.icon className="size-3.5 text-neutral-900" strokeWidth={2} />
                  </span>
                  <span className="text-sm font-medium text-foreground">
                    {s.label}
                  </span>
                </span>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.1 }}
            transition={{ duration: 0.5, delay: 0.1, ease: "easeInOut" }}
            className="relative flex justify-center lg:justify-end"
          >
            <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-sm flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-foreground">
                  9-A sinf
                </span>
                <span
                  className="rounded-full px-2.5 py-1 text-xs font-medium text-neutral-900"
                  style={{ backgroundColor: "#FBC02D" }}
                >
                  32 oʻquvchi
                </span>
              </div>
              <div className="flex flex-col gap-3">
                {[
                  "Har birining ismi, jadvali va ballari bitta joyda",
                  "45 daqiqa ichida hammaning davomatini belgilaysiz",
                  "Xulq va oʻzlashtirish avtomatik hisoblanadi",
                ].map((line) => (
                  <div key={line} className="flex items-start gap-2.5">
                    <span
                      className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full"
                      style={{ backgroundColor: "var(--success)" }}
                    >
                      <Check
                        className="size-3"
                        strokeWidth={3}
                        style={{ color: "var(--success-foreground)" }}
                      />
                    </span>
                    <span className="text-sm text-muted-foreground leading-snug">
                      {line}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default Personas;

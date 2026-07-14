"use client";

import { motion, type HTMLMotionProps } from "motion/react";

/* Motion tokenlarga mos qiymatlar (globals.css @theme bilan sinxron):
   duration-base = 250ms, ease-standard = Material 3 standard. */
const EASE_STANDARD = [0.2, 0, 0, 1] as const;
const DURATION_BASE = 0.25;

type FadeInProps = HTMLMotionProps<"div"> & {
  /** Kirish kechikishi (soniya) — stagger uchun qoʻlda berish mumkin. */
  delay?: number;
  /** Boshlangʻich vertikal siljish (px). 0 = faqat fade. */
  y?: number;
};

/**
 * Yagona enter-animatsiya primitivi: fade + yengil koʻtarilish.
 * Sahifa bloklari, panellar va kartalarning kirishi uchun shu ishlatiladi —
 * har joyda qoʻlda motion.div yozilmaydi.
 */
export function FadeIn({ delay = 0, y = 8, ...props }: FadeInProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: DURATION_BASE, ease: EASE_STANDARD, delay }}
      {...props}
    />
  );
}

/**
 * Roʻyxat uchun stagger-konteyner: bolalar `<StaggerItem>` boʻlsa,
 * har biri 40ms kechikish bilan ketma-ket kiradi (maks. ~6 ta sezilarli,
 * qolganlari deyarli birga — jahon amaliyotidagi odatiy chegara).
 */
export function StaggerList({
  ...props
}: HTMLMotionProps<"div">) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: 0.04 } },
      }}
      {...props}
    />
  );
}

export function StaggerItem({ ...props }: HTMLMotionProps<"div">) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 8 },
        visible: {
          opacity: 1,
          y: 0,
          transition: { duration: DURATION_BASE, ease: EASE_STANDARD },
        },
      }}
      {...props}
    />
  );
}

"use client";

import { LazyMotion, MotionConfig, domAnimation } from "motion/react";

/**
 * Barcha motion animatsiyalari uchun global konfiguratsiya.
 * reducedMotion="user" — foydalanuvchi OS darajasida "kam harakat"
 * tanlagan boʻlsa, transform/layout animatsiyalari avtomatik oʻchadi
 * (opacity saqlanadi). WCAG 2.3.3 shu bitta joyda yopiladi.
 *
 * LazyMotion + domAnimation — yengil `m.*` komponentlari (masalan Button)
 * uchun animatsiya/gesture imkoniyatlari. `strict` yoʻq: `layoutId` kabi
 * domMax talab qiladigan joylar toʻliq `motion.*` bilan qoladi.
 */
export function MotionProvider({ children }: { children: React.ReactNode }) {
  return (
    <LazyMotion features={domAnimation}>
      <MotionConfig reducedMotion="user">{children}</MotionConfig>
    </LazyMotion>
  );
}

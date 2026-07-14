"use client";

import { MotionConfig } from "motion/react";

/**
 * Barcha motion animatsiyalari uchun global konfiguratsiya.
 * reducedMotion="user" — foydalanuvchi OS darajasida "kam harakat"
 * tanlagan boʻlsa, transform/layout animatsiyalari avtomatik oʻchadi
 * (opacity saqlanadi). WCAG 2.3.3 shu bitta joyda yopiladi.
 */
export function MotionProvider({ children }: { children: React.ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}

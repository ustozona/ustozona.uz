"use client";

import { animate, motion, useMotionValue, useTransform } from "motion/react";
import { useEffect } from "react";

/**
 * Sonni 0 dan `value`gacha yumshoq sanaydigan komponent.
 * shadcn-space "Welcome Card" (card-04) gʻoyasidan moslashtirilgan —
 * rasm/rang emas, faqat animatsiya olingan; bizning tokenlarda ishlaydi.
 */
export function AnimatedCounter({
  value,
  duration = 1.2,
  prefix = "",
  suffix = "",
  className,
}: {
  value: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
}) {
  const count = useMotionValue(0);
  const rounded = useTransform(count, (latest) => Math.round(latest).toLocaleString("ru-RU"));

  useEffect(() => {
    const controls = animate(count, value, { duration });
    return controls.stop;
  }, [value, duration, count]);

  return (
    <span className={className}>
      {prefix}
      <motion.span>{rounded}</motion.span>
      {suffix}
    </span>
  );
}

"use client";

import { Instrument_Sans } from "next/font/google";
import { cn } from "@/lib/utils";
import { BrandShield } from "@/assets/logo/brand-shield";
import { AnimatedTextRoller } from "@/components/shadcn-space/animated-text/animated-text-04";

const instrumentSans = Instrument_Sans({ subsets: ["latin"], weight: ["500"] });

type BrandWordmarkProps = {
  className?: string;
  shieldClassName?: string;
  textClassName?: string;
  gapClassName?: string;
  rollerSize?: "lg" | "base" | "sm";
  showRoller?: boolean;
};

/**
 * Ustozona wordmark: qalqon + "Ustozona" (Instrument Sans Bold) + aylanuvchi soʻz (Instrument Serif Italic).
 * Qalqon:matn boʻshligʻi brend spetsifikatsiyasiga koʻra ~0.4x qalqon oʻlchami (masalan 240px qalqon → 96px).
 */
export function BrandWordmark({
  className,
  shieldClassName,
  textClassName,
  gapClassName = "gap-3",
  rollerSize = "lg",
  showRoller = true,
}: BrandWordmarkProps) {
  return (
    <div className={cn("flex items-center", gapClassName, className)}>
      <BrandShield className={cn("shrink-0", shieldClassName)} />
      <span
        className={cn(
          "font-medium tracking-tight text-foreground",
          instrumentSans.className,
          textClassName,
        )}
      >
        Ustozona
      </span>
      {showRoller && (
        // gap-3 (12px) − 6px = 6px ≈ 0.2×qalqon — spetsifikatsiyadagi ikkinchi boʻshliq
        <AnimatedTextRoller size={rollerSize} className="-ml-1.5" textClassName={textClassName} />
      )}
    </div>
  );
}

export default BrandWordmark;

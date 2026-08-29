"use client";

import { Instrument_Sans, Instrument_Serif } from "next/font/google";
import { cn } from "@/lib/utils";
import { BrandShield } from "@/assets/logo/brand-shield";
import { AnimatedTextRoller } from "@/components/shadcn-space/animated-text/animated-text-04";

const instrumentSans = Instrument_Sans({ subsets: ["latin"], weight: ["500"] });
/* Aylanuvchi soʻz bilan AYNAN bir xil shrift (animated-text-04.tsx) — statik
   variant undan faqat harakatsizligi bilan farq qilishi kerak. */
const instrumentSerif = Instrument_Serif({ subsets: ["latin"], weight: ["400"], style: ["italic"] });

type BrandWordmarkProps = {
  className?: string;
  shieldClassName?: string;
  textClassName?: string;
  gapClassName?: string;
  rollerSize?: "lg" | "base" | "sm";
  showRoller?: boolean;
  /**
   * Ost-loyiha nomi — "Ustozona blog", "Ustozona yordam" kabi.
   *
   * Berilsa aylanuvchi soʻz OʻRNIGA shu soʻz statik turadi. Sabab: aylanish
   * — LANDING uchun, u yerda u mahsulotlar roʻyxatini koʻrsatadi. Ost-loyiha
   * ichida esa u yolgʻon axborot beradi: blogni oʻqiyotgan odam sarlavhada
   * "Ustozona doska" degan yozuvni koʻradi va qayerdaligini adashtiradi.
   * Bu yerda logo — navigatsiya belgisi, reklama emas.
   */
  word?: string;
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
  word,
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
      {/* gap-3 (12px) − 6px = 6px ≈ 0.2×qalqon — spetsifikatsiyadagi ikkinchi
          boʻshliq; statik va aylanuvchi variant bir xil siljish oladi. */}
      {word ? (
        <span className={cn("-ml-1.5 text-muted-foreground", instrumentSerif.className, textClassName)}>
          {word}
        </span>
      ) : (
        showRoller && (
          <AnimatedTextRoller size={rollerSize} className="-ml-1.5" textClassName={textClassName} />
        )
      )}
    </div>
  );
}

export default BrandWordmark;

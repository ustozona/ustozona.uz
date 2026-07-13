"use client";

import { useEffect, useRef, useState } from "react";
import { Instrument_Serif } from "next/font/google";
import { cn } from "@/lib/utils";

const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: ["400"],
  style: ["italic"],
});

// Ustozona ost-loyihalari — "Ustozona boshqaruv", "Ustozona baholash" ...
const defaultWords = ["boshqaruv", "baholash", "intellekt", "doska"];

type AnimatedTextRollerSize = "lg" | "base" | "sm";

const SIZE_PRESETS: Record<AnimatedTextRollerSize, { textClass: string; lineHeightRem: number; containerClass: string }> = {
  lg: { textClass: "text-xl leading-7", lineHeightRem: 1.75, containerClass: "h-7" },
  base: { textClass: "text-base leading-6", lineHeightRem: 1.5, containerClass: "h-6" },
  sm: { textClass: "text-sm leading-5", lineHeightRem: 1.25, containerClass: "h-5" },
};

type AnimatedTextRollerProps = {
  words?: string[];
  intervalMs?: number;
  className?: string;
  size?: AnimatedTextRollerSize;
  textClassName?: string;
};

export const AnimatedTextRoller = ({
  words = defaultWords,
  intervalMs = 2500,
  className,
  size = "lg",
  textClassName,
}: AnimatedTextRollerProps) => {
  const [index, setIndex] = useState(0);
  const [instant, setInstant] = useState(false);
  const resetTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { textClass, lineHeightRem, containerClass } = SIZE_PRESETS[size];
  const loopWords = [...words, words[0]];

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => prev + 1);
    }, intervalMs);
    return () => clearInterval(interval);
  }, [words.length, intervalMs]);

  useEffect(() => {
    if (index === words.length) {
      resetTimeout.current = setTimeout(() => {
        setInstant(true);
        setIndex(0);
      }, 700);
      return () => {
        if (resetTimeout.current) clearTimeout(resetTimeout.current);
      };
    }
    if (instant) {
      const raf = requestAnimationFrame(() => setInstant(false));
      return () => cancelAnimationFrame(raf);
    }
  }, [index, words.length, instant]);

  return (
    <span
      className={cn("inline-block overflow-hidden align-middle", containerClass, className)}
      aria-label={words.join(", ")}
    >
      <span
        className={cn("block", instant ? "transition-none" : "transition-transform duration-700 ease-in-out")}
        style={{ transform: `translateY(-${index * lineHeightRem}rem)` }}
      >
        {loopWords.map((word, i) => (
          <span key={i} className={cn("block", containerClass)}>
            <span className={cn(textClassName ?? textClass, instrumentSerif.className, "text-muted-foreground")}>
              {word}
            </span>
          </span>
        ))}
      </span>
    </span>
  );
};

export default AnimatedTextRoller;

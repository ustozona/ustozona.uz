"use client";

import { useEffect, useState } from "react";
import { Instrument_Serif } from "next/font/google";
import { cn } from "@/lib/utils";
import { AuroraText } from "@/registry/magicui/aurora-text";

const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: ["400"],
  style: ["italic"],
});

// Ustozona ost-loyihalari — "Ustozona boshqaruv", "Ustozona baholash" ...
const defaultWords = ["boshqaruv", "baholash", "intellekt"];

type AnimatedTextRollerProps = {
  words?: string[];
  intervalMs?: number;
  className?: string;
};

export const AnimatedTextRoller = ({
  words = defaultWords,
  intervalMs = 2500,
  className,
}: AnimatedTextRollerProps) => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % words.length);
    }, intervalMs);
    return () => clearInterval(interval);
  }, [words.length, intervalMs]);

  return (
    <span
      className={cn("inline-block h-7 overflow-hidden align-middle", className)}
      aria-label={words.join(", ")}
    >
      <span
        className="block transition-transform duration-700 ease-in-out"
        style={{ transform: `translateY(-${index * 1.75}rem)` }}
      >
        {words.map((word, i) => (
          <span key={i} className="block h-7 leading-7">
            <AuroraText
              className={cn(
                "text-xl leading-7",
                instrumentSerif.className,
              )}
            >
              {word}
            </AuroraText>
          </span>
        ))}
      </span>
    </span>
  );
};

export default AnimatedTextRoller;

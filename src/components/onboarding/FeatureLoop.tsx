"use client";

import * as React from "react";
import { motion, AnimatePresence } from "motion/react";
import { type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { CLASS_COLOR_BASE, makeColorTints, type ClassColor } from "@/lib/class-colors";
import { ProgressiveBlur } from "@/components/ui/progressive-blur";

export interface FeatureLoopItem {
  icon: LucideIcon;
  title: string;
  desc: string;
  color: ClassColor;
}

const CARD_STEP = 92;
const CARD_HEIGHT = 84;

/* ════════════════════════════════════════════════════════════════════
   FEATURE LOOP — cheksiz aylanuvchi "steksimon" roʻyxat (onboarding
   welcome kartasi + login/register foni). Balandlik `visible` soniga
   qarab avtomatik hisoblanadi (fixed emas) — markaziy karta faol,
   qolganlari markazdan uzoqlashgan sayin xiralashadi, yuqori/past
   fade bilan yumshoq kesiladi. Har karta oʻz sinf rangida.

   Kartalar KALITI barqaror (f.title) — shu tufayli oyna siljiganda
   Framer Motion ularni "yangi" deb hisoblamaydi, balki mavjud kartani
   yangi y-pozitsiyaga silliq koʻchiradi (konveyer effekti).
   ════════════════════════════════════════════════════════════════════ */
export function FeatureLoop({
  items,
  duration = 4200,
  visible = 3,
  className,
}: {
  items: FeatureLoopItem[];
  duration?: number;
  /** Bir vaqtda nechta karta koʻrinishi (toq son maʼqul — markazi aniq boʻladi) */
  visible?: number;
  className?: string;
}) {
  const [pointer, setPointer] = React.useState(0);
  const center = Math.floor(visible / 2);
  const trackHeight = (visible - 1) * CARD_STEP + CARD_HEIGHT;

  React.useEffect(() => {
    const timer = setInterval(() => {
      setPointer((p) => (p + 1) % items.length);
    }, duration);
    return () => clearInterval(timer);
  }, [duration, items.length]);

  const visibleItems = Array.from({ length: visible }, (_, k) => {
    const offset = k - center;
    return items[(pointer + offset + items.length * 2) % items.length];
  });

  return (
    <div className={cn("relative w-full overflow-hidden", className)} style={{ height: trackHeight }}>
      <AnimatePresence initial={false}>
        {visibleItems.map((f, i) => {
          const isActive = i === center;
          const dist = Math.abs(i - center);
          const opacity = isActive ? 1 : Math.max(0.2, 0.55 - dist * 0.15);
          const scale = isActive ? 1 : Math.max(0.88, 1 - dist * 0.05);
          const glow = CLASS_COLOR_BASE[f.color];
          const tints = makeColorTints(glow);
          return (
            <motion.div
              key={f.title}
              initial={{ y: visible * CARD_STEP, opacity: 0, scale: 0.9 }}
              animate={{ y: i * CARD_STEP, opacity, scale }}
              exit={{ y: -CARD_STEP, opacity: 0, scale: 0.85 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className={cn(
                "absolute left-0 top-0 flex w-full items-center gap-4 rounded-xl border-2 p-4.5 text-left transition-colors duration-500",
                isActive && "shadow-xs"
              )}
              style={{
                borderColor: isActive ? tints.solid : "var(--border)",
                backgroundColor: isActive ? tints.surface.backgroundColor : "var(--card)",
              }}
            >
              <div
                className="list-card-icon flex size-12 shrink-0 items-center justify-center rounded-lg"
                style={tints.iconBg}
              >
                <f.icon className="size-5.5" style={tints.iconText} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[15px] font-semibold leading-tight">{f.title}</p>
                <p className="text-[13px] text-muted-foreground mt-1">{f.desc}</p>
                <div className="mt-2.5 h-1 overflow-hidden rounded-full bg-muted">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ backgroundColor: tints.solid }}
                    animate={{ width: isActive ? "100%" : "0%" }}
                    transition={
                      isActive
                        ? { duration: duration / 1000, ease: "linear" }
                        : { duration: 0.3, ease: "easeInOut" }
                    }
                  />
                </div>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>

      <ProgressiveBlur position="top" height="20%" />
      <ProgressiveBlur position="bottom" height="20%" />
    </div>
  );
}

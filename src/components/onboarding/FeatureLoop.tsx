"use client";

import * as React from "react";
import { motion, AnimatePresence } from "motion/react";
import { type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { CLASS_COLOR_BASE, makeColorTints, type ClassColor } from "@/lib/class-colors";

export interface FeatureLoopItem {
  icon: LucideIcon;
  title: string;
  desc: string;
  color: ClassColor;
}

/* ════════════════════════════════════════════════════════════════════
   FEATURE LOOP — onboarding welcome kartasi uchun cheksiz aylanuvchi
   "steksimon" roʻyxat. Modal balandligini oʻzgartirmaydi (fixed height,
   scrollsiz) — bir vaqtda 3 ta karta koʻrinadi, markaziy karta faol,
   yuqori/past fade bilan yumshoq kesiladi. Har karta oʻz sinf rangida.
   ════════════════════════════════════════════════════════════════════ */
export function FeatureLoop({
  items,
  duration = 4200,
  className,
}: {
  items: FeatureLoopItem[];
  duration?: number;
  className?: string;
}) {
  const [pointer, setPointer] = React.useState(0);

  React.useEffect(() => {
    const timer = setInterval(() => {
      setPointer((p) => (p + 1) % items.length);
    }, duration);
    return () => clearInterval(timer);
  }, [duration, items.length]);

  const visible = [
    items[(pointer - 1 + items.length) % items.length],
    items[pointer],
    items[(pointer + 1) % items.length],
  ];

  return (
    <div className={cn("relative h-60 w-full overflow-hidden", className)}>
      <AnimatePresence initial={false}>
        {visible.map((f, i) => {
          const isActive = i === 1;
          const glow = CLASS_COLOR_BASE[f.color];
          const tints = makeColorTints(glow);
          return (
            <motion.div
              key={f.title}
              initial={{ y: 200, opacity: 0, scale: 0.92 }}
              animate={{ y: i * 84, opacity: isActive ? 1 : 0.4, scale: isActive ? 1 : 0.94 }}
              exit={{ y: -74, opacity: 0, scale: 0.85 }}
              transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
              className="absolute left-0 top-0 flex w-full items-center gap-3.5 rounded-xl border p-4 text-left"
              style={{
                borderColor: isActive ? tints.ring.borderColor : "var(--border)",
                backgroundColor: isActive ? tints.surface.backgroundColor : "var(--card)",
              }}
            >
              <div
                className="list-card-icon flex size-11 shrink-0 items-center justify-center rounded-lg"
                style={tints.iconBg}
              >
                <f.icon className="size-5" style={tints.iconText} />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold leading-tight">{f.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{f.desc}</p>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>

      <div className="pointer-events-none absolute inset-x-0 top-0 h-8 bg-linear-to-b from-card to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-8 bg-linear-to-t from-card to-transparent" />
    </div>
  );
}

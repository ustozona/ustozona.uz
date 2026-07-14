"use client";

import { motion, type Variants } from "motion/react";
import { CheckCircle, Loader } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

/**
 * shadcn-space badge-07 (Success) va badge-08 (Pending) — bitta komponentda.
 *
 * Animatsiya, glow qatlamlari va ranglar ASL KODDAGIDEK. Yagona farq: matn
 * ("Success"/"Pending" oʻrniga) va ton parametr qilingan, chunki registry
 * demolarida ular kod ichida qotib yozilgan.
 */
const LETTER_VARIANTS: Variants = {
  hidden: { y: -14, opacity: 0 },
  visible: (i: number) => ({
    y: 0,
    opacity: 1,
    transition: {
      delay: i * 0.038,
      duration: 0.35,
      ease: [0.215, 0.61, 0.355, 1],
    },
  }),
};

const MotionBadge = motion.create(Badge);

export type GlowBadgeTone = "success" | "pending";

export const GlowBadge = ({
  tone = "success",
  children,
  className,
}: {
  tone?: GlowBadgeTone;
  children: string;
  className?: string;
}) => {
  const isPending = tone === "pending";

  return (
    <MotionBadge
      variant="outline"
      className={cn(
        "relative h-auto cursor-default overflow-visible rounded-full",
        "gap-1.5 px-2.5 py-1.5",
        "bg-background backdrop-blur-md",
        "text-foreground text-xs font-medium leading-none",
        isPending ? "border-amber-300/25" : "border-teal-400/25",
        className,
      )}
    >
      {/* Top glow */}
      <motion.span
        aria-hidden
        animate={{ opacity: 0.55 }}
        transition={{ duration: 0.45 }}
        className={cn(
          "pointer-events-none absolute -top-2 left-[10%] right-[10%] h-4 blur",
          isPending
            ? "bg-[radial-gradient(ellipse_80%_100%_at_50%_100%,rgba(252,211,77,0.95)_0%,transparent_70%)]"
            : "bg-[radial-gradient(ellipse_80%_100%_at_50%_100%,rgba(45,212,191,0.95)_0%,transparent_70%)]",
        )}
      />
      <motion.span
        aria-hidden
        animate={{ opacity: 0.75 }}
        transition={{ duration: 0.45 }}
        className={cn(
          "pointer-events-none absolute -top-1 left-[22%] right-[22%] h-2 blur-sm",
          isPending
            ? "bg-[radial-gradient(ellipse_70%_100%_at_50%_100%,rgba(252,211,77,0.85)_0%,transparent_70%)]"
            : "bg-[radial-gradient(ellipse_70%_100%_at_50%_100%,rgba(45,212,191,0.85)_0%,transparent_70%)]",
        )}
      />
      <motion.span
        aria-hidden
        animate={{ opacity: 0.9 }}
        transition={{ duration: 0.45 }}
        className={cn(
          "pointer-events-none absolute top-0 left-[28%] right-[28%] h-px",
          isPending
            ? "bg-[radial-gradient(ellipse_40%_50%_at_50%_50%,rgba(252,211,77,0.95)_0%,transparent_100%)]"
            : "bg-[radial-gradient(ellipse_40%_50%_at_50%_50%,rgba(45,212,191,0.95)_0%,transparent_100%)]",
        )}
      />

      {/* Icon */}
      {isPending ? (
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "linear" }}
          className="flex h-3.5 w-3.5 shrink-0 items-center justify-center text-amber-300"
        >
          <Loader size={14} strokeWidth={2.5} />
        </motion.div>
      ) : (
        <motion.span
          initial={{ scale: 0.35, opacity: 0, rotate: -25 }}
          animate={{ scale: 1, opacity: 1, rotate: 0 }}
          transition={{ duration: 0.32, ease: [0.175, 0.885, 0.32, 1.275] }}
          className="flex h-3.5 w-3.5 shrink-0 items-center justify-center"
        >
          <CheckCircle size={14} strokeWidth={2} className="text-teal-400" />
        </motion.span>
      )}

      {/* Animated label */}
      <span className="inline-flex overflow-hidden leading-none">
        {children.split("").map((char, i) => (
          <motion.span
            key={i}
            custom={i}
            variants={LETTER_VARIANTS}
            initial="hidden"
            animate="visible"
            className="inline-block whitespace-pre leading-normal"
          >
            {char}
          </motion.span>
        ))}
      </span>
    </MotionBadge>
  );
};

export default GlowBadge;

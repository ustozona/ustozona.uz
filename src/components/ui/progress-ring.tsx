"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Doiraviy progress — kichik, matnsiz ham ishlaydigan primitiv.
 *
 * Ilgari bu SVG matematikasi `AttendanceRing` ichida yolgʻiz yashardi va
 * boshqa joyda halqa kerak boʻlganda nusxa koʻchirish talab qilinardi.
 * Endi hisob shu yerda, `AttendanceRing` esa uning ustidagi yupqa oʻram
 * (svetofor rangi + markazdagi foiz).
 *
 * Standart rang — `currentColor`: halqa oʻzi turgan chipning matn rangini
 * oladi, shuning uchun chip ohangini (`text-success`, `text-muted-…`)
 * oʻzgartirish yetarli, ranglarni ikkinchi marta eʼlon qilish shart emas.
 */
export function ProgressRing({
  pct,
  size = 38,
  strokeWidth = 3,
  color = "currentColor",
  /** Fon halqasining rang ulushi (%) — asosiy rangdan hosil qilinadi. */
  trackMix = 18,
  radius: radiusProp,
  className,
  children,
}: {
  /** 0–100. Chegaradan chiqqan qiymat qisiladi. */
  pct: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  trackMix?: number;
  /** Standart hisobdan boshqa radius kerak boʻlsa (mavjud koʻrinishni
      piksel-aniq saqlash uchun). */
  radius?: number;
  className?: string;
  /** Markazdagi mazmun (foiz, ikonka…). */
  children?: ReactNode;
}) {
  const safe = Math.max(0, Math.min(100, pct));
  // Chetlari kesilmasin uchun radius chiziq qalinligiga kichrayadi.
  const radius = radiusProp ?? size / 2 - strokeWidth;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - safe / 100);

  return (
    <div
      className={cn("relative shrink-0", className)}
      style={{ width: size, height: size }}
    >
      <svg viewBox={`0 0 ${size} ${size}`} className="absolute inset-0 size-full -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          style={{ stroke: `color-mix(in srgb, ${color} ${trackMix}%, transparent)` }}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          style={{ stroke: color, strokeDasharray: circumference, strokeDashoffset: offset }}
        />
      </svg>
      {children && (
        <span className="absolute inset-0 flex items-center justify-center">{children}</span>
      )}
    </div>
  );
}

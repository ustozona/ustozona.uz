"use client";

import { ArrowUp, ArrowDown, ChevronRight } from "lucide-react";
import { Area, AreaChart } from "recharts";
import { SectionIcon } from "@/components/ui/section-icon";
import { Progress } from "@/components/ui/progress";
import { ChartContainer, type ChartConfig } from "@/components/ui/chart";
import { TypographyMuted } from "@/components/ui/typography";
import { cn } from "@/lib/utils";

const SPARKLINE_CONFIG = { value: { label: "" } } satisfies ChartConfig;

/**
 * Statistik koʻrsatkich kartasi — Tremor "KPI Cards" (Card 6) asosida,
 * dizayn-tizim tokenlariga moslashtirilgan. Statistika sahifasi va oʻquvchi
 * profili shu bitta komponentni ishlatadi. Tasks sahifasidagi bosiluvchi
 * filtr-tugma StatTile'da qoladi — u alohida maqsad (interaktiv), bu esa
 * faqat oʻqish uchun statistik karta.
 */
export function StatCard({
  icon: Icon,
  label,
  value,
  unit,
  sub,
  delta,
  deltaType = "positive",
  tone = "default",
  progress,
  sparkline,
  onClick,
}: {
  icon?: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  /** Qiymatdan keyin kichik, ikkilamchi birlik (masalan "ta", "nafar"). Asosiy raqamning bir qismi emas. */
  unit?: string;
  sub?: string;
  delta?: string;
  deltaType?: "positive" | "negative";
  tone?: "default" | "destructive" | "success";
  /** 0–100 boʻlsa, qiymat ostida ingichka progress-bar chiziladi. */
  progress?: number;
  /** Berilsa, qiymat yonida kichik trend chizigʻi chiqadi. Faqat haqiqiy trend maʼlumoti bor joyda ishlating. */
  sparkline?: number[];
  /** Berilsa, karta bosiluvchi boʻladi (hover'da strelka chiqadi). */
  onClick?: () => void;
}) {
  const toneColorClass =
    tone === "destructive" ? "text-destructive" : tone === "success" ? "text-success" : undefined;
  const toneHex =
    tone === "destructive" ? "var(--destructive)" : tone === "success" ? "var(--success)" : "var(--primary)";

  const Wrapper = onClick ? "button" : "div";

  return (
    <Wrapper
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className={cn(
        "group/stat w-full rounded-xl border border-border/60 bg-card p-5 flex flex-col gap-4 text-left transition-colors",
        onClick && "hover:bg-muted/40 cursor-pointer"
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2.5">
          {Icon && (
            <SectionIcon className="rounded-full">
              <Icon />
            </SectionIcon>
          )}
          <span className="truncate text-sm font-medium text-muted-foreground">{label}</span>
        </div>
        {delta && (
          <span
            className={cn(
              "inline-flex items-center gap-x-0.5 rounded-md px-1.5 py-0.5 text-xs font-medium shrink-0",
              deltaType === "positive"
                ? "bg-success/10 text-success"
                : "bg-destructive/10 text-destructive"
            )}
          >
            {deltaType === "positive" ? (
              <ArrowUp className="-ml-0.5 size-3 shrink-0" aria-hidden />
            ) : (
              <ArrowDown className="-ml-0.5 size-3 shrink-0" aria-hidden />
            )}
            {delta}
          </span>
        )}
        {onClick && !delta && (
          <ChevronRight className="size-3.5 text-muted-foreground/40 opacity-0 group-hover/stat:opacity-100 transition-opacity shrink-0" />
        )}
      </div>

      <div className="flex items-center justify-between gap-3">
        <div className="flex items-baseline gap-1.5">
          <div className={cn("text-[28px] font-bold tabular-nums leading-none tracking-tight", toneColorClass)}>
            {value}
          </div>
          {unit && <span className="text-sm font-normal text-muted-foreground">{unit}</span>}
        </div>
        {sparkline && sparkline.length > 1 && (
          <ChartContainer config={SPARKLINE_CONFIG} className="h-8 w-16 shrink-0 aspect-auto">
            <AreaChart data={sparkline.map((v, i) => ({ i, value: v }))} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="statCardSparkFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={toneHex} stopOpacity={0.35} />
                  <stop offset="100%" stopColor={toneHex} stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area
                type="monotone"
                dataKey="value"
                stroke={toneHex}
                strokeWidth={1.5}
                fill="url(#statCardSparkFill)"
                isAnimationActive={false}
              />
            </AreaChart>
          </ChartContainer>
        )}
      </div>

      {progress !== undefined && (
        <Progress
          value={progress}
          indicatorColor={toneHex}
          className="mt-0.5"
          style={{ backgroundColor: `color-mix(in srgb, ${toneHex} 16%, transparent)` }}
        />
      )}

      {sub && <TypographyMuted className="truncate text-xs">{sub}</TypographyMuted>}
    </Wrapper>
  );
}

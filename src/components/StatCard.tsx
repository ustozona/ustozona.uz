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
  className,
  valueClassName,
  subClassName,
  subInline,
  iconClassName,
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
  /** Tashqi konteynerga qoʻshimcha klasslar (masalan `flex-1`/kichraytirilgan padding). */
  className?: string;
  /** Qiymat shriftini responsiv qilish uchun (default `text-[28px]`ni almashtiradi). */
  valueClassName?: string;
  /** `sub` matniga qoʻshimcha klasslar (masalan ogohlantirish uchun `text-destructive`). */
  subClassName?: string;
  /** `true` — `sub` pastki alohida qatorda emas, qiymat bilan bir qatorda
      (Notion/Linear "compact stat" naqshi: "50 daq. ≈2 pomodoro"). */
  subInline?: boolean;
  /** Ikonka doirasiga qoʻshimcha klasslar — bir nechta karta yonma-yon
      turganda toifaviy rang bilan tezkor tanishni osonlashtirish uchun
      (masalan `bg-info/10 text-info`). Default — neytral `bg-muted`. */
  iconClassName?: string;
}) {
  const toneColorClass =
    tone === "destructive" ? "text-destructive" : tone === "success" ? "text-success" : undefined;
  const toneHex =
    tone === "destructive" ? "var(--destructive)" : tone === "success" ? "var(--success)" : "var(--primary)";

  // `<button>` emas — ichidagi sparkline/Progress kabi murakkab elementlar
  // bilan native button ba'zi brauzerlarda hover/fokusda gʻalati render
  // beradi. Boshqa bosiluvchi kartalar/qatorlar (ClassesTable) bilan bir xil
  // naqsh: `div` + onClick + klaviatura qoʻllovi.
  //
  // MUHIM: hoverda fon RANGI oʻzgartirilmaydi — karta sahifadagi katak-
  // naqsh fon ustida turadi, har qanday shaffof/xira fon shu naqsh bilan
  // "kurashadi" va karta "erib ketgandek" koʻrinadi (sinab koʻrilgan: ham
  // bg-muted/40, ham toʻliq bg-muted shu muammoni beradi). Jahon amaliyoti
  // (Stripe/Linear/Vercel KPI kartalari): fon emas, soya bilan "koʻtarilish"
  // + border toʻqlashishi — bu naqsh bilan hech qachon ziddiyatga kirmaydi.
  return (
    <div
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onClick();
              }
            }
          : undefined
      }
      className={cn(
        "group/stat w-full rounded-xl border border-border/60 bg-card p-5 flex flex-col gap-4 text-left transition-all",
        onClick && "hover:border-border hover:shadow-md cursor-pointer focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2",
        className
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2.5">
          {Icon && (
            <SectionIcon className={cn("rounded-full", iconClassName)}>
              <Icon />
            </SectionIcon>
          )}
          {/* `truncate` EMAS: uzun yorliqlar ("Shu haftada bajarilgan") tor
              kartada "Shu haftada b…" boʻlib kesilardi va karta nimani
              oʻlchayotgani nomaʼlum qolardi. `line-clamp-2` — bir qatorga
              sigʻsa avvalgidek koʻrinadi, sigʻmasa ikkinchi qatorga oʻtadi;
              chegara baribir bor, shuning uchun karta balandligi
              nazoratdan chiqmaydi. */}
          <span className="line-clamp-2 text-sm font-medium text-muted-foreground">{label}</span>
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
          <div className={cn("text-[28px] font-bold tabular-nums leading-none tracking-tight", toneColorClass, valueClassName)}>
            {value}
          </div>
          {unit && <span className="text-sm font-normal text-muted-foreground">{unit}</span>}
          {subInline && sub && (
            <TypographyMuted className={cn("truncate text-xs", subClassName)}>{sub}</TypographyMuted>
          )}
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

      {sub && !subInline && <TypographyMuted className={cn("truncate text-xs", subClassName)}>{sub}</TypographyMuted>}
    </div>
  );
}

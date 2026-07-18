"use client";

import { useEffect, useState } from "react";
import { Mars, Venus } from "lucide-react";
import { Pie, PieChart } from "recharts";
import { TypographyMuted } from "@/components/ui/typography";
import { ChartContainer, ChartTooltip, type ChartConfig } from "@/components/ui/chart";

// Jins ranglari — StudentProfile'dagi qatʼiy naqsh bilan bir xil manba
// (Mars/sky = oʻgʻil, Venus/pink = qiz), boshqa joyda ixtiro qilinmaydi.
function chartConfig(boysLabel: string, girlsLabel: string): ChartConfig {
  return {
    count: { label: "" },
    male: { label: boysLabel, color: "var(--color-sky-500)" },
    female: { label: girlsLabel, color: "var(--color-pink-500)" },
  };
}

/** Oʻgʻil/qiz nisbati — markazida jami son bilan donut chart (recharts),
    pastida markazlashtirilgan izoh (son + foiz), hover'da tooltip.
    Statistika sahifasida ham butun-maktab Umumiy, ham sinf detali darajasida
    ishlatiladi. Serverda ResponsiveContainer oʻlchovsiz boʻlgani uchun faqat
    mount'dan keyin chiziladi (task-stats-panel'dagi bilan bir xil gotcha). */
export function GenderDonutChart({
  gender, boysLabel, girlsLabel, unitLabel,
}: {
  gender: { boys: number; girls: number; boysPct: number | null; girlsPct: number | null };
  boysLabel: string;
  girlsLabel: string;
  /** "nafar" kabi ikkilamchi birlik — legend qatorlari va tooltip'da sonlardan keyin. */
  unitLabel?: string;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const total = gender.boys + gender.girls;
  if (total === 0) return null;
  const boysPct = gender.boysPct ?? 0;
  const girlsPct = gender.girlsPct ?? 0;

  const chartData = [
    { gender: "male", count: gender.boys, fill: "var(--color-male)" },
    { gender: "female", count: gender.girls, fill: "var(--color-female)" },
  ];

  return (
    <div className="flex w-full flex-col items-center gap-4">
      {!mounted ? (
        <div className="size-[160px] shrink-0" />
      ) : (
        <ChartContainer config={chartConfig(boysLabel, girlsLabel)} className="aspect-square size-[160px] shrink-0">
          <PieChart>
            <ChartTooltip
              cursor={false}
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const item = payload[0] as { value: number; payload: { gender: string } };
                const pct = item.payload.gender === "male" ? boysPct : girlsPct;
                return (
                  <div className="rounded-lg border border-border/50 bg-background px-2.5 py-1.5 text-xs shadow-xl">
                    <span className="font-semibold tabular-nums">{item.value}</span>
                    {unitLabel && <span className="text-muted-foreground"> {unitLabel}</span>}
                    <span className="text-muted-foreground"> ({pct}%)</span>
                  </div>
                );
              }}
            />
            <Pie data={chartData} dataKey="count" nameKey="gender" innerRadius={52} outerRadius={78} strokeWidth={3} />
          </PieChart>
        </ChartContainer>
      )}
      <div className="flex w-full flex-col gap-2">
        <div className="flex items-center justify-between gap-2 text-sm">
          <span className="flex items-center gap-1.5 text-foreground/80">
            <Mars className="size-3.5 shrink-0 text-sky-500" />
            {boysLabel}
          </span>
          <span className="font-semibold tabular-nums">
            {gender.boys}{unitLabel ? ` ${unitLabel}` : ""} <TypographyMuted className="inline">({boysPct}%)</TypographyMuted>
          </span>
        </div>
        <div className="flex items-center justify-between gap-2 text-sm">
          <span className="flex items-center gap-1.5 text-foreground/80">
            <Venus className="size-3.5 shrink-0 text-pink-500" />
            {girlsLabel}
          </span>
          <span className="font-semibold tabular-nums">
            {gender.girls}{unitLabel ? ` ${unitLabel}` : ""} <TypographyMuted className="inline">({girlsPct}%)</TypographyMuted>
          </span>
        </div>
      </div>
    </div>
  );
}

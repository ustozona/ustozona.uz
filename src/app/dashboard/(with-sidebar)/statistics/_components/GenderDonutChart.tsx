"use client";

import { useEffect, useState } from "react";
import { Mars, Venus } from "lucide-react";
import { Label, Pie, PieChart } from "recharts";
import { TypographyLabel, TypographyMuted } from "@/components/ui/typography";
import { ChartContainer, type ChartConfig } from "@/components/ui/chart";

// Jins ranglari — StudentProfile'dagi qatʼiy naqsh bilan bir xil manba
// (Mars/sky = oʻgʻil, Venus/pink = qiz), boshqa joyda ixtiro qilinmaydi.
const GENDER_CHART_CONFIG = {
  count: { label: "" },
  male: { label: "", color: "var(--color-sky-500)" },
  female: { label: "", color: "var(--color-pink-500)" },
} satisfies ChartConfig;

/** Oʻgʻil/qiz nisbati — markazida jami son bilan donut chart (recharts).
    Statistika sahifasida ham butun-maktab Umumiy, ham sinf detali darajasida
    ishlatiladi. Serverda ResponsiveContainer oʻlchovsiz boʻlgani uchun faqat
    mount'dan keyin chiziladi (task-stats-panel'dagi bilan bir xil gotcha). */
export function GenderDonutChart({
  gender, boysLabel, girlsLabel, totalLabel,
}: {
  gender: { boys: number; girls: number; boysPct: number | null; girlsPct: number | null };
  boysLabel: string;
  girlsLabel: string;
  totalLabel: string;
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
    <div className="rounded-xl border border-border/60 p-4 flex items-center gap-4">
      {!mounted ? (
        <div className="size-[120px] shrink-0" />
      ) : (
        <ChartContainer config={GENDER_CHART_CONFIG} className="aspect-square size-[120px] shrink-0">
          <PieChart>
            <Pie data={chartData} dataKey="count" nameKey="gender" innerRadius={38} outerRadius={58} strokeWidth={3}>
              <Label
                content={({ viewBox }) => {
                  if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                    return (
                      <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle" dominantBaseline="middle">
                        <tspan x={viewBox.cx} y={viewBox.cy} className="fill-foreground text-xl font-bold">
                          {total}
                        </tspan>
                      </text>
                    );
                  }
                }}
              />
            </Pie>
          </PieChart>
        </ChartContainer>
      )}
      <div className="min-w-0 flex-1 space-y-2">
        <TypographyLabel>{totalLabel}</TypographyLabel>
        <div className="flex items-center gap-2 text-sm">
          <Mars className="size-4 text-sky-500 shrink-0" />
          <span className="text-foreground/80">{boysLabel}</span>
          <span className="ml-auto font-semibold tabular-nums">{gender.boys} <TypographyMuted className="inline">({boysPct}%)</TypographyMuted></span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Venus className="size-4 text-pink-500 shrink-0" />
          <span className="text-foreground/80">{girlsLabel}</span>
          <span className="ml-auto font-semibold tabular-nums">{gender.girls} <TypographyMuted className="inline">({girlsPct}%)</TypographyMuted></span>
        </div>
      </div>
    </div>
  );
}

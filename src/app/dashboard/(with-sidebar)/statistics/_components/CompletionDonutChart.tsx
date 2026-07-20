"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, XCircle } from "lucide-react";
import { Label, Pie, PieChart } from "recharts";
import { TypographyMuted } from "@/components/ui/typography";
import { ChartContainer, ChartTooltip, type ChartConfig } from "@/components/ui/chart";
import type { CompletionRate } from "@/lib/class-stats";

const chartConfig: ChartConfig = {
  count: { label: "" },
  completed: { label: "", color: "var(--success)" },
  missing: { label: "", color: "var(--destructive)" },
};

/** Topshiriqlar bajarilishi — bajarilgan/bajarilmagan nisbati donut chart
    (GenderDonutChart bilan bir xil vizual naqsh: markazda jami, pastda
    ikki qatorli izoh). Sinf-darajali `assignmentCompletionRate`dan keladi. */
export function CompletionDonutChart({
  completion, completedLabel, notCompletedLabel, totalLabel, unitLabel,
}: {
  completion: CompletionRate;
  completedLabel: string;
  notCompletedLabel: string;
  totalLabel: string;
  unitLabel?: string;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const completed = completion.totalSlots - completion.unsubmittedCount;
  const missing = completion.unsubmittedCount;
  const total = completed + missing;
  if (total === 0) return null;
  const completedPct = Math.round((completed / total) * 100);
  const missingPct = 100 - completedPct;

  const chartData = [
    { kind: "completed", count: completed, fill: "var(--color-completed)" },
    { kind: "missing", count: missing, fill: "var(--color-missing)" },
  ];

  return (
    <div className="flex w-full flex-col items-center gap-4">
      {!mounted ? (
        <div className="size-[160px] shrink-0" />
      ) : (
        <ChartContainer config={chartConfig} className="aspect-square size-[160px] shrink-0">
          <PieChart>
            <ChartTooltip
              cursor={false}
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const item = payload[0] as { value: number; payload: { kind: string } };
                const pct = item.payload.kind === "completed" ? completedPct : missingPct;
                return (
                  <div className="rounded-lg border border-border/50 bg-background px-2.5 py-1.5 text-xs shadow-xl">
                    <span className="font-semibold tabular-nums">{item.value}</span>
                    {unitLabel && <span className="text-muted-foreground"> {unitLabel}</span>}
                    <span className="text-muted-foreground"> ({pct}%)</span>
                  </div>
                );
              }}
            />
            <Pie data={chartData} dataKey="count" nameKey="kind" innerRadius={52} outerRadius={78} strokeWidth={3}>
              <Label
                content={({ viewBox }) => {
                  if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                    return (
                      <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle" dominantBaseline="middle">
                        <tspan x={viewBox.cx} y={(viewBox.cy || 0) - 12} className="fill-muted-foreground text-xs">
                          {totalLabel}
                        </tspan>
                        <tspan x={viewBox.cx} y={(viewBox.cy || 0) + 12} className="fill-foreground text-2xl font-bold">
                          {completedPct}%
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
      <div className="flex w-full flex-col gap-2">
        <div className="flex items-center justify-between gap-2 text-sm">
          <span className="flex items-center gap-1.5 text-foreground/80">
            <CheckCircle2 className="size-3.5 shrink-0 text-success" />
            {completedLabel}
          </span>
          <span className="font-semibold tabular-nums">
            {completed}{unitLabel ? ` ${unitLabel}` : ""} <TypographyMuted className="inline">({completedPct}%)</TypographyMuted>
          </span>
        </div>
        <div className="flex items-center justify-between gap-2 text-sm">
          <span className="flex items-center gap-1.5 text-foreground/80">
            <XCircle className="size-3.5 shrink-0 text-destructive" />
            {notCompletedLabel}
          </span>
          <span className="font-semibold tabular-nums">
            {missing}{unitLabel ? ` ${unitLabel}` : ""} <TypographyMuted className="inline">({missingPct}%)</TypographyMuted>
          </span>
        </div>
      </div>
    </div>
  );
}

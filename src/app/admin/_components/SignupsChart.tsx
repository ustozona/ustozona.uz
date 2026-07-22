"use client";

import * as React from "react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { Card } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

/* Oxirgi 30 kunlik roʻyxatdan oʻtishlar grafigi.
   recharts SSR'da hydration mismatch beradi — mount-gate majburiy. */

const chartConfig = {
  n: { label: "Roʻyxatdan oʻtish", color: "var(--chart-1)" },
} satisfies ChartConfig;

export default function SignupsChart({
  data,
}: {
  data: { day: string; n: number }[];
}) {
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  return (
    <Card className="shadow-none gap-0 p-0">
      <div className="border-b border-border px-5 py-4">
        <h2 className="heading-small">Roʻyxatdan oʻtishlar</h2>
        <p className="text-caption text-muted-foreground">Oxirgi 30 kun</p>
      </div>
      <div className="p-5">
        {mounted ? (
          <ChartContainer config={chartConfig} className="h-56 w-full">
            <AreaChart data={data} margin={{ left: -20, right: 8 }}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis
                dataKey="day"
                tickLine={false}
                axisLine={false}
                tickFormatter={(v: string) => v.slice(5).replace("-", ".")}
                minTickGap={24}
              />
              <YAxis tickLine={false} axisLine={false} allowDecimals={false} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Area
                dataKey="n"
                type="monotone"
                fill="var(--color-n)"
                fillOpacity={0.15}
                stroke="var(--color-n)"
                strokeWidth={2}
              />
            </AreaChart>
          </ChartContainer>
        ) : (
          <div className="h-56" />
        )}
      </div>
    </Card>
  );
}

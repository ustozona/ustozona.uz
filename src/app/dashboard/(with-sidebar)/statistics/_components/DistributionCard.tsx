"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Bar, BarChart, CartesianGrid, XAxis, Cell, LabelList } from "recharts";
import { BarChart3 } from "lucide-react";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { scoreBarColor } from "@/lib/score-colors";
import type { DistributionBin } from "@/lib/class-stats";
import { StatEmpty } from "./StatEmpty";

const CHART_CONFIG = { count: { label: "count" } } satisfies ChartConfig;

export function DistributionCard({ bins }: { bins: DistributionBin[] | null }) {
  const t = useTranslations("StatisticsPage");
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const total = bins ? bins.reduce((sum, b) => sum + b.count, 0) : 0;

  return (
    <div className="h-full">
      {bins === null ? (
        <StatEmpty icon={BarChart3} title={t("notEnoughData")} />
      ) : !mounted ? (
        <div className="h-full min-h-40 w-full" />
      ) : (
        <ChartContainer config={CHART_CONFIG} className="aspect-auto h-full min-h-40 w-full">
          <BarChart data={bins} margin={{ top: 20, right: 4, left: 4, bottom: 0 }}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={6} />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  formatter={(_v, _n, item) => {
                    const bin = item.payload as DistributionBin;
                    const pct = total > 0 ? Math.round((bin.count / total) * 100) : 0;
                    return `${bin.count} ${t("unitPeople")} (${pct}%)`;
                  }}
                />
              }
            />
            <Bar dataKey="count" radius={4}>
              {bins.map((b) => (
                <Cell key={b.label} fill={scoreBarColor(b.min)} />
              ))}
              <LabelList dataKey="count" position="top" className="fill-foreground text-xs font-semibold" />
            </Bar>
          </BarChart>
        </ChartContainer>
      )}
    </div>
  );
}

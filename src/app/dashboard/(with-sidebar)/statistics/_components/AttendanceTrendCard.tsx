"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { TrendingUp } from "lucide-react";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { MIN_TREND_WEEKS, type AttendanceWeekPoint } from "@/lib/class-stats";
import { StatEmpty } from "./StatEmpty";

const CHART_CONFIG = { pct: { label: "pct", color: "var(--info)" } } satisfies ChartConfig;

export function AttendanceTrendCard({ weeks }: { weeks: AttendanceWeekPoint[] }) {
  const t = useTranslations("StatisticsPage");
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const withData = weeks.filter((w) => w.pct !== null);
  const notEnough = withData.length < MIN_TREND_WEEKS;

  return (
    <div>
      {notEnough ? (
        <StatEmpty icon={TrendingUp} title={t("notEnoughData")} />
      ) : !mounted ? (
        <div className="h-32 w-full" />
      ) : (
        <ChartContainer config={CHART_CONFIG} className="aspect-auto h-32 w-full">
          <AreaChart data={weeks} margin={{ top: 4, right: 4, left: 4, bottom: 0 }}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="weekStart" tickLine={false} axisLine={false} tickMargin={6} hide />
            <YAxis domain={[0, 100]} hide />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel formatter={(v) => `${v}%`} />}
            />
            <defs>
              <linearGradient id="fillAttendancePct" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-pct)" stopOpacity={0.8} />
                <stop offset="95%" stopColor="var(--color-pct)" stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <Area
              dataKey="pct"
              type="natural"
              fill="url(#fillAttendancePct)"
              fillOpacity={0.4}
              stroke="var(--color-pct)"
              strokeWidth={2}
              connectNulls
            />
          </AreaChart>
        </ChartContainer>
      )}
    </div>
  );
}

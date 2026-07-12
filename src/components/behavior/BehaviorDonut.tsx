"use client";

import { Cell, Label, Pie, PieChart } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import type { SkillSlice } from "@/lib/behavior-data";
import { BehaviorEmoji } from "./BehaviorEmoji";
import { formatPoints } from "./SkillCard";

/* Hisobot donut'i — yashil yoylar ijobiy, qizil salbiy; HAR segment
   bitta koʻnikma (bir xil rang oilasida shaffoflik bilan farqlanadi),
   markazda "N% ijobiy". AttendanceDonut (profil charts.tsx) qolipi. */

// ATT_COLORS bilan bir xil semantik juftlik (present/absent).
const POSITIVE_HEX = "#22c55e";
const NEGATIVE_HEX = "#ef4444";

export function BehaviorDonut({
  slices,
  positivePct,
}: {
  slices: SkillSlice[];
  /** Ijobiy eventlar ulushi (soni boʻyicha), % — event boʻlmasa null. */
  positivePct: number | null;
}) {
  const config: ChartConfig = Object.fromEntries(
    slices.map((s) => [s.key, { label: s.name }])
  );

  /* Bir tur ichida segmentlar shaffoflik pogʻonasi bilan ajratiladi. */
  const opacity = new Map<string, number>();
  let p = 0;
  let n = 0;
  for (const s of slices) {
    const i = s.positive ? p++ : n++;
    opacity.set(s.key, Math.max(0.4, 1 - i * 0.16));
  }

  return (
    <ChartContainer config={config} className="mx-auto aspect-square w-full max-w-[210px]">
      <PieChart>
        <ChartTooltip
          cursor={false}
          content={
            <ChartTooltipContent
              nameKey="key"
              hideLabel
              formatter={(_value, name, item) => {
                const key = (item?.payload?.key ?? name) as string;
                const s = slices.find((x) => x.key === key);
                if (!s) return String(name);
                return (
                  <span className="flex items-center gap-1.5 text-foreground">
                    <BehaviorEmoji code={s.emoji} label={s.name} className="size-4" />
                    <span>
                      {s.name} · {s.count} marta ·{" "}
                      <span className="font-semibold tabular-nums">
                        {formatPoints(s.points)}
                      </span>
                    </span>
                  </span>
                );
              }}
            />
          }
        />
        <Pie
          data={slices as unknown as Record<string, unknown>[]}
          dataKey="count"
          nameKey="key"
          innerRadius="64%"
          outerRadius="94%"
          strokeWidth={2}
          paddingAngle={2}
        >
          {slices.map((s) => (
            <Cell
              key={s.key}
              fill={s.positive ? POSITIVE_HEX : NEGATIVE_HEX}
              fillOpacity={opacity.get(s.key)}
            />
          ))}
          <Label
            content={({ viewBox }) => {
              if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                return (
                  <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle" dominantBaseline="middle">
                    <tspan
                      x={viewBox.cx}
                      y={viewBox.cy}
                      className="fill-foreground text-3xl font-bold tabular-nums"
                    >
                      {positivePct === null ? "—" : `${positivePct}%`}
                    </tspan>
                    <tspan
                      x={viewBox.cx}
                      y={(viewBox.cy ?? 0) + 24}
                      className="fill-muted-foreground text-[11px] font-medium uppercase tracking-wider"
                    >
                      Ijobiy
                    </tspan>
                  </text>
                );
              }
            }}
          />
        </Pie>
      </PieChart>
    </ChartContainer>
  );
}

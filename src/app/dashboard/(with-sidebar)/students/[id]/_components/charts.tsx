"use client";

/* ════════════════════════════════════════════════════════════════════
   Profil chartlari — shadcn `chart` (Recharts) asosida.
   Ranglar dizayn tizimidan: sinf hex (trend/radar), semantik davomat ranglari.
   ════════════════════════════════════════════════════════════════════ */

import { useTranslations } from "next-intl";
import {
  Area, AreaChart, CartesianGrid, XAxis, YAxis, Line,
  Pie, PieChart, Cell, Label,
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
} from "recharts";
import {
  ChartContainer, ChartTooltip, ChartTooltipContent,
  ChartLegend, ChartLegendContent, type ChartConfig,
} from "@/components/ui/chart";
import {
  Tooltip, TooltipTrigger, TooltipContent, TooltipProvider,
} from "@/components/ui/tooltip";
import type {
  TrendPoint, BloomBreakdown, AttendanceWindow, AttendanceDay,
} from "@/lib/student-profile";

// Davomat semantik ranglari (yagona joy)
export const ATT_COLORS = {
  present: "#22c55e",
  absent: "#ef4444",
  late: "#f59e0b",
  excused: "#0ea5e9",
} as const;

// ─── Baho dinamikasi (area + gradient) ───────────────────────────────────────

// Chetdagi yozuvlar kesilmasligi uchun: birinchini chapga, oxirgisini oʻngga,
// qolganini markazga tekislaymiz. Shunda chart toʻliq enini saqlaydi.
function EdgeAwareTick({
  x, y, payload, index, lastIndex,
}: {
  x?: number; y?: number; payload?: { value: string }; index?: number; lastIndex?: number;
}) {
  const anchor = index === 0 ? "start" : index === lastIndex ? "end" : "middle";
  return (
    <text x={x} y={y} dy={12} textAnchor={anchor} className="fill-muted-foreground text-xs">
      {payload?.value}
    </text>
  );
}

function TrendEmptyState({ message }: { message: string }) {
  const t = useTranslations("StudentCharts");
  return (
    <div className="flex h-full min-h-[200px] flex-col items-center justify-center gap-1 text-center">
      <p className="text-sm font-medium text-foreground">{t("trendEmptyTitle")}</p>
      <p className="text-xs text-muted-foreground">{message}</p>
    </div>
  );
}

export function TrendChart({ points, color }: { points: TrendPoint[]; color: string }) {
  const t = useTranslations("StudentCharts");
  // D — boʻsh / yetarsiz holatlar: trend uchun kamida 2 davr nuqtasi kerak,
  // aks holda chiziq emas, yolgʻiz nuqta chiqadi (ma'nosiz).
  if (points.length === 0) {
    return <TrendEmptyState message={t("trendEmptyNoGraded")} />;
  }
  if (points.length === 1) {
    return (
      <TrendEmptyState message={t("trendEmptySinglePeriod")} />
    );
  }

  // Asosiy chiziq rangi qiymatga bogʻliq (scoreBarColor): past qizil, yuqori
  // yashil — semantik. Kumulyativ chiziq esa neytral (muted) yoʻnaltiruvchi.
  const config = {
    pct: { label: t("periodAverage"), color },
    cum: { label: t("overallLevel"), color: "var(--muted-foreground)" },
  } satisfies ChartConfig;

  // Domenni ikkala qatorga ham moslaymiz; tepa/pastda biroz havo qoldiramiz.
  const values = points.flatMap((p) => [p.pct, p.cum]);
  const lo = Math.max(0, Math.min(...values) - 4);
  const hi = Math.min(100, Math.max(...values) + 6);

  return (
    <ChartContainer config={config} className="aspect-auto h-full w-full">
      {/* Chetlarda 6px joy — hover'dagi activeDot kesilmasligi uchun (≈ dot radiusi).
          387px chartda koʻzga koʻrinmaydi, sarlavha bilan tekislanish saqlanadi. */}
      <AreaChart accessibilityLayer data={points} margin={{ left: 6, right: 6, top: 5 }}>
        <defs>
          <linearGradient id="trend-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--color-pct)" stopOpacity={0.8} />
            <stop offset="95%" stopColor="var(--color-pct)" stopOpacity={0.1} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="label"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          interval={0}
          tick={<EdgeAwareTick lastIndex={points.length - 1} />}
        />
        <YAxis domain={[lo, hi]} hide />
        <ChartTooltip
          cursor={false}
          content={
            <ChartTooltipContent
              indicator="dot"
              formatter={(value, name, item) => {
                const label = name === "cum" ? t("overallLevel") : t("periodAverage");
                const count = name === "pct" ? t("tooltipCountSuffix", { count: Number(item?.payload?.count ?? 0) }) : "";
                return t("tooltipValue", { label, value: String(value ?? ""), count });
              }}
            />
          }
        />
        {/* Asosiy: davr ichidagi oʻrtacha (gradientli maydon) */}
        <Area
          dataKey="pct"
          type="monotone"
          fill="url(#trend-fill)"
          stroke="var(--color-pct)"
          strokeWidth={2}
        />
        {/* Ikkilamchi: kumulyativ oʻrtacha — ochroq, uzuq yoʻnaltiruvchi chiziq */}
        <Line
          dataKey="cum"
          type="monotone"
          stroke="var(--color-cum)"
          strokeWidth={1.5}
          strokeDasharray="4 4"
          dot={false}
          strokeOpacity={0.6}
        />
        <ChartLegend content={<ChartLegendContent />} />
      </AreaChart>
    </ChartContainer>
  );
}

// ─── Blum darajalari (radar) ─────────────────────────────────────────────────

export function BloomRadar({ levels, hex }: { levels: BloomBreakdown[]; hex: string }) {
  const t = useTranslations("StudentCharts");
  const data = levels.map((l) => ({ level: l.label, value: l.value }));
  const config = { value: { label: t("achievement"), color: hex } } satisfies ChartConfig;

  return (
    <ChartContainer config={config} className="mx-auto aspect-square max-h-[250px] w-full">
      <RadarChart data={data}>
        <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
        <PolarAngleAxis dataKey="level" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} />
        <PolarGrid />
        <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
        <Radar dataKey="value" fill="var(--color-value)" fillOpacity={0.6} />
      </RadarChart>
    </ChartContainer>
  );
}

// ─── Davomat donut (markazlangan overlay) ────────────────────────────────────

export function AttendanceDonut({ summary }: { summary: AttendanceWindow }) {
  const t = useTranslations("StudentCharts");
  const data = [
    { status: "present", value: summary.present },
    { status: "late", value: summary.late },
    { status: "excused", value: summary.excused },
    { status: "absent", value: summary.absent },
  ];
  const attTooltipPhrase = {
    present: t("presentPhrase"),
    absent: t("absentPhrase"),
    late: t("latePhrase"),
    excused: t("excusedPhrase"),
  } as const;
  const config: ChartConfig = {
    present: { label: t("present"), color: ATT_COLORS.present },
    late: { label: t("late"), color: ATT_COLORS.late },
    excused: { label: t("excused"), color: ATT_COLORS.excused },
    absent: { label: t("absent"), color: ATT_COLORS.absent },
  };

  return (
    <ChartContainer config={config} className="mx-auto aspect-square w-full max-w-[210px]">
      <PieChart>
        <ChartTooltip
          cursor={false}
          content={
            <ChartTooltipContent
              nameKey="status"
              hideLabel
              indicator="line"
              formatter={(value, name, item) => {
                const status = (item?.payload?.status ?? name) as keyof typeof attTooltipPhrase;
                const phrase = attTooltipPhrase[status] ?? String(name);
                // formatter berilganda shadcn indicator'ni chizmaydi (chart.tsx:195) —
                // shuning uchun "line" indicator'ni shu yerda oʻzimiz qaytaramiz.
                return (
                  <>
                    <span
                      className="w-1 shrink-0 self-stretch rounded-[2px]"
                      style={{ backgroundColor: ATT_COLORS[status as keyof typeof ATT_COLORS] }}
                    />
                    <span className="text-foreground">{t("donutTooltip", { value: String(value ?? ""), phrase })}</span>
                  </>
                );
              }}
            />
          }
        />
        <Pie data={data} dataKey="value" nameKey="status" innerRadius="64%" outerRadius="94%" strokeWidth={2} paddingAngle={2}>
          {data.map((d) => (
            <Cell key={d.status} fill={ATT_COLORS[d.status as keyof typeof ATT_COLORS]} />
          ))}
          {/* Markaz matni — chart SVGʻi ICHIDA (standart shadcn pattern).
              Tooltip qatlamidan oldin chizilgani uchun hover'da tooltip ustida chiqadi. */}
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
                      {summary.pct}%
                    </tspan>
                    <tspan
                      x={viewBox.cx}
                      y={(viewBox.cy ?? 0) + 24}
                      className="fill-muted-foreground text-[11px] font-medium uppercase tracking-wider"
                    >
                      {t("attendanceLabel")}
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

// ─── Davomat tracker (segment lenta — "qachon") ──────────────────────────────
// Har dars kuni = bitta segment; rang ATT_COLORS dan, hover'da sana + holat.
// Donut "qancha"ni, tracker "qachon"ni koʻrsatadi.

export function AttendanceTracker({ days }: { days: AttendanceDay[] }) {
  const t = useTranslations("StudentCharts");
  const attStatusLabels = {
    present: t("present"),
    absent: t("absent"),
    late: t("late"),
    excused: t("excused"),
  } as const;
  if (days.length === 0) {
    return (
      <div className="flex h-9 items-center justify-center text-sm text-muted-foreground">
        {t("noAttendanceData")}
      </div>
    );
  }
  return (
    <TooltipProvider delayDuration={100}>
      <div className="flex w-full gap-px sm:gap-[3px]">
        {days.map((d) => (
          <Tooltip key={d.date}>
            <TooltipTrigger asChild>
              <div
                className="h-9 min-w-px flex-1 rounded-[2px] transition-opacity hover:opacity-70 sm:rounded-[3px]"
                style={{ backgroundColor: ATT_COLORS[d.status] }}
              />
            </TooltipTrigger>
            <TooltipContent>
              <span className="font-medium">{d.label}</span>
              <span className="opacity-70"> · {attStatusLabels[d.status]}</span>
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
    </TooltipProvider>
  );
}

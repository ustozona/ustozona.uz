"use client";

import { useMemo, useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import {
  type StudentProfile, type Granularity, type TopicBreakdown,
  aggregateTrend, aggregateAttendance, GRANULARITY_LABELS,
} from "@/lib/student-profile";
import { cn } from "@/lib/utils";
import { scoreBarColor } from "@/lib/score-colors";
import { CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { SectionIcon } from "@/components/ui/section-icon";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent,
  DropdownMenuRadioGroup, DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu";
import { TypographyLabel, TypographyMuted } from "@/components/ui/typography";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { TrendChart, BloomRadar, AttendanceDonut, AttendanceTracker, ATT_COLORS } from "./charts";
import {
  GraduationCap, CalendarCheck, CalendarRange, TrendingUp, ClipboardCheck, Layers, ChevronDown, Brain,
  Check, X, Clock, FileText,
} from "lucide-react";

// Davomat ikonlari — attendance sahifasi bilan bir xil (BUILTIN_STATUSES.icon)
const ATT_ICONS = {
  present: Check,
  absent: X,
  late: Clock,
  excused: FileText,
} as const;

// Baho dinamikasi — faqat statistik maʼnoli davrlar (kunlik/yillik bitta nuqta
// yoki shovqin berardi). Davomat — kunlik kerakmas, lekin yillik yaxlit koʻrinish.
const TREND_GRANULARITIES: Granularity[] = ["weekly", "monthly", "quarterly"];
const ATTENDANCE_GRANULARITIES: Granularity[] = ["weekly", "monthly", "quarterly", "yearly"];

export function KpiCard({
  label, value, sub, color, icon,
}: {
  label: string;
  value: string;
  sub: string;
  color?: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="flex flex-col rounded-xl bg-card p-5 border border-border/50 shadow-sm">
      <div className="flex items-start justify-between">
        <TypographyLabel>{label}</TypographyLabel>
        <SectionIcon size="sm">{icon}</SectionIcon>
      </div>
      <span className="mt-2 text-3xl font-bold tracking-tight" style={color ? { color } : undefined}>
        {value}
      </span>
      <TypographyMuted className="mt-1">{sub}</TypographyMuted>
    </div>
  );
}

// Toifa (baho turi) bari — oʻzlashtirish %, ulush (ogʻirlik) va baholar soni.
// shadcn `Progress` ustida; rang toifaning oʻz rangi (TOPIC_COLOR_HEX) — indikator
// va (xira) trekka dinamik berib, semantik svetofor emas. `mounted` bilan 0→qiymat
// animatsiyasi (transition-all indikatorda).
function CategoryBar({ row, mounted }: { row: TopicBreakdown; mounted: boolean }) {
  const t = useTranslations("OverviewTab");
  const pct = row.avg;
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-2">
        <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: row.hex }} />
        <span className="truncate text-sm font-medium">{row.topic.name}</span>
        <span className="ml-auto text-sm font-semibold tabular-nums">
          {pct === null ? "—" : `${pct}%`}
        </span>
      </div>
      <Progress
        value={mounted ? pct ?? 0 : 0}
        indicatorColor={row.hex}
        className="**:data-[slot=progress-indicator]:duration-1000"
        style={{ backgroundColor: `color-mix(in srgb, ${row.hex} 16%, transparent)` }}
      />
      <TypographyMuted className="text-[11px]">
        {row.count === 0
          ? t("categoryShareUngraded", { weight: row.topic.weightPercent })
          : t("categoryShareGraded", { weight: row.topic.weightPercent, count: row.count })}
      </TypographyMuted>
    </div>
  );
}

function GranularityDropdown({
  value, onChange, options,
}: {
  value: Granularity;
  onChange: (g: Granularity) => void;
  options: Granularity[];
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="ml-auto h-8 gap-1.5 font-medium shadow-none">
          {GRANULARITY_LABELS[value]}
          <ChevronDown className="size-3.5 opacity-60" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuRadioGroup value={value} onValueChange={(v) => onChange(v as Granularity)}>
          {options.map((g) => (
            <DropdownMenuRadioItem key={g} value={g}>
              {GRANULARITY_LABELS[g]}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default function OverviewTab({ profile }: { profile: StudentProfile }) {
  const t = useTranslations("OverviewTab");
  const { overallGrade, attendance, missingCount, topics, bloom, datedScores, location } = profile;

  // Toifa barlari uchun 0→qiymat mount animatsiyasi
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 150);
    return () => clearTimeout(timer);
  }, []);

  const [gran, setGran] = useState<Granularity>("monthly");
  const trendPoints = useMemo(() => aggregateTrend(datedScores, gran), [datedScores, gran]);

  const [attGran, setAttGran] = useState<Granularity>("yearly");
  const attView = useMemo(() => aggregateAttendance(attendance.days, attGran), [attendance.days, attGran]);

  // label — qisqa (tracker legendasi, kichik joylar uchun)
  // phrase — tooltipdagi kesim: "{value} marta {phrase} · jami {N} dars"
  const attLegend: {
    key: keyof typeof ATT_COLORS; label: string; phrase: string; value: number;
  }[] = [
    { key: "present", label: t("present"), phrase: t("presentPhrase"), value: attView.present },
    { key: "absent", label: t("absent"), phrase: t("absentPhrase"), value: attView.absent },
    { key: "late", label: t("late"), phrase: t("latePhrase"), value: attView.late },
    { key: "excused", label: t("excused"), phrase: t("excusedPhrase"), value: attView.excused },
  ];
  const attTotal = attLegend.reduce((sum, s) => sum + s.value, 0);

  return (
    <div className="space-y-5">
      {/* KPI row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <KpiCard
          label={t("overallGrade")}
          value={`${overallGrade}%`}
          sub={t("overallGradeSub")}
          color={scoreBarColor(overallGrade)}
          icon={<GraduationCap />}
        />
        <KpiCard
          label={t("attendance")}
          value={`${attendance.pct}%`}
          sub={t("attendanceSub", { present: attendance.present, total: attendance.total })}
          color={attendance.pct < 90 ? scoreBarColor(attendance.pct) : undefined}
          icon={<CalendarCheck />}
        />
        <KpiCard
          label={t("missing")}
          value={`${missingCount}`}
          sub={missingCount === 0 ? t("missingSubZero") : t("missingSub")}
          color={missingCount > 0 ? "#ef4444" : undefined}
          icon={<ClipboardCheck />}
        />
      </div>

      {/* Baho dinamikasi + Toifa boʻyicha (barlar) */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Baho dinamikasi — vaqt darajasi bilan */}
        <div className="flex flex-col rounded-xl bg-card p-5 border border-border/50 shadow-sm lg:col-span-2">
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <SectionIcon><TrendingUp /></SectionIcon>
            <CardTitle>{t("gradeTrend")}</CardTitle>
            <GranularityDropdown value={gran} onChange={setGran} options={TREND_GRANULARITIES} />
          </div>
          <div className="flex-1 min-h-[250px]">
            <TrendChart points={trendPoints} color={scoreBarColor(overallGrade)} />
          </div>
        </div>

        {/* Toifa boʻyicha — ulush + baholar soni bilan barlar */}
        <div className="flex flex-col rounded-xl bg-card p-5 border border-border/50 shadow-sm lg:col-span-1">
          <div className="mb-4 flex items-center gap-2.5">
            <SectionIcon><Layers /></SectionIcon>
            <CardTitle>{t("byCategory")}</CardTitle>
          </div>
          <div className="flex flex-col gap-4">
            {topics.map((topic) => (
              <CategoryBar key={topic.topic.id} row={topic} mounted={mounted} />
            ))}
          </div>
        </div>
      </div>

      {/* Davomat + Blum darajalari (radar) */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Davomat — donut + oraliq + legend */}
        <div className="flex flex-col rounded-xl bg-card p-5 border border-border/50 shadow-sm">
          <div className="mb-4 flex items-center gap-2.5">
            <SectionIcon><CalendarCheck /></SectionIcon>
            <CardTitle>{t("attendanceCard")}</CardTitle>
            <GranularityDropdown value={attGran} onChange={setAttGran} options={ATTENDANCE_GRANULARITIES} />
          </div>
          <AttendanceDonut summary={attView} />
          <div className="mt-auto grid grid-cols-2 gap-x-4 gap-y-3 pt-4">
            {attLegend.map((s) => {
              const Icon = ATT_ICONS[s.key];
              const color = ATT_COLORS[s.key];
              const share = attTotal > 0 ? Math.round((s.value / attTotal) * 100) : 0;
              return (
                <Tooltip key={s.key}>
                  <TooltipTrigger asChild>
                    <div className="flex cursor-default items-center gap-2.5">
                      <span
                        className="flex size-9 shrink-0 items-center justify-center rounded-lg"
                        style={{ backgroundColor: `color-mix(in srgb, ${color} 18%, transparent)` }}
                      >
                        <Icon className="size-[18px]" strokeWidth={2.5} style={{ color }} />
                      </span>
                      <span className="text-base font-bold tabular-nums">
                        {s.value}
                        <span className="ml-0.5 text-sm font-medium text-muted-foreground">{t("times")}</span>
                      </span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    {t("attendanceTooltip", { value: s.value, phrase: s.phrase, total: attTotal, share })}
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </div>
        </div>

        {/* Blum darajalari — radar */}
        <div className="flex flex-col rounded-xl bg-card p-5 border border-border/50 shadow-sm lg:col-span-2">
          <div className="mb-2 flex items-center gap-2.5">
            <SectionIcon><Brain /></SectionIcon>
            <CardTitle>{t("bloomLevels")}</CardTitle>
          </div>
          <BloomRadar levels={bloom} hex={location.hex} />
          <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5">
            {bloom.map((l) => (
              <div key={l.id} className="flex items-center gap-2 text-sm">
                <span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: location.hex }} />
                <span className="truncate text-muted-foreground">{l.label}</span>
                <span className="ml-auto font-semibold tabular-nums">{l.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Davomat tracker — segment lenta (butun oʻquv yili, kun-ma-kun) */}
      <div className="flex flex-col rounded-xl bg-card p-5 border border-border/50 shadow-sm">
        <div className="mb-1 flex items-center gap-2.5">
          <SectionIcon><CalendarRange /></SectionIcon>
          <CardTitle>{t("attendanceStrip")}</CardTitle>
          <TypographyMuted className="ml-auto">{t("attendanceStripDays", { count: attendance.total })}</TypographyMuted>
        </div>
        <TypographyMuted className="mb-4">{t("attendanceStripHint")}</TypographyMuted>
        <AttendanceTracker days={attendance.days} />
        <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2">
          {attLegend.map((s) => (
            <div key={s.key} className="flex items-center gap-2">
              <span className="size-2.5 shrink-0 rounded-[3px]" style={{ backgroundColor: ATT_COLORS[s.key] }} />
              <span className="text-xs text-muted-foreground">{s.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

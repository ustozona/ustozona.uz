"use client";

import { useMemo, useState } from "react";
import { useCollator } from "@/lib/use-collator";
import { useTranslations } from "next-intl";
import { ArrowDown, ArrowUp, ArrowUpDown, ChevronRight, SearchX } from "lucide-react";
import { TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { classTints, type ClassColor } from "@/lib/class-colors";
import { STAT_DEADBAND_PP, type AbsenceTier, type StudentPeriodSummary } from "@/lib/class-stats";
import { scoreBarColor } from "@/lib/score-colors";
import { cn } from "@/lib/utils";
import { AttendanceRing } from "./AttendanceRing";
import { StatEmpty } from "./StatEmpty";

export type StudentOverviewRow = StudentPeriodSummary & {
  classId: string;
  className: string;
  classColor: ClassColor;
};

type SortKey = "name" | "className" | "attendancePct" | "summative" | "trendDelta" | "absenceTier";

const TIER_RANK: Record<Exclude<AbsenceTier, null>, number> = { chronic: 2, watch: 1, ok: 0 };

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  return parts.slice(0, 2).map((p) => p[0]?.toUpperCase() ?? "").join("");
}

/**
 * "Oʻquvchilar" tabi — barcha sinflardagi oʻquvchilarni bitta saralanadigan
 * jadvalda koʻrsatadi (`ClassesTable`'ning oʻquvchi darajasidagi hamkasbi,
 * bir xil vizual naqsh: gradient doira + progress ustun + sticky sarlavha).
 * Qator bosilsa oʻquvchi profiliga oʻtiladi.
 */
export function StudentsTable({
  rows,
  scrolled = false,
  onSelect,
  hideClassColumn = false,
}: {
  rows: StudentOverviewRow[];
  scrolled?: boolean;
  onSelect: (studentId: string) => void;
  /** Bitta sinf doirasida koʻrsatilganda "Sinf" ustuni ortiqcha (barcha
      qatorda bir xil qiymat) — shu holatda yashiriladi. */
  hideClassColumn?: boolean;
}) {
  const t = useTranslations("StatisticsPage");
  const [sort, setSort] = useState<{ key: SortKey; dir: "asc" | "desc" }>({ key: "absenceTier", dir: "desc" });
  const compare = useCollator();

  const sorted = useMemo(() => {
    const dirMul = sort.dir === "asc" ? 1 : -1;
    return [...rows].sort((a, b) => {
      if (sort.key === "name") return compare(a.name, b.name) * dirMul;
      if (sort.key === "className") return compare(a.className, b.className) * dirMul;
      if (sort.key === "absenceTier") {
        const av = a.absenceTier ? TIER_RANK[a.absenceTier] : -1;
        const bv = b.absenceTier ? TIER_RANK[b.absenceTier] : -1;
        return (av - bv) * dirMul;
      }
      const av = a[sort.key] ?? -Infinity;
      const bv = b[sort.key] ?? -Infinity;
      return (av - bv) * dirMul;
    });
  }, [rows, sort, compare]);

  const toggleSort = (key: SortKey) => {
    setSort((prev) =>
      prev.key === key ? { key, dir: prev.dir === "asc" ? "desc" : "asc" } : { key, dir: key === "name" || key === "className" ? "asc" : "desc" }
    );
  };

  const stickyHeadCell = cn(
    "sticky top-0 z-20 bg-card after:pointer-events-none after:absolute after:inset-x-0 after:top-full after:h-3 after:bg-linear-to-b after:from-black/4 after:to-transparent after:transition-opacity",
    scrolled ? "after:opacity-100" : "after:opacity-0"
  );

  const SortHeader = ({
    label, sortKey, className, align = "left",
  }: { label: string; sortKey: SortKey; className?: string; align?: "left" | "center" }) => (
    <TableHead className={cn(stickyHeadCell, "px-3 py-3", align === "center" && "text-center", className)}>
      <button
        type="button"
        onClick={() => toggleSort(sortKey)}
        className={cn(
          "inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors",
          align === "center" && "justify-center"
        )}
      >
        {label}
        {sort.key === sortKey ? (
          sort.dir === "asc" ? <ArrowUp className="size-3" /> : <ArrowDown className="size-3" />
        ) : (
          <ArrowUpDown className="size-3 opacity-40" />
        )}
      </button>
    </TableHead>
  );

  return (
    <>
      {sorted.length === 0 ? (
        <StatEmpty icon={SearchX} title={t("noStudentsFound")} className="h-full" />
      ) : (
        <table className="w-full min-w-3xl caption-bottom text-sm">
          <TableHeader>
            <TableRow className="hover:bg-transparent! border-b-0!">
              <SortHeader label={t("columnStudent")} sortKey="name" className="min-w-48 pl-4" />
              {!hideClassColumn && <SortHeader label={t("columnClass")} sortKey="className" className="w-36" />}
              <SortHeader label={t("columnAttendance")} sortKey="attendancePct" className="w-20" align="center" />
              <SortHeader label={t("columnGrade")} sortKey="summative" className="w-44" />
              <SortHeader label={t("columnTrend")} sortKey="trendDelta" className="w-24" align="center" />
              <SortHeader label={t("columnTier")} sortKey="absenceTier" className="w-28" align="center" />
              <TableHead className={cn(stickyHeadCell, "w-10 px-4 py-3")} />
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.map((r) => {
              const scoreColor = scoreBarColor(r.summative ?? 0);
              const delta = r.trendDelta;
              const stable = delta === null || Math.abs(delta) < STAT_DEADBAND_PP;
              return (
                <TableRow key={r.studentId} className="group cursor-pointer" onClick={() => onSelect(r.studentId)}>
                  <TableCell className="whitespace-nowrap py-3.5 pl-4 pr-3">
                    <div className="flex items-center gap-3">
                      <div
                        className="size-9 shrink-0 rounded-full flex items-center justify-center text-xs font-semibold text-white"
                        style={classTints(r.classColor).gradientTile}
                      >
                        {initials(r.name)}
                      </div>
                      <span className="truncate text-sm font-semibold text-foreground">{r.name}</span>
                    </div>
                  </TableCell>

                  {!hideClassColumn && (
                    <TableCell className="whitespace-nowrap w-36 truncate px-3 py-3.5 text-sm text-muted-foreground">
                      {r.className}
                    </TableCell>
                  )}

                  <TableCell className="whitespace-nowrap w-20 px-3 py-3.5">
                    <div className="flex justify-center">
                      <AttendanceRing pct={r.attendancePct} />
                    </div>
                  </TableCell>

                  <TableCell className="whitespace-nowrap w-44 px-3 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <Progress
                        value={r.summative ?? 0}
                        indicatorColor={scoreColor}
                        className="w-full h-1.5 max-w-24"
                        style={{ backgroundColor: `color-mix(in srgb, ${scoreColor} 16%, transparent)` }}
                      />
                      <span className="shrink-0 text-sm font-semibold tabular-nums">
                        {r.summative !== null ? `${Math.round(r.summative)}%` : "—"}
                      </span>
                    </div>
                  </TableCell>

                  <TableCell className="whitespace-nowrap w-24 px-3 py-3.5 text-center">
                    {delta !== null && !stable ? (
                      <span className={cn("inline-flex items-center gap-0.5 text-xs font-semibold tabular-nums", delta > 0 ? "text-success" : "text-destructive")}>
                        {delta > 0 ? <ArrowUp className="size-3" /> : <ArrowDown className="size-3" />}
                        {Math.round(Math.abs(delta))}pp
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground/50">—</span>
                    )}
                  </TableCell>

                  <TableCell className="whitespace-nowrap w-28 px-3 py-3.5 text-center">
                    {r.absenceTier === "chronic" ? (
                      <span className="inline-flex rounded-full bg-destructive/15 px-1.5 py-0.5 text-[10px] font-semibold text-destructive">
                        {t("tierChronic")}
                      </span>
                    ) : r.absenceTier === "watch" ? (
                      <span className="inline-flex rounded-full bg-warning/15 px-1.5 py-0.5 text-[10px] font-semibold text-warning">
                        {t("tierWatch")}
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground/50">—</span>
                    )}
                  </TableCell>

                  <TableCell className="whitespace-nowrap px-4 py-3.5">
                    <ChevronRight className="size-4 text-muted-foreground/40 transition-transform group-hover:translate-x-0.5 group-hover:text-muted-foreground" />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </table>
      )}
    </>
  );
}

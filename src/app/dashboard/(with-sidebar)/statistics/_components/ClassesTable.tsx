"use client";

import { useMemo, useState } from "react";
import { useCollator } from "@/lib/use-collator";
import { useTranslations } from "next-intl";
import { ArrowDown, ArrowUp, ArrowUpDown, ChevronRight, GraduationCap, SearchX } from "lucide-react";
import { TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { classColor } from "@/lib/grades-data";
import { classTints } from "@/lib/class-colors";
import { STAT_DEADBAND_PP, type ClassOverviewRow } from "@/lib/class-stats";
import { scoreBarColor } from "@/lib/score-colors";
import { cn } from "@/lib/utils";
import { AttendanceRing } from "./AttendanceRing";
import { StatEmpty } from "./StatEmpty";

type SortKey = "name" | "studentCount" | "attendanceAvg" | "summativeAvg" | "behaviorPositivePct";

/**
 * Sinflar boʻyicha toʻliq maʼlumot jadvali — "Sinflar" tabida. Shadcn-space
 * "Top Projects" (table-01) bloki naqshiga vizual moslangan (progress-bar
 * ustun) — lekin maʼlumotlar haqiqiy (soxta byudjet/menejer emas). Butun
 * qator bosiladi (checkbox/amal menyusi yoʻq, oxirida faqat hover chevron).
 * Ikonka `classTints(color).gradientTile` — "Mening
 * sinflarim" bilan bir xil kanonik gradient-doira. Oʻquvchilar ustuni SON
 * ("N nafar", ikonkasiz — Davomat/Baho ustunlari bilan bir xil naqsh) —
 * avatar stack emas: 15-30 kishining bosh harflari identifikatsiya bermaydi,
 * bu yerda "kim" emas "nechta" savoli muhim (Stripe/Linear/GitHub qator-son
 * ustunlari kabi). Qidiruv/karta
 * sarlavhasi ota-komponentda (`OverviewPanel`). Jadval oʻz balandligicha
 * render boʻladi va tashqi sahifa scroll'ining bir qismi — ichki scroll YOʻQ
 * (ikkita ustma-ust scrollbar — nested-scroll antipattern). `ClassRowsCard`
 * (Umumiy tabidagi triage vidjeti) bilan ADASHTIRMANG — bu yerda barcha
 * sinflar, saralash bilan. Oxirgi ustun ("Xulq-atvor") — sahifa tepasidagi
 * donut kartaning sinf darajasidagi versiyasi (avvalgi notoʻgʻri "Signal"
 * ustuni oʻrniga — u ijobiy va salbiy signallarni aralashtirib yuborardi).
 */
export function ClassesTable({
  rows,
  onSelect,
}: {
  rows: ClassOverviewRow[];
  onSelect: (classId: string) => void;
}) {
  const t = useTranslations("StatisticsPage");
  const [sort, setSort] = useState<{ key: SortKey; dir: "asc" | "desc" }>({ key: "attendanceAvg", dir: "asc" });
  const compare = useCollator();

  const sorted = useMemo(() => {
    const dirMul = sort.dir === "asc" ? 1 : -1;
    return [...rows].sort((a, b) => {
      if (sort.key === "name") return compare(a.name, b.name) * dirMul;
      const av = a[sort.key] ?? -Infinity;
      const bv = b[sort.key] ?? -Infinity;
      return (av - bv) * dirMul;
    });
  }, [rows, sort, compare]);

  const toggleSort = (key: SortKey) => {
    setSort((prev) =>
      prev.key === key ? { key, dir: prev.dir === "asc" ? "desc" : "asc" } : { key, dir: key === "name" ? "asc" : "desc" }
    );
  };

  const SortHeader = ({
    label, sortKey, className, align = "left",
  }: { label: string; sortKey: SortKey; className?: string; align?: "left" | "center" }) => (
    <TableHead className={cn("px-3 py-3", align === "center" && "text-center", className)}>
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
        <StatEmpty icon={SearchX} title={t("noClassesFound")} className="py-10" />
      ) : (
        <table className="w-full min-w-3xl caption-bottom text-sm">
            <TableHeader>
              <TableRow className="hover:bg-transparent! border-b-0!">
                <SortHeader label={t("columnClass")} sortKey="name" className="min-w-48 pl-4" />
                <SortHeader label={t("columnStudents")} sortKey="studentCount" className="w-32" />
                <SortHeader label={t("columnAttendance")} sortKey="attendanceAvg" className="w-20" align="center" />
                <SortHeader label={t("columnGrade")} sortKey="summativeAvg" className="w-52" />
                <SortHeader label={t("behaviorSplitTitle")} sortKey="behaviorPositivePct" className="w-24" align="center" />
                <TableHead className="w-10 px-4 py-3" />
              </TableRow>
            </TableHeader>
            {/* Qatorlar orasidagi chiziq — TableRow'ning standart border-b'i
                (shadcn table-01 naqshi); oxirgi qatorda TableBody avtomatik
                oʻchiradi. */}
            <TableBody>
              {sorted.map((r) => {
                const color = classColor({ id: r.classId, name: r.name, color: r.color });
                const scoreColor = scoreBarColor(r.summativeAvg ?? 0);
                const delta = r.summativeDelta;
                const stable = delta === null || Math.abs(delta) < STAT_DEADBAND_PP;
                return (
                  <TableRow
                    key={r.classId}
                    className="group cursor-pointer"
                    onClick={() => onSelect(r.classId)}
                  >
                    <TableCell className="whitespace-nowrap py-3.5 pl-4 pr-3">
                      <div className="flex items-center gap-3">
                        <div
                          className="size-11 shrink-0 rounded-full flex items-center justify-center text-white"
                          style={classTints(color).gradientTile}
                        >
                          <GraduationCap className="size-5" />
                        </div>
                        <span className="truncate text-sm font-semibold text-foreground">{r.name}</span>
                      </div>
                    </TableCell>

                    <TableCell className="whitespace-nowrap w-32 px-3 py-3.5">
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <span className="font-semibold text-foreground tabular-nums">{r.studentCount}</span>
                        {t("unitPeople")}
                      </div>
                    </TableCell>

                    <TableCell className="whitespace-nowrap w-20 px-3 py-3.5">
                      <div className="flex justify-center">
                        <AttendanceRing pct={r.attendanceAvg} />
                      </div>
                    </TableCell>

                    <TableCell className="whitespace-nowrap w-52 px-3 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <Progress
                          value={r.summativeAvg ?? 0}
                          indicatorColor={scoreColor}
                          className="w-full h-1.5 max-w-24"
                          style={{ backgroundColor: `color-mix(in srgb, ${scoreColor} 16%, transparent)` }}
                        />
                        <span className="shrink-0 text-sm font-semibold tabular-nums">
                          {r.summativeAvg !== null ? `${Math.round(r.summativeAvg)}%` : "—"}
                        </span>
                        {delta !== null && !stable && (
                          <span className={cn("flex items-center shrink-0 text-[10px]", delta > 0 ? "text-success" : "text-destructive")}>
                            {delta > 0 ? <ArrowUp className="size-2.5" /> : <ArrowDown className="size-2.5" />}
                            {Math.round(Math.abs(delta))}pp
                          </span>
                        )}
                      </div>
                    </TableCell>

                    <TableCell className="whitespace-nowrap w-24 px-3 py-3.5 text-center">
                      {r.behaviorPositivePct !== null ? (
                        <span className="text-sm font-semibold tabular-nums" style={{ color: scoreBarColor(r.behaviorPositivePct) }}>
                          {Math.round(r.behaviorPositivePct)}%
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

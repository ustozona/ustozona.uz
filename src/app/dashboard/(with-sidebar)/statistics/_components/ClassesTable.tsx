"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { ArrowDown, ArrowUp, ArrowUpDown, ChevronRight, GraduationCap, SearchX } from "lucide-react";
import { TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { classColor } from "@/lib/grades-data";
import { CLASS_COLOR_HEX, classTints } from "@/lib/class-colors";
import { STAT_DEADBAND_PP, type ClassOverviewRow } from "@/lib/class-stats";
import { cn } from "@/lib/utils";
import { StatEmpty } from "./StatEmpty";

type SortKey = "name" | "studentCount" | "attendanceAvg" | "summativeAvg" | "signalCount";

/**
 * Sinflar boʻyicha toʻliq maʼlumot jadvali — "Sinflar" tabida. Shadcn-space
 * "Top Projects" (table-01) bloki naqshiga vizual moslangan (progress-bar
 * ustun) — lekin maʼlumotlar haqiqiy (soxta byudjet/menejer emas). Butun
 * qator bosiladi (checkbox/amal menyusi yoʻq, oxirida faqat hover chevron).
 * Ikonka `classTints(color).gradientTile` — "Mening
 * sinflarim" bilan bir xil kanonik gradient-doira. Qidiruv/karta sarlavhasi
 * ota-komponentda (`ClassesTablePanel`), sarlavha qator `sticky` — faqat
 * tana scroll boʻladi. `ClassRowsCard` (Umumiy tabidagi triage vidjeti)
 * bilan ADASHTIRMANG — bu yerda barcha sinflar, saralash bilan.
 */
export function ClassesTable({
  rows,
  scrolled = false,
  onSelect,
}: {
  rows: ClassOverviewRow[];
  /** Scroll konteyner tepadan siljiganmi — sticky sarlavha soyasi shunda chiqadi. */
  scrolled?: boolean;
  onSelect: (classId: string) => void;
}) {
  const t = useTranslations("StatisticsPage");
  const [sort, setSort] = useState<{ key: SortKey; dir: "asc" | "desc" }>({ key: "signalCount", dir: "desc" });

  const sorted = useMemo(() => {
    const dirMul = sort.dir === "asc" ? 1 : -1;
    return [...rows].sort((a, b) => {
      if (sort.key === "name") return a.name.localeCompare(b.name) * dirMul;
      const av = a[sort.key] ?? -Infinity;
      const bv = b[sort.key] ?? -Infinity;
      return (av - bv) * dirMul;
    });
  }, [rows, sort]);

  const toggleSort = (key: SortKey) => {
    setSort((prev) =>
      prev.key === key ? { key, dir: prev.dir === "asc" ? "desc" : "asc" } : { key, dir: key === "name" ? "asc" : "desc" }
    );
  };

  // border-collapse rejimida <th>ga toʻgʻridan-toʻgʻri box-shadow render
  // boʻlmaydi — shuning uchun "soya" pseudo-element (::after) orqali chiziladi:
  // sarlavhaning tagidan boshlanadigan, pastga soʻnib boruvchi qoramtir
  // gradient polosa (GitHub/Linear sticky-header naqshi). box-shadow emas,
  // background — shunda soya sarlavhaga zich yopishadi, oraliq boʻshliq yoʻq.
  // Faqat scroll boshlanganda koʻrinadi — tepada turganda chiziq boʻlmaydi.
  const stickyHeadCell = cn(
    "sticky top-0 z-20 bg-card after:pointer-events-none after:absolute after:inset-x-0 after:top-full after:h-1.5 after:bg-linear-to-b after:from-black/6 after:to-transparent after:transition-opacity",
    scrolled ? "after:opacity-100" : "after:opacity-0"
  );

  const SortHeader = ({ label, sortKey, className }: { label: string; sortKey: SortKey; className?: string }) => (
    <TableHead className={cn(stickyHeadCell, "px-3 py-3", className)}>
      <button
        type="button"
        onClick={() => toggleSort(sortKey)}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
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
        <StatEmpty icon={SearchX} title={t("noClassesFound")} className="h-full" />
      ) : (
        <table className="w-full min-w-3xl caption-bottom text-sm">
            <TableHeader>
              <TableRow className="hover:bg-transparent! border-b-0!">
                <SortHeader label={t("columnClass")} sortKey="name" className="min-w-48 pl-4" />
                <SortHeader label={t("columnStudents")} sortKey="studentCount" />
                <SortHeader label={t("columnAttendance")} sortKey="attendanceAvg" />
                <SortHeader label={t("columnGrade")} sortKey="summativeAvg" className="min-w-40" />
                <SortHeader label={t("columnSignal")} sortKey="signalCount" />
                <TableHead className={cn(stickyHeadCell, "w-10 px-4 py-3")} />
              </TableRow>
            </TableHeader>
            {/* Qatorlar orasidagi yagona chiziq manbai: divide-y. TableRow'ning
                oʻz border-b'i (birinchi qator ustida ham chiqib ketmasligi
                uchun) shu yerda oʻchiriladi. */}
            <TableBody className="divide-y divide-border/60 [&_tr]:border-0">
              {sorted.map((r) => {
                const color = classColor({ id: r.classId, name: r.name, color: r.color });
                const hex = CLASS_COLOR_HEX[color];
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

                    <TableCell className="whitespace-nowrap px-3 py-3.5 text-sm tabular-nums text-muted-foreground">
                      {t("studentsCount", { count: r.studentCount })}
                    </TableCell>

                    <TableCell className="whitespace-nowrap px-3 py-3.5 text-sm tabular-nums text-foreground">
                      {r.attendanceAvg !== null ? `${Math.round(r.attendanceAvg)}%` : "—"}
                    </TableCell>

                    <TableCell className="whitespace-nowrap px-3 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <Progress
                          value={r.summativeAvg ?? 0}
                          indicatorColor={hex}
                          className="w-full h-1.5 max-w-28"
                          style={{ backgroundColor: `color-mix(in srgb, ${hex} 16%, transparent)` }}
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

                    <TableCell className="whitespace-nowrap px-3 py-3.5">
                      {r.signalCount > 0 ? (
                        <span className="inline-flex rounded-full bg-warning/15 px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-warning">
                          {r.signalCount}
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

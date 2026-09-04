"use client";

/* ════════════════════════════════════════════════════════════════════
   PROFIL — STANDARTLAR OʻZLASHTIRISHI

   «Ikki yon koʻzgu» (docs/standards-page-spec.md §13.3):

     RADAR  → gestalt profil, oʻqlar = MAZMUN SOHALARI.
              «Qayerga qarash kerak». Oʻlchov asbobi emas.
     BARLAR → har standart: daraja, dalil soni, oxirgi sana.
              «Nima qilish kerak». Qaror shu yerdan chiqadi.

   Radar faqat 3–8 soha boʻlganda chiziladi: 3 oʻqli radar maʼnosiz
   shakl, 8 dan koʻpi oʻqilmaydi (§14.4). Sohalar boʻlmasa yoki
   yetarli boʻlmasa — barlar yolgʻiz qoladi va hech narsa buzilmaydi.
   ════════════════════════════════════════════════════════════════════ */

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { Target } from "lucide-react";
import { CardTitle } from "@/components/ui/card";
import { SectionIcon } from "@/components/ui/section-icon";
import {
  Tooltip, TooltipContent, TooltipTrigger,
} from "@/components/ui/tooltip";
import { useGradesStore } from "@/store/useGradesStore";
import { classStandardIndex } from "@/lib/class-standards";
import { useStandardsStore } from "@/store/useStandardsStore";
import { RADAR_MIN_DOMAINS, RADAR_MAX_DOMAINS } from "@/lib/standards-data";
import {
  masteryFor, domainMasteryFromLevels, MIN_EVIDENCE, type StandardMastery,
} from "@/lib/student-standard-mastery";
import type { ClassData } from "@/lib/grades-data";
import { ProfileRadar } from "./charts";
import { cn } from "@/lib/utils";

type Row = StandardMastery & { desc: string; domainName?: string };

export default function StandardsPanel({
  classId,
  studentId,
  hex,
}: {
  classId: string;
  studentId: string;
  hex: string;
}) {
  const t = useTranslations("StudentStandards");
  const sets = useStandardsStore((s) => s.sets);
  const classDataMap = useGradesStore((s) => s.classDataMap);

  const { rows, axes } = useMemo(() => {
    const cd = classDataMap[classId] as ClassData | undefined;
    if (!cd) return { rows: [] as Row[], axes: [] };

    /* Standartlar va sohalar — pikeri bilan BIR XIL manbadan, shuning
       uchun tartib va guruhlash ikkala ekranda mos tushadi. */
    const { standards, domains } = classStandardIndex(sets, [classId]);
    const domainName = new Map(domains.map((d) => [d.id, d.name]));

    const rows: Row[] = [];
    /* Radar oʻqlari SHU darajalardan yigʻiladi — `domainMastery` ni bu
       yerda chaqirish har standartni ikkinchi marta hisoblardi. */
    const levelById = new Map<string, number | null>();
    for (const { std, domainId } of standards) {
      const m = masteryFor(std.id, studentId, cd.assignments, cd.grades);
      levelById.set(std.id, m.level);
      // Dalili umuman yoʻq standart roʻyxatni koʻmib tashlaydi — chiqarmaymiz.
      if (m.evidenceCount === 0) continue;
      rows.push({
        ...m,
        desc: std.desc,
        domainName: domainId ? domainName.get(domainId) : undefined,
      });
    }

    const axes = domains
      .map((d) => ({
        label: d.name,
        m: domainMasteryFromLevels(d.standardIds, levelById, d.id),
      }))
      .filter((a) => a.m.level !== null)
      .map((a) => ({ label: a.label, value: Math.round(a.m.level! * 100) }));

    return { rows, axes };
  }, [sets, classDataMap, classId, studentId]);

  if (rows.length === 0) return null;

  const showRadar = axes.length >= RADAR_MIN_DOMAINS && axes.length <= RADAR_MAX_DOMAINS;

  return (
    <div className="flex flex-col rounded-xl border border-border/50 bg-card p-5 shadow-sm">
      <div className="mb-3 flex items-center gap-2.5">
        <SectionIcon><Target /></SectionIcon>
        <CardTitle>{t("title")}</CardTitle>
      </div>

      <div className={cn("grid gap-6", showRadar && "lg:grid-cols-[minmax(0,260px)_1fr]")}>
        {showRadar && (
          <div className="flex flex-col">
            <ProfileRadar axes={axes} hex={hex} />
            <p className="mt-1 text-center text-xs text-muted-foreground">
              {t("radarHint")}
            </p>
          </div>
        )}

        <div className="flex flex-col gap-2.5">
          {rows.map((r) => (
            <StandardRow key={r.standardId} row={r} hex={hex} />
          ))}
        </div>
      </div>
    </div>
  );
}

function StandardRow({ row, hex }: { row: Row; hex: string }) {
  const t = useTranslations("StudentStandards");
  const pct = row.level === null ? null : Math.round(row.level * 100);

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-baseline gap-2">
        <span className="font-mono text-xs text-muted-foreground">{row.standardId}</span>
        {row.domainName && (
          <span className="truncate text-xs text-muted-foreground/70">{row.domainName}</span>
        )}
        <span className="ml-auto shrink-0 font-mono text-sm font-semibold">
          {pct === null ? (
            /* Dalil yetarli emas — RAQAM KOʻRSATILMAYDI. Bitta-ikkita
               urinish tasodifiy xatolikka moyil; koʻrsatilmagan raqam
               notoʻgʻri raqamdan yaxshi (§11.5). */
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="cursor-help text-muted-foreground">{t("notAssessed")}</span>
              </TooltipTrigger>
              <TooltipContent>
                {t("needMore", { have: row.evidenceCount, need: MIN_EVIDENCE })}
              </TooltipContent>
            </Tooltip>
          ) : (
            `${pct}%`
          )}
        </span>
      </div>

      <Tooltip>
        <TooltipTrigger asChild>
          <div className="h-1.5 w-full cursor-help overflow-hidden rounded-full bg-muted">
            {pct !== null && (
              <div
                className="h-full rounded-full transition-[width] duration-500"
                style={{ width: `${pct}%`, backgroundColor: hex }}
              />
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">
          <p className="mb-1">{row.desc}</p>
          <p className="text-xs opacity-80">
            {t("evidence", { count: row.evidenceCount })}
            {row.lastAssessed ? ` · ${row.lastAssessed}` : ""}
          </p>
        </TooltipContent>
      </Tooltip>
    </div>
  );
}

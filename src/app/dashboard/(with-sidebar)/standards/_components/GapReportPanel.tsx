"use client";

/* ════════════════════════════════════════════════════════════════════
   BOʻSHLIQ HISOBOTI PANELI

   Oʻqituvchiga dars rejasi va baholash oʻrtasidagi nomutanosiblikni
   bitta ekranda koʻrsatadi (docs/standards-page-spec.md §11.3).

   ⚠️ «Topshiriq biriktirish» — YORDAMCHI yoʻl. Standart teglashning
   asosiy kirish nuqtasi topshiriq muharririning oʻzi (§13.5); bu tugma
   faqat boʻshliq roʻyxatidan chiqadigan qisqa yoʻl va topshiriq
   muharririni ochadi.

   Panel faqat KOʻRSATADIGAN narsa boʻlganda chiziladi: standart yoʻq
   yoki hammasi joyida boʻlsa — boʻsh joy egallamaydi.
   ════════════════════════════════════════════════════════════════════ */

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { AlertTriangle, Plus, ScanSearch } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CardTitle } from "@/components/ui/card";
import { SectionIcon } from "@/components/ui/section-icon";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useStandardsStore } from "@/store/useStandardsStore";
import { useLessonStore } from "@/store/useLessonStore";
import { useGradesStore } from "@/store/useGradesStore";
import { useAssignmentEditorStore, makeDraftPayload } from "@/store/useAssignmentEditorStore";
import { gapReport, type GapRow, type GapStatus } from "@/lib/standards-gap";
import { classStandardIndex } from "@/lib/class-standards";
import { toast } from "sonner";
import type { ClassData } from "@/lib/grades-data";
import { cn } from "@/lib/utils";

/** Faqat xavfli ikki holat koʻrsatiladi — «joyida» va «navbat emas» shovqin. */
const SHOWN: GapStatus[] = ["untested", "untaught"];

export default function GapReportPanel({ classId }: { classId: string }) {
  const t = useTranslations("StandardsGap");
  const sets = useStandardsStore((s) => s.sets);
  const lessons = useLessonStore((s) => s.lessons);
  const classDataMap = useGradesStore((s) => s.classDataMap);
  const openDraft = useAssignmentEditorStore((s) => s.openDraft);
  const [expanded, setExpanded] = useState<GapStatus | null>(null);

  const report = useMemo(() => {
    const cd = classDataMap[classId] as ClassData | undefined;
    /* Standartlar — pikeri va profil paneli bilan BIR XIL manbadan:
       takror kodda qaysi nusxa qolishi ham shu yerda hal qilinadi. */
    const { standards } = classStandardIndex(sets, [classId]);
    return gapReport(
      standards.map((s) => s.std),
      lessons,
      cd?.assignments ?? [],
      classId,
    );
  }, [sets, lessons, classDataMap, classId]);

  const problems = report.rows.filter((r) => SHOWN.includes(r.status));
  if (report.rows.length === 0 || problems.length === 0) return null;

  /** Standartni oʻlchaydigan topshiriq yaratish — qoralama ochiladi. */
  function attachAssignment(row: GapRow) {
    const cd = classDataMap[classId] as ClassData | undefined;
    const firstTopic = cd?.topics[0]?.id ?? null;
    const payload = makeDraftPayload(classId, firstTopic);
    payload.assignment.title = row.std.id;
    payload.assignment.standardIds = [row.std.id];
    /* ⚠️ `openDraft` tugallanmagan qoralamani TIKLAYDI — bizning payload
       tashlab yuboriladi. Jimgina yoʻqotmasdan aytib qoʻyamiz. */
    if (openDraft(classId, payload) === "restored") {
      toast.info(t("draftRestored"));
    }
  }

  return (
    <div className="flex flex-col rounded-xl border border-border bg-card p-5">
      <div className="mb-1 flex items-center gap-2.5">
        <SectionIcon><ScanSearch /></SectionIcon>
        <CardTitle>{t("title")}</CardTitle>
        <Badge variant="secondary" className="ml-auto shadow-none">
          {t("problemCount", { count: problems.length })}
        </Badge>
      </div>
      <p className="mb-4 text-xs text-muted-foreground">{t("subtitle")}</p>

      <div className="flex flex-col gap-2">
        {SHOWN.map((status) => {
          const list = report.rows.filter((r) => r.status === status);
          if (list.length === 0) return null;
          const open = expanded === status;
          return (
            <div key={status} className="rounded-lg border border-border/60">
              <button
                type="button"
                onClick={() => setExpanded(open ? null : status)}
                className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left"
              >
                <AlertTriangle
                  className={cn(
                    "size-4 shrink-0",
                    status === "untested" ? "text-amber-500" : "text-orange-600",
                  )}
                />
                <span className="text-sm font-medium">{t(`status.${status}`)}</span>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="cursor-help text-xs text-muted-foreground">?</span>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">{t(`hint.${status}`)}</TooltipContent>
                </Tooltip>
                <span className="ml-auto font-mono text-sm font-semibold tabular-nums">
                  {list.length}
                </span>
              </button>

              {open && (
                <div className="flex flex-col gap-1 border-t border-border/60 px-3 py-2">
                  {list.map((row) => (
                    <div key={row.std.id} className="flex items-center gap-2 py-1">
                      <span className="font-mono text-xs text-muted-foreground">{row.std.id}</span>
                      <span className="min-w-0 flex-1 truncate text-sm">{row.std.desc}</span>
                      {status === "untested" && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 shrink-0 gap-1 px-2 shadow-none"
                          onClick={() => attachAssignment(row)}
                        >
                          <Plus className="size-3.5" />
                          {t("attach")}
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

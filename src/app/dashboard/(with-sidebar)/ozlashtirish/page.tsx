"use client";

import { useMemo, useState } from "react";
import { Grid3x3, CheckCircle2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SectionIcon } from "@/components/ui/section-icon";
import { CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { TypographyMuted } from "@/components/ui/typography";
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
} from "@/components/ui/empty";
import ClassListPanel from "@/components/ClassListPanel";
import { useClassStore } from "@/store/useClassStore";
import { withSidebarPageClass, panelHeaderClass } from "@/components/DashboardPage";
import { cn } from "@/lib/utils";
import {
  seedClass,
  mastery,
  decay,
  lastAssessedDate,
  type MasteryState,
  type DecayLevel,
} from "@/lib/diagnostics";

const SEED_CLASS_ID = "9-b";

/** Katak rangi — mastery holati + decay (yemirilish) birlashtirilgan. */
function cellClass(state: MasteryState, level: DecayLevel): string {
  if (state === "untested") return "bg-muted/40 text-muted-foreground/60";
  if (state === "not-mastered") return "bg-destructive/10 text-destructive";
  // mastered — decay'ga qarab rangi soʻnadi
  if (level === "fresh") return "bg-success/20 text-success";
  if (level === "fading") return "bg-success/10 text-success/80";
  return "bg-warning/10 text-warning-foreground"; // stale — takrorlash kerak
}

export default function OzlashtirishPage() {
  const storeClassId = useClassStore((s) => s.selectedClassId);
  const setSelectedClassId = useClassStore((s) => s.setSelectedClassId);
  const [classId, setClassId] = useState<string>(SEED_CLASS_ID);
  const handleSelect = (id: string) => { setClassId(id); setSelectedClassId(id); };

  const data = seedClass();
  const isSeed = classId === SEED_CLASS_ID;

  const decayByStd = useMemo(() => {
    const m = new Map<string, ReturnType<typeof decay>>();
    for (const std of data.standards) m.set(std.id, decay(lastAssessedDate(std.id)));
    return m;
  }, [data]);

  const grid = useMemo(() => {
    if (!isSeed) return [];
    return data.students.map((stu) => ({
      student: stu,
      cells: data.standards.map((std) => ({
        std,
        m: mastery(data.responses, data.questions, stu.id, std.id),
        d: decayByStd.get(std.id)!,
      })),
    }));
  }, [isSeed, data, decayByStd]);

  // Oʻzlashtirgan standartlar soni (halol oʻsish koʻrsatkichi poydevori)
  const masteredCount = useMemo(
    () => grid.reduce((sum, row) => sum + row.cells.filter((c) => c.m.state === "mastered").length, 0),
    [grid]
  );
  const totalCells = grid.length * data.standards.length;

  return (
    <>
      <div className="hidden lg:block w-[280px] shrink-0 h-full py-4 pl-4">
        <ClassListPanel page="standards" selectedClassId={storeClassId} onSelect={handleSelect} />
      </div>

      <div className={withSidebarPageClass}>
        <div className="bg-card rounded-xl card-elevation flex flex-col overflow-hidden min-w-0 min-h-0 h-full">
          {/* Header */}
          <div className={cn(panelHeaderClass, "items-center justify-between gap-3 min-h-[4.5rem]")}>
            <div className="flex items-center gap-3 min-w-0">
              <SectionIcon>
                <Grid3x3 className="size-[18px]" aria-hidden />
              </SectionIcon>
              <div className="min-w-0">
                <CardTitle>Oʻzlashtirish</CardTitle>
                <TypographyMuted className="text-caption">
                  {isSeed ? "9-B · Informatika — standart boʻyicha oʻzlashtirish (harf bahosi emas)" : "Tanlangan sinf uchun maʼlumot yoʻq"}
                </TypographyMuted>
              </div>
            </div>
            {isSeed && (
              <Badge variant="outline" className="shadow-none gap-1.5 shrink-0 tabular-nums">
                <CheckCircle2 className="size-3.5 text-success" />
                {masteredCount}/{totalCells} oʻzlashtirildi
              </Badge>
            )}
          </div>

          {/* Content */}
          {!isSeed ? (
            <Empty className="flex-1">
              <EmptyHeader>
                <EmptyMedia variant="icon"><Grid3x3 /></EmptyMedia>
                <EmptyTitle>Maʼlumot yoʻq</EmptyTitle>
                <EmptyDescription>Demo bosqichida oʻzlashtirish jadvali faqat 9-B sinf uchun mavjud.</EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <div className="flex-1 min-h-0 flex flex-col">
              <ScrollArea className="flex-1 min-h-0">
                <table className="w-full border-separate border-spacing-0 text-sm">
                  <thead className="sticky top-0 z-10">
                    <tr>
                      <th className="sticky left-0 z-20 bg-card text-left font-medium text-muted-foreground px-5 py-3 border-b border-border min-w-[200px]">
                        Oʻquvchi
                      </th>
                      {data.standards.map((std) => (
                        <th key={std.id} className="bg-card px-3 py-3 border-b border-border text-center font-mono text-xs font-bold text-foreground whitespace-nowrap">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="cursor-default">{std.code}</span>
                            </TooltipTrigger>
                            <TooltipContent className="max-w-xs">{std.desc}</TooltipContent>
                          </Tooltip>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {grid.map(({ student, cells }) => (
                      <tr key={student.id} className="group">
                        <td className="sticky left-0 z-10 bg-card group-hover:bg-muted/40 px-5 py-2 border-b border-border text-foreground whitespace-nowrap transition-colors">
                          {student.name}
                        </td>
                        {cells.map(({ std, m, d }) => (
                          <td key={std.id} className="px-2 py-2 border-b border-border text-center">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className={cn(
                                  "inline-flex items-center justify-center min-w-[3rem] rounded-md px-2 py-1 text-xs font-semibold tabular-nums cursor-default",
                                  cellClass(m.state, d.level)
                                )}>
                                  {m.state === "untested" ? "—" : `${Math.round(m.ratio * 100)}%`}
                                </span>
                              </TooltipTrigger>
                              <TooltipContent>
                                {m.state === "untested"
                                  ? "Yetarli diagnostika yoʻq (10 savoldan kam)"
                                  : m.state === "mastered"
                                    ? `Oʻzlashtirdi · ${d.due ? `${d.days} kun oldin — takrorlash kerak` : "yangi"}`
                                    : "Oʻzlashtirmadi (75% dan past)"}
                              </TooltipContent>
                            </Tooltip>
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </ScrollArea>

              {/* Legend */}
              <div className="shrink-0 border-t border-border px-5 py-3 flex flex-wrap items-center gap-x-5 gap-y-2">
                <LegendItem className="bg-success/20 text-success" label="Oʻzlashtirdi (yangi)" />
                <LegendItem className="bg-success/10 text-success/80" label="Oʻzlashtirdi (soʻnmoqda)" />
                <LegendItem className="bg-warning/10 text-warning-foreground" label="Takrorlash kerak" />
                <LegendItem className="bg-destructive/10 text-destructive" label="Oʻzlashtirmadi" />
                <LegendItem className="bg-muted/40 text-muted-foreground/60" label="Tekshirilmagan" />
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function LegendItem({ className, label }: { className: string; label: string }) {
  return (
    <span className="flex items-center gap-2">
      <span className={cn("size-4 rounded", className)} />
      <span className="text-caption text-muted-foreground">{label}</span>
    </span>
  );
}

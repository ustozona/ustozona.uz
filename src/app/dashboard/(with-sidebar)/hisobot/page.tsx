"use client";

import { useMemo, useState } from "react";
import { FileText, Printer, Check, CheckCircle2, AlertTriangle } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SectionIcon } from "@/components/ui/section-icon";
import { CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TypographyMuted } from "@/components/ui/typography";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import ClassListPanel from "@/components/ClassListPanel";
import { useClassIdParam } from "@/hooks/useClassIdParam";
import { withSidebarPageClass, panelHeaderClass } from "@/components/DashboardPage";
import { cn } from "@/lib/utils";
import { seedClass, mastery } from "@/lib/diagnostics";

const SEED_CLASS_ID = "9-b";
const TODAY = new Date().toISOString().slice(0, 10);

export default function HisobotPage() {
  const [storeClassId, setSelectedClassId] = useClassIdParam({ fallbackToStore: true });
  const data = seedClass();

  const [studentId, setStudentId] = useState<string>(data.students[0]?.id ?? "");
  const [approved, setApproved] = useState(false);

  const report = useMemo(() => {
    const stu = data.students.find((s) => s.id === studentId);
    if (!stu) return null;

    const perStandard = data.standards.map((std) => {
      const m = mastery(data.responses, data.questions, stu.id, std.id);
      // Oʻquvchining shu standartdagi misconception'lari (distraktor tahlili)
      const qIds = new Set(data.questions.filter((q) => q.standardId === std.id).map((q) => q.id));
      const miscCounts = new Map<string, number>();
      for (const r of data.responses) {
        if (r.studentId !== stu.id || !r.optionId || !qIds.has(r.questionId)) continue;
        const q = data.questions.find((x) => x.id === r.questionId);
        const opt = q?.options.find((o) => o.id === r.optionId);
        if (opt && !opt.isCorrect && opt.misconceptionId) {
          miscCounts.set(opt.misconceptionId, (miscCounts.get(opt.misconceptionId) ?? 0) + 1);
        }
      }
      const topMisc = [...miscCounts.entries()].sort((a, b) => b[1] - a[1])[0];
      const misc = topMisc ? data.misconceptions.find((mm) => mm.id === topMisc[0]) : undefined;
      return { std, m, misc };
    });

    const mastered = perStandard.filter((p) => p.m.state === "mastered");
    const needsWork = perStandard.filter((p) => p.m.state === "not-mastered");
    return { stu, perStandard, mastered, needsWork };
  }, [studentId, data]);

  return (
    <>
      <div className="hidden lg:block w-[280px] shrink-0 h-full py-4 pl-4 print:hidden">
        <ClassListPanel page="standards" selectedClassId={storeClassId ?? ""} onSelect={setSelectedClassId} />
      </div>

      <div className={withSidebarPageClass}>
        <div className="bg-card rounded-xl border border-border flex flex-col overflow-hidden min-w-0 min-h-0 h-full">
          {/* Header */}
          <div className={cn(panelHeaderClass, "items-center justify-between gap-3 min-h-16 print:hidden")}>
            <div className="flex items-center gap-3 min-w-0">
              <SectionIcon>
                <FileText className="size-[18px]" aria-hidden />
              </SectionIcon>
              <div className="min-w-0">
                <CardTitle>Hisobot</CardTitle>
                <TypographyMuted className="text-caption">
                  Ustozona AI dalilga asoslangan hisobot tuzadi — oʻqituvchi tasdiqlaydi va chop etadi
                </TypographyMuted>
              </div>
            </div>
          </div>

          {/* Toolbar */}
          <div className="shrink-0 border-b border-border px-6 py-4 flex items-center gap-3 flex-wrap print:hidden">
            <Select value={studentId} onValueChange={(v) => { setStudentId(v); setApproved(false); }}>
              <SelectTrigger className="w-[280px] max-w-full"><SelectValue placeholder="Oʻquvchi tanlang" /></SelectTrigger>
              <SelectContent>
                {data.students.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button variant={approved ? "default" : "outline"} className="shadow-none gap-2" onClick={() => setApproved((a) => !a)}>
              <Check className="size-4" /> {approved ? "Tasdiqlandi" : "Tasdiqlash"}
            </Button>
            <Button className="gap-2" disabled={!approved} onClick={() => window.print()}>
              <Printer className="size-4" /> Chop etish (PDF)
            </Button>
          </div>

          {/* Report */}
          <ScrollArea className="flex-1 min-h-0">
            {report && (
              <div className="px-6 py-6 print:px-0">
                <div className="mx-auto max-w-2xl bg-card rounded-xl border border-border p-8 space-y-6 print:border-0 print:shadow-none">
                  {/* Report header */}
                  <div className="flex items-start justify-between gap-4 border-b border-border pb-4">
                    <div>
                      <h1 className="heading-section text-foreground">{report.stu.name}</h1>
                      <TypographyMuted className="text-caption">9-B · Informatika · {TODAY}</TypographyMuted>
                    </div>
                    <Badge variant="outline" className="shadow-none gap-1.5 tabular-nums">
                      {report.mastered.length}/{report.perStandard.length} standart oʻzlashtirildi
                    </Badge>
                  </div>

                  {/* Oʻzlashtirilgan */}
                  <section className="space-y-2">
                    <h2 className="text-label text-success flex items-center gap-1.5"><CheckCircle2 className="size-4" /> Oʻzlashtirilgan</h2>
                    {report.mastered.length === 0 ? (
                      <TypographyMuted className="text-body">Hozircha toʻliq oʻzlashtirilgan standart yoʻq.</TypographyMuted>
                    ) : (
                      <ul className="space-y-1">
                        {report.mastered.map((p) => (
                          <li key={p.std.id} className="text-body text-foreground/90 flex gap-2">
                            <span className="font-mono text-xs font-bold shrink-0 mt-0.5">{p.std.code}</span>
                            <span>{p.std.desc} <span className="text-muted-foreground tabular-nums">({Math.round(p.m.ratio * 100)}%)</span></span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </section>

                  {/* Mustahkamlash kerak — aniq tashxis (mavhum soʻzsiz) */}
                  <section className="space-y-2">
                    <h2 className="text-label text-warning-foreground flex items-center gap-1.5"><AlertTriangle className="size-4" /> Mustahkamlash kerak</h2>
                    {report.needsWork.length === 0 ? (
                      <TypographyMuted className="text-body">Barcha tekshirilgan standartlar oʻzlashtirildi.</TypographyMuted>
                    ) : (
                      <ul className="space-y-3">
                        {report.needsWork.map((p) => (
                          <li key={p.std.id} className="text-body">
                            <div className="flex gap-2">
                              <span className="font-mono text-xs font-bold shrink-0 mt-0.5">{p.std.code}</span>
                              <span className="text-foreground/90">{p.std.desc} <span className="text-muted-foreground tabular-nums">({Math.round(p.m.ratio * 100)}%)</span></span>
                            </div>
                            {p.misc && (
                              <p className="text-caption text-destructive mt-1 pl-8">
                                Aniqlangan xato: {p.misc.label}
                              </p>
                            )}
                          </li>
                        ))}
                      </ul>
                    )}
                  </section>

                  <p className="text-caption text-muted-foreground border-t border-border pt-4">
                    Ushbu hisobot diagnostik test natijalaridan avtomatik tuzildi va oʻqituvchi tomonidan tasdiqlandi.
                  </p>
                </div>
              </div>
            )}
          </ScrollArea>
        </div>
      </div>
    </>
  );
}

"use client";

import * as React from "react";
import { Users } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Avatar,
  AvatarFallback,
  AvatarGroup,
  AvatarGroupCount,
} from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeaderBar,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  filterEventsByPeriod,
  type BehaviorPeriod,
} from "@/lib/behavior-data";
import { useBehaviorStore } from "@/store/useBehaviorStore";
import { useCalendarStore } from "@/store/useCalendarStore";
import { ReportPanel } from "./ReportPanel";

/* ════════════════════════════════════════════════════════════════════
   Sinf-darajali hisobot (ClassDojo "Reports" UX): chapda "Butun sinf" +
   oʻquvchilar roʻyxati (tanlangan davrdagi ijobiy foizi bilan), oʻngda
   tanlanganga donut + davr filtri + timeline — oʻquvchi modalidagi
   hisobot paneli (ReportPanel) qayta ishlatiladi.

   Butun sinf koʻrinishida timeline yozuvlarida oʻquvchi ismi ham chiqadi.
   Export/Print v1da YOʻQ.
   ════════════════════════════════════════════════════════════════════ */

const EMPTY_EVENTS: never[] = [];

/** Chap roʻyxat tanlovi: null = butun sinf. */
type Selection = string | null;

export function ClassReportDialog({
  open,
  onOpenChange,
  classId,
  students,
  colorHex,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  classId: string;
  students: { id: string; name: string; initials: string }[];
  colorHex: string;
}) {
  const events = useBehaviorStore((s) => s.eventsByClass[classId]) ?? EMPTY_EVENTS;
  const allDeletions = useBehaviorStore((s) => s.deletions);
  const deleteEventWithLog = useBehaviorStore((s) => s.deleteEventWithLog);
  const setEventNote = useBehaviorStore((s) => s.setEventNote);

  const [selection, setSelection] = React.useState<Selection>(null);
  const [period, setPeriod] = React.useState<BehaviorPeriod>("thisWeek");
  // "Bu oʻquv yili" davri uchun faol yil oynasi (calendar mirror).
  const yearRange = useCalendarStore((s) => s.calendar.range);

  // Har ochilishda "Butun sinf"dan boshlanadi.
  React.useEffect(() => {
    if (open) setSelection(null);
  }, [open]);

  const nameById = React.useMemo(
    () => new Map(students.map((s) => [s.id, s.name])),
    [students]
  );

  /* Chap roʻyxatdagi ijobiy foizlar — tanlangan davr boʻyicha
     (oʻng paneldagi donut bilan bir xil kesim). */
  const pctById = React.useMemo(() => {
    const filtered = filterEventsByPeriod(events, period, undefined, yearRange);
    const totals = new Map<string, { positive: number; count: number }>();
    for (const e of filtered) {
      const t = totals.get(e.studentId) ?? { positive: 0, count: 0 };
      t.count += 1;
      if (e.points > 0) t.positive += 1;
      totals.set(e.studentId, t);
    }
    const pct = new Map<string, number>();
    for (const [id, t] of totals) pct.set(id, Math.round((t.positive / t.count) * 100));
    return pct;
  }, [events, period, yearRange]);

  const selectedDeletions = React.useMemo(
    () =>
      allDeletions.filter(
        (d) => d.classId === classId && (selection === null || d.studentId === selection)
      ),
    [allDeletions, classId, selection]
  );

  const selectedEvents = React.useMemo(
    () => (selection === null ? events : events.filter((e) => e.studentId === selection)),
    [events, selection]
  );

  const rowClass = (active: boolean) =>
    cn(
      "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors",
      active
        ? "bg-muted text-foreground"
        : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
    );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-0 p-0 sm:max-w-4xl" showCloseButton={false}>
        <DialogHeaderBar
          icon={<Users className="size-4" aria-hidden />}
          title="Sinf hisoboti"
          description="Berilgan ballar kesimi — butun sinf yoki bitta oʻquvchi boʻyicha."
        />

        <div className="flex min-h-0">
          {/* Chap: Butun sinf + oʻquvchilar (davrdagi ijobiy % bilan) */}
          <ScrollArea className="h-[480px] w-64 shrink-0 border-r border-border">
            {/* Radix viewport display:table — nav'ga aniq en bermasak kontent panel enidan oshib kesiladi. */}
            <nav className="flex w-64 flex-col gap-0.5 p-3">
              <button
                type="button"
                onClick={() => setSelection(null)}
                className={rowClass(selection === null)}
              >
                <AvatarGroup className="shrink-0">
                  {students.slice(0, 3).map((st) => (
                    <Avatar key={st.id} className="size-7">
                      <AvatarFallback
                        className="text-[10px] font-semibold text-white"
                        style={{ backgroundColor: colorHex }}
                      >
                        {st.initials}
                      </AvatarFallback>
                    </Avatar>
                  ))}
                  {students.length > 3 && (
                    <AvatarGroupCount className="size-7 text-[10px] font-semibold tabular-nums">
                      +{students.length - 3}
                    </AvatarGroupCount>
                  )}
                </AvatarGroup>
                <span className="truncate">Butun sinf</span>
              </button>

              {students.map((st) => {
                const pct = pctById.get(st.id);
                return (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => setSelection(st.id)}
                    className={rowClass(selection === st.id)}
                  >
                    <Avatar className="size-7 shrink-0">
                      <AvatarFallback
                        className="text-[10px] font-semibold text-white"
                        style={{ backgroundColor: colorHex }}
                      >
                        {st.initials}
                      </AvatarFallback>
                    </Avatar>
                    <span className="min-w-0 flex-1 truncate">{st.name}</span>
                    {pct !== undefined && (
                      <span
                        className={cn(
                          "shrink-0 text-xs font-semibold tabular-nums",
                          pct >= 50 ? "text-success" : "text-destructive"
                        )}
                      >
                        {pct}%
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </ScrollArea>

          {/* Oʻng: davr + donut + timeline (umumiy ReportPanel) */}
          <ScrollArea className="h-[480px] min-w-0 flex-1">
            <div className="p-5">
              <ReportPanel
                events={selectedEvents}
                period={period}
                onPeriodChange={setPeriod}
                nameById={selection === null ? nameById : undefined}
                deletions={selectedDeletions}
                onDelete={(e, reason) => deleteEventWithLog(classId, e, reason)}
                onSaveNote={(e, note) => setEventNote(classId, e.id, note)}
              />
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}

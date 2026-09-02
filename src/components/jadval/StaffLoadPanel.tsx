"use client";

import { useMemo } from "react";
import { Gauge } from "lucide-react";
import { Panel, PanelBody, PanelHeader } from "@/components/ui/panel";
import { SectionIcon } from "@/components/ui/section-icon";
import { CardTitle } from "@/components/ui/card";
import { TypographyMuted } from "@/components/ui/typography";
import { cn } from "@/lib/utils";
import { staffLoads, type SchoolTimetableDoc } from "@/lib/school-timetable";

/* ════════════════════════════════════════════════════════════════════
   XODIM YUKLAMASI — «resurs gistogrammasi».

   Zavuchning ikkinchi hisoboti: «Jami soat» sinf boʻyicha nima
   yetishmayotganini aytadi, bu esa OʻQITUVCHI boʻyicha aytadi. Ikkalasi
   birga tarifikatsiya hujjatining asosi.

   Jahon planlashtirish mahsulotlarida bu standart panel; mahalliy
   yechimlarda uchramaydi — shuning uchun bu bizning farqimiz.
   ════════════════════════════════════════════════════════════════════ */

export default function StaffLoadPanel({
  doc,
  litStaffId,
  onPick,
}: {
  doc: SchoolTimetableDoc;
  litStaffId: string | null;
  onPick: (staffId: string | null) => void;
}) {
  const loads = useMemo(() => staffLoads(doc), [doc]);
  const norm = loads[0]?.norm ?? 18;
  /* Shkala eng katta yuklama va normadan kattarogʻiga bogʻlanadi —
     shunda norma chizigʻi doim koʻrinadi. */
  const max = loads.length ? Math.max(...loads.map((l) => l.hours), norm) : 1;
  const over = loads.filter((l) => l.hours > l.norm).length;

  return (
    <Panel className="w-60 shrink-0">
      <PanelHeader>
        <div className="flex min-w-0 items-center gap-2.5 justify-self-start">
          <SectionIcon className="shrink-0">
            <Gauge />
          </SectionIcon>
          <div className="flex min-w-0 items-baseline gap-1.5">
            <CardTitle className="truncate">Yuklama</CardTitle>
            {over > 0 && (
              <TypographyMuted className="shrink-0 text-sm text-destructive">
                {over} ta oshgan
              </TypographyMuted>
            )}
          </div>
        </div>
      </PanelHeader>

      <PanelBody className="px-5 pb-5 pt-5">
        <p className="text-caption mb-4">Haftalik soat. Bitta stavka — {norm} soat.</p>

        <div className="flex flex-col gap-2">
          {loads.map((l) => {
            const isOver = l.hours > l.norm;
            const lit = litStaffId === l.staffId;
            return (
              <button
                key={l.staffId}
                type="button"
                aria-pressed={lit}
                onClick={() => onPick(lit ? null : l.staffId)}
                className={cn(
                  "block w-full rounded-md px-2 py-2 text-left transition-colors duration-fast",
                  "hover:bg-muted/60",
                  lit && "bg-muted"
                )}
              >
                <span className="flex items-baseline justify-between gap-2">
                  <span className="text-caption truncate font-medium text-foreground">{l.name}</span>
                  <span
                    className={cn(
                      "text-caption shrink-0 font-semibold tabular-nums",
                      isOver && "text-destructive"
                    )}
                  >
                    {l.hours}
                  </span>
                </span>
                {/* Ustun — normaga nisbatan. Norma chizigʻi doim koʻrinadi,
                    shuning uchun «oshib ketgan» koʻz bilan oʻqiladi. */}
                <span className="relative mt-1.5 block h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <span
                    className={cn(
                      "absolute inset-y-0 left-0 rounded-full",
                      isOver ? "bg-destructive" : "bg-primary/70"
                    )}
                    style={{ width: `${Math.min(100, (l.hours / max) * 100)}%` }}
                  />
                  <span
                    aria-hidden
                    className="absolute inset-y-0 w-px bg-foreground/40"
                    style={{ left: `${(norm / max) * 100}%` }}
                  />
                </span>
              </button>
            );
          })}
        </div>
      </PanelBody>
    </Panel>
  );
}

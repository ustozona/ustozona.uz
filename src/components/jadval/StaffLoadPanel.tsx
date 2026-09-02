"use client";

import { useMemo } from "react";
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
  const max = loads.length ? Math.max(...loads.map((l) => l.hours), loads[0].norm) : 1;

  return (
    <aside className="flex w-60 shrink-0 flex-col overflow-hidden rounded-xl border border-border bg-card">
      <div className="border-b border-border px-4 py-3">
        <h2 className="text-label">Yuklama</h2>
        <p className="text-caption mt-0.5 leading-snug">
          Haftalik soat. Bitta stavka — {loads[0]?.norm ?? 18} soat.
        </p>
      </div>

      <div className="min-h-0 flex-1 overflow-auto px-4 py-3 scrollbar-hover [scrollbar-width:thin]">
        {loads.map((l) => {
          const over = l.hours > l.norm;
          const lit = litStaffId === l.staffId;
          return (
            <button
              key={l.staffId}
              type="button"
              aria-pressed={lit}
              onClick={() => onPick(lit ? null : l.staffId)}
              className={cn(
                "mb-2 block w-full rounded-md px-1.5 py-1 text-left transition-colors duration-fast",
                "hover:bg-muted/60",
                lit && "bg-muted"
              )}
            >
              <span className="flex items-baseline justify-between gap-2">
                <span className="truncate text-[11.5px] font-medium">{l.name}</span>
                <span
                  className={cn(
                    "shrink-0 font-mono text-[11px] tabular-nums",
                    over ? "text-destructive" : "text-muted-foreground"
                  )}
                >
                  {l.hours}
                </span>
              </span>
              {/* Ustun — normaga nisbatan. Norma chizigʻi doim koʻrinadi,
                  shuning uchun «oshib ketgan» koʻz bilan oʻqiladi. */}
              <span className="relative mt-1 block h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <span
                  className={cn(
                    "absolute inset-y-0 left-0 rounded-full",
                    over ? "bg-destructive" : "bg-primary/70"
                  )}
                  style={{ width: `${Math.min(100, (l.hours / max) * 100)}%` }}
                />
                <span
                  aria-hidden
                  className="absolute inset-y-0 w-px bg-foreground/40"
                  style={{ left: `${(l.norm / max) * 100}%` }}
                />
              </span>
            </button>
          );
        })}
      </div>
    </aside>
  );
}

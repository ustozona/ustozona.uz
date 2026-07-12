"use client";

import * as React from "react";
import { ChevronDown, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TypographyMuted } from "@/components/ui/typography";
import {
  BEHAVIOR_PERIODS,
  eventStats,
  filterEventsByPeriod,
  skillBreakdown,
  type BehaviorDeletionLogEntry,
  type BehaviorEvent,
  type BehaviorPeriod,
} from "@/lib/behavior-data";
import { MONTHS_UZ } from "@/lib/localization";
import { BehaviorDonut } from "./BehaviorDonut";
import { BehaviorEmoji } from "./BehaviorEmoji";
import { EventTimeline } from "./EventTimeline";

/* Ballar hisoboti paneli — davr filtri + donut + timeline. Bitta-oʻquvchi
   modali (StudentDialog) ham, sinf-darajali hisobot (ClassReportDialog)
   ham shu panelni ishlatadi: farqi faqat berilgan eventlar toʻplami va
   nameById (butun sinf lentasida oʻquvchi ismi ham chiqadi). */

export function ReportPanel({
  events,
  period,
  onPeriodChange,
  onDelete,
  onSaveNote,
  nameById,
  deletions,
}: {
  events: BehaviorEvent[];
  period: BehaviorPeriod;
  onPeriodChange: (p: BehaviorPeriod) => void;
  onDelete: (event: BehaviorEvent, reason?: string) => void;
  onSaveNote: (event: BehaviorEvent, note: string) => void;
  /** Berilsa — timeline yozuvlarida oʻquvchi ismi ham chiqadi. */
  nameById?: Map<string, string>;
  /** Berilsa — pastda yigʻiladigan "Oʻchirilgan yozuvlar" jurnali chiqadi. */
  deletions?: BehaviorDeletionLogEntry[];
}) {
  const filtered = React.useMemo(
    () => filterEventsByPeriod(events, period),
    [events, period]
  );
  const slices = React.useMemo(() => skillBreakdown(filtered), [filtered]);
  const stats = React.useMemo(() => eventStats(filtered), [filtered]);

  return (
    <div className="space-y-4">
      <Select value={period} onValueChange={(v) => onPeriodChange(v as BehaviorPeriod)}>
        <SelectTrigger size="sm" className="w-40">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {BEHAVIOR_PERIODS.map((p) => (
            <SelectItem key={p.id} value={p.id}>
              {p.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {filtered.length === 0 ? (
        <TypographyMuted className="py-8 text-center text-sm">
          Bu davrda yozuv yoʻq.
        </TypographyMuted>
      ) : (
        <>
          <BehaviorDonut slices={slices} positivePct={stats.positivePct} />

          <div className="flex items-center justify-center gap-2">
            <span className="rounded-full bg-success/10 px-2.5 py-1 text-xs font-semibold tabular-nums text-success">
              +{stats.earned} ijobiy
            </span>
            <span className="rounded-full bg-destructive/10 px-2.5 py-1 text-xs font-semibold tabular-nums text-destructive">
              −{stats.lost} salbiy
            </span>
          </div>

          <EventTimeline
            className="border-t border-border pt-4"
            events={filtered}
            nameById={nameById}
            onDelete={onDelete}
            onSaveNote={onSaveNote}
          />
        </>
      )}

      {deletions && deletions.length > 0 && (
        <DeletionLog deletions={deletions} nameById={nameById} />
      )}
    </div>
  );
}

/* ── Oʻchirilgan yozuvlar jurnali (append-only, faqat oʻqish) ────────── */

function formatDeletedAt(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${d.getDate()}-${MONTHS_UZ[d.getMonth()].toLowerCase()}, ${hh}:${mm}`;
}

function DeletionLog({
  deletions,
  nameById,
}: {
  deletions: BehaviorDeletionLogEntry[];
  nameById?: Map<string, string>;
}) {
  const [open, setOpen] = React.useState(false);
  const sorted = React.useMemo(
    () => [...deletions].sort((a, b) => b.deletedAt.localeCompare(a.deletedAt)),
    [deletions]
  );

  return (
    <Collapsible
      open={open}
      onOpenChange={setOpen}
      className="border-t border-border pt-3"
    >
      <CollapsibleTrigger className="flex w-full items-center gap-2 rounded-lg px-1 py-1.5 text-left text-xs font-medium text-muted-foreground transition-colors hover:text-foreground">
        <Trash2 className="size-3.5 shrink-0" aria-hidden />
        Oʻchirilgan yozuvlar
        <span className="tabular-nums">({deletions.length})</span>
        <ChevronDown
          className={cn("ml-auto size-3.5 shrink-0 transition-transform", open && "rotate-180")}
          aria-hidden
        />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <ul className="mt-2 space-y-3">
          {sorted.map((d) => {
            const positive = d.points > 0;
            const studentName = nameById?.get(d.studentId);
            return (
              <li key={d.id} className="flex items-start gap-2.5">
                <BehaviorEmoji
                  code={d.emoji}
                  label={d.name}
                  className="mt-0.5 size-6 shrink-0 opacity-50 grayscale"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-muted-foreground line-through">
                    {studentName ? `${studentName} — ` : ""}
                    {d.name}
                    <span className="tabular-nums">
                      {" "}
                      ({positive ? "+" : ""}
                      {d.points})
                    </span>
                  </p>
                  <p className="text-xs text-muted-foreground/70">
                    {formatDeletedAt(d.deletedAt)} da oʻchirilgan
                    {d.reason ? ` · ${d.reason}` : ""}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      </CollapsibleContent>
    </Collapsible>
  );
}

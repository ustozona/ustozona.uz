import type * as React from "react";
import { Check, X, Clock, FileText, Circle } from "lucide-react";
import type { AttendanceStatusDef } from "@/lib/attendance-data";
import { ATTENDANCE_TONE } from "@/lib/score-colors";

/* Davomat holatining vizual tili — YAGONA manba: davomat jurnali va
   Sozlamalar > Davomat ikkalasi shu map'dan ikonka+rang oladi. Toʻplam
   qulflangan (4 built-in), ranglar semantik tokenlardan (score-colors.ts). */

export const STATUS_ICONS: Record<
  string,
  React.ComponentType<{ className?: string; strokeWidth?: number }>
> = {
  check: Check,
  x: X,
  clock: Clock,
  file: FileText,
};

export type StatusVisual = {
  Icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  cellClass: string;
  textClass: string;
};

export function statusVisual(def: AttendanceStatusDef): StatusVisual {
  const Icon = STATUS_ICONS[def.icon] ?? Circle;
  const t = ATTENDANCE_TONE[def.tone];
  return { Icon, cellClass: t.cell, textClass: t.text };
}

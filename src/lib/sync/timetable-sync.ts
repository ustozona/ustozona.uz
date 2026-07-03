import type { TimetableVersion } from "@/lib/timetable-versions";
import {
  emptyTimetableBatch,
  isEmptyTimetableBatch,
  type TimetableBatch,
  type VersionUpsert,
} from "./timetable-batch";

/* ════════════════════════════════════════════════════════════════════
   TIMETABLE DIFF — versiyalar id boʻyicha hujjat sifatida solishtiriladi.
   Tartib effectiveFrom'dan hosilaviy (store sortVersions qiladi) —
   pozitsiya diff'da eʼtiborga olinmaydi.
   ════════════════════════════════════════════════════════════════════ */

export type TimetableSnapshot = { versions: TimetableVersion[] };

function toVersionUpsert(v: TimetableVersion): VersionUpsert {
  return {
    id: v.id,
    effectiveFrom: v.effectiveFrom,
    note: v.note ?? null,
    createdAt: v.createdAt,
    bellConfig: v.bellConfig as unknown as Record<string, unknown>,
    events: v.events as unknown as Record<string, unknown>[],
  };
}

export function diffTimetable(
  prev: TimetableSnapshot,
  next: TimetableSnapshot
): TimetableBatch | null {
  if (prev.versions === next.versions) return null;
  const batch = emptyTimetableBatch();

  const prevById = new Map(prev.versions.map((v) => [v.id, v]));
  for (const v of next.versions) {
    const p = prevById.get(v.id);
    if (!p || p !== v) batch.versionsUpsert.push(toVersionUpsert(v));
  }
  const nextIds = new Set(next.versions.map((v) => v.id));
  for (const v of prev.versions) {
    if (!nextIds.has(v.id)) batch.versionsDelete.push(v.id);
  }

  return isEmptyTimetableBatch(batch) ? null : batch;
}

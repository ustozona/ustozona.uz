import type { CustomSet, StandardSet } from "@/store/useStandardsStore";
import {
  emptyStandardsBatch,
  isEmptyStandardsBatch,
  type StandardsBatch,
  type StandardSetUpsert,
} from "./standards-batch";

/* ════════════════════════════════════════════════════════════════════
   STANDARDS DIFF — {sets, customSets} (prev, next) → batch | null.
   Ikkala roʻyxat bitta batchga yigʻiladi (kind bilan ajratilgan):
   id boʻyicha, reference yoki pozitsiya oʻzgargan element upsert;
   yoʻqolgan id delete.
   ════════════════════════════════════════════════════════════════════ */

export type StandardsSnapshot = { sets: StandardSet[]; customSets: CustomSet[] };

function toSetUpsert(s: StandardSet, sortOrder: number): StandardSetUpsert {
  return {
    id: s.id,
    kind: "class",
    name: s.name,
    subject: s.subject,
    sortOrder,
    data: s as unknown as Record<string, unknown>,
  };
}

function toCustomUpsert(c: CustomSet, sortOrder: number): StandardSetUpsert {
  return {
    id: c.id,
    kind: "custom",
    name: c.name,
    subject: c.subject,
    sortOrder,
    data: c as unknown as Record<string, unknown>,
  };
}

function diffList<T extends { id: string }>(
  prev: T[],
  next: T[],
  toUpsert: (item: T, index: number) => StandardSetUpsert,
  batch: StandardsBatch
): void {
  const prevById = new Map<string, { item: T; index: number }>();
  prev.forEach((item, index) => prevById.set(item.id, { item, index }));

  next.forEach((item, index) => {
    const p = prevById.get(item.id);
    if (!p || p.item !== item || p.index !== index) batch.setsUpsert.push(toUpsert(item, index));
  });

  const nextIds = new Set(next.map((it) => it.id));
  for (const it of prev) if (!nextIds.has(it.id)) batch.setsDelete.push(it.id);
}

export function diffStandards(
  prev: StandardsSnapshot,
  next: StandardsSnapshot
): StandardsBatch | null {
  if (prev.sets === next.sets && prev.customSets === next.customSets) return null;
  const batch = emptyStandardsBatch();

  if (prev.sets !== next.sets) diffList(prev.sets, next.sets, toSetUpsert, batch);
  if (prev.customSets !== next.customSets) {
    diffList(prev.customSets, next.customSets, toCustomUpsert, batch);
  }

  return isEmptyStandardsBatch(batch) ? null : batch;
}

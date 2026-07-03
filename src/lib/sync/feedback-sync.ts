import type { FeedbackItem } from "@/store/useFeedbackStore";
import {
  emptyFeedbackBatch,
  isEmptyFeedbackBatch,
  type FeedbackBatch,
  type FeedbackUpsert,
} from "./feedback-batch";

/* ════════════════════════════════════════════════════════════════════
   FEEDBACK DIFF — {items} (prev, next) → batch | null.
   tasks-sync bilan bir xil: id boʻyicha, reference yoki pozitsiya
   oʻzgargan element upsert; yoʻqolgan id delete.
   ════════════════════════════════════════════════════════════════════ */

export type FeedbackSnapshot = { items: FeedbackItem[] };

function toUpsert(f: FeedbackItem, sortOrder: number): FeedbackUpsert {
  return {
    id: f.id,
    status: f.status,
    category: f.category,
    sortOrder,
    data: f as unknown as Record<string, unknown>,
  };
}

export function diffFeedback(
  prev: FeedbackSnapshot,
  next: FeedbackSnapshot
): FeedbackBatch | null {
  if (prev.items === next.items) return null;
  const batch = emptyFeedbackBatch();

  const prevById = new Map<string, { item: FeedbackItem; index: number }>();
  prev.items.forEach((item, index) => prevById.set(item.id, { item, index }));

  next.items.forEach((item, index) => {
    const p = prevById.get(item.id);
    if (!p || p.item !== item || p.index !== index) {
      batch.itemsUpsert.push(toUpsert(item, index));
    }
  });

  const nextIds = new Set(next.items.map((f) => f.id));
  for (const f of prev.items) if (!nextIds.has(f.id)) batch.itemsDelete.push(f.id);

  return isEmptyFeedbackBatch(batch) ? null : batch;
}

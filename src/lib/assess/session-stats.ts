// Sessiya tahlili — SOF funksiyalar, v1 da FAQAT shu qatlam (mastery/decay
// v2 ga suriladi, docs/ost-loyihalar-arxitektura.md B boʻlim).
//
// DAL (src/server/dal/assess/results.ts) `responses`/`session_participants`
// qatorlarini jonli `GROUP BY` bilan oʻqiydi va shu funksiyalarga uzatadi —
// `mastery_snapshots` kabi kesh QURILMAYDI (R120: HAMMASI faqat
// baholanadigan elementlarni oladi).

export type ResponseStat = {
  itemId: string;
  participantId: string;
  isCorrect: boolean | null;
  score: number | null;
  elapsedMs: number | null;
};

export type ParticipantPresence = {
  id: string;
  lastSeenAt: Date;
  /** Ishtirokchi hozir turgan slayd/savol indeksi. */
  currentIndex: number;
};

/** completionRate = avg(ishtirokchi yechgan element / jami element) (R50). */
export function completionRate(
  responses: ResponseStat[],
  participantIds: string[],
  totalItems: number
): number {
  if (participantIds.length === 0 || totalItems === 0) return 0;
  const answeredByParticipant = new Map<string, Set<string>>();
  for (const r of responses) {
    const set = answeredByParticipant.get(r.participantId) ?? new Set<string>();
    set.add(r.itemId);
    answeredByParticipant.set(r.participantId, set);
  }
  const ratios = participantIds.map(
    (id) => (answeredByParticipant.get(id)?.size ?? 0) / totalItems
  );
  return ratios.reduce((sum, r) => sum + r, 0) / ratios.length;
}

/** accuracy = toʻgʻri javoblar ulushi (barcha elementlar boʻyicha, umumiy). */
export function accuracy(responses: ResponseStat[]): number {
  const scored = responses.filter((r) => r.isCorrect !== null);
  if (scored.length === 0) return 0;
  const correct = scored.filter((r) => r.isCorrect).length;
  return correct / scored.length;
}

/** itemAccuracy = element boʻyicha sinf foizi → matritsa ustun sarlavhasi (R45). */
export function itemAccuracy(responses: ResponseStat[]): { itemId: string; accuracy: number }[] {
  const byItem = new Map<string, ResponseStat[]>();
  for (const r of responses) {
    const list = byItem.get(r.itemId) ?? [];
    list.push(r);
    byItem.set(r.itemId, list);
  }
  return [...byItem.entries()].map(([itemId, list]) => ({
    itemId,
    accuracy: accuracy(list),
  }));
}

/** optionCounts = MCQ variantlari boʻyicha tanlov soni (R56).
    ⚠️ v1 da FAQAT sanoq — sabab yorligʻi (misconception) v1 dan chiqdi. */
export function optionCounts(answers: { optionId: string }[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const a of answers) {
    counts[a.optionId] = (counts[a.optionId] ?? 0) + 1;
  }
  return counts;
}

export type OutcomeCounts = { correct: number; partial: number; incorrect: number; unattempted: number };

/** outcomeCounts = TOʻRT holat (R122). `unattempted` toʻplam elementlari
    roʻyxatidan hisoblanadi, `responses` jadvalidan emas. */
export function outcomeCounts(itemIds: string[], responses: ResponseStat[]): OutcomeCounts {
  const answered = new Set(responses.map((r) => r.itemId));
  let correct = 0;
  let partial = 0;
  let incorrect = 0;
  for (const r of responses) {
    if (r.score !== null && r.score > 0 && r.score < 1) partial += 1;
    else if (r.isCorrect === true) correct += 1;
    else if (r.isCorrect === false) incorrect += 1;
  }
  const unattempted = itemIds.filter((id) => !answered.has(id)).length;
  return { correct, partial, incorrect, unattempted };
}

/** accuracyByIndex = [{index, accuracy, itemId}] — grafik oʻqi UMUMIY indeks,
    savol raqami emas (R121); slaydlar boʻshliq qoldiradi, indeks siljimaydi. */
export function accuracyByIndex(
  orderedItemIds: string[],
  responses: ResponseStat[]
): { index: number; itemId: string; accuracy: number }[] {
  const byItem = itemAccuracy(responses);
  const accuracyOf = new Map(byItem.map((x) => [x.itemId, x.accuracy]));
  return orderedItemIds.map((itemId, index) => ({
    index,
    itemId,
    accuracy: accuracyOf.get(itemId) ?? 0,
  }));
}

/** avgTime = oʻrtacha vaqt — KOʻRSATILADI, ballanmaydi (R123). */
export function avgTime(responses: ResponseStat[]): number {
  const withTime = responses.filter((r) => r.elapsedMs !== null) as (ResponseStat & {
    elapsedMs: number;
  })[];
  if (withTime.length === 0) return 0;
  return withTime.reduce((sum, r) => sum + r.elapsedMs, 0) / withTime.length;
}

/** unanswered = kutilgan ishtirokchi − javob bergan (xato EMAS, alohida) (R56). */
export function unanswered(expectedParticipants: number, respondedParticipantIds: Set<string>): number {
  return Math.max(0, expectedParticipants - respondedParticipantIds.size);
}

/** duration = opened_at → closed_at (past foizni talqin qilish uchun) (R55). */
export function duration(openedAt: Date | null, closedAt: Date | null): number {
  if (!openedAt || !closedAt) return 0;
  return Math.max(0, closedAt.getTime() - openedAt.getTime());
}

/** presence = { submitted, attempting, absent } — jonli panel uchun (R114).
    `attempting` javob emas, hozirlik: `lastSeenAt` + joriy indeksdan hosila. */
export function presence(
  participants: ParticipantPresence[],
  currentIndex: number,
  staleAfterMs = 15_000,
  now: Date = new Date()
): { submitted: number; attempting: number; absent: number } {
  let submitted = 0;
  let attempting = 0;
  let absent = 0;
  for (const p of participants) {
    const isStale = now.getTime() - p.lastSeenAt.getTime() > staleAfterMs;
    if (isStale) {
      absent += 1;
    } else if (p.currentIndex > currentIndex) {
      submitted += 1;
    } else {
      attempting += 1;
    }
  }
  return { submitted, attempting, absent };
}

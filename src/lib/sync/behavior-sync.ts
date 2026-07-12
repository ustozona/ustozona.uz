import type {
  BehaviorDeletionLogEntry,
  BehaviorEvent,
  BehaviorRedemption,
  BehaviorReward,
  BehaviorSkill,
} from "@/lib/behavior-data";
import {
  emptyBehaviorBatch,
  isEmptyBehaviorBatch,
  type BehaviorBatch,
  type EventUpsert,
  type RedemptionUpsert,
  type RewardUpsert,
  type SkillUpsert,
} from "./behavior-batch";

/* ════════════════════════════════════════════════════════════════════
   BEHAVIOR DIFF — (prev, next) snapshot → batch.

   attendance-sync bilan bir xil tamoyil: immutable yangilanishlar
   tufayli reference tenglik oʻzgarishni arzon topadi; hamma slice
   id-kalitli.

   `next`da yoʻqolgan class kaliti eʼtiborsiz qoldiriladi — store hech
   qachon kalit oʻchirmaydi; sinf oʻchirilishini FK CASCADE hal qiladi.
   ════════════════════════════════════════════════════════════════════ */

export type BehaviorSnapshot = {
  skills: BehaviorSkill[];
  rewards: BehaviorReward[];
  eventsByClass: Record<string, BehaviorEvent[]>;
  redemptions: BehaviorRedemption[];
  /** Append-only jurnal — diff faqat yangi qoʻshilganlarni insert qiladi. */
  deletions: BehaviorDeletionLogEntry[];
};

function toSkillUpsert(s: BehaviorSkill, sortOrder: number): SkillUpsert {
  return {
    id: s.id,
    name: s.name,
    emoji: s.emoji,
    points: s.points,
    description: s.description ?? null,
    sortOrder,
  };
}

function toEventUpsert(classId: string, e: BehaviorEvent): EventUpsert {
  return {
    id: e.id,
    classId,
    studentId: e.studentId,
    skillId: e.skillId ?? null,
    name: e.name,
    emoji: e.emoji,
    points: e.points,
    description: e.description ?? null,
    note: e.note ?? null,
    date: e.date,
    createdAt: e.createdAt,
    groupId: e.groupId ?? null,
  };
}

function toRewardUpsert(r: BehaviorReward, sortOrder: number): RewardUpsert {
  return { id: r.id, name: r.name, emoji: r.emoji, cost: r.cost, sortOrder };
}

function toRedemptionUpsert(r: BehaviorRedemption): RedemptionUpsert {
  return {
    id: r.id,
    classId: r.classId,
    studentId: r.studentId,
    rewardId: r.rewardId ?? null,
    name: r.name,
    emoji: r.emoji,
    cost: r.cost,
    date: r.date,
    createdAt: r.createdAt,
  };
}

/** Tartib ham holatning qismi (sortOrder) boʻlgan roʻyxatlar uchun. */
function diffOrdered<T extends { id: string }, U>(
  prev: T[],
  next: T[],
  toUpsert: (item: T, index: number) => U,
  upserts: U[],
  deletes: string[]
): void {
  const prevById = new Map<string, { item: T; index: number }>();
  prev.forEach((item, index) => prevById.set(item.id, { item, index }));

  next.forEach((item, index) => {
    const p = prevById.get(item.id);
    if (!p || p.item !== item || p.index !== index) {
      upserts.push(toUpsert(item, index));
    }
  });

  const nextIds = new Set(next.map((i) => i.id));
  for (const item of prev) if (!nextIds.has(item.id)) deletes.push(item.id);
}

function diffClassEvents(
  classId: string,
  prev: BehaviorEvent[] | undefined,
  next: BehaviorEvent[],
  batch: BehaviorBatch
): void {
  if (!prev) {
    for (const e of next) batch.eventsUpsert.push(toEventUpsert(classId, e));
    return;
  }
  const prevById = new Map<string, BehaviorEvent>();
  for (const e of prev) prevById.set(e.id, e);

  const nextIds = new Set<string>();
  for (const e of next) {
    nextIds.add(e.id);
    const p = prevById.get(e.id);
    if (!p || p !== e) batch.eventsUpsert.push(toEventUpsert(classId, e));
  }
  for (const e of prev) if (!nextIds.has(e.id)) batch.eventsDelete.push(e.id);
}

function diffRedemptions(
  prev: BehaviorRedemption[],
  next: BehaviorRedemption[],
  batch: BehaviorBatch
): void {
  const prevById = new Map<string, BehaviorRedemption>();
  for (const r of prev) prevById.set(r.id, r);

  const nextIds = new Set<string>();
  for (const r of next) {
    nextIds.add(r.id);
    const p = prevById.get(r.id);
    if (!p || p !== r) batch.redemptionsUpsert.push(toRedemptionUpsert(r));
  }
  for (const r of prev) if (!nextIds.has(r.id)) batch.redemptionsDelete.push(r.id);
}

/** Append-only jurnal: prev'da yoʻq idlar insert boʻladi (delete hech qachon). */
function diffDeletions(
  prev: BehaviorDeletionLogEntry[],
  next: BehaviorDeletionLogEntry[],
  batch: BehaviorBatch
): void {
  const prevIds = new Set(prev.map((d) => d.id));
  for (const d of next) {
    if (prevIds.has(d.id)) continue;
    batch.deletionsInsert.push({
      id: d.id,
      classId: d.classId,
      studentId: d.studentId,
      eventId: d.eventId,
      name: d.name,
      emoji: d.emoji,
      points: d.points,
      date: d.date,
      reason: d.reason ?? null,
      deletedAt: d.deletedAt,
    });
  }
}

export function diffBehavior(
  prev: BehaviorSnapshot,
  next: BehaviorSnapshot
): BehaviorBatch | null {
  if (
    prev.skills === next.skills &&
    prev.rewards === next.rewards &&
    prev.eventsByClass === next.eventsByClass &&
    prev.redemptions === next.redemptions &&
    prev.deletions === next.deletions
  ) {
    return null;
  }
  const batch = emptyBehaviorBatch();

  if (prev.skills !== next.skills) {
    diffOrdered(prev.skills, next.skills, toSkillUpsert, batch.skillsUpsert, batch.skillsDelete);
  }
  if (prev.rewards !== next.rewards) {
    diffOrdered(prev.rewards, next.rewards, toRewardUpsert, batch.rewardsUpsert, batch.rewardsDelete);
  }
  if (prev.eventsByClass !== next.eventsByClass) {
    for (const [classId, nextArr] of Object.entries(next.eventsByClass)) {
      const prevArr = prev.eventsByClass[classId];
      if (prevArr === nextArr) continue;
      diffClassEvents(classId, prevArr, nextArr, batch);
    }
  }
  if (prev.redemptions !== next.redemptions) {
    diffRedemptions(prev.redemptions, next.redemptions, batch);
  }
  if (prev.deletions !== next.deletions) {
    diffDeletions(prev.deletions, next.deletions, batch);
  }

  return isEmptyBehaviorBatch(batch) ? null : batch;
}

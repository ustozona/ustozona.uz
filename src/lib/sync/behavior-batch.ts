import { z } from "zod";

/* ════════════════════════════════════════════════════════════════════
   BEHAVIOR SYNC BATCH — client diff ↔ server action shartnomasi.

   Hamma obyekt id-kalitli (PK = id), upsert idempotent (retry xavfsiz).
   teacherId serverda sessiyadan olinadi.
   ════════════════════════════════════════════════════════════════════ */

const id = z.string().min(1).max(200);

export const skillUpsertSchema = z.object({
  id,
  name: z.string().min(1).max(200),
  emoji: z.string().min(1).max(50),
  points: z
    .number()
    .int()
    .min(-10)
    .max(10)
    .refine((v) => v !== 0, "points 0 boʻlmaydi"),
  description: z.string().max(500).nullable(),
  sortOrder: z.number().int().min(0),
});

export const eventUpsertSchema = z.object({
  id,
  classId: id,
  studentId: id,
  skillId: id.nullable(),
  name: z.string().min(1).max(200),
  emoji: z.string().min(1).max(50),
  points: z.number().int().min(-100).max(100),
  description: z.string().max(500).nullable(),
  note: z.string().max(2000).nullable(),
  date: z.string().min(8).max(20), // "YYYY-MM-DD"
  createdAt: z.string().min(1).max(50), // ISO
});

export const rewardUpsertSchema = z.object({
  id,
  name: z.string().min(1).max(200),
  emoji: z.string().min(1).max(50),
  cost: z.number().int().min(1).max(10000),
  sortOrder: z.number().int().min(0),
});

export const redemptionUpsertSchema = z.object({
  id,
  classId: id,
  studentId: id,
  rewardId: id.nullable(),
  name: z.string().min(1).max(500),
  emoji: z.string().min(1).max(50),
  cost: z.number().int().min(1).max(10000),
  date: z.string().min(8).max(20),
  createdAt: z.string().min(1).max(50),
});

export const behaviorBatchSchema = z.object({
  skillsUpsert: z.array(skillUpsertSchema).max(500),
  skillsDelete: z.array(id).max(500),
  eventsUpsert: z.array(eventUpsertSchema).max(20000),
  eventsDelete: z.array(id).max(20000),
  rewardsUpsert: z.array(rewardUpsertSchema).max(500),
  rewardsDelete: z.array(id).max(500),
  redemptionsUpsert: z.array(redemptionUpsertSchema).max(20000),
  redemptionsDelete: z.array(id).max(20000),
});

export type SkillUpsert = z.infer<typeof skillUpsertSchema>;
export type EventUpsert = z.infer<typeof eventUpsertSchema>;
export type RewardUpsert = z.infer<typeof rewardUpsertSchema>;
export type RedemptionUpsert = z.infer<typeof redemptionUpsertSchema>;
export type BehaviorBatch = z.infer<typeof behaviorBatchSchema>;

export function emptyBehaviorBatch(): BehaviorBatch {
  return {
    skillsUpsert: [],
    skillsDelete: [],
    eventsUpsert: [],
    eventsDelete: [],
    rewardsUpsert: [],
    rewardsDelete: [],
    redemptionsUpsert: [],
    redemptionsDelete: [],
  };
}

export function isEmptyBehaviorBatch(b: BehaviorBatch): boolean {
  return (
    b.skillsUpsert.length === 0 &&
    b.skillsDelete.length === 0 &&
    b.eventsUpsert.length === 0 &&
    b.eventsDelete.length === 0 &&
    b.rewardsUpsert.length === 0 &&
    b.rewardsDelete.length === 0 &&
    b.redemptionsUpsert.length === 0 &&
    b.redemptionsDelete.length === 0
  );
}

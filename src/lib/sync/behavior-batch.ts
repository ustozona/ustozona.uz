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
  groupId: id.nullable(),
  /** Avto-event manbasi; null = qoʻlda berilgan. */
  source: z.enum(["attendance", "streak", "grade"]).nullable(),
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

/** Oʻchirish jurnali yozuvi — append-only, hech qachon oʻchirilmaydi/yangilanmaydi. */
export const deletionInsertSchema = z.object({
  id,
  classId: id,
  studentId: id,
  eventId: id,
  name: z.string().min(1).max(200),
  emoji: z.string().min(1).max(50),
  points: z.number().int().min(-100).max(100),
  date: z.string().min(8).max(20),
  reason: z.string().max(2000).nullable(),
  deletedAt: z.string().min(1).max(50), // ISO
});

/** Avtomatik ball qoidalari — per-teacher bitta qator. */
export const autoSettingsUpsertSchema = z.object({
  attendanceEnabled: z.boolean(),
  lateEnabled: z.boolean().default(true),
  latePoints: z.number().int().min(-10).max(-1),
  absentEnabled: z.boolean().default(true),
  absentPoints: z.number().int().min(-10).max(-1),
  presentEnabled: z.boolean(),
  presentPoints: z.number().int().min(1).max(5),
  streakEnabled: z.boolean(),
  streakN: z.number().int().min(2).max(20),
  streakBonus: z.number().int().min(1).max(10),
  attendanceSince: z.string().min(8).max(20), // "YYYY-MM-DD"
  journalEnabled: z.boolean(),
  gradedEnabled: z.boolean().default(true),
  gradedPoints: z.number().int().min(1).max(5),
  missedDueEnabled: z.boolean().default(true),
  missedDuePoints: z.number().int().min(-10).max(-1),
  journalSince: z.string().min(8).max(20),
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
  deletionsInsert: z.array(deletionInsertSchema).max(20000),
  autoSettingsUpsert: z.array(autoSettingsUpsertSchema).max(1),
});

export type SkillUpsert = z.infer<typeof skillUpsertSchema>;
export type EventUpsert = z.infer<typeof eventUpsertSchema>;
export type RewardUpsert = z.infer<typeof rewardUpsertSchema>;
export type RedemptionUpsert = z.infer<typeof redemptionUpsertSchema>;
export type DeletionInsert = z.infer<typeof deletionInsertSchema>;
export type AutoSettingsUpsert = z.infer<typeof autoSettingsUpsertSchema>;
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
    deletionsInsert: [],
    autoSettingsUpsert: [],
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
    b.redemptionsDelete.length === 0 &&
    b.deletionsInsert.length === 0 &&
    b.autoSettingsUpsert.length === 0
  );
}

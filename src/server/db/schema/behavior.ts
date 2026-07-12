import { index, integer, pgTable, text } from "drizzle-orm/pg-core";
import { teachers } from "./teachers";
import { classes, students } from "./classes";

/* ════════════════════════════════════════════════════════════════════
   XULQ — koʻnikmalar, eventlar (append-only ledger), mukofotlar,
   sarflashlar. 4 flat jadval, JSONB yoʻq (attendance uslubi).

   Koʻnikmalar global per-teacher (per-class emas) — keyin nullable
   class_id qoʻshish buzilishsiz migratsiya boʻladi.

   behavior_events.skill_id / behavior_redemptions.reward_id ATAYLAB
   FK-siz: koʻnikma/mukofot oʻchirilsa tarix qoladi (snapshot ustunlar
   name/emoji/description/points event ichida).

   Xulq ballari akademik baholarga (grades jadvallari) aralashmaydi.
   ════════════════════════════════════════════════════════════════════ */

export const behaviorSkills = pgTable(
  "behavior_skills",
  {
    id: text("id").primaryKey(),
    teacherId: text("teacher_id")
      .notNull()
      .references(() => teachers.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    emoji: text("emoji").notNull(),
    points: integer("points").notNull(),
    description: text("description"),
    sortOrder: integer("sort_order").notNull().default(0),
    updatedAt: text("updated_at").notNull(), // ISO
  },
  (t) => [index("behavior_skills_teacher_idx").on(t.teacherId)]
);

export const behaviorEvents = pgTable(
  "behavior_events",
  {
    id: text("id").primaryKey(),
    teacherId: text("teacher_id")
      .notNull()
      .references(() => teachers.id, { onDelete: "cascade" }),
    classId: text("class_id")
      .notNull()
      .references(() => classes.id, { onDelete: "cascade" }),
    studentId: text("student_id")
      .notNull()
      .references(() => students.id, { onDelete: "cascade" }),
    /** FK-siz — koʻnikma oʻchirilsa tarix buzilmasin. */
    skillId: text("skill_id"),
    name: text("name").notNull(),
    emoji: text("emoji").notNull(),
    points: integer("points").notNull(),
    description: text("description"),
    note: text("note"),
    date: text("date").notNull(), // "YYYY-MM-DD"
    createdAt: text("created_at").notNull(), // ISO
  },
  (t) => [
    index("behavior_events_teacher_idx").on(t.teacherId),
    index("behavior_events_class_idx").on(t.classId),
    index("behavior_events_student_idx").on(t.studentId),
  ]
);

export const behaviorRewards = pgTable(
  "behavior_rewards",
  {
    id: text("id").primaryKey(),
    teacherId: text("teacher_id")
      .notNull()
      .references(() => teachers.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    emoji: text("emoji").notNull(),
    cost: integer("cost").notNull(),
    sortOrder: integer("sort_order").notNull().default(0),
    updatedAt: text("updated_at").notNull(), // ISO
  },
  (t) => [index("behavior_rewards_teacher_idx").on(t.teacherId)]
);

export const behaviorRedemptions = pgTable(
  "behavior_redemptions",
  {
    id: text("id").primaryKey(),
    teacherId: text("teacher_id")
      .notNull()
      .references(() => teachers.id, { onDelete: "cascade" }),
    classId: text("class_id")
      .notNull()
      .references(() => classes.id, { onDelete: "cascade" }),
    studentId: text("student_id")
      .notNull()
      .references(() => students.id, { onDelete: "cascade" }),
    /** FK-siz — mukofot oʻchirilsa tarix buzilmasin; erkin sarflashda NULL. */
    rewardId: text("reward_id"),
    name: text("name").notNull(),
    emoji: text("emoji").notNull(),
    cost: integer("cost").notNull(),
    date: text("date").notNull(), // "YYYY-MM-DD"
    createdAt: text("created_at").notNull(), // ISO
  },
  (t) => [
    index("behavior_redemptions_teacher_idx").on(t.teacherId),
    index("behavior_redemptions_class_idx").on(t.classId),
    index("behavior_redemptions_student_idx").on(t.studentId),
  ]
);

export type BehaviorSkillRow = typeof behaviorSkills.$inferSelect;
export type BehaviorEventRow = typeof behaviorEvents.$inferSelect;
export type BehaviorRewardRow = typeof behaviorRewards.$inferSelect;
export type BehaviorRedemptionRow = typeof behaviorRedemptions.$inferSelect;

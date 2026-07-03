import {
  boolean,
  index,
  integer,
  pgTable,
  primaryKey,
  real,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { teachers } from "./teachers";
import { classes, students } from "./classes";

/* ════════════════════════════════════════════════════════════════════
   JURNAL — toifalar (topics), topshiriqlar (assignments), baholar.

   Model docs/grades-v1-spec.md ga mos: baho foizga normallanadi,
   vazn faqat toifa (kategoriya) darajasida. Shkala/inputMode toifada,
   maxScore topshiriqda (xom maxraj). Grades PK (student, assignment) —
   idempotent batch upsert shu kalit bilan ishlaydi.
   ════════════════════════════════════════════════════════════════════ */

export const topics = pgTable(
  "topics",
  {
    id: text("id").primaryKey(),
    teacherId: text("teacher_id")
      .notNull()
      .references(() => teachers.id, { onDelete: "cascade" }),
    classId: text("class_id")
      .notNull()
      .references(() => classes.id, { onDelete: "cascade" }),
    /** Sinflar aro guruhlash kaliti ("hw", "test", ...) — tahrir hammasiga tegadi. */
    groupId: text("group_id"),
    name: text("name").notNull(),
    color: text("color").notNull(), // TopicColor
    purpose: text("purpose").notNull(), // formative | summative
    weightPercent: integer("weight_percent").notNull().default(0),
    inputMode: text("input_mode").notNull(), // score | select
    scaleKind: text("scale_kind"), // GradingScale preset
    passLabel: text("pass_label").notNull().default("Bajardi"),
    failLabel: text("fail_label").notNull().default("Bajarmadi"),
    /** Frontend massiv tartibi — round-trip'da saqlanadi. */
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("topics_teacher_idx").on(t.teacherId),
    index("topics_class_idx").on(t.classId),
  ]
);

export const assignments = pgTable(
  "assignments",
  {
    id: text("id").primaryKey(),
    teacherId: text("teacher_id")
      .notNull()
      .references(() => teachers.id, { onDelete: "cascade" }),
    classId: text("class_id")
      .notNull()
      .references(() => classes.id, { onDelete: "cascade" }),
    topicId: text("topic_id")
      .notNull()
      .references(() => topics.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    /** Xom maxraj — baho foizga shu orqali normallanadi. */
    maxScore: integer("max_score").notNull(),
    date: text("date"), // "YYYY-MM-DD"
    /** Jurnal ustunlari tartibi — round-trip'da saqlanadi. */
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("assignments_teacher_idx").on(t.teacherId),
    index("assignments_class_idx").on(t.classId),
    index("assignments_topic_idx").on(t.topicId),
  ]
);

export const grades = pgTable(
  "grades",
  {
    teacherId: text("teacher_id")
      .notNull()
      .references(() => teachers.id, { onDelete: "cascade" }),
    studentId: text("student_id")
      .notNull()
      .references(() => students.id, { onDelete: "cascade" }),
    assignmentId: text("assignment_id")
      .notNull()
      .references(() => assignments.id, { onDelete: "cascade" }),
    /** null = boʻsh katak; select mode'da 100 (pass) / 0 (fail). */
    score: real("score"),
    isDraft: boolean("is_draft").notNull().default(false),
    /** Q/T belgisi: absent | unsubmitted; oʻrtachadan chiqariladi. */
    missing: text("missing"),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    primaryKey({ columns: [t.studentId, t.assignmentId] }),
    index("grades_teacher_idx").on(t.teacherId),
    index("grades_assignment_idx").on(t.assignmentId),
  ]
);

export type TopicRow = typeof topics.$inferSelect;
export type AssignmentRow = typeof assignments.$inferSelect;
export type GradeRow = typeof grades.$inferSelect;

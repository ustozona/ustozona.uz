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
   vazn faqat toifa (kategoriya) darajasida. Shkala toifada,
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
    scaleKind: text("scale_kind"), // GradingScale preset
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
    /** null = "Toifasiz" (virtual guruh, UI'da hisoblanadi) — toifa oʻchsa
        topshiriq oʻchmaydi, shu holatga tushadi (`onDelete: set null`). */
    topicId: text("topic_id").references(() => topics.id, { onDelete: "set null" }),
    title: text("title").notNull(),
    /** Xom maxraj — baho foizga shu orqali normallanadi. */
    maxScore: integer("max_score").notNull(),
    date: text("date"), // "YYYY-MM-DD"
    /** Topshirish muddati — metadata (hisobga kirmaydi), xulq avto-ball oʻqiydi. */
    dueDate: text("due_date"), // "YYYY-MM-DD"
    /** Topshiriq turi: manual (qoʻlda) | test | deck (taqdimot). Test/deck
        hozircha muharrirsiz — kelgusi bosqichda ulanadi. */
    kind: text("kind").notNull().default("manual"),
    /** Yoʻriqnoma — oddiy matn (v1; Tiptap boy matn keyingi bosqichda). */
    instructions: text("instructions"),
    /** Baholash sessiyasidan nashr qilingan boʻlsa — izlanuvchanlik uchun
        manba sessiya id'si (docs/ost-loyihalar-arxitektura.md, publish.ts). */
    sourceSessionId: text("source_session_id"),
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

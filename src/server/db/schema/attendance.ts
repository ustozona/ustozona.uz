import {
  boolean,
  index,
  integer,
  pgTable,
  primaryKey,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { teachers } from "./teachers";
import { classes, students } from "./classes";

/* ════════════════════════════════════════════════════════════════════
   DAVOMAT — holatlar toʻplami + yozuvlar.

   Holatlar oʻqituvchi darajasida (barcha sinflarga umumiy) — frontend
   useAttendanceStore bilan bir xil model: built-in 4 holat + maxsus
   holatlar bitta jadvalda. Yozuv kaliti (class, student, date) —
   rejadagi unique talabga PK sifatida javob beradi; "unmarked" yozuv
   sifatida SAQLANMAYDI (yozuv yoʻqligi = unmarked).
   ════════════════════════════════════════════════════════════════════ */

export const attendanceStatuses = pgTable(
  "attendance_statuses",
  {
    teacherId: text("teacher_id")
      .notNull()
      .references(() => teachers.id, { onDelete: "cascade" }),
    key: text("key").notNull(), // "present", "absent", ... yoki maxsus slug
    label: text("label").notNull(),
    icon: text("icon").notNull(), // lucide ikona nomi
    scoreImpact: text("score_impact").notNull(), // positive | negative | neutral
    active: boolean("active").notNull().default(true),
    builtIn: boolean("built_in").notNull().default(false),
    /** Built-in uchun semantik tone, maxsus uchun ClassColor. */
    tone: text("tone").notNull(),
    /** UI'dagi tartib (BUILTIN_STATUSES ketma-ketligi saqlansin). */
    sortOrder: integer("sort_order").notNull().default(0),
  },
  (t) => [primaryKey({ columns: [t.teacherId, t.key] })]
);

export const attendanceRecords = pgTable(
  "attendance_records",
  {
    teacherId: text("teacher_id")
      .notNull()
      .references(() => teachers.id, { onDelete: "cascade" }),
    classId: text("class_id")
      .notNull()
      .references(() => classes.id, { onDelete: "cascade" }),
    studentId: text("student_id")
      .notNull()
      .references(() => students.id, { onDelete: "cascade" }),
    date: text("date").notNull(), // "YYYY-MM-DD"
    status: text("status").notNull(),
    note: text("note"),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    primaryKey({ columns: [t.classId, t.studentId, t.date] }),
    index("attendance_records_teacher_idx").on(t.teacherId),
    index("attendance_records_student_idx").on(t.studentId),
  ]
);

export type AttendanceStatusRow = typeof attendanceStatuses.$inferSelect;
export type AttendanceRecordRow = typeof attendanceRecords.$inferSelect;

import { index, integer, jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { teachers } from "./teachers";

/* ════════════════════════════════════════════════════════════════════
   REJALASHTIRISH DOMENI — darslar banki, jadval versiyalari, kalendar.

   Bular "hujjat" maʼlumotlar: UI ularni butunligicha oʻqib-yozadi,
   oʻquvchi/vaqt boʻyicha SQL agregatsiya yoʻq (reja qoidasi: bunday
   hujjatlar JSONB). Shu sabab:
   - lessons.data = TOʻLIQ Lesson obyekti (content HTML, koʻp-sinf
     xaritalari bilan) — round-trip aynan; ustunlar (classId, status...)
     faqat kelajakdagi server-soʻrovlar uchun denormallangan nusxa.
   - timetable_versions.events/bellConfig = versiya snapshoti JSONB.
   - calendars = oʻqituvchi boshiga bitta hujjat (PK = teacher_id).

   classId/unitId ustunlari ATAYIN FK emas (plain text): bu domenda
   izchillikni client store boshqaradi (masalan, dars bir nechta sinfga
   tegishli boʻlishi mumkin, sinf oʻchirilganda dars saqlanib qoladi).
   Tenant izolyatsiyasi teacherId FK CASCADE orqali.
   ════════════════════════════════════════════════════════════════════ */

export const units = pgTable(
  "units",
  {
    id: text("id").primaryKey(),
    teacherId: text("teacher_id")
      .notNull()
      .references(() => teachers.id, { onDelete: "cascade" }),
    classId: text("class_id").notNull(),
    number: integer("number").notNull(),
    title: text("title").notNull(),
    description: text("description").notNull().default(""),
    sortOrder: integer("sort_order").notNull().default(0),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("units_teacher_idx").on(t.teacherId)]
);

export const lessons = pgTable(
  "lessons",
  {
    id: text("id").primaryKey(),
    teacherId: text("teacher_id")
      .notNull()
      .references(() => teachers.id, { onDelete: "cascade" }),
    classId: text("class_id").notNull(),
    unitId: text("unit_id"),
    number: integer("number").notNull(),
    title: text("title").notNull(),
    status: text("status").notNull(), // Completed | Scheduled | Unscheduled | Draft
    sortOrder: integer("sort_order").notNull().default(0),
    /** TOʻLIQ Lesson obyekti — oʻqishda aynan shu qaytariladi. */
    data: jsonb("data").$type<Record<string, unknown>>().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("lessons_teacher_idx").on(t.teacherId),
    index("lessons_class_idx").on(t.classId),
  ]
);

export const timetableVersions = pgTable(
  "timetable_versions",
  {
    id: text("id").primaryKey(),
    teacherId: text("teacher_id")
      .notNull()
      .references(() => teachers.id, { onDelete: "cascade" }),
    effectiveFrom: text("effective_from").notNull(), // "YYYY-MM-DD"
    note: text("note"),
    /** Client ISO satri (TimetableVersion.createdAt bilan aynan mos). */
    createdAt: text("created_at").notNull(),
    bellConfig: jsonb("bell_config").$type<Record<string, unknown>>().notNull(),
    events: jsonb("events").$type<unknown[]>().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("timetable_versions_teacher_idx").on(t.teacherId)]
);

export const calendars = pgTable("calendars", {
  teacherId: text("teacher_id")
    .primaryKey()
    .references(() => teachers.id, { onDelete: "cascade" }),
  /** AcademicYearCalendar hujjati butunligicha. */
  data: jsonb("data").$type<Record<string, unknown>>().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type UnitRow = typeof units.$inferSelect;
export type LessonRow = typeof lessons.$inferSelect;
export type TimetableVersionRow = typeof timetableVersions.$inferSelect;
export type CalendarRow = typeof calendars.$inferSelect;

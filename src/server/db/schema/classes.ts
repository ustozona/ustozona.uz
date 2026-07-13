import { index, integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { user } from "./auth";
import { teachers } from "./teachers";

/* ════════════════════════════════════════════════════════════════════
   SINFLAR va OʻQUVCHILAR — roster yadrosi.

   ID'lar: text, ilova/seed generatsiya qiladi. Legacy seed id'lar
   ("5-a", "s-0-abdulloh-xasanov") faqat demo oʻqituvchiga tegishli;
   yangi yozuvlar uchun ilova global-unikal id yaratishi shart
   (crypto.randomUUID) — PK butun jadval boʻyicha yagona.

   Multi-tenant: har soʻrov DAL'da sessiyadagi teacher_id bilan
   filtrlangani uchun boshqa oʻqituvchining qatori hech qachon
   qaytmaydi; FK CASCADE'lar oʻqituvchi oʻchirilishida butun daraxtni
   tozalaydi.
   ════════════════════════════════════════════════════════════════════ */

export const classes = pgTable(
  "classes",
  {
    id: text("id").primaryKey(),
    teacherId: text("teacher_id")
      .notNull()
      .references(() => teachers.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    /** ClassColor yorligʻi ("blue", "gray", ...); null = indeks boʻyicha avto. */
    color: text("color"),
    /** Koʻrsatma vaqti, mas. "17:10 — 17:55" (faqat koʻrinish uchun). */
    time: text("time"),
    /** Sinf raqami (1–11); null = toʻgarak kabi darajasiz guruh. */
    grade: integer("grade"),
    /** Fan nomi, mas. "Ingliz tili". */
    subject: text("subject"),
    /** Avatar ikonkasi kaliti (ClassIconKey). */
    icon: text("icon"),
    description: text("description"),
    /** Frontend massiv tartibi (sidebar/roʻyxat) — round-trip'da saqlanadi. */
    sortOrder: integer("sort_order").notNull().default(0),
    /** Arxivlangan sana (ISO satr) yoki null. null = faol sinf. Arxiv sinflar
        pickerlardan yashiriladi (rollover: bitiruvchi guruhlar). Sinf UUID va
        tarixi (davomat/baho) saqlanadi — faqat roʻyxatdan yashirin. */
    archivedAt: text("archived_at"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("classes_teacher_idx").on(t.teacherId)]
);

export const students = pgTable(
  "students",
  {
    id: text("id").primaryKey(),
    teacherId: text("teacher_id")
      .notNull()
      .references(() => teachers.id, { onDelete: "cascade" }),
    classId: text("class_id")
      .notNull()
      .references(() => classes.id, { onDelete: "cascade" }),
    /** Sentyabr: oʻquvchi akkaunti ulanganда auth user'ga bogʻlanadi. */
    userId: text("user_id").references(() => user.id, { onDelete: "set null" }),
    name: text("name").notNull(),
    initials: text("initials").notNull(),
    status: text("status").notNull().default("active"), // active | away | archived
    gender: text("gender"), // male | female
    birthDate: text("birth_date"), // "YYYY-MM-DD" — frontend bilan aynan mos satr
    parentName: text("parent_name"),
    parentPhone: text("parent_phone"),
    studentPhone: text("student_phone"),
    /** Roster tartibi (sinf ichida). */
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("students_teacher_idx").on(t.teacherId),
    index("students_class_idx").on(t.classId),
  ]
);

export type ClassRow = typeof classes.$inferSelect;
export type StudentRow = typeof students.$inferSelect;

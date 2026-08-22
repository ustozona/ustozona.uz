import { boolean, jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { user } from "./auth";
import { workspaces } from "./workspaces";

/* ════════════════════════════════════════════════════════════════════
   TEACHERS — har bir oʻqituvchining domen-profili.

   `id` Better Auth `user.id` bilan bir xil boʻladi (2-bosqichda auth
   qoʻshilganda birinchi kirishda shu jadvalga qator yaratiladi).
   Barcha domen jadvallari (classes, students, grades, ...) shu jadvalga
   `teacher_id` FK bilan bogʻlanadi — multi-tenant izolyatsiya asosi.
   ════════════════════════════════════════════════════════════════════ */

export const teachers = pgTable("teachers", {
  id: text("id")
    .primaryKey()
    .references(() => user.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  /** ⚠️ Profil uchun ERKIN MATN — koʻrsatish uchun, xolos.
      ⛔ Guruhlash/ruxsat uchun HECH QACHON ishlatilmaydi: uni har kim
      istalgancha yozadi ("30", "23-MAKTAB", boʻsh…), demak ishonch
      chegarasi boʻla olmaydi. Yagona hokimiyat — `workspace_members`. */
  school: text("school"),
  /** Oʻqituvchi hozir qaysi maydonda ishlayapti (maydon almashtirgichi).
      null = shaxsiy maydoni. Aʼzolik `workspace_members` da — bu faqat
      "oxirgi tanlov" xotirasi, ruxsat manbai EMAS. */
  activeWorkspaceId: text("active_workspace_id").references(() => workspaces.id, {
    onDelete: "set null",
  }),
  subject: text("subject"),
  /** "YYYY-MM-DD" — ixtiyoriy, tugʻilgan kun tabrigi/chegirma uchun. */
  birthDate: text("birth_date"),
  avatarUrl: text("avatar_url"),
  language: text("language").notNull().default("uz"),
  academicYear: text("academic_year"),
  plan: text("plan").notNull().default("free"),
  /** true = admin/test/demo hisob — faollashuv voronkasi va "eʼtibor
      talab qiladi" roʻyxatida hisoblanmaydi (real koʻrsatkichni buzmasin). */
  excludeFromMetrics: boolean("exclude_from_metrics").notNull().default(false),
  /** UI afzalliklari (workspaceBackground, journalScale kabi) — hujjat sifatida. */
  prefs: jsonb("prefs").$type<Record<string, unknown>>().notNull().default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type TeacherRow = typeof teachers.$inferSelect;
export type NewTeacherRow = typeof teachers.$inferInsert;

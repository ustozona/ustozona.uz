import { index, jsonb, pgTable, text } from "drizzle-orm/pg-core";
import { teachers } from "./teachers";
import { students } from "./classes";

/* ════════════════════════════════════════════════════════════════════
   OʻQUVCHI QAYDLARI — profil sahifasidagi "Qaydlar" tab. Muallif oʻz
   qaydini tahrirlashi/oʻchirishi mumkin (DAL setWhere teacherId bilan
   himoyalangan — faqat oʻzinikini).

   `tags` — erkin teglar roʻyxati (default uchlik: positive/concern/neutral
   taklif qilinadi, lekin majburiy emas va istalganini olib tashlash mumkin).
   `visibility` — "teachers" (faqat oʻqituvchilar) | "guardians" (ota-ona +
   oʻquvchi ham koʻradi).
   ════════════════════════════════════════════════════════════════════ */

export const studentNotes = pgTable(
  "student_notes",
  {
    id: text("id").primaryKey(),
    teacherId: text("teacher_id")
      .notNull()
      .references(() => teachers.id, { onDelete: "cascade" }),
    studentId: text("student_id")
      .notNull()
      .references(() => students.id, { onDelete: "cascade" }),
    /** Toʻliq qayd rejimida ixtiyoriy sarlavha; qisqa qaydda yoʻq. */
    title: text("title"),
    text: text("text").notNull(),
    /** Karta foni uchun och (pastel) rang id; null = neytral. */
    color: text("color"),
    /** @deprecated tags'ga koʻchdi — faqat eski qatorlar uchun saqlanadi, endi yozilmaydi. */
    sentiment: text("sentiment"),
    tags: jsonb("tags").$type<string[]>().notNull().default([]),
    visibility: text("visibility").notNull().default("teachers"), // "teachers"|"guardians"
    createdAt: text("created_at").notNull(), // ISO
  },
  (t) => [
    index("student_notes_teacher_idx").on(t.teacherId),
    index("student_notes_student_idx").on(t.studentId),
  ]
);

export type StudentNoteRow = typeof studentNotes.$inferSelect;

import { index, pgTable, text } from "drizzle-orm/pg-core";
import { teachers } from "./teachers";
import { students } from "./classes";

/* ════════════════════════════════════════════════════════════════════
   OʻQUVCHI QAYDLARI — profil sahifasidagi "Qaydlar" tab (append-only,
   behavior_events uslubi: flat jadval, tahrirlanmaydi, faqat qoʻshiladi).
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
    text: text("text").notNull(),
    sentiment: text("sentiment").notNull(), // "positive"|"concern"|"neutral"
    createdAt: text("created_at").notNull(), // ISO
  },
  (t) => [
    index("student_notes_teacher_idx").on(t.teacherId),
    index("student_notes_student_idx").on(t.studentId),
  ]
);

export type StudentNoteRow = typeof studentNotes.$inferSelect;

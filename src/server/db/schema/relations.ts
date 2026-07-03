import { index, pgTable, primaryKey, text, timestamp } from "drizzle-orm/pg-core";
import { teachers } from "./teachers";
import { students } from "./classes";

/* ════════════════════════════════════════════════════════════════════
   QARINDOSHLIK — yoʻnalishsiz oʻquvchi juftlari (aka-uka/opa-singil).

   Frontend relations-store bilan bir xil model: juft normallashtirilib
   saqlanadi (studentA < studentB — DAL yozishda taʼminlaydi), yorliq
   (aka/uka/...) koʻruvchi tomonда jins+yosh boʻyicha hisoblanadi.
   ════════════════════════════════════════════════════════════════════ */

export const studentRelations = pgTable(
  "student_relations",
  {
    teacherId: text("teacher_id")
      .notNull()
      .references(() => teachers.id, { onDelete: "cascade" }),
    /** Juftning kichigi (satr tartibida) — normallashtirish invarianti. */
    studentA: text("student_a")
      .notNull()
      .references(() => students.id, { onDelete: "cascade" }),
    studentB: text("student_b")
      .notNull()
      .references(() => students.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    primaryKey({ columns: [t.studentA, t.studentB] }),
    index("student_relations_teacher_idx").on(t.teacherId),
  ]
);

export type StudentRelationRow = typeof studentRelations.$inferSelect;

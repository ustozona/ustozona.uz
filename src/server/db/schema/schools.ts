import { pgTable, text, timestamp } from "drizzle-orm/pg-core";

/* ════════════════════════════════════════════════════════════════════
   MAKTABLAR — maktab poydevori (M4). Bitta maktabga koʻp oʻqituvchi
   (teachers.schoolId FK) — koʻp-maktabli admin keyingi bosqich.
   ════════════════════════════════════════════════════════════════════ */

export const schools = pgTable("schools", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  region: text("region"),
  city: text("city"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type SchoolRow = typeof schools.$inferSelect;
export type NewSchoolRow = typeof schools.$inferInsert;

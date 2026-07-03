import { index, integer, jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { teachers } from "./teachers";

/* ════════════════════════════════════════════════════════════════════
   FIKR-MULOHAZA — mahsulot feedback doskasi (useFeedbackStore).

   v1'da har oʻqituvchi oʻz doskasini koʻradi (localStorage davri bilan
   bir xil model) — umumiy jamoaviy doska backend'dan keyingi bosqich.
   data = TOʻLIQ FeedbackItem hujjati (replies, reactions, rasmlar
   base64 data-URL koʻrinishida — shu sabab qator katta boʻlishi mumkin,
   sync CHUNK kichik tutiladi). status/category — denormallangan nusxa.
   ════════════════════════════════════════════════════════════════════ */

export const feedback = pgTable(
  "feedback",
  {
    id: text("id").primaryKey(),
    teacherId: text("teacher_id")
      .notNull()
      .references(() => teachers.id, { onDelete: "cascade" }),
    status: text("status").notNull(), // yangi | korilmoqda | ... | rad
    category: text("category").notNull(), // taklif | xato | savol | maqtov | boshqa
    sortOrder: integer("sort_order").notNull().default(0),
    /** TOʻLIQ FeedbackItem obyekti — oʻqishda aynan shu qaytariladi. */
    data: jsonb("data").$type<Record<string, unknown>>().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("feedback_teacher_idx").on(t.teacherId)]
);

export type FeedbackRow = typeof feedback.$inferSelect;

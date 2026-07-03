import { index, integer, jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { teachers } from "./teachers";

/* ════════════════════════════════════════════════════════════════════
   STANDARTLAR DOMENI — standartlar toʻplamlari (papkalar).

   Reja dastlab standard_sets/standard_items relatsion juftligini nazarda
   tutgan edi, lekin JSONB qoidasi boʻyicha bu domen hujjat: UI toʻplamni
   butunligicha oʻqib-yozadi, oʻquvchi/vaqt boʻyicha SQL agregatsiya yoʻq
   (covered belgisi ham toʻplam ichida almashtiriladi). Shu sabab
   6-bosqichdagi lessons precedenti qoʻllanadi: BITTA jadval, data =
   toʻliq StandardSet/CustomSet hujjati.

   kind ustuni store'dagi ikki roʻyxatni ajratadi:
   - "class"  → sets (sinf(lar)ga biriktirilgan papkalar);
   - "custom" → customSets ("Mening standartlarim" kutubxonasi).
   name/subject — denormallangan nusxa (kelajak soʻrovlar uchun).
   ════════════════════════════════════════════════════════════════════ */

export const standardSets = pgTable(
  "standard_sets",
  {
    id: text("id").primaryKey(),
    teacherId: text("teacher_id")
      .notNull()
      .references(() => teachers.id, { onDelete: "cascade" }),
    kind: text("kind").notNull(), // class | custom
    name: text("name").notNull(),
    subject: text("subject").notNull().default(""),
    sortOrder: integer("sort_order").notNull().default(0),
    /** TOʻLIQ StandardSet (kind=class) yoki CustomSet (kind=custom) hujjati. */
    data: jsonb("data").$type<Record<string, unknown>>().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("standard_sets_teacher_idx").on(t.teacherId)]
);

export type StandardSetRow = typeof standardSets.$inferSelect;

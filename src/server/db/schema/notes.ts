import { pgTable, primaryKey, text, timestamp } from "drizzle-orm/pg-core";
import { teachers } from "./teachers";

/* ════════════════════════════════════════════════════════════════════
   SINF ESLATMALARI — sinf boshiga bitta erkin matn (OverviewSidebar).

   useClassNotesStore'dagi Record<classId, string>'ning satr koʻrinishi.
   classId ATAYIN FK emas (planning domeni bilan bir xil sabab):
   izchillikni client store boshqaradi; sinf oʻchirilsa eslatma qatori
   keyingi sync'da oʻchadi.
   ════════════════════════════════════════════════════════════════════ */

export const classNotes = pgTable(
  "class_notes",
  {
    teacherId: text("teacher_id")
      .notNull()
      .references(() => teachers.id, { onDelete: "cascade" }),
    classId: text("class_id").notNull(),
    note: text("note").notNull().default(""),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.teacherId, t.classId] })]
);

export type ClassNoteRow = typeof classNotes.$inferSelect;

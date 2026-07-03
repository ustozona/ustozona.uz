import { index, integer, jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { teachers } from "./teachers";

/* ════════════════════════════════════════════════════════════════════
   VAZIFALAR DOMENI — oʻqituvchining shaxsiy vazifalari (tasks sahifasi).

   Bir-foydalanuvchi hujjatlari: subtasklar, kommentlar, pomodoro
   sessiyalari, takrorlanish qoidasi — hammasi bitta Task obyekti
   ichida yashaydi va UI uni butunligicha oʻqib-yozadi (reja qoidasi:
   bunday hujjatlar JSONB). data = TOʻLIQ Task obyekti; status/dueDate
   ustunlari faqat kelajakdagi server-soʻrovlar (masalan, muddati kelgan
   vazifa eslatmalari) uchun denormallangan nusxa.

   classIds Task ichida FK'siz qoladi (dars banki bilan bir xil sabab):
   izchillikni client store boshqaradi, sinf oʻchirilsa vazifa qoladi.
   ════════════════════════════════════════════════════════════════════ */

export const tasks = pgTable(
  "tasks",
  {
    id: text("id").primaryKey(),
    teacherId: text("teacher_id")
      .notNull()
      .references(() => teachers.id, { onDelete: "cascade" }),
    status: text("status").notNull(), // todo | in-progress | done | canceled
    dueDate: text("due_date"), // "YYYY-MM-DD" | null
    sortOrder: integer("sort_order").notNull().default(0),
    /** TOʻLIQ Task obyekti — oʻqishda aynan shu qaytariladi. */
    data: jsonb("data").$type<Record<string, unknown>>().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("tasks_teacher_idx").on(t.teacherId)]
);

export type TaskRow = typeof tasks.$inferSelect;

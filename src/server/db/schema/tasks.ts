import { index, integer, jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { teachers } from "./teachers";

/* ════════════════════════════════════════════════════════════════════
   VAZIFALAR — jadval fizik saqlanib qolgan (eski Tasks funksiyasi
   o'chirilganda sxema fayli olib tashlangan edi, lekin DROP migratsiyasi
   yo'q). Shu fayl 0019 snapshotdagi shaklga AYNAN mos — `drizzle-kit
   generate` yangi migratsiya chiqarmasligi kerak.

   `status`/`dueDate`/`sortOrder` — denormallangan ustunlar (filtr/sort
   uchun); `data` — to'liq Task obyekti (src/lib/tasks-data.ts) JSONB'da.
   ════════════════════════════════════════════════════════════════════ */

export const tasks = pgTable(
  "tasks",
  {
    id: text("id").primaryKey(),
    teacherId: text("teacher_id")
      .notNull()
      .references(() => teachers.id, { onDelete: "cascade" }),
    status: text("status").notNull(),
    dueDate: text("due_date"),
    sortOrder: integer("sort_order").notNull().default(0),
    data: jsonb("data").notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("tasks_teacher_idx").on(t.teacherId)]
);

export type TaskRow = typeof tasks.$inferSelect;

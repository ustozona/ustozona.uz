import { boolean, index, integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { teachers } from "./teachers";

/* ════════════════════════════════════════════════════════════════════
   BILDIRISHNOMALAR — header qoʻngʻiroq (useNotificationsStore).

   Yassi va kichik yozuvlar — JSONB'siz oddiy ustunlar. createdAt client
   ISO satri (NotificationItem.createdAt bilan aynan mos, timetable
   precedenti); sortOrder store massiv tartibini aynan saqlaydi
   (yangi bildirishnoma boshiga qoʻshiladi).
   ════════════════════════════════════════════════════════════════════ */

export const notifications = pgTable(
  "notifications",
  {
    id: text("id").primaryKey(),
    teacherId: text("teacher_id")
      .notNull()
      .references(() => teachers.id, { onDelete: "cascade" }),
    kind: text("kind").notNull(), // reply | feedback | status | system
    title: text("title").notNull(),
    body: text("body"),
    href: text("href"),
    /* status-kind bildirishnomalar uchun aniq holat pill'i (m-n Feedback
       STATUS_META'dagi rang/label) — boshqa kind'larda null, generic
       KIND_BADGE'ga qaytadi. */
    badgeLabel: text("badge_label"),
    badgeClassName: text("badge_class_name"),
    read: boolean("read").notNull().default(false),
    createdAt: text("created_at").notNull(), // client ISO satri
    sortOrder: integer("sort_order").notNull().default(0),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("notifications_teacher_idx").on(t.teacherId)]
);

export type NotificationRow = typeof notifications.$inferSelect;

import { pgTable, text, timestamp, jsonb, index } from "drizzle-orm/pg-core";

/* ════════════════════════════════════════════════════════════════════
   ADMIN AUDIT LOG — har bir admin mutatsiyasi shu yerga yoziladi.

   actorUserId ATAYLAB FK emas: foydalanuvchi oʻchirilsa ham log
   qolishi shart. actorEmail/targetLabel — oʻchishga chidamli snapshot.
   ════════════════════════════════════════════════════════════════════ */

export const adminAuditLogs = pgTable(
  "admin_audit_logs",
  {
    id: text("id").primaryKey(),
    actorUserId: text("actor_user_id").notNull(),
    actorEmail: text("actor_email").notNull(),
    /** Masalan: "user.ban", "feedback.reply", "school.create" */
    action: text("action").notNull(),
    targetType: text("target_type"),
    targetId: text("target_id"),
    /** Insonga tushunarli snapshot (masalan target email yoki maktab nomi). */
    targetLabel: text("target_label"),
    meta: jsonb("meta").notNull().default({}),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("admin_audit_createdAt_idx").on(table.createdAt),
    index("admin_audit_actor_idx").on(table.actorUserId),
  ],
);

export type AdminAuditLogRow = typeof adminAuditLogs.$inferSelect;

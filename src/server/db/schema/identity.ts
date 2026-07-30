import { pgTable, primaryKey, text, timestamp } from "drizzle-orm/pg-core";
import { user } from "./auth";
import { teachers } from "./teachers";
import { classes, students } from "./classes";

/* ════════════════════════════════════════════════════════════════════
   IDENTITY — Shogird (oʻquvchi/ota-ona) shaxsiyat qatlami.

   docs/ost-loyihalar-arxitektura.md, A boʻlim. `students.userId` FK
   emas, koʻp-koʻpga bogʻlanish `student_links` orqali: bitta ota-ona →
   N bola, bitta bola → N oʻqituvchi qatori (3 oʻqituvchi oʻqitsa —
   3 ta alohida `students` qatori, shu bois PK bitta FK bilan
   ifodalanmaydi).
   ════════════════════════════════════════════════════════════════════ */

/** Auth user ↔ student bogʻlanishi. PK — bitta user bitta bolaga bir marta bogʻlanadi. */
export const studentLinks = pgTable(
  "student_links",
  {
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    studentId: text("student_id")
      .notNull()
      .references(() => students.id, { onDelete: "cascade" }),
    /** parent | guardian | self (oʻquvchining oʻzi). */
    relation: text("relation").notNull(),
    grantedBy: text("granted_by").references(() => teachers.id, { onDelete: "set null" }),
    verifiedAt: timestamp("verified_at", { withTimezone: true }),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.studentId] })]
);

/** Taklif kodi — OʻQITUVCHI beradi, maktab emas (docs/MANTIQ.md). */
export const studentInvites = pgTable("student_invites", {
  id: text("id").primaryKey(),
  code: text("code").notNull().unique(),
  teacherId: text("teacher_id")
    .notNull()
    .references(() => teachers.id, { onDelete: "cascade" }),
  /** classId toʻldirilsa — sinfga qoʻshiluvchi umumiy kod. */
  classId: text("class_id").references(() => classes.id, { onDelete: "cascade" }),
  /** studentId toʻldirilsa — aniq bolaga bogʻlangan shaxsiy taklif (ota-ona uchun). */
  studentId: text("student_id").references(() => students.id, { onDelete: "cascade" }),
  relation: text("relation").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  usedAt: timestamp("used_at", { withTimezone: true }),
  usedBy: text("used_by").references(() => user.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/** Telegram initData orqali kiruvchi Shogird foydalanuvchisi. */
export const userTelegram = pgTable("user_telegram", {
  telegramId: text("telegram_id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  username: text("username"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type StudentLinkRow = typeof studentLinks.$inferSelect;
export type NewStudentLinkRow = typeof studentLinks.$inferInsert;
export type StudentInviteRow = typeof studentInvites.$inferSelect;
export type NewStudentInviteRow = typeof studentInvites.$inferInsert;
export type UserTelegramRow = typeof userTelegram.$inferSelect;
export type NewUserTelegramRow = typeof userTelegram.$inferInsert;

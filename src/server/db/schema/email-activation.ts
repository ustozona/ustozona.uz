import { boolean, jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { user } from "./auth";

/* ════════════════════════════════════════════════════════════════════
   EMAIL AKTIVATSIYA — har foydalanuvchiga BITTA qator.

   Spesifikatsiya: docs/email-aktivatsiya-spec.md

   Nega cron yoʻq: xat trigger paytida kelajakka rejalashtiriladi
   (Resend `scheduledAt`, 30 kungacha) va qaytgan id shu yerga
   yoziladi. Foydalanuvchi kutilgan ishni bajarsa, oʻsha id
   `emails.cancel()` bilan bekor qilinadi. Suppression shundan
   bepul chiqadi — bajarilgan ish uchun xat ketmaydi.

   ⚠️ Bekor qilingan xatni QAYTA rejalashtirib boʻlmaydi. Vaqtni
   surish kerak boʻlsa `emails.update({ id, scheduledAt })`.

   `optedOut` — obunani bekor qilish sahifasi va sozlamalardagi
   toggle shu ustunni yozadi. Tranzaksion xatlar (parolni tiklash)
   bunga BOGʻLIQ EMAS — ular baribir ketaveradi.
   ════════════════════════════════════════════════════════════════════ */

/** Zanjirdagi bosqich. `done` — zanjir tugadi, avtomatik xat yoʻq. */
export type ActivationStage = "a1" | "a2" | "a3" | "a4" | "done";

/** Yuborilgan xatlar jurnali. Kalit tartibi muhim emas — faqat oʻqiladi. */
export type ActivationSentEntry = { stage: ActivationStage; at: string };

export const emailActivation = pgTable("email_activation", {
  userId: text("user_id")
    .primaryKey()
    .references(() => user.id, { onDelete: "cascade" }),
  optedOut: boolean("opted_out").notNull().default(false),
  stage: text("stage").$type<ActivationStage>().notNull().default("a1"),
  /* Resend'da kutib turgan xat. null — hozir rejalashtirilgani yoʻq. */
  scheduledEmailId: text("scheduled_email_id"),
  scheduledFor: timestamp("scheduled_for", { withTimezone: true }),
  sentLog: jsonb("sent_log").$type<ActivationSentEntry[]>().notNull().default([]),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type EmailActivationRow = typeof emailActivation.$inferSelect;

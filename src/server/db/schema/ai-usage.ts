import { index, integer, jsonb, pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { user } from "./auth";

/* ════════════════════════════════════════════════════════════════════
   AI KUNLIK KVOTA + TELEMETRIYA — har foydalanuvchi kuniga nechta AI
   xabar yuborgani va nechta hujjat yuklagani. Limitlar: AI_DAILY_LIMIT
   (default 30 xabar), AI_DOC_DAILY_LIMIT (default 5 fayl). Kun —
   Asia/Tashkent (UTC+5) boʻyicha YYYY-MM-DD.

   `providers` — {gemini: n, groq: n, anthropic: n} — qaysi provayder
   qancha ishlatilgani (fallback chastotasini kuzatish uchun).
   ════════════════════════════════════════════════════════════════════ */

export const aiUsage = pgTable(
  "ai_usage",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    day: text("day").notNull(), // YYYY-MM-DD (Asia/Tashkent)
    count: integer("count").notNull().default(0),
    docCount: integer("doc_count").notNull().default(0),
    providers: jsonb("providers").$type<Record<string, number>>().notNull().default({}),
  },
  (t) => [uniqueIndex("ai_usage_user_day_idx").on(t.userId, t.day)]
);

/* Yuklangan hujjatlar (darslik rejimi) — egalik tekshiruvi uchun:
   chat faqat oʻz foydalanuvchisi yuklagan uri'ni qabul qiladi. */
export const aiDocs = pgTable(
  "ai_docs",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    uri: text("uri").notNull(),
    mimeType: text("mime_type").notNull(),
    name: text("name").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("ai_docs_user_idx").on(t.userId)]
);

/* Chat tarixi — har (foydalanuvchi, dars) uchun bitta suhbat.
   Xabarlar jsonb: {role, content}[]. */
export const aiChats = pgTable(
  "ai_chats",
  {
    id: text("id").primaryKey(), // `${userId}:${lessonId}`
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    lessonId: text("lesson_id").notNull(),
    messages: jsonb("messages")
      .$type<Array<{ role: "user" | "assistant"; content: string }>>()
      .notNull()
      .default([]),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("ai_chats_user_idx").on(t.userId)]
);

export type AiUsageRow = typeof aiUsage.$inferSelect;
export type AiDocRow = typeof aiDocs.$inferSelect;
export type AiChatRow = typeof aiChats.$inferSelect;

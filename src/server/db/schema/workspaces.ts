import { pgTable, text, timestamp } from "drizzle-orm/pg-core";

/* ════════════════════════════════════════════════════════════════════
   ISH MAYDONI — ijara (tenancy) birligi.

   ⭐ YADRO GʻOYA: **yakka oʻqituvchi — bu aʼzosi bitta boʻlgan maydon.**
   "Yakka rejim" va "maktab rejimi" degan ikki xil tizim YOʻQ — bitta
   tuzilma, faqat aʼzolar soni farq qiladi (Slack/Notion naqshi).

   ⛔ Shuning uchun kodda `if (kind === "school")` kabi shart HECH QACHON
   paydo boʻlmasligi kerak — bu yamoq qaytib kelganining birinchi belgisi.
   `kind` faqat KOʻRSATISH uchun (admin panelida shaxsiy maydonlar
   roʻyxatni toʻldirib yubormasin), ruxsat mantigʻi unga qaramaydi.

   ⚠️ Aʼzolik `workspace-members.ts` da — ATAYLAB alohida fayl:
   `teachers` maydonga (activeWorkspaceId), maydon aʼzolikka muhtoj
   boʻlgani uchun bitta faylda aylanma import chiqadi.

   Batafsil: docs/ish-maydoni-arxitektura.md
   ════════════════════════════════════════════════════════════════════ */

export const workspaces = pgTable("workspaces", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  /** personal = roʻyxatdan oʻtishda avtomatik yaratilgan | school = haqiqiy maktab. */
  kind: text("kind").notNull().default("personal"),
  region: text("region"),
  city: text("city"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type WorkspaceRow = typeof workspaces.$inferSelect;
export type NewWorkspaceRow = typeof workspaces.$inferInsert;

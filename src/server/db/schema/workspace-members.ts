import { index, pgTable, primaryKey, text, timestamp } from "drizzle-orm/pg-core";
import { teachers } from "./teachers";
import { workspaces } from "./workspaces";

/* ════════════════════════════════════════════════════════════════════
   AʼZOLIK — oʻqituvchi ↔ ish maydoni, KOʻP-KOʻPGA.

   ⭐ Nega koʻp-koʻpga (asoschi qarori 2026-08-22): Oʻzbekistonda
   oʻqituvchi maktabda ishlab, kechqurun repetitorlik ham qiladi.
   Repetitorlik oʻquvchilari maktab hamkasblariga koʻrinmasligi kerak —
   buning yagona toʻgʻri yoʻli ularni ALOHIDA maydonda saqlash.

   ⚠️ Bu jadval — ruxsatning YAGONA HOKIMIYATI. `teachers.school`
   (erkin matn) hech qachon guruhlash uchun ishlatilmaydi,
   `teachers.activeWorkspaceId` esa faqat "oxirgi tanlov" xotirasi.

   Rol:
     owner   — maydonni yaratgan (shaxsiy maydonda har doim shu)
     admin   — maktab admini (zavuch); kim qaysi darsni oʻtishini belgilaydi
     teacher — oddiy aʼzo
   ════════════════════════════════════════════════════════════════════ */

export const workspaceMembers = pgTable(
  "workspace_members",
  {
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    teacherId: text("teacher_id")
      .notNull()
      .references(() => teachers.id, { onDelete: "cascade" }),
    role: text("role").notNull().default("teacher"), // owner | admin | teacher
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    primaryKey({ columns: [t.workspaceId, t.teacherId] }),
    index("workspace_members_teacher_idx").on(t.teacherId),
  ]
);

export type WorkspaceMemberRow = typeof workspaceMembers.$inferSelect;

import { index, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { teachers } from "./teachers";
import { workspaces } from "./workspaces";

/* ════════════════════════════════════════════════════════════════════
   HAMKASBNI TAKLIF QILISH — ish maydoniga qoʻshilish kodi.

   ⭐ Nega KOD, email emas: bizda hali xat yuborish infratuzilmasi yoʻq,
   va Oʻzbekiston maktabida hamkasblar baribir bir xonada — kodni ogʻzaki
   yoki Telegram orqali berish tabiiyroq. Xuddi shu naqsh `student_invites`
   da ham tanlangan.

   🔴 BU JADVAL — RUXSAT BERUVCHI. Kod qoʻlga tushsa, begona odam maydonga
   kiradi va bolalar roʻyxatini koʻradi. Shu bois:
     - kodning amal qilish muddati bor (`expiresAt`)
     - bir marta ishlatiladi (`usedAt`) — ulashilgan havola qayta
       ishlatilmasin
     - bekor qilinadi (`revokedAt`) — noto'g'ri odamga yuborilgan kod
       o'chirilishi kerak, va "o'chirish" tarixni yo'q qilmasin

   ⚠️ `role` ATAYLAB taklifda saqlanadi, qabul qilishda emas: kimni admin
   qilish qarori taklif YOZILAYOTGANDA qabul qilinadi. Aks holda qabul
   qiluvchi oʻz rolini tanlab olardi.
   ════════════════════════════════════════════════════════════════════ */

export const workspaceInvites = pgTable(
  "workspace_invites",
  {
    id: text("id").primaryKey(),
    /** Ulashiladigan kod — chalkashmaydigan alifbo (0/O, 1/I yoʻq). */
    code: text("code").notNull().unique(),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    /** Qabul qiluvchiga beriladigan rol: admin | teacher. */
    role: text("role").notNull().default("teacher"),
    createdBy: text("created_by")
      .notNull()
      .references(() => teachers.id, { onDelete: "cascade" }),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    usedAt: timestamp("used_at", { withTimezone: true }),
    usedBy: text("used_by").references(() => teachers.id, { onDelete: "set null" }),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("workspace_invites_workspace_idx").on(t.workspaceId)]
);

export type WorkspaceInviteRow = typeof workspaceInvites.$inferSelect;

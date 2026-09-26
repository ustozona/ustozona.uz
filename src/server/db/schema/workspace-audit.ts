import { index, pgTable, text, timestamp, jsonb } from "drizzle-orm/pg-core";
import { teachers } from "./teachers";
import { workspaces } from "./workspaces";

/* ════════════════════════════════════════════════════════════════════
   ISH MAYDONI AUDITI — jamoa ichidagi kuzatiladigan amallar.

   ⚠️ Bu `admin_audit_logs` EMAS. Ikkalasi ataylab alohida:

   | | admin_audit_logs | workspace_audit_logs |
   |---|---|---|
   | Kim yozadi | Ustozona jamoasi (platforma) | Maydon aʼzolari |
   | Kim oʻqiydi | super_admin (`/admin/audit`) | Maydonning oʻzi |
   | Qamrov | Butun tizim | Bitta maydon |

   Bitta jadvalga qoʻshilsa, maktab oʻz tarixini koʻrish uchun platforma
   jurnaliga kirishi kerak boʻlardi — bu esa boshqa maktablarni ham
   ochib qoʻyardi (docs/ish-maydoni-arxitektura.md §11.1).

   🔴 NEGA UMUMAN KERAK: §11.6 qarori bilan admin butun maydon
   maʼlumotini OʻQIY oladi. Yozish taqiqlangan, lekin u oʻzini darsga
   biriktirib yoza boshlashi mumkin — va aynan shu qadam koʻrinadigan
   boʻlishi kerak edi. Iz qolmasa, qaror yarim qoladi.
   ════════════════════════════════════════════════════════════════════ */

export const workspaceAuditLogs = pgTable(
  "workspace_audit_logs",
  {
    id: text("id").primaryKey(),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    /** ⚠️ `set null` — oʻqituvchi oʻchsa ham IZ QOLADI. Aks holda
        "kim qildi" savolining javobi oʻsha odam bilan birga yoʻqolardi. */
    actorTeacherId: text("actor_teacher_id").references(() => teachers.id, {
      onDelete: "set null",
    }),
    /** Oʻqituvchi oʻchsa nom qolsin — snapshot, FK emas. */
    actorName: text("actor_name").notNull(),
    action: text("action").notNull(),
    targetType: text("target_type"),
    targetId: text("target_id"),
    /** Nishonning oʻsha paytdagi nomi — u keyin oʻzgarsa ham tarix oʻqiladi. */
    targetLabel: text("target_label"),
    meta: jsonb("meta").$type<Record<string, unknown>>().notNull().default({}),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("workspace_audit_workspace_idx").on(t.workspaceId, t.createdAt)]
);

export type WorkspaceAuditLogRow = typeof workspaceAuditLogs.$inferSelect;

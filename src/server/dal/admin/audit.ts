import "server-only";
import { desc, eq, and, type SQL } from "drizzle-orm";
import { db } from "@/server/db/client";
import { adminAuditLogs, type AdminAuditLogRow } from "@/server/db/schema";
import { requireAdmin, type AdminActor } from "@/server/session";

/* ════════════════════════════════════════════════════════════════════
   ADMIN AUDIT — har bir admin mutatsiyasi muvaffaqiyatdan KEYIN yoziladi.
   neon-http tranzaksiyasiz — yozuv best-effort (mavjud DAL normasi).
   ════════════════════════════════════════════════════════════════════ */

export type AdminAuditAction =
  | "user.set_role"
  | "user.ban"
  | "user.unban"
  | "user.delete"
  | "user.impersonate"
  | "user.reset_password"
  | "user.exclude_from_metrics"
  | "user.include_in_metrics"
  | "feedback.reply"
  | "feedback.status"
  | "school.create"
  | "school.update"
  | "school.delete"
  | "school.assign_teacher"
  // Bir martalik tuzatish vositasi (grades-audit.ts) — «800%» xatosi.
  | "grades.repair_percent";

export async function writeAuditLog(
  actor: AdminActor,
  entry: {
    action: AdminAuditAction;
    targetType?: string;
    targetId?: string;
    targetLabel?: string;
    meta?: Record<string, unknown>;
  },
): Promise<void> {
  await db.insert(adminAuditLogs).values({
    id: crypto.randomUUID(),
    actorUserId: actor.id,
    actorEmail: actor.email,
    action: entry.action,
    targetType: entry.targetType ?? null,
    targetId: entry.targetId ?? null,
    targetLabel: entry.targetLabel ?? null,
    meta: entry.meta ?? {},
  });
}

export type AuditLogPage = {
  items: AdminAuditLogRow[];
  total: number;
  page: number;
  pageSize: number;
};

export async function listAuditLogs(params: {
  action?: string;
  page?: number;
  pageSize?: number;
}): Promise<AuditLogPage> {
  await requireAdmin();
  const page = Math.max(1, params.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, params.pageSize ?? 50));

  const conditions: SQL[] = [];
  if (params.action) conditions.push(eq(adminAuditLogs.action, params.action));
  const where = conditions.length ? and(...conditions) : undefined;

  const [items, total] = await Promise.all([
    db
      .select()
      .from(adminAuditLogs)
      .where(where)
      .orderBy(desc(adminAuditLogs.createdAt))
      .limit(pageSize)
      .offset((page - 1) * pageSize),
    db.$count(adminAuditLogs, where),
  ]);

  return { items, total, page, pageSize };
}

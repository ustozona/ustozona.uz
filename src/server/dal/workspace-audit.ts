import "server-only";
import { randomUUID } from "node:crypto";
import { desc, eq } from "drizzle-orm";
import { db } from "@/server/db/client";
import { teachers, workspaceAuditLogs } from "@/server/db/schema";
import { requireWorkspace, requireWorkspaceAdmin, type WorkspaceContext } from "@/server/workspace";

/* ════════════════════════════════════════════════════════════════════
   ISH MAYDONI AUDITI — yozish va oʻqish.

   ⚠️ Yozuv amal MUVAFFAQIYATLI tugagandan KEYIN qoʻyiladi va u
   best-effort: audit yozilmagani uchun asosiy amal orqaga qaytmaydi
   (mavjud `admin/audit.ts` normasi bilan bir xil).
   ════════════════════════════════════════════════════════════════════ */

export type WorkspaceAuditAction =
  | "student.merge"
  | "class_teacher.add"
  | "class_teacher.remove"
  | "class.transfer_ownership"
  | "invite.create"
  | "invite.accept";

export async function writeWorkspaceAudit(
  ctx: WorkspaceContext,
  entry: {
    action: WorkspaceAuditAction;
    targetType?: string;
    targetId?: string;
    targetLabel?: string;
    meta?: Record<string, unknown>;
  }
): Promise<void> {
  const [actor] = await db
    .select({ name: teachers.name })
    .from(teachers)
    .where(eq(teachers.id, ctx.teacherId));

  await db.insert(workspaceAuditLogs).values({
    id: randomUUID(),
    workspaceId: ctx.workspaceId,
    actorTeacherId: ctx.teacherId,
    actorName: actor?.name ?? "Nomaʼlum",
    action: entry.action,
    targetType: entry.targetType ?? null,
    targetId: entry.targetId ?? null,
    targetLabel: entry.targetLabel ?? null,
    meta: entry.meta ?? {},
  });
}

export type WorkspaceAuditItem = {
  id: string;
  actorName: string;
  action: string;
  targetLabel: string | null;
  meta: Record<string, unknown>;
  createdAt: Date;
};

/**
 * Maydon tarixi — oxirgi 100 yozuv.
 *
 * ⚠️ Faqat admin oʻqiydi. Sabab: yozuvlar «kim kimni darsdan chiqardi»
 * kabi nozik maʼlumot; har aʼzoga ochilsa jamoa ichida keraksiz
 * kuzatuv muhiti paydo boʻladi. Bu qaror keyin yumshatilishi mumkin.
 */
export async function listWorkspaceAudit(): Promise<WorkspaceAuditItem[]> {
  const ctx = await requireWorkspaceAdmin();
  return db
    .select({
      id: workspaceAuditLogs.id,
      actorName: workspaceAuditLogs.actorName,
      action: workspaceAuditLogs.action,
      targetLabel: workspaceAuditLogs.targetLabel,
      meta: workspaceAuditLogs.meta,
      createdAt: workspaceAuditLogs.createdAt,
    })
    .from(workspaceAuditLogs)
    .where(eq(workspaceAuditLogs.workspaceId, ctx.workspaceId))
    .orderBy(desc(workspaceAuditLogs.createdAt))
    .limit(100);
}

/** Yozuv uchun kontekst — chaqiruvchi allaqachon tekshirgan boʻlsa qayta soʻramaslik. */
export async function auditContext(): Promise<WorkspaceContext> {
  return requireWorkspace();
}

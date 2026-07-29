"use server";

import { headers } from "next/headers";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { auth } from "@/server/auth";
import { requireAdmin } from "@/server/session";
import { writeAuditLog } from "@/server/dal/admin/audit";
import { db } from "@/server/db/client";
import { teachers } from "@/server/db/schema";

/* ════════════════════════════════════════════════════════════════════
   ADMIN → FOYDALANUVCHI MUTATSIYALARI.

   Hammasi server-side `auth.api.*` orqali — plugin ruxsat tekshiruvlari
   haqiqiy sessiyaga qarshi ishlaydi (headers uzatiladi), ban sessiya
   bekor qilish kabi yon effektlar bepul keladi. Har bir mutatsiya
   muvaffaqiyatdan keyin audit logga yoziladi.

   nextCookies() plagini tufayli impersonate/stopImpersonating server
   action ichida cookie yoza oladi (deleteAccountAction precedenti).
   ════════════════════════════════════════════════════════════════════ */

const ROLE_VALUES = ["teacher", "school_admin", "super_admin"] as const;

const setRoleSchema = z.object({
  userId: z.string().min(1),
  roles: z.array(z.enum(ROLE_VALUES)).min(1),
});

export async function setRoleAction(input: z.infer<typeof setRoleSchema>) {
  const { actor } = await requireAdmin();
  const { userId, roles } = setRoleSchema.parse(input);
  const hdrs = await headers();
  await auth.api.setRole({ body: { userId, role: roles }, headers: hdrs });
  await writeAuditLog(actor, {
    action: "user.set_role",
    targetType: "user",
    targetId: userId,
    meta: { roles },
  });
  return { ok: true as const };
}

const banSchema = z.object({
  userId: z.string().min(1),
  reason: z.string().trim().min(1).max(500),
  /** Kunlarda; undefined = muddatsiz. */
  expiresInDays: z.number().int().positive().max(3650).optional(),
});

export async function banUserAction(input: z.infer<typeof banSchema>) {
  const { actor } = await requireAdmin();
  const { userId, reason, expiresInDays } = banSchema.parse(input);
  const hdrs = await headers();
  await auth.api.banUser({
    body: {
      userId,
      banReason: reason,
      banExpiresIn: expiresInDays ? expiresInDays * 24 * 60 * 60 : undefined,
    },
    headers: hdrs,
  });
  await writeAuditLog(actor, {
    action: "user.ban",
    targetType: "user",
    targetId: userId,
    meta: { reason, expiresInDays: expiresInDays ?? null },
  });
  return { ok: true as const };
}

const userIdSchema = z.object({ userId: z.string().min(1) });

export async function unbanUserAction(input: z.infer<typeof userIdSchema>) {
  const { actor } = await requireAdmin();
  const { userId } = userIdSchema.parse(input);
  await auth.api.unbanUser({ body: { userId }, headers: await headers() });
  await writeAuditLog(actor, {
    action: "user.unban",
    targetType: "user",
    targetId: userId,
  });
  return { ok: true as const };
}

const removeSchema = z.object({
  userId: z.string().min(1),
  /** Audit uchun snapshot — oʻchirilgandan keyin email topilmaydi. */
  email: z.string().min(1),
});

export async function removeUserAction(input: z.infer<typeof removeSchema>) {
  const { actor } = await requireAdmin();
  const { userId, email } = removeSchema.parse(input);
  // user qatori oʻchishi cascade orqali teachers → butun domen daraxtini
  // tozalaydi (deleteAccountAction bilan bir xil zanjir).
  await auth.api.removeUser({ body: { userId }, headers: await headers() });
  await writeAuditLog(actor, {
    action: "user.delete",
    targetType: "user",
    targetId: userId,
    targetLabel: email,
  });
  return { ok: true as const };
}

const resetSchema = z.object({ email: z.string().email() });

export async function resetPasswordAction(input: z.infer<typeof resetSchema>) {
  const { actor } = await requireAdmin();
  const { email } = resetSchema.parse(input);
  await auth.api.requestPasswordReset({
    body: { email, redirectTo: "/reset-password" },
  });
  await writeAuditLog(actor, {
    action: "user.reset_password",
    targetType: "user",
    targetLabel: email,
  });
  return { ok: true as const };
}

export async function impersonateUserAction(
  input: z.infer<typeof userIdSchema>,
) {
  const { actor } = await requireAdmin();
  const { userId } = userIdSchema.parse(input);
  // Audit avval — impersonatsiyadan keyin joriy sessiya almashadi.
  await writeAuditLog(actor, {
    action: "user.impersonate",
    targetType: "user",
    targetId: userId,
  });
  await auth.api.impersonateUser({
    body: { userId },
    headers: await headers(),
  });
  return { ok: true as const };
}

const excludeFromMetricsSchema = z.object({
  userId: z.string().min(1),
  excluded: z.boolean(),
});

export async function setExcludeFromMetricsAction(
  input: z.infer<typeof excludeFromMetricsSchema>,
) {
  const { actor } = await requireAdmin();
  const { userId, excluded } = excludeFromMetricsSchema.parse(input);
  await db.update(teachers).set({ excludeFromMetrics: excluded }).where(eq(teachers.id, userId));
  await writeAuditLog(actor, {
    action: excluded ? "user.exclude_from_metrics" : "user.include_in_metrics",
    targetType: "user",
    targetId: userId,
  });
  return { ok: true as const };
}

export async function stopImpersonatingAction() {
  // requireAdmin ATAYLAB YOʻQ: impersonatsiya sessiyasida rol teacher.
  await auth.api.stopImpersonating({ headers: await headers() });
  return { ok: true as const };
}

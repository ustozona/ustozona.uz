"use server";

import { headers } from "next/headers";
import { z } from "zod";
import { auth } from "@/server/auth";
import { requireAdmin } from "@/server/session";
import { isSuperAdmin } from "@/lib/auth-roles";
import { writeAuditLog } from "@/server/dal/admin/audit";
import {
  countActiveSuperAdmins,
  getUserRoleSnapshot,
  hasPasswordAccount,
  setExcludeFromMetrics,
} from "@/server/dal/admin/users";

/* ════════════════════════════════════════════════════════════════════
   ADMIN → FOYDALANUVCHI MUTATSIYALARI.

   Hammasi server-side `auth.api.*` orqali — plugin ruxsat tekshiruvlari
   haqiqiy sessiyaga qarshi ishlaydi (headers uzatiladi), ban sessiya
   bekor qilish kabi yon effektlar bepul keladi. Har bir mutatsiya
   muvaffaqiyatdan keyin audit logga yoziladi.

   nextCookies() plagini tufayli impersonate/stopImpersonating server
   action ichida cookie yoza oladi (deleteAccountAction precedenti).
   ════════════════════════════════════════════════════════════════════ */

/* ════════════════════════════════════════════════════════════════════
   QULFLANIB QOLISHDAN HIMOYA — SERVERDA.

   Jadvaldagi tugmalar oʻz hisobingiz uchun allaqachon oʻchirilgan, lekin
   bu faqat KOʻRINISH qatlami: server action'ni toʻgʻridan-toʻgʻri
   chaqirish mumkin, shu bois shart shu yerda ham tekshiriladi.

   Ikki xil qulflanish bor va ikkalasi ham bir xil oqibatga olib keladi —
   admin panelga hech kim kira olmaydi, faqat bazaga qoʻlda kirib tuzatish
   qoladi:

   1) OʻZINGIZ — oʻzini bloklash, oʻchirish yoki super_admin rolini
      olib tashlash.
   2) OXIRGISI — panelda bittagina super_admin qolgan boʻlsa, uni
      (boshqa odam boʻlsa ham) bloklash / oʻchirish / roldan tushirish.
   ════════════════════════════════════════════════════════════════════ */

const ROLE_VALUES = ["teacher", "school_admin", "super_admin"] as const;

function assertNotSelf(actorId: string, userId: string, amal: string): void {
  if (actorId === userId) {
    throw new Error(
      `Oʻz hisobingizni ${amal} mumkin emas — admin paneliga kira olmay qolasiz.`,
    );
  }
}

/** `userId` super_admin huquqini yoʻqotmoqchi — undan keyin hech kim
    qolmasa, amalni rad etamiz. */
async function assertSuperAdminRemains(userId: string, amal: string): Promise<void> {
  const target = await getUserRoleSnapshot(userId);
  // Nishon allaqachon super_admin emas yoki bloklangan — sanoqqa kirmaydi.
  if (!target || !isSuperAdmin(target) || target.banned) return;
  if ((await countActiveSuperAdmins()) <= 1) {
    throw new Error(
      `Bu — yagona faol super admin. Uni ${amal} admin paneli butunlay ` +
        `yopiladi. Avval boshqa hisobga super admin rolini bering.`,
    );
  }
}

const setRoleSchema = z.object({
  userId: z.string().min(1),
  roles: z.array(z.enum(ROLE_VALUES)).min(1),
});

export async function setRoleAction(input: z.infer<typeof setRoleSchema>) {
  const { actor } = await requireAdmin();
  const { userId, roles } = setRoleSchema.parse(input);
  /* Rolni saqlash — super_admin OLIB TASHLANAYOTGAN boʻlsagina xavfli.
     Rol qoʻshish yoki boshqa oʻzgarish erkin. */
  if (!roles.includes("super_admin")) {
    assertNotSelf(actor.id, userId, "super admin rolidan tushirish");
    await assertSuperAdminRemains(userId, "roldan tushirsangiz");
  }
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
  assertNotSelf(actor.id, userId, "bloklash");
  await assertSuperAdminRemains(userId, "bloklasangiz");
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
  assertNotSelf(actor.id, userId, "oʻchirish");
  await assertSuperAdminRemains(userId, "oʻchirsangiz");
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

  /* ⚠️ Google bilan kirgan hisobda PAROL YOʻQ — `requestPasswordReset`
     jimgina muvaffaqiyat qaytaradi, panel «Xat yuborildi» deydi, xat esa
     hech qachon kelmaydi. Admin oʻqituvchiga «yubordim» deb aytadi va
     ikkalasi ham kutib qoladi. Shuning uchun oldindan tekshiramiz:
     parol bilan kirish `account.provider_id = 'credential'` qatori bor
     hisobda mavjud. */
  if (!(await hasPasswordAccount(email))) {
    throw new Error(
      "Bu hisobda parol yoʻq — Google orqali kirilgan. Parol tiklash xati " +
        "yuborilmaydi; foydalanuvchi avvalgidek Google bilan kirsin.",
    );
  }

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
  assertNotSelf(actor.id, userId, "sifatida koʻrish");

  /* ⚠️ Audit KEYIN yoziladi, avval emas. Ilgari teskari edi — «sessiya
     almashadi» degan xavotir bilan. Xavotir asossiz: `writeAuditLog`
     yuqorida olingan `actor` nusxasiga yozadi va oʻzi qayta sessiya
     soʻramaydi. Teskari tartibning narxi esa haqiqiy edi —
     impersonatsiya yiqilsa ham jurnalda «kirdi» deb qolardi, yaʼni
     audit jurnali boʻlmagan voqeani tasdiqlardi. */
  await auth.api.impersonateUser({
    body: { userId },
    headers: await headers(),
  });
  await writeAuditLog(actor, {
    action: "user.impersonate",
    targetType: "user",
    targetId: userId,
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
  await setExcludeFromMetrics(userId, excluded);
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

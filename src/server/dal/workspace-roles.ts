import "server-only";
import { and, eq } from "drizzle-orm";
import { db } from "@/server/db/client";
import { teachers, workspaceMembers } from "@/server/db/schema";
import { ForbiddenError } from "@/server/session";
import { requireWorkspace, requireWorkspaceAdmin } from "@/server/workspace";
import { moveTeacherToWorkspace } from "./workspace-membership";
import { writeWorkspaceAudit } from "./workspace-audit";

/* ════════════════════════════════════════════════════════════════════
   MAYDON AʼZOLIGINI BOSHQARISH — egalikni oʻtkazish va aʼzoni chiqarish.

   🔴 NEGA BU FAYL BOR: maydonda EGASIZ holat boʻlishi mumkin emas edi,
   lekin uni taqiqlaydigan hech narsa yoʻq edi. Ega chiqib ketsa sinf va
   oʻquvchilar egasiz qolardi va buni UI orqali tuzatishning yoʻli
   yoʻq edi (docs/ish-maydoni-arxitektura.md §10.6).

   ⭐ Uch amal bir joyda, chunki ular BITTA invariantni saqlaydi:
   «har maydonda kamida bitta `owner` bor».

     transferWorkspaceOwnership — egalikni beradi (eski ega `admin` boʻladi)
     removeWorkspaceMember      — boshqani chiqaradi (egani EMAS)
     assertNotLastOwner         — oʻzi chiqmoqchi boʻlganda toʻsadi

   ⚠️ Chiqarilgan oʻqituvchining sinf va oʻquvchilari maydonda QOLADI —
   ular maktabniki (`workspace-membership.ts` izohi). U shaxsiy
   maydoniga BOʻSH qaytadi. Baholari oʻchmaydi: mualliflik `teacherId`
   yozuvda qoladi (§3.2).
   ════════════════════════════════════════════════════════════════════ */

/**
 * Egalikni boshqa aʼzoga oʻtkazadi.
 *
 * Eski ega `admin` boʻlib qoladi — `teacher` emas. Sabab: oʻtkazish
 * odatda «men ketyapman» yoki «sen boshqar» degani, va odamni bir
 * amalda barcha huquqidan mahrum qilish uni oʻz maydonidan qulflab
 * qoʻyishi mumkin. Kerak boʻlsa yangi ega uni chiqaradi.
 */
export async function transferWorkspaceOwnership(targetTeacherId: string): Promise<void> {
  const ctx = await requireWorkspace();
  if (ctx.role !== "owner") {
    throw new ForbiddenError("Egalikni faqat maydon egasi oʻtkaza oladi");
  }
  if (targetTeacherId === ctx.teacherId) {
    throw new ForbiddenError("Egalik allaqachon sizda");
  }

  const [target] = await db
    .select({ name: teachers.name })
    .from(teachers)
    .innerJoin(
      workspaceMembers,
      and(
        eq(workspaceMembers.teacherId, teachers.id),
        eq(workspaceMembers.workspaceId, ctx.workspaceId)
      )
    )
    .where(eq(teachers.id, targetTeacherId));
  if (!target) throw new ForbiddenError("Bu oʻqituvchi maydon aʼzosi emas");

  /* ⚠️ Ikkala yozuv bitta tranzaksiyada. Yarim bajarilsa maydonda ikki
     ega yoki hech qanday ega qolardi — ikkinchisi tuzatib boʻlmaydigan
     holat, chunki egasiz maydonda egalikni oʻtkazadigan odam yoʻq. */
  await db.transaction(async (tx) => {
    await tx
      .update(workspaceMembers)
      .set({ role: "admin" })
      .where(
        and(
          eq(workspaceMembers.workspaceId, ctx.workspaceId),
          eq(workspaceMembers.teacherId, ctx.teacherId)
        )
      );
    await tx
      .update(workspaceMembers)
      .set({ role: "owner" })
      .where(
        and(
          eq(workspaceMembers.workspaceId, ctx.workspaceId),
          eq(workspaceMembers.teacherId, targetTeacherId)
        )
      );
  });

  await writeWorkspaceAudit(ctx, {
    action: "workspace.transfer_ownership",
    targetType: "teacher",
    targetId: targetTeacherId,
    targetLabel: target.name,
  });
}

/**
 * Aʼzoni butun maydondan chiqaradi.
 *
 * ⛔ Egani chiqarib boʻlmaydi — avval egalik oʻtkazilishi kerak. Bu
 * shunchaki qulaylik cheklovi emas: admin egani chiqara olsa, u bir
 * amalda maydonni egallab olardi.
 */
export async function removeWorkspaceMember(targetTeacherId: string): Promise<void> {
  const ctx = await requireWorkspaceAdmin();
  if (targetTeacherId === ctx.teacherId) {
    throw new ForbiddenError("Oʻzingizni chiqara olmaysiz — «Jamoadan chiqish» dan foydalaning");
  }

  const [target] = await db
    .select({ role: workspaceMembers.role, name: teachers.name })
    .from(workspaceMembers)
    .innerJoin(teachers, eq(teachers.id, workspaceMembers.teacherId))
    .where(
      and(
        eq(workspaceMembers.workspaceId, ctx.workspaceId),
        eq(workspaceMembers.teacherId, targetTeacherId)
      )
    );
  if (!target) throw new ForbiddenError("Bu oʻqituvchi maydon aʼzosi emas");

  if (target.role === "owner") {
    throw new ForbiddenError("Maydon egasini chiqarib boʻlmaydi");
  }
  /* Adminni faqat ega chiqaradi — adminlar bir-birini chiqarib
     tashlashi jamoada tugamaydigan holat yaratardi. */
  if (target.role === "admin" && ctx.role !== "owner") {
    throw new ForbiddenError("Maʼmuriyat aʼzosini faqat maydon egasi chiqara oladi");
  }

  await moveTeacherToWorkspace(targetTeacherId, null);

  await writeWorkspaceAudit(ctx, {
    action: "member.remove",
    targetType: "teacher",
    targetId: targetTeacherId,
    targetLabel: target.name,
  });
}

/**
 * Maydonni tark etish mumkinmi.
 *
 * ⛔ Ega chiqa olmaydi. UI'da tugma allaqachon yashirilgan, lekin server
 * amali baribir chaqirilishi mumkin — va bu tekshiruv boʻlmasa maydon
 * egasiz qolardi (§10.6 dagi yagona maʼlumot yoʻqotadigan holat).
 */
export async function assertCanLeaveWorkspace(role: string): Promise<void> {
  if (role === "owner") {
    throw new ForbiddenError(
      "Siz maydon egasisiz. Avval egalikni boshqa aʼzoga oʻtkazing, keyin chiqing"
    );
  }
}

import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/server/db/client";
import { classes, students, teachers, workspaceMembers, workspaces } from "@/server/db/schema";

/* ════════════════════════════════════════════════════════════════════
   MAYDONGA QOʻSHILISH — yagona amal.

   ⚠️ Bu mantiq IKKI joydan chaqiriladi: platforma admini oʻqituvchini
   maktabga biriktirganda (`dal/admin/schools.ts`) va oʻqituvchining oʻzi
   taklif kodini qabul qilganda (`dal/workspace-invites.ts`).

   ⛔ IKKI NUSXA YOZILMASIN. Tranzaksiya ichida beshta nozik qadam bor
   (ish koʻchishi, eski aʼzoliklarni tozalash, shaxsiy maydonni tiklash,
   faol maydonni oʻzgartirish) — nusxalar vaqt oʻtib ajralib ketadi va
   qaysi biri toʻgʻri ekanini hech kim bilmaydi.
   ════════════════════════════════════════════════════════════════════ */

/**
 * Oʻqituvchini boshqa ish maydoniga koʻchiradi.
 *
 * ⭐ ISHI HAM KOʻCHADI. Asoschi qarori (2026-08-22): oʻqituvchi bir
 * vaqtda bitta joyda ishlaydi. Ilgari maktabga qoʻshilganda unga BOʻSH
 * ikkinchi maydon paydo boʻlardi va u ilovani boʻsh koʻrardi.
 *
 * ⚠️ `students`/`classes` shaxsiy maydondan koʻchiriladi, maktabdan
 * EMAS: maktab oʻz yozuvlarini saqlaydi (chiqib ketgan oʻqituvchi
 * sinflarni oʻzi bilan olib keta olmaydi).
 *
 * `targetWorkspaceId = null` — shaxsiy maydonga qaytarish.
 */
export async function moveTeacherToWorkspace(
  teacherId: string,
  targetWorkspaceId: string | null,
  role: string = "teacher"
): Promise<string> {
  const target = targetWorkspaceId ?? `ws-${teacherId}`;

  await db.transaction(async (tx) => {
    /* ⛔ Chaqiruvchidan kelgan maydon id'si BAZADA borligi tekshiriladi.
       `schoolId` admin panelidan, `invite.workspaceId` esa taklif
       qatoridan keladi — ikkalasi ham maydon oradan oʻchirilgan boʻlsa
       eskirgan qiymat boʻlishi mumkin. Tekshiruvsiz pastdagi insert
       23503 (`workspace_members_workspace_id_workspaces_id_fk`) bilan
       yiqilar, lekin undan OLDIN eski aʼzolik allaqachon oʻchirilgan
       boʻlar edi — oʻqituvchi umuman maydonsiz qolardi. */
    if (targetWorkspaceId) {
      const [exists] = await tx
        .select({ id: workspaces.id })
        .from(workspaces)
        .where(eq(workspaces.id, targetWorkspaceId));
      if (!exists) {
        throw new Error(`Ish maydoni topilmadi: ${targetWorkspaceId}`);
      }
    }

    const current = await tx
      .select({ workspaceId: workspaceMembers.workspaceId, kind: workspaces.kind })
      .from(workspaceMembers)
      .innerJoin(workspaces, eq(workspaces.id, workspaceMembers.workspaceId))
      .where(eq(workspaceMembers.teacherId, teacherId));

    if (targetWorkspaceId) {
      const personal = current.find((m) => m.kind === "personal");
      if (personal && personal.workspaceId !== targetWorkspaceId) {
        await tx
          .update(classes)
          .set({ workspaceId: targetWorkspaceId })
          .where(eq(classes.workspaceId, personal.workspaceId));
        await tx
          .update(students)
          .set({ workspaceId: targetWorkspaceId })
          .where(eq(students.workspaceId, personal.workspaceId));
      }
    }

    // Yakka aʼzolik: eskilari olib tashlanadi (§4.2 — koʻp-maydonlilik
    // sxemada bor, lekin UI'dan hali berilmaydi).
    await tx.delete(workspaceMembers).where(eq(workspaceMembers.teacherId, teacherId));

    if (!targetWorkspaceId) {
      // Shaxsiy maydon oʻchirilgan boʻlishi mumkin emas, lekin idempotent.
      const [t] = await tx.select().from(teachers).where(eq(teachers.id, teacherId));
      await tx
        .insert(workspaces)
        .values({ id: target, name: t?.name ?? "Shaxsiy", kind: "personal" })
        .onConflictDoNothing();
    }

    await tx
      .insert(workspaceMembers)
      .values({ workspaceId: target, teacherId, role: targetWorkspaceId ? role : "owner" })
      .onConflictDoNothing();
    await tx
      .update(teachers)
      .set({ activeWorkspaceId: target })
      .where(eq(teachers.id, teacherId));
  });

  return target;
}

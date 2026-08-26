import "server-only";
import { randomInt, randomUUID } from "node:crypto";
import { and, desc, eq, gt, isNull } from "drizzle-orm";
import { db } from "@/server/db/client";
import { teachers, workspaceInvites, workspaceMembers, workspaces } from "@/server/db/schema";
import { ForbiddenError, requireTeacher } from "@/server/session";
import { requireWorkspace, requireWorkspaceAdmin } from "@/server/workspace";
import { moveTeacherToWorkspace } from "./workspace-membership";

/* ════════════════════════════════════════════════════════════════════
   HAMKASBNI TAKLIF QILISH.

   Oqim: ega/admin kod yaratadi → kodni hamkasbga beradi → hamkasb
   sozlamalarda kodni kiritadi va TASDIQLAYDI.

   🔴 Qabul qilish — QAYTARILMAS amal: oʻqituvchining sinf va
   oʻquvchilari yangi maydonga koʻchadi va u oʻz shaxsiy maydoniga
   "orqaga" qayta olmaydi (maktab oʻz yozuvlarini saqlaydi). Shu bois
   UI'da tasdiq oynasi va oqibati ochiq yozilishi SHART.

   Batafsil: docs/ish-maydoni-arxitektura.md §10.4
   ════════════════════════════════════════════════════════════════════ */

/** Chalkashmaydigan alifbo: 0/O, 1/I/L qoʻshilmagan (ogʻzaki aytiladi). */
const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const CODE_LENGTH = 8;
const TTL_DAYS = 7;

function generateCode(): string {
  let out = "";
  for (let i = 0; i < CODE_LENGTH; i += 1) out += ALPHABET[randomInt(ALPHABET.length)];
  return out;
}

export type WorkspaceInviteItem = {
  id: string;
  code: string;
  role: string;
  expiresAt: Date;
  usedAt: Date | null;
  usedByName: string | null;
  revokedAt: Date | null;
};

/** Taklif kodi yaratadi. Faqat maydon admini. */
export async function createWorkspaceInvite(role: "admin" | "teacher"): Promise<string> {
  const ctx = await requireWorkspaceAdmin();

  const expiresAt = new Date(Date.now() + TTL_DAYS * 24 * 60 * 60 * 1000);
  /* Kod unikal — toʻqnashuv ehtimoli 31^8 da juda kichik, lekin
     `code` UNIQUE boʻlgani uchun urinish qaytariladi. */
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const code = generateCode();
    const [row] = await db
      .insert(workspaceInvites)
      .values({
        id: randomUUID(),
        code,
        workspaceId: ctx.workspaceId,
        role,
        createdBy: ctx.teacherId,
        expiresAt,
      })
      .onConflictDoNothing()
      .returning({ code: workspaceInvites.code });
    if (row) return row.code;
  }
  throw new Error("Taklif kodi yaratilmadi");
}

/**
 * Maydonning FAOL taklif kodlari — eng yangisi birinchi.
 *
 * ⚠️ Ishlatilgan/bekor qilingan/muddati oʻtganlari qaytarilmaydi.
 * Filtr ATAYLAB serverda: "muddati oʻtdimi" savolining javobi vaqtga
 * bogʻliq, render paytida esa vaqt oʻqish mumkin emas (React Compiler
 * `Date.now()` ni nopok deb rad etadi va u haqli — natija har
 * render'da oʻzgaradi).
 */
export async function listWorkspaceInvites(): Promise<WorkspaceInviteItem[]> {
  const ctx = await requireWorkspaceAdmin();
  const rows = await db
    .select({
      id: workspaceInvites.id,
      code: workspaceInvites.code,
      role: workspaceInvites.role,
      expiresAt: workspaceInvites.expiresAt,
      usedAt: workspaceInvites.usedAt,
      revokedAt: workspaceInvites.revokedAt,
      usedByName: teachers.name,
    })
    .from(workspaceInvites)
    .leftJoin(teachers, eq(teachers.id, workspaceInvites.usedBy))
    .where(
      and(
        eq(workspaceInvites.workspaceId, ctx.workspaceId),
        isNull(workspaceInvites.usedAt),
        isNull(workspaceInvites.revokedAt),
        gt(workspaceInvites.expiresAt, new Date())
      )
    )
    .orderBy(desc(workspaceInvites.createdAt));
  return rows;
}

/** Kodni bekor qiladi. ⚠️ Qator OʻCHIRILMAYDI — kim taklif qilgani tarixi qoladi. */
export async function revokeWorkspaceInvite(inviteId: string): Promise<void> {
  const ctx = await requireWorkspaceAdmin();
  await db
    .update(workspaceInvites)
    .set({ revokedAt: new Date() })
    .where(
      and(
        eq(workspaceInvites.id, inviteId),
        eq(workspaceInvites.workspaceId, ctx.workspaceId),
        isNull(workspaceInvites.usedAt)
      )
    );
}

export type InvitePreview = {
  workspaceName: string;
  invitedByName: string;
  role: string;
};

/**
 * Kodni tekshiradi va nima taklif qilinayotganini qaytaradi.
 *
 * ⚠️ Hech narsani OʻZGARTIRMAYDI: oʻqituvchi qabul qilishdan oldin
 * qayerga qoʻshilayotganini koʻrishi kerak — qabul qaytarilmas.
 */
export async function previewWorkspaceInvite(code: string): Promise<InvitePreview> {
  await requireTeacher();
  const invite = await findUsableInvite(code);
  const [row] = await db
    .select({ workspaceName: workspaces.name, invitedByName: teachers.name })
    .from(workspaceInvites)
    .innerJoin(workspaces, eq(workspaces.id, workspaceInvites.workspaceId))
    .innerJoin(teachers, eq(teachers.id, workspaceInvites.createdBy))
    .where(eq(workspaceInvites.id, invite.id));
  if (!row) throw new ForbiddenError("Taklif topilmadi");
  return { ...row, role: invite.role };
}

/**
 * Taklifni qabul qiladi — oʻqituvchi va uning ishi maydonga koʻchadi.
 *
 * 🔴 Kod bir marta ishlaydi: `usedAt` shart bilan yangilanadi, yaʼni
 * ikki parallel soʻrovdan faqat bittasi oʻtadi. Busiz ulashilgan
 * havola bilan bir necha odam kirib olardi.
 */
export async function acceptWorkspaceInvite(code: string): Promise<void> {
  const teacher = await requireTeacher();
  const invite = await findUsableInvite(code);

  const [alreadyIn] = await db
    .select({ teacherId: workspaceMembers.teacherId })
    .from(workspaceMembers)
    .where(
      and(
        eq(workspaceMembers.workspaceId, invite.workspaceId),
        eq(workspaceMembers.teacherId, teacher.id)
      )
    );
  if (alreadyIn) throw new ForbiddenError("Siz allaqachon bu maydondasiz");

  /* ⭐ Kodni AVVAL band qilamiz, keyin koʻchiramiz. Teskarisi boʻlsa,
     koʻchirish muvaffaqiyatli tugab, band qilish poygada yutqazsa —
     kod hali ham "ishlatilmagan" boʻlib qolardi. */
  const claimed = await db
    .update(workspaceInvites)
    .set({ usedAt: new Date(), usedBy: teacher.id })
    .where(and(eq(workspaceInvites.id, invite.id), isNull(workspaceInvites.usedAt)))
    .returning({ id: workspaceInvites.id });
  if (claimed.length === 0) throw new ForbiddenError("Bu kod allaqachon ishlatilgan");

  await moveTeacherToWorkspace(teacher.id, invite.workspaceId, invite.role);
}

/** Maydonni tark etadi — shaxsiy maydonga qaytadi. */
export async function leaveWorkspace(): Promise<void> {
  const ctx = await requireWorkspace();
  if (ctx.workspaceId === `ws-${ctx.teacherId}`) {
    throw new ForbiddenError("Shaxsiy maydonni tark etib boʻlmaydi");
  }
  /* ⚠️ Sinf va oʻquvchilar maydonda QOLADI — ular maktabniki
     (dal/workspace-membership.ts izohi). */
  await moveTeacherToWorkspace(ctx.teacherId, null);
}

async function findUsableInvite(code: string) {
  const [invite] = await db
    .select()
    .from(workspaceInvites)
    .where(eq(workspaceInvites.code, code.trim().toUpperCase()));

  if (!invite) throw new ForbiddenError("Bunday kod topilmadi");
  if (invite.revokedAt) throw new ForbiddenError("Bu kod bekor qilingan");
  if (invite.usedAt) throw new ForbiddenError("Bu kod allaqachon ishlatilgan");
  if (invite.expiresAt.getTime() < Date.now()) throw new ForbiddenError("Kod muddati tugagan");
  return invite;
}

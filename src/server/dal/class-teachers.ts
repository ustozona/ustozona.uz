import "server-only";
import { and, asc, eq, inArray, ne } from "drizzle-orm";
import { db } from "@/server/db/client";
import { classTeachers, classes, teachers, workspaceMembers } from "@/server/db/schema";
import { ForbiddenError } from "@/server/session";
import { requireWorkspace, type WorkspaceContext } from "@/server/workspace";
import { writeWorkspaceAudit } from "./workspace-audit";

/* ════════════════════════════════════════════════════════════════════
   DARSNI KIM OʻTADI — hamkasb qoʻshish, chiqarish, egalik.

   🔴 Bu fayldagi har amal IMTIYOZ OSHIRISH nuqtasi: koʻrinuvchanlik
   "men oʻtadigan darsdagi bolalar" qoidasiga tayanadi, demak oʻzini
   darsga qoʻsha olgan odam OʻZIGA OʻZI ruxsat bergan boʻladi
   (docs/ish-maydoni-arxitektura.md §4.1).

   Shu bois qoida qatʼiy: qoʻshishni faqat SINF EGASI yoki MAYDON
   ADMINI qiladi. Hech kim oʻzini qoʻsha olmaydi.

   Naqsh manbai — ClassDojo «Shared Classes» (§10.1): ega hamkasb
   qoʻshadi, hamkasb esa faqat oʻzi chiqa oladi.
   ════════════════════════════════════════════════════════════════════ */

export type ClassTeacherItem = {
  teacherId: string;
  name: string;
  email: string;
  role: string;
  isMe: boolean;
};

/** Sinfdagi biriktirilgan oʻqituvchilar; ega birinchi. */
export async function listClassTeachers(classId: string): Promise<ClassTeacherItem[]> {
  const ctx = await assertInWorkspace(classId);
  const rows = await db
    .select({
      teacherId: classTeachers.teacherId,
      role: classTeachers.role,
      name: teachers.name,
      email: teachers.email,
    })
    .from(classTeachers)
    .innerJoin(teachers, eq(teachers.id, classTeachers.teacherId))
    .where(eq(classTeachers.classId, classId))
    .orderBy(asc(classTeachers.createdAt));

  return rows
    .map((r) => ({ ...r, isMe: r.teacherId === ctx.teacherId }))
    .sort((a, b) => (a.role === "owner" ? -1 : 0) - (b.role === "owner" ? -1 : 0));
}

/**
 * Hamkasbni darsga biriktiradi.
 *
 * ⚠️ Ikki tekshiruv MAJBURIY va ikkalasi ham serverda:
 *   1) chaqiruvchi — ega yoki maydon admini
 *   2) qoʻshilayotgan odam — SHU maydon aʼzosi
 *
 * Ikkinchisisiz begona oʻqituvchi id'si yuborilib, maydondan tashqari
 * odamga bolalar maʼlumoti ochilardi.
 */
export async function addClassTeacher(classId: string, teacherId: string): Promise<void> {
  const ctx = await assertCanManageClass(classId);

  const [member] = await db
    .select({ teacherId: workspaceMembers.teacherId })
    .from(workspaceMembers)
    .where(
      and(
        eq(workspaceMembers.workspaceId, ctx.workspaceId),
        eq(workspaceMembers.teacherId, teacherId)
      )
    );
  if (!member) throw new ForbiddenError("Bu oʻqituvchi ish maydonida yoʻq");

  await db
    .insert(classTeachers)
    .values({ classId, teacherId, role: "teacher" })
    .onConflictDoNothing();

  await writeWorkspaceAudit(ctx, {
    action: "class_teacher.add",
    targetType: "class",
    targetId: classId,
    targetLabel: await classLabel(classId),
    meta: { teacherId },
  });
}

/**
 * Hamkasbni darsdan chiqaradi.
 *
 * Ikki holat ruxsat etiladi: ega/admin boshqasini chiqaradi, YOKI
 * hamkasb oʻzi chiqadi («leave a shared class»).
 *
 * ⛔ Ega oʻzini chiqara olmaydi — sinf yetim qolardi. Avval egalik
 * oʻtkazilsin (§10.6 fors-major).
 */
export async function removeClassTeacher(classId: string, teacherId: string): Promise<void> {
  const ctx = await assertInWorkspace(classId);
  const rows = await currentTeachers(classId);

  const target = rows.find((r) => r.teacherId === teacherId);
  if (!target) return;

  const isSelf = teacherId === ctx.teacherId;
  if (!isSelf) await assertCanManageClass(classId);

  if (target.role === "owner") {
    throw new ForbiddenError("Avval egalik boshqa oʻqituvchiga oʻtkazilsin");
  }

  await db
    .delete(classTeachers)
    .where(and(eq(classTeachers.classId, classId), eq(classTeachers.teacherId, teacherId)));

  await writeWorkspaceAudit(ctx, {
    action: "class_teacher.remove",
    targetType: "class",
    targetId: classId,
    targetLabel: await classLabel(classId),
    meta: { teacherId, self: isSelf },
  });
}

/**
 * Egalikni oʻtkazadi.
 *
 * Fors-major yoʻli: oʻqituvchi ishdan boʻshadi, lekin sinf va undagi
 * baholar qolishi kerak. Maydon admini buni EGANING roziligisiz ham
 * qila oladi — ClassDojo'da ham School Leader shunday (§10.1).
 *
 * Eski ega darsda `teacher` boʻlib QOLADI: uni chiqarish alohida
 * qaror, va u tasodifan maʼlumotdan uzilib qolmasin.
 */
export async function transferClassOwnership(
  classId: string,
  toTeacherId: string
): Promise<void> {
  const ctx = await assertCanManageClass(classId);
  const rows = await currentTeachers(classId);
  if (!rows.some((r) => r.teacherId === toTeacherId)) {
    throw new ForbiddenError("Yangi ega avval darsga biriktirilsin");
  }

  await db.transaction(async (tx) => {
    await tx
      .update(classTeachers)
      .set({ role: "teacher" })
      .where(and(eq(classTeachers.classId, classId), ne(classTeachers.teacherId, toTeacherId)));
    await tx
      .update(classTeachers)
      .set({ role: "owner" })
      .where(and(eq(classTeachers.classId, classId), eq(classTeachers.teacherId, toTeacherId)));
  });

  await writeWorkspaceAudit(ctx, {
    action: "class.transfer_ownership",
    targetType: "class",
    targetId: classId,
    targetLabel: await classLabel(classId),
    meta: { toTeacherId },
  });
}

/** Sinf nomi audit yozuvi uchun — nom keyin oʻzgarsa ham tarix oʻqiladi. */
async function classLabel(classId: string): Promise<string> {
  const [row] = await db.select({ name: classes.name }).from(classes).where(eq(classes.id, classId));
  return row?.name ?? classId;
}

/* ─── ichki yordamchilar ─────────────────────────────────────────── */

async function currentTeachers(classId: string) {
  return db
    .select({ teacherId: classTeachers.teacherId, role: classTeachers.role })
    .from(classTeachers)
    .where(eq(classTeachers.classId, classId));
}

/** Sinf faol maydonda ekanini tasdiqlaydi (koʻrish darajasi). */
async function assertInWorkspace(classId: string): Promise<WorkspaceContext> {
  const ctx = await requireWorkspace();
  const [row] = await db
    .select({ id: classes.id })
    .from(classes)
    .where(and(eq(classes.id, classId), eq(classes.workspaceId, ctx.workspaceId)));
  if (!row) throw new ForbiddenError("Bu sinf topilmadi");
  return ctx;
}

/**
 * Boshqaruv huquqi — sinf egasi YOKI maydon admini.
 *
 * ⚠️ Bu §11.6 dagi "admin faqat oʻqiydi" qoidasiga zid emas: admin
 * baho yozmaydi, u kim qaysi darsni oʻtishini belgilaydi — maktabda
 * bu aynan uning ishi. Baho qoʻymoqchi boʻlsa oʻzini darsga
 * biriktiradi, va oʻsha qadam koʻrinadigan boʻladi.
 */
export async function assertCanManageClass(classId: string): Promise<WorkspaceContext> {
  const ctx = await assertInWorkspace(classId);
  /* ⚠️ Bu yerda `owner` QOʻSHILMAYDI — va bu `requireWorkspaceAdmin`
     dagi xato bilan bir xil emas. Gap MAYDON egasi haqida: jamoa
     maydonini ochgan oʻqituvchi hamkasbining sinfini boshqara olmasin.
     Pastdagi tekshiruv SINF egasini koʻradi — yakka oʻqituvchi oʻz
     sinfida aynan shu. */
  if (ctx.role === "admin") return ctx;

  const [row] = await db
    .select({ role: classTeachers.role })
    .from(classTeachers)
    .where(
      and(
        eq(classTeachers.classId, classId),
        eq(classTeachers.teacherId, ctx.teacherId),
        inArray(classTeachers.role, ["owner"])
      )
    );
  if (!row) throw new ForbiddenError("Bu amal sinf egasiga tegishli");
  return ctx;
}

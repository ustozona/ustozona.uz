import "server-only";
import { randomUUID } from "node:crypto";
import { and, asc, count, eq, inArray, isNotNull, isNull, lt, sql } from "drizzle-orm";
import { db } from "@/server/db/client";
import {
  assignments,
  attendanceRecords,
  classNotes,
  classTeachers,
  classes,
  enrollments,
  grades,
  students,
  teachers,
  workspaceAuditLogs,
} from "@/server/db/schema";
import { ForbiddenError } from "@/server/session";
import { requireWorkspace, type WorkspaceContext } from "@/server/workspace";
import { writeWorkspaceAudit } from "./workspace-audit";
import {
  TRASH_DAYS,
  purgeDate,
  type ClassTrashPreview,
  type TrashedClass,
} from "@/lib/class-trash";

/* ════════════════════════════════════════════════════════════════════
   SINF SAVATI — arxiv → savat (7 kun) → butunlay oʻchirish.

   Naqsh: oʻchirish ikki bosqichli va qaytariladigan oynaga ega.
   1. Faol sinf toʻgʻridan-toʻgʻri oʻchmaydi — avval arxivlanadi.
   2. Arxivdagi sinf savatga tushadi: `deleted_at` qoʻyiladi, qator va
      butun tarix (baho, davomat, xulq) joyida qoladi. Sinf hech qayerda
      koʻrinmaydi — `visibleClassIds`/`taughtClassIds` uni chiqaradi.
   3. TRASH_DAYS kundan keyin cron (yoki «hozir oʻchirish») haqiqiy
      `DELETE` qiladi — cascade shu yerda ishlaydi. Shaxsiy maʼlumot
      qonuni boʻyicha «yoʻq qilish» = tiklab boʻlmaydigan holat, shuning
      uchun savat abadiy soft-delete emas.

   KIM NIMA QILA OLADI
   ──────────────────────────────────────────────────────────────────
   - Savatga tashlash: sinf EGASI yoki maydon ADMINI. Hamkasblar boʻlsa
     ham — sinf allaqachon arxivda, dialog ularni sanab koʻrsatadi.
   - Oddiy hamkasb «oʻchirish» ni bossa — u faqat darsdan CHIQADI.
   - Tiklash / hozir oʻchirish: ega, admin yoki tashlagan odamning oʻzi.

   ⭐ Admin istisnosi (§11.6 dan farqli) ATAYLAB: maktab — maʼlumot
   egasi, rahbariyat sinfni tiklay va yoʻq qila olishi shart. Aks holda
   oʻqituvchi ketib qolsa uning savatdagi sinfini hech kim boshqara
   olmasdi. `admin` — `owner` emas (maydon egasi hamkasblar
   maʼlumotiga tegmaydi, sabab `workspace.ts` dagi `hasAdminRole`).

   OʻQUVCHILAR: oʻquvchi har doim sinf orqali qoʻshiladi, sinfsiz bola
   boʻlmasligi kerak. Shuning uchun butunlay oʻchirishda boshqa hech
   bir sinfga yozilmagan bola ham oʻchadi. Boshqa sinfda izi bor bola
   (hatto yopilgan yozilish — koʻchish tarixi) saqlanadi: uni oʻchirish
   oʻsha sinfning baholarini cascade bilan olib ketardi.
   ════════════════════════════════════════════════════════════════════ */

function isAdmin(ctx: WorkspaceContext): boolean {
  return ctx.role === "admin";
}

type ClassAccess = {
  id: string;
  name: string;
  archived: boolean;
  deletedBy: string | null;
  myRole: string | null;
  otherTeachers: string[];
};

/** Sinflar va ulardagi mening rolim — bitta maydon ichida. */
async function loadAccess(
  ctx: WorkspaceContext,
  classIds: string[],
  trashed: boolean
): Promise<ClassAccess[]> {
  if (classIds.length === 0) return [];
  const rows = await db
    .select({
      id: classes.id,
      name: classes.name,
      archivedAt: classes.archivedAt,
      deletedBy: classes.deletedBy,
    })
    .from(classes)
    .where(
      and(
        eq(classes.workspaceId, ctx.workspaceId),
        inArray(classes.id, classIds),
        trashed ? isNotNull(classes.deletedAt) : isNull(classes.deletedAt)
      )
    );
  if (rows.length === 0) return [];

  const teacherRows = await db
    .select({
      classId: classTeachers.classId,
      teacherId: classTeachers.teacherId,
      role: classTeachers.role,
      name: teachers.name,
    })
    .from(classTeachers)
    .innerJoin(teachers, eq(teachers.id, classTeachers.teacherId))
    .where(inArray(classTeachers.classId, rows.map((r) => r.id)))
    .orderBy(asc(classTeachers.createdAt));

  return rows.map((r) => {
    const mine = teacherRows.find((t) => t.classId === r.id && t.teacherId === ctx.teacherId);
    return {
      id: r.id,
      name: r.name,
      archived: !!r.archivedAt,
      deletedBy: r.deletedBy,
      myRole: mine?.role ?? null,
      otherTeachers: teacherRows
        .filter((t) => t.classId === r.id && t.teacherId !== ctx.teacherId)
        .map((t) => t.name),
    };
  });
}

function trashMode(ctx: WorkspaceContext, a: ClassAccess): ClassTrashPreview["mode"] | null {
  if (a.myRole === "owner" || isAdmin(ctx)) return a.archived ? "trash" : "not_archived";
  if (a.myRole) return "leave";
  return null; // begona sinf — qamrovdan tashqarida
}

function canManageTrashed(ctx: WorkspaceContext, a: ClassAccess): boolean {
  return a.myRole === "owner" || isAdmin(ctx) || a.deletedBy === ctx.teacherId;
}

async function countBy(
  ids: string[],
  query: (ids: string[]) => Promise<{ classId: string; n: number }[]>
): Promise<Map<string, number>> {
  if (ids.length === 0) return new Map();
  return new Map((await query(ids)).map((r) => [r.classId, r.n]));
}

/** Dialog oqibatni raqam bilan aytadi: nechta bola, baho, davomat. */
export async function previewClassTrash(classIds: string[]): Promise<ClassTrashPreview[]> {
  const ctx = await requireWorkspace();
  const access = await loadAccess(ctx, classIds, false);
  const items = access
    .map((a) => ({ a, mode: trashMode(ctx, a) }))
    .filter((x): x is { a: ClassAccess; mode: ClassTrashPreview["mode"] } => x.mode !== null);
  const ids = items.filter((x) => x.mode === "trash").map((x) => x.a.id);

  // Ketma-ket — Promise.all emas (Supavisor pool'i, loyiha xotirasi).
  const studentCounts = await countBy(ids, (part) =>
    db
      .select({ classId: enrollments.classId, n: count() })
      .from(enrollments)
      .where(and(inArray(enrollments.classId, part), isNull(enrollments.endedAt)))
      .groupBy(enrollments.classId)
  );
  const gradeCounts = await countBy(ids, (part) =>
    db
      .select({ classId: assignments.classId, n: count() })
      .from(grades)
      .innerJoin(assignments, eq(assignments.id, grades.assignmentId))
      .where(inArray(assignments.classId, part))
      .groupBy(assignments.classId)
  );
  const attendanceCounts = await countBy(ids, (part) =>
    db
      .select({ classId: attendanceRecords.classId, n: count() })
      .from(attendanceRecords)
      .where(inArray(attendanceRecords.classId, part))
      .groupBy(attendanceRecords.classId)
  );

  return items.map(({ a, mode }) => ({
    classId: a.id,
    name: a.name,
    mode,
    otherTeachers: a.otherTeachers,
    students: studentCounts.get(a.id) ?? 0,
    grades: gradeCounts.get(a.id) ?? 0,
    attendance: attendanceCounts.get(a.id) ?? 0,
  }));
}

/**
 * Savatga tashlaydi (ega/admin) yoki darsdan chiqaradi (hamkasb).
 *
 * ⚠️ Qaror qoidasi `previewClassTrash` bilan BIR XIL (`trashMode`) —
 * dialog nima desa, server aynan shuni qiladi.
 */
export async function trashClasses(
  classIds: string[]
): Promise<{ trashed: number; left: number }> {
  const ctx = await requireWorkspace();
  const access = await loadAccess(ctx, classIds, false);
  const toTrash = access.filter((a) => trashMode(ctx, a) === "trash");
  const toLeave = access.filter((a) => trashMode(ctx, a) === "leave");

  if (toTrash.length > 0) {
    await db
      .update(classes)
      .set({ deletedAt: new Date(), deletedBy: ctx.teacherId, updatedAt: new Date() })
      .where(
        and(
          eq(classes.workspaceId, ctx.workspaceId),
          inArray(classes.id, toTrash.map((a) => a.id)),
          isNotNull(classes.archivedAt),
          isNull(classes.deletedAt)
        )
      );
  }
  if (toLeave.length > 0) {
    /* `role = teacher` — ega bu yoʻl bilan chiqib ketmaydi
       (sabab `dal/grades.ts` → `detachOrDeleteClasses`). */
    await db
      .delete(classTeachers)
      .where(
        and(
          eq(classTeachers.teacherId, ctx.teacherId),
          eq(classTeachers.role, "teacher"),
          inArray(classTeachers.classId, toLeave.map((a) => a.id))
        )
      );
  }

  for (const a of toTrash) {
    await writeWorkspaceAudit(ctx, {
      action: "class.trash",
      targetType: "class",
      targetId: a.id,
      targetLabel: a.name,
    }).catch(() => {});
  }
  for (const a of toLeave) {
    await writeWorkspaceAudit(ctx, {
      action: "class_teacher.remove",
      targetType: "class",
      targetId: a.id,
      targetLabel: a.name,
      meta: { self: true },
    }).catch(() => {});
  }
  return { trashed: toTrash.length, left: toLeave.length };
}

/** Savat: men oʻtgan sinflar (admin uchun — butun maydon). */
export async function listTrashedClasses(): Promise<TrashedClass[]> {
  const ctx = await requireWorkspace();

  const mineRows = await db
    .select({ classId: classTeachers.classId, role: classTeachers.role })
    .from(classTeachers)
    .where(eq(classTeachers.teacherId, ctx.teacherId));
  const myRole = new Map(mineRows.map((r) => [r.classId, r.role]));

  const rows = await db
    .select({
      id: classes.id,
      name: classes.name,
      color: classes.color,
      icon: classes.icon,
      deletedAt: classes.deletedAt,
      deletedBy: classes.deletedBy,
      deletedByName: teachers.name,
    })
    .from(classes)
    .leftJoin(teachers, eq(teachers.id, classes.deletedBy))
    .where(and(eq(classes.workspaceId, ctx.workspaceId), isNotNull(classes.deletedAt)))
    .orderBy(asc(classes.deletedAt));

  const visible = rows.filter((r) => isAdmin(ctx) || myRole.has(r.id));
  const studentCounts = await countBy(
    visible.map((r) => r.id),
    (part) =>
      db
        .select({ classId: enrollments.classId, n: count() })
        .from(enrollments)
        .where(and(inArray(enrollments.classId, part), isNull(enrollments.endedAt)))
        .groupBy(enrollments.classId)
  );

  return visible.map((r) => {
    const deletedAt = r.deletedAt ?? new Date();
    return {
      id: r.id,
      name: r.name,
      color: r.color,
      icon: r.icon,
      students: studentCounts.get(r.id) ?? 0,
      deletedAt: deletedAt.toISOString(),
      purgeAt: purgeDate(deletedAt).toISOString(),
      daysLeft: Math.max(0, Math.ceil((purgeDate(deletedAt).getTime() - Date.now()) / 86_400_000)),
      deletedByName: r.deletedByName,
      canManage:
        isAdmin(ctx) || myRole.get(r.id) === "owner" || r.deletedBy === ctx.teacherId,
    };
  });
}

async function manageableTrashed(classIds: string[]) {
  const ctx = await requireWorkspace();
  const access = await loadAccess(ctx, classIds, true);
  const allowed = access.filter((a) => canManageTrashed(ctx, a));
  if (access.length > 0 && allowed.length === 0) {
    throw new ForbiddenError("Bu sinfni faqat uning egasi yoki maktab maʼmuriyati boshqaradi");
  }
  return { ctx, allowed };
}

/** Savatdan qaytaradi — sinf ARXIVDA qoladi, faolga oʻzi chiqmaydi. */
export async function restoreClasses(classIds: string[]): Promise<number> {
  const { ctx, allowed } = await manageableTrashed(classIds);
  if (allowed.length === 0) return 0;
  await db
    .update(classes)
    .set({ deletedAt: null, deletedBy: null, updatedAt: new Date() })
    .where(
      and(eq(classes.workspaceId, ctx.workspaceId), inArray(classes.id, allowed.map((a) => a.id)))
    );
  for (const a of allowed) {
    await writeWorkspaceAudit(ctx, {
      action: "class.restore",
      targetType: "class",
      targetId: a.id,
      targetLabel: a.name,
    }).catch(() => {});
  }
  return allowed.length;
}

/** Muddatini kutmasdan butunlay oʻchirish — faqat savatdagi sinf. */
export async function purgeClassesNow(classIds: string[]): Promise<number> {
  const { ctx, allowed } = await manageableTrashed(classIds);
  for (const a of allowed) {
    // Audit OLDIN: keyin nom ham, qator ham qolmaydi.
    await writeWorkspaceAudit(ctx, {
      action: "class.purge",
      targetType: "class",
      targetId: a.id,
      targetLabel: a.name,
    }).catch(() => {});
    await hardDeleteClass(a.id);
  }
  return allowed.length;
}

/**
 * Muddati oʻtgan savatni tozalaydi — cron chaqiradi (sessiyasiz).
 * Bir chaqiruvda koʻpi bilan `limit` ta sinf: qolgani keyingi safar.
 */
export async function purgeExpiredClasses(limit = 100): Promise<{ purged: number }> {
  const cutoff = new Date(Date.now() - TRASH_DAYS * 24 * 60 * 60 * 1000);
  const rows = await db
    .select({ id: classes.id, name: classes.name, workspaceId: classes.workspaceId })
    .from(classes)
    .where(and(isNotNull(classes.deletedAt), lt(classes.deletedAt, cutoff)))
    .orderBy(asc(classes.deletedAt))
    .limit(limit);

  for (const r of rows) {
    await db
      .insert(workspaceAuditLogs)
      .values({
        id: randomUUID(),
        workspaceId: r.workspaceId,
        actorTeacherId: null,
        actorName: "Tizim",
        action: "class.purge",
        targetType: "class",
        targetId: r.id,
        targetLabel: r.name,
        meta: { auto: true, days: TRASH_DAYS },
      })
      .catch(() => {});
    await hardDeleteClass(r.id);
  }
  return { purged: rows.length };
}

/**
 * Haqiqiy DELETE — faqat savatdagi sinf uchun.
 *
 * Cascade: baho, davomat, xulq, yozilish va davrlar, jonli sessiyalar.
 * FK'siz `class_notes` qoʻlda tozalanadi. `units`/`lessons` ATAYLAB
 * qoladi — dars rejasi boshqa sinfda qayta ishlatiladi (schema/planning.ts).
 */
async function hardDeleteClass(classId: string): Promise<void> {
  await db.transaction(async (tx) => {
    const roster = await tx
      .selectDistinct({ id: enrollments.studentId })
      .from(enrollments)
      .where(eq(enrollments.classId, classId));

    await tx.delete(classNotes).where(eq(classNotes.classId, classId));
    const gone = await tx
      .delete(classes)
      .where(and(eq(classes.id, classId), isNotNull(classes.deletedAt)))
      .returning({ id: classes.id });
    if (gone.length === 0) return; // oraliqda tiklangan

    /* Sinfsiz qolgan bola — u ham ketadi. Boshqa sinfda HAR QANDAY
       yozilishi (yopilgani ham) bor bola saqlanadi. */
    const ids = roster.map((r) => r.id);
    if (ids.length > 0) {
      await tx
        .delete(students)
        .where(
          and(
            inArray(students.id, ids),
            sql`not exists (select 1 from ${enrollments} where ${enrollments.studentId} = ${students.id})`
          )
        );
    }
  });
}

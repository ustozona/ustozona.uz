import "server-only";
import { and, count, eq } from "drizzle-orm";
import { db } from "@/server/db/client";
import { teachers, workspaceMembers, workspaces } from "@/server/db/schema";
import { requireAdmin, requireSchoolAdmin } from "@/server/session";
import { writeAuditLog } from "./audit";

/* Admin paneli "Maktablar" boʻlimi.

   ⚠️ Maktab — bu `kind = "school"` boʻlgan ISH MAYDONI (alohida jadval
   emas). Har oʻqituvchining shaxsiy maydoni ham bor (`kind = "personal"`),
   lekin u bu roʻyxatda koʻrinmaydi — aks holda roʻyxat yuzlab shaxsiy
   maydon bilan toʻlib ketardi.

   Batafsil: docs/ish-maydoni-arxitektura.md §1 */

export type AdminSchoolItem = {
  id: string;
  name: string;
  region: string | null;
  city: string | null;
  createdAt: Date;
  teacherCount: number;
};

/** Maktablar roʻyxati (oʻqituvchi soni bilan) — faqat super_admin. */
export async function listSchools(): Promise<AdminSchoolItem[]> {
  await requireAdmin();
  return db
    .select({
      id: workspaces.id,
      name: workspaces.name,
      region: workspaces.region,
      city: workspaces.city,
      createdAt: workspaces.createdAt,
      teacherCount: count(workspaceMembers.teacherId),
    })
    .from(workspaces)
    .leftJoin(workspaceMembers, eq(workspaceMembers.workspaceId, workspaces.id))
    .where(eq(workspaces.kind, "school"))
    .groupBy(workspaces.id)
    .orderBy(workspaces.name);
}

/** school_admin oʻz maktabini koʻrishi uchun (super_admin barchasini). */
export async function getSchoolForCurrentAdmin(): Promise<AdminSchoolItem | null> {
  const { scope } = await requireSchoolAdmin();
  if (scope.all) return null;
  const [row] = await db
    .select({
      id: workspaces.id,
      name: workspaces.name,
      region: workspaces.region,
      city: workspaces.city,
      createdAt: workspaces.createdAt,
      teacherCount: count(workspaceMembers.teacherId),
    })
    .from(workspaces)
    .leftJoin(workspaceMembers, eq(workspaceMembers.workspaceId, workspaces.id))
    .where(eq(workspaces.id, scope.workspaceId))
    .groupBy(workspaces.id);
  return row ?? null;
}

export type TeacherListItem = {
  id: string;
  name: string;
  email: string;
  schoolId: string | null;
};

/** Maktabga biriktirilmagan / biriktirish uchun oʻqituvchilar roʻyxati.

    `schoolId` — oʻqituvchi aʼzo boʻlgan `kind = "school"` maydon (shaxsiy
    maydon hisobga olinmaydi). Bir nechta maktabga aʼzo boʻlish texnik
    jihatdan mumkin; bu roʻyxat birinchisini koʻrsatadi. */
export async function listTeachersForAssignment(): Promise<TeacherListItem[]> {
  await requireAdmin();
  const rows = await db
    .select({
      id: teachers.id,
      name: teachers.name,
      email: teachers.email,
      schoolId: workspaces.id,
    })
    .from(teachers)
    .leftJoin(workspaceMembers, eq(workspaceMembers.teacherId, teachers.id))
    .leftJoin(
      workspaces,
      and(eq(workspaces.id, workspaceMembers.workspaceId), eq(workspaces.kind, "school"))
    )
    .orderBy(teachers.name);

  // Bir oʻqituvchi bir nechta maydonga aʼzo boʻlsa join takroriy qator
  // beradi — maktabga aʼzoligini ustun qoʻyib yigʻamiz.
  const byId = new Map<string, TeacherListItem>();
  for (const r of rows) {
    const prev = byId.get(r.id);
    if (!prev || (!prev.schoolId && r.schoolId)) byId.set(r.id, r);
  }
  return [...byId.values()];
}

export async function createSchool(input: {
  name: string;
  region?: string;
  city?: string;
}): Promise<void> {
  const { actor } = await requireAdmin();
  const id = crypto.randomUUID();
  await db.insert(workspaces).values({
    id,
    name: input.name,
    kind: "school",
    region: input.region || null,
    city: input.city || null,
  });
  await writeAuditLog(actor, {
    action: "school.create",
    targetType: "school",
    targetId: id,
    targetLabel: input.name,
  });
}

export async function updateSchool(
  schoolId: string,
  input: { name: string; region?: string; city?: string },
): Promise<void> {
  const { actor } = await requireAdmin();
  await db
    .update(workspaces)
    .set({ name: input.name, region: input.region || null, city: input.city || null })
    .where(eq(workspaces.id, schoolId));
  await writeAuditLog(actor, {
    action: "school.update",
    targetType: "school",
    targetId: schoolId,
    targetLabel: input.name,
  });
}

export async function deleteSchool(schoolId: string): Promise<void> {
  const { actor } = await requireAdmin();
  const [row] = await db.select().from(workspaces).where(eq(workspaces.id, schoolId));
  if (!row) throw new Error("Maktab topilmadi");
  await db.delete(workspaces).where(eq(workspaces.id, schoolId));
  await writeAuditLog(actor, {
    action: "school.delete",
    targetType: "school",
    targetId: schoolId,
    targetLabel: row.name,
  });
}

/** Oʻqituvchini maktab maydoniga qoʻshadi yoki undan chiqaradi.

    `schoolId = null` — oʻqituvchini BARCHA maktab maydonlaridan chiqaradi
    (shaxsiy maydoni tegilmaydi, aks holda oʻz maʼlumotini yoʻqotardi). */
export async function assignTeacherToSchool(
  teacherId: string,
  schoolId: string | null,
): Promise<void> {
  const { actor } = await requireAdmin();

  const schoolMemberships = await db
    .select({ workspaceId: workspaceMembers.workspaceId })
    .from(workspaceMembers)
    .innerJoin(workspaces, eq(workspaces.id, workspaceMembers.workspaceId))
    .where(and(eq(workspaceMembers.teacherId, teacherId), eq(workspaces.kind, "school")));

  for (const m of schoolMemberships) {
    await db
      .delete(workspaceMembers)
      .where(
        and(
          eq(workspaceMembers.teacherId, teacherId),
          eq(workspaceMembers.workspaceId, m.workspaceId)
        )
      );
  }

  if (schoolId) {
    await db
      .insert(workspaceMembers)
      .values({ workspaceId: schoolId, teacherId, role: "teacher" })
      .onConflictDoNothing();
  }

  const [teacher] = await db.select().from(teachers).where(eq(teachers.id, teacherId));
  await writeAuditLog(actor, {
    action: "school.assign_teacher",
    targetType: "teacher",
    targetId: teacherId,
    targetLabel: teacher?.name ?? teacherId,
    meta: { schoolId },
  });
}

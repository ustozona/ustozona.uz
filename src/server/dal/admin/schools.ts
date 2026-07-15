import "server-only";
import { count, eq } from "drizzle-orm";
import { db } from "@/server/db/client";
import { schools, teachers } from "@/server/db/schema";
import { requireAdmin, requireSchoolAdmin } from "@/server/session";
import { writeAuditLog } from "./audit";

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
  const rows = await db
    .select({
      id: schools.id,
      name: schools.name,
      region: schools.region,
      city: schools.city,
      createdAt: schools.createdAt,
      teacherCount: count(teachers.id),
    })
    .from(schools)
    .leftJoin(teachers, eq(teachers.schoolId, schools.id))
    .groupBy(schools.id)
    .orderBy(schools.name);
  return rows;
}

/** school_admin oʻz maktabini koʻrishi uchun (super_admin barchasini). */
export async function getSchoolForCurrentAdmin(): Promise<AdminSchoolItem | null> {
  const { scope } = await requireSchoolAdmin();
  if (scope.all) return null;
  const [row] = await db
    .select({
      id: schools.id,
      name: schools.name,
      region: schools.region,
      city: schools.city,
      createdAt: schools.createdAt,
      teacherCount: count(teachers.id),
    })
    .from(schools)
    .leftJoin(teachers, eq(teachers.schoolId, schools.id))
    .where(eq(schools.id, scope.schoolId))
    .groupBy(schools.id);
  return row ?? null;
}

export type TeacherListItem = {
  id: string;
  name: string;
  email: string;
  schoolId: string | null;
};

/** Maktabga biriktirilmagan / biriktirish uchun oʻqituvchilar roʻyxati. */
export async function listTeachersForAssignment(): Promise<TeacherListItem[]> {
  await requireAdmin();
  return db
    .select({ id: teachers.id, name: teachers.name, email: teachers.email, schoolId: teachers.schoolId })
    .from(teachers)
    .orderBy(teachers.name);
}

export async function createSchool(input: {
  name: string;
  region?: string;
  city?: string;
}): Promise<void> {
  const { actor } = await requireAdmin();
  const id = crypto.randomUUID();
  await db.insert(schools).values({
    id,
    name: input.name,
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
    .update(schools)
    .set({ name: input.name, region: input.region || null, city: input.city || null })
    .where(eq(schools.id, schoolId));
  await writeAuditLog(actor, {
    action: "school.update",
    targetType: "school",
    targetId: schoolId,
    targetLabel: input.name,
  });
}

export async function deleteSchool(schoolId: string): Promise<void> {
  const { actor } = await requireAdmin();
  const [row] = await db.select().from(schools).where(eq(schools.id, schoolId));
  if (!row) throw new Error("Maktab topilmadi");
  await db.delete(schools).where(eq(schools.id, schoolId));
  await writeAuditLog(actor, {
    action: "school.delete",
    targetType: "school",
    targetId: schoolId,
    targetLabel: row.name,
  });
}

export async function assignTeacherToSchool(
  teacherId: string,
  schoolId: string | null,
): Promise<void> {
  const { actor } = await requireAdmin();
  await db.update(teachers).set({ schoolId }).where(eq(teachers.id, teacherId));
  const [teacher] = await db.select().from(teachers).where(eq(teachers.id, teacherId));
  await writeAuditLog(actor, {
    action: "school.assign_teacher",
    targetType: "teacher",
    targetId: teacherId,
    targetLabel: teacher?.name ?? teacherId,
    meta: { schoolId },
  });
}

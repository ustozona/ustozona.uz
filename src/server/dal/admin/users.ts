import "server-only";
import {
  and,
  count,
  desc,
  eq,
  ilike,
  inArray,
  max,
  or,
  sql,
  type SQL,
} from "drizzle-orm";
import { db } from "@/server/db/client";
import { user, session, teachers, classes, students } from "@/server/db/schema";
import { requireAdmin } from "@/server/session";

/* ════════════════════════════════════════════════════════════════════
   ADMIN → FOYDALANUVCHILAR — kross-tenant oʻqish.

   Plugin `listUsers` teachers bilan JOIN qilolmagani uchun jadval
   custom Drizzle soʻrov; mutatsiyalar esa `auth.api.*` orqali
   (actions/admin/users.ts).
   ════════════════════════════════════════════════════════════════════ */

export type AdminUserListItem = {
  id: string;
  name: string;
  email: string;
  image: string | null;
  role: string | null;
  banned: boolean | null;
  banReason: string | null;
  banExpires: Date | null;
  createdAt: Date;
  plan: string | null;
  school: string | null;
  classCount: number;
  studentCount: number;
  lastSeen: Date | null;
};

export type AdminUsersPage = {
  items: AdminUserListItem[];
  total: number;
  page: number;
  pageSize: number;
};

export type AdminUsersFilter = {
  search?: string;
  role?: string; // "super_admin" | "school_admin" | "teacher"
  banned?: boolean;
  plan?: string;
  page?: number;
  pageSize?: number;
};

export async function listUsersForAdmin(
  params: AdminUsersFilter,
): Promise<AdminUsersPage> {
  await requireAdmin();
  const page = Math.max(1, params.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, params.pageSize ?? 25));

  const conditions: SQL[] = [];
  if (params.search?.trim()) {
    const q = `%${params.search.trim()}%`;
    conditions.push(or(ilike(user.name, q), ilike(user.email, q))!);
  }
  if (params.role) {
    // Rollar vergul bilan saqlanadi — element sifatida solishtiramiz.
    conditions.push(
      sql`${params.role} = ANY(string_to_array(coalesce(${user.role}, 'teacher'), ','))`,
    );
  }
  if (params.banned !== undefined) {
    conditions.push(
      params.banned
        ? eq(user.banned, true)
        : sql`coalesce(${user.banned}, false) = false`,
    );
  }
  if (params.plan) conditions.push(eq(teachers.plan, params.plan));

  const where = conditions.length ? and(...conditions) : undefined;

  const base = db
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
      image: user.image,
      role: user.role,
      banned: user.banned,
      banReason: user.banReason,
      banExpires: user.banExpires,
      createdAt: user.createdAt,
      plan: teachers.plan,
      school: teachers.school,
    })
    .from(user)
    .leftJoin(teachers, eq(teachers.id, user.id));

  const [rows, [{ total }]] = await Promise.all([
    base
      .where(where)
      .orderBy(desc(user.createdAt))
      .limit(pageSize)
      .offset((page - 1) * pageSize),
    db
      .select({ total: count() })
      .from(user)
      .leftJoin(teachers, eq(teachers.id, user.id))
      .where(where),
  ]);

  const ids = rows.map((r) => r.id);
  const [classCounts, studentCounts, lastSeens] = ids.length
    ? await Promise.all([
        db
          .select({ teacherId: classes.teacherId, n: count() })
          .from(classes)
          .where(inArray(classes.teacherId, ids))
          .groupBy(classes.teacherId),
        db
          .select({ teacherId: students.teacherId, n: count() })
          .from(students)
          .where(inArray(students.teacherId, ids))
          .groupBy(students.teacherId),
        db
          .select({ userId: session.userId, last: max(session.updatedAt) })
          .from(session)
          .where(inArray(session.userId, ids))
          .groupBy(session.userId),
      ])
    : [[], [], []];

  const classMap = new Map(classCounts.map((c) => [c.teacherId, c.n]));
  const studentMap = new Map(studentCounts.map((c) => [c.teacherId, c.n]));
  const seenMap = new Map(lastSeens.map((s) => [s.userId, s.last]));

  return {
    items: rows.map((r) => ({
      ...r,
      classCount: classMap.get(r.id) ?? 0,
      studentCount: studentMap.get(r.id) ?? 0,
      lastSeen: seenMap.get(r.id) ?? null,
    })),
    total,
    page,
    pageSize,
  };
}

export type AdminUserDetail = AdminUserListItem & {
  emailVerified: boolean;
  subject: string | null;
  academicYear: string | null;
  sessions: { id: string; updatedAt: Date; ipAddress: string | null; userAgent: string | null }[];
};

export async function getUserDetailForAdmin(
  userId: string,
): Promise<AdminUserDetail | null> {
  await requireAdmin();

  const [row] = await db
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
      emailVerified: user.emailVerified,
      image: user.image,
      role: user.role,
      banned: user.banned,
      banReason: user.banReason,
      banExpires: user.banExpires,
      createdAt: user.createdAt,
      plan: teachers.plan,
      school: teachers.school,
      subject: teachers.subject,
      academicYear: teachers.academicYear,
    })
    .from(user)
    .leftJoin(teachers, eq(teachers.id, user.id))
    .where(eq(user.id, userId));
  if (!row) return null;

  const [classCount, studentCount, sessions] = await Promise.all([
    db.$count(classes, eq(classes.teacherId, userId)),
    db.$count(students, eq(students.teacherId, userId)),
    db
      .select({
        id: session.id,
        updatedAt: session.updatedAt,
        ipAddress: session.ipAddress,
        userAgent: session.userAgent,
      })
      .from(session)
      .where(eq(session.userId, userId))
      .orderBy(desc(session.updatedAt))
      .limit(10),
  ]);

  return {
    ...row,
    classCount,
    studentCount,
    lastSeen: sessions[0]?.updatedAt ?? null,
    sessions,
  };
}

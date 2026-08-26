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
import {
  user,
  session,
  teachers,
  attendanceRecords,
  grades,
} from "@/server/db/schema";
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
  /** Oxirgi kirish (session) — login, ish qilgani emas. */
  lastSeen: Date | null;
  /** Oxirgi real ish (davomat/baho yozuvi) — faollik shu bilan oʻlchanadi. */
  lastActiveAt: Date | null;
  attendanceCount: number;
  gradeCount: number;
  /** "activated" = davomat/baho bor va oxirgi 14 kun ichida ishlagan; qolgani "at_risk". */
  activationStatus: "activated" | "at_risk";
  /** true = admin/test hisob — voronka/"eʼtibor talab qiladi" statistikasidan chiqarilgan. */
  excludeFromMetrics: boolean;
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

/* ════════════════════════════════════════════════════════════════════
   YAGONA SANOQ — `v_teacher_totals` ko'rinishidan.

   Ko'rinish `supabase/migrations/20260808_v_teacher_totals.sql` da.
   Bu yerda faqat o'qiladi: mantiq SQL'da bo'lgani uchun admin paneli,
   hisobotlar va bot bir xil raqamni ko'radi.
   ════════════════════════════════════════════════════════════════════ */
type TeacherTotals = { teacherId: string; classCount: number; studentCount: number };

async function listTeacherTotals(ids: string[]): Promise<TeacherTotals[]> {
  /* ⚠️ `v_teacher_totals` FAQAT prodda (Supabase) mavjud — u LessonLab
     bot jadvallariga (`bot_classes`, `bot_students`) tayanadi va Drizzle
     migratsiyalaridan tashqarida yaratilgan. Lokal Neon bazasida bu
     koʻrinish ham, bot jadvallari ham YOʻQ, shu bois `/admin/users`
     sahifasi lokalda har doim yiqilardi.

     Koʻrinish bor boʻlsa oʻsha ishlatiladi (ikki platformani dublikatsiz
     sanaydigan yagona manba). Yoʻq boʻlsa — faqat Ustozona tomonidan
     sanaymiz: lokalda baribir boshqa maʼlumot yoʻq. */
  const [probe] = await db.execute<{ exists: string | null }>(
    sql`SELECT to_regclass('public.v_teacher_totals')::text AS exists`
  );
  const idList = sql.join(ids.map((id) => sql`${id}`), sql`, `);

  const rows = probe?.exists
    ? await db.execute<{
        uz_teacher_id: string;
        class_count: number | string;
        student_count: number | string;
      }>(sql`
        SELECT uz_teacher_id, class_count, student_count
        FROM v_teacher_totals
        WHERE uz_teacher_id IN (${idList})
      `)
    : await db.execute<{
        uz_teacher_id: string;
        class_count: number | string;
        student_count: number | string;
      }>(sql`
        SELECT t.id AS uz_teacher_id,
          (SELECT COUNT(*)::int FROM class_teachers ct
             JOIN classes c ON c.id = ct.class_id
             WHERE ct.teacher_id = t.id AND c.archived_at IS NULL) AS class_count,
          (SELECT COUNT(DISTINCT e.student_id)::int FROM class_teachers ct
             JOIN enrollments e ON e.class_id = ct.class_id
             WHERE ct.teacher_id = t.id) AS student_count
        FROM teachers t
        WHERE t.id IN (${idList})
      `);

  // ⚠️ postgres-js `count(*)` ni bigint sifatida qaytaradi va u JS'ga
  // STRING bo'lib keladi — `Number()` siz «5» + 1 = «51» bo'lardi
  // (`getUnlinkImpact` da ham xuddi shu tuzoq bor edi).
  return Array.from(rows).map((r) => ({
    teacherId: r.uz_teacher_id,
    classCount: Number(r.class_count),
    studentCount: Number(r.student_count),
  }));
}

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
      excludeFromMetrics: teachers.excludeFromMetrics,
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
  const [totals, lastSeens, attendanceStats, gradeStats] = ids.length
    ? await Promise.all([
        /* ⛔ SINF/O'QUVCHI SONI — `classes`/`students` dan EMAS.

           Loyihada ma'lumot NUSXALANMAYDI: o'qituvchining ishi qaysi
           tomonda yaratilgan bo'lsa, o'sha yerda qoladi va bog'lanish
           orqali o'qiladi. Faqat `classes`/`students` sanalsa, bot
           orqali ishlaydigan o'qituvchi panelda «0 sinf, 0 o'quvchi»
           bo'lib ko'rinardi — 2026-08-08 da aynan shunday bo'ldi
           (`ejavohirxon@gmail.com`: panelda 0/0, aslida 4 sinf va
           102 o'quvchi) va bu «ma'lumot o'chib ketdi» deb tushunildi.

           `v_teacher_totals` ikkala tomonni DUBLIKATSIZ sanaydi:
           bog'langan juftlik bir marta hisoblanadi. Ta'rif SQL'da —
           admin paneli, hisobotlar va bot AYNAN bir xil raqamni
           ko'rishi uchun (`account_unlink_impact` bilan bir xil
           sabab). */
        listTeacherTotals(ids),
        db
          .select({ userId: session.userId, last: max(session.updatedAt) })
          .from(session)
          .where(inArray(session.userId, ids))
          .groupBy(session.userId),
        db
          .select({
            teacherId: attendanceRecords.teacherId,
            n: count(),
            last: max(attendanceRecords.updatedAt),
          })
          .from(attendanceRecords)
          .where(inArray(attendanceRecords.teacherId, ids))
          .groupBy(attendanceRecords.teacherId),
        db
          .select({ teacherId: grades.teacherId, n: count(), last: max(grades.updatedAt) })
          .from(grades)
          .where(inArray(grades.teacherId, ids))
          .groupBy(grades.teacherId),
      ])
    : [[], [], [], []];

  const classMap = new Map(totals.map((t) => [t.teacherId, t.classCount]));
  const studentMap = new Map(totals.map((t) => [t.teacherId, t.studentCount]));
  const seenMap = new Map(lastSeens.map((s) => [s.userId, s.last]));
  const attendanceMap = new Map(attendanceStats.map((a) => [a.teacherId, a]));
  const gradeMap = new Map(gradeStats.map((g) => [g.teacherId, g]));

  const twoWeeksAgo = Date.now() - 14 * 24 * 60 * 60 * 1000;

  return {
    items: rows.map((r) => {
      const attendance = attendanceMap.get(r.id);
      const grade = gradeMap.get(r.id);
      const attendanceCount = attendance?.n ?? 0;
      const gradeCount = grade?.n ?? 0;
      const lastActiveAt =
        [attendance?.last, grade?.last]
          .filter((d): d is Date => !!d)
          .sort((a, b) => b.getTime() - a.getTime())[0] ?? null;

      const activationStatus: AdminUserListItem["activationStatus"] =
        attendanceCount === 0 && gradeCount === 0
          ? "at_risk"
          : lastActiveAt && lastActiveAt.getTime() >= twoWeeksAgo
            ? "activated"
            : "at_risk";

      return {
        ...r,
        classCount: classMap.get(r.id) ?? 0,
        studentCount: studentMap.get(r.id) ?? 0,
        lastActiveAt,
        attendanceCount,
        gradeCount,
        activationStatus,
        lastSeen: seenMap.get(r.id) ?? null,
        excludeFromMetrics: r.excludeFromMetrics ?? false,
      };
    }),
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
      excludeFromMetrics: teachers.excludeFromMetrics,
    })
    .from(user)
    .leftJoin(teachers, eq(teachers.id, user.id))
    .where(eq(user.id, userId));
  if (!row) return null;

  const [totals, sessions, attendanceStat, gradeStat] = await Promise.all([
    // Ro'yxat bilan AYNI manba — aks holda jadval va tafsilot
    // bir-biriga zid raqam ko'rsatardi (`listTeacherTotals` izohi).
    listTeacherTotals([userId]),
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
    db
      .select({ n: count(), last: max(attendanceRecords.updatedAt) })
      .from(attendanceRecords)
      .where(eq(attendanceRecords.teacherId, userId)),
    db.select({ n: count(), last: max(grades.updatedAt) }).from(grades).where(eq(grades.teacherId, userId)),
  ]);

  const attendanceCount = attendanceStat[0]?.n ?? 0;
  const gradeCount = gradeStat[0]?.n ?? 0;
  const lastActiveAt =
    [attendanceStat[0]?.last, gradeStat[0]?.last]
      .filter((d): d is Date => !!d)
      .sort((a, b) => b.getTime() - a.getTime())[0] ?? null;
  const twoWeeksAgo = Date.now() - 14 * 24 * 60 * 60 * 1000;
  const activationStatus: AdminUserListItem["activationStatus"] =
    attendanceCount === 0 && gradeCount === 0
      ? "at_risk"
      : lastActiveAt && lastActiveAt.getTime() >= twoWeeksAgo
        ? "activated"
        : "at_risk";

  return {
    ...row,
    classCount: totals[0]?.classCount ?? 0,
    studentCount: totals[0]?.studentCount ?? 0,
    lastSeen: sessions[0]?.updatedAt ?? null,
    lastActiveAt,
    attendanceCount,
    gradeCount,
    activationStatus,
    excludeFromMetrics: row.excludeFromMetrics ?? false,
    sessions,
  };
}

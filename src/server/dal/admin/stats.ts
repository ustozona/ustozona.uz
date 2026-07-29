import "server-only";
import { count, gt, sql } from "drizzle-orm";
import { db } from "@/server/db/client";
import { user, teachers, classes, students } from "@/server/db/schema";
import { requireAdmin } from "@/server/session";

/* ════════════════════════════════════════════════════════════════════
   ADMIN → PLATFORMA STATISTIKASI (kross-tenant agregatlar).

   Voronka "faol"ni sessiya/kirish orqali EMAS, real ish (davomat/baho/
   dars) orqali oʻlchaydi — kirish faollik emas. Xuddi shu mantiq
   scripts/metrics.ts'da (terminal skript) ham bor; bu yerda ekvivalenti
   admin panelga koʻchirilgan, chunki panelni tekshirish uchun kimdir
   terminalga kirmasligi kerak.
   ════════════════════════════════════════════════════════════════════ */

export type ActivationFunnel = {
  signedUp: number;
  withClass: number;
  withStudents: number;
  activated: number;
  returned: number;
  wau: number;
};

export type AtRiskTeacher = {
  id: string;
  name: string;
  email: string;
  reason: "no_class" | "no_students" | "no_attendance" | "went_quiet";
  lastActiveAt: Date | null;
};

export type AdminStats = {
  funnel: ActivationFunnel;
  atRisk: AtRiskTeacher[];
  /** Oxirgi 30 kun boʻyicha kunlik roʻyxatdan oʻtishlar (boʻsh kunlar 0). */
  signupsByDay: { day: string; n: number }[];
  planBreakdown: { plan: string; n: number }[];
};

const DAY_MS = 24 * 60 * 60 * 1000;

export async function getAdminStats(): Promise<AdminStats> {
  await requireAdmin();

  const since30 = new Date(Date.now() - 30 * DAY_MS);
  const weekAgo = new Date(Date.now() - 7 * DAY_MS);
  const twoWeeksAgo = new Date(Date.now() - 14 * DAY_MS);

  /* Har bir oʻqituvchi uchun bitta qator: roʻyxat maʼlumoti + real
     faollik (davomat/baho/dars yozuvlaridan eng kechkisi). Sahifa
     koʻrish/session bu yerda FAOLLIK sifatida hisoblanmaydi. */
  const result = await db.execute(sql`
    WITH activity AS (
      SELECT teacher_id, MAX(updated_at) AS last_at FROM attendance_records GROUP BY teacher_id
      UNION ALL
      SELECT teacher_id, MAX(updated_at) FROM grades GROUP BY teacher_id
      UNION ALL
      SELECT teacher_id, MAX(updated_at) FROM lessons GROUP BY teacher_id
    )
    SELECT
      t.id,
      u.name,
      u.email,
      u.created_at                                       AS signed_up_at,
      (SELECT COUNT(*)::int FROM classes c
         WHERE c.teacher_id = t.id AND c.archived_at IS NULL)     AS class_count,
      (SELECT COUNT(*)::int FROM students s
         WHERE s.teacher_id = t.id)                        AS student_count,
      (SELECT COUNT(*)::int FROM attendance_records a
         WHERE a.teacher_id = t.id)                         AS attendance_count,
      (SELECT COUNT(*)::int FROM grades g
         WHERE g.teacher_id = t.id)                          AS grade_count,
      (SELECT MAX(a2.last_at) FROM activity a2 WHERE a2.teacher_id = t.id) AS last_active_at
      FROM teachers t
      JOIN "user" u ON u.id = t.id
      WHERE t.exclude_from_metrics = false
  `);
  const rawRows = result.rows as unknown as Array<{
    id: string;
    name: string;
    email: string;
    signed_up_at: string | Date;
    class_count: number;
    student_count: number;
    attendance_count: number;
    grade_count: number;
    last_active_at: string | Date | null;
  }>;

  /* neon-http raw SQL sana ustunlarini Date EMAS, ISO-string sifatida
     qaytaradi (Drizzle query builder'dan farqli) — shu yerda bir marta
     Date'ga aylantirib olamiz, aks holda .getTime() pastda yiqiladi. */
  const rows = rawRows.map((r) => ({
    ...r,
    signed_up_at: new Date(r.signed_up_at),
    last_active_at: r.last_active_at ? new Date(r.last_active_at) : null,
  }));

  const signedUp = rows.length;
  const withClass = rows.filter((r) => r.class_count > 0);
  const withStudents = rows.filter((r) => r.student_count > 0);
  const activated = rows.filter((r) => r.attendance_count > 0 || r.grade_count > 0);
  const returned = activated.filter(
    (r) =>
      r.last_active_at !== null &&
      r.last_active_at.getTime() - r.signed_up_at.getTime() > 7 * DAY_MS,
  );
  const wau = rows.filter(
    (r) => r.last_active_at !== null && r.last_active_at.getTime() > weekAgo.getTime(),
  );

  const atRisk: AtRiskTeacher[] = rows
    .filter((r) =>
      r.attendance_count === 0 && r.grade_count === 0
        ? true
        : r.last_active_at === null || r.last_active_at.getTime() < twoWeeksAgo.getTime(),
    )
    .map((r) => ({
      id: r.id,
      name: r.name,
      email: r.email,
      reason:
        r.class_count === 0
          ? ("no_class" as const)
          : r.student_count === 0
            ? ("no_students" as const)
            : r.attendance_count === 0 && r.grade_count === 0
              ? ("no_attendance" as const)
              : ("went_quiet" as const),
      lastActiveAt: r.last_active_at,
    }))
    .sort((a, b) => (a.lastActiveAt?.getTime() ?? 0) - (b.lastActiveAt?.getTime() ?? 0));

  const [signupRows, planRows] = await Promise.all([
    db
      .select({
        day: sql<string>`to_char(date_trunc('day', ${user.createdAt}), 'YYYY-MM-DD')`,
        n: count(),
      })
      .from(user)
      .where(gt(user.createdAt, since30))
      .groupBy(sql`date_trunc('day', ${user.createdAt})`),
    db.select({ plan: teachers.plan, n: count() }).from(teachers).groupBy(teachers.plan),
  ]);

  const byDay = new Map(signupRows.map((r) => [r.day, r.n]));
  const signupsByDay: { day: string; n: number }[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(Date.now() - i * DAY_MS);
    const key = d.toISOString().slice(0, 10);
    signupsByDay.push({ day: key, n: byDay.get(key) ?? 0 });
  }

  return {
    funnel: {
      signedUp,
      withClass: withClass.length,
      withStudents: withStudents.length,
      activated: activated.length,
      returned: returned.length,
      wau: wau.length,
    },
    atRisk,
    signupsByDay,
    planBreakdown: planRows.map((r) => ({ plan: r.plan, n: r.n })),
  };
}

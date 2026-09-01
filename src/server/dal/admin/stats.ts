import "server-only";
import { count, gt, sql } from "drizzle-orm";
import { db } from "@/server/db/client";
// classes/students bu yerda ishlatilmaydi: sinf va oʻquvchi sanogʻi
// quyidagi raw SQL ichida class_teachers/enrollments orqali olinadi.
import { user, teachers } from "@/server/db/schema";
import { requireAdmin } from "@/server/session";

/* ════════════════════════════════════════════════════════════════════
   ADMIN → PLATFORMA STATISTIKASI (kross-tenant agregatlar).

   Voronka "faol"ni sessiya/kirish orqali EMAS, real ish (davomat/baho/
   dars) orqali oʻlchaydi — kirish faollik emas. Xuddi shu mantiq
   scripts/metrics.ts'da (terminal skript) ham bor; bu yerda ekvivalenti
   admin panelga koʻchirilgan, chunki panelni tekshirish uchun kimdir
   terminalga kirmasligi kerak.

   ⚠️ IKKI FUNKSIYAGA AJRATILGAN — ATAYLAB.

   Ilgari bitta `getAdminStats()` hammasini birga qaytarardi, yaʼni
   sahifa eng SEKIN soʻrovni kutib turardi. Endi:

     getActivationOverview()  — ogʻir (har oʻqituvchi boʻyicha agregat)
     getSignupTrends()        — yengil (ikki GROUP BY)

   Sahifa ularni alohida `<Suspense>` ichida chaqiradi, shuning uchun
   grafik ogʻir soʻrovni kutmasdan chiqadi (src/app/admin/page.tsx).
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

export type ActivationOverview = {
  funnel: ActivationFunnel;
  atRisk: AtRiskTeacher[];
};

export type SignupTrends = {
  /** Oxirgi 30 kun boʻyicha kunlik roʻyxatdan oʻtishlar (boʻsh kunlar 0). */
  signupsByDay: { day: string; n: number }[];
  planBreakdown: { plan: string; n: number }[];
};

const DAY_MS = 24 * 60 * 60 * 1000;

export async function getActivationOverview(): Promise<ActivationOverview> {
  await requireAdmin();

  const weekAgo = new Date(Date.now() - 7 * DAY_MS);
  const twoWeeksAgo = new Date(Date.now() - 14 * DAY_MS);

  /* Har bir oʻqituvchi uchun bitta qator: roʻyxat maʼlumoti + real
     faollik (davomat/baho/dars yozuvlaridan eng kechkisi). Sahifa
     koʻrish/session bu yerda FAOLLIK sifatida hisoblanmaydi.

     ⚠️ KORRELYATSIYALANGAN SUBQUERY EMAS — HAR JADVAL BIR MARTA.

     Ilgari har ustun `(SELECT … WHERE x.teacher_id = t.id)` shaklida
     edi va `activity` CTE ham shunday oʻqilardi. Postgres uni inline
     qilib, HAR oʻqituvchi uchun `attendance_records` ni boshidan
     skanerlardi (oʻlchandi: 51 loop × 4202 qator). Kichik bazada bu
     23 ms, lekin xarajat oʻqituvchi × yozuv, yaʼni KVADRATIK — 500
     oʻqituvchi va 500k davomatda panel ochilmay qoladi.

     Endi har jadval bitta GROUP BY bilan yigʻiladi va natija bir
     marta LEFT JOIN qilinadi. Raqamlar bir xilligi prod bazada
     tekshirildi (51 qator, 33 sinf, 429 oʻquvchi, 4202 davomat).

     `GREATEST` NULL'larni eʼtiborsiz qoldiradi: hammasi boʻsh boʻlsa
     NULL, aks holda eng kechki sana. */
  const result = await db.execute(sql`
    WITH scoped AS (
      SELECT t.id, u.name, u.email, u.created_at AS signed_up_at
      FROM teachers t
      JOIN "user" u ON u.id = t.id
      WHERE t.exclude_from_metrics = false
    ),
    /* Sinf/oʻquvchi endi oʻqituvchiga EMAS, ish maydoniga tegishli
       (docs/ish-maydoni-arxitektura.md). "Oʻqituvchining sinfi" degani
       endi "u oʻtadigan dars" — class_teachers orqali. Oʻquvchi esa
       shu darslarga YOZILGAN bola; DISTINCT shart, chunki bitta bola
       bir oʻqituvchining bir nechta guruhida boʻlishi mumkin
       (informatika + toʻgarak). */
    cls AS (
      SELECT ct.teacher_id,
             COUNT(*) FILTER (WHERE c.archived_at IS NULL)::int AS class_count
      FROM class_teachers ct
      JOIN classes c ON c.id = ct.class_id
      GROUP BY ct.teacher_id
    ),
    stu AS (
      SELECT ct.teacher_id, COUNT(DISTINCT e.student_id)::int AS student_count
      FROM class_teachers ct
      JOIN enrollments e ON e.class_id = ct.class_id
      GROUP BY ct.teacher_id
    ),
    att AS (
      SELECT teacher_id, COUNT(*)::int AS n, MAX(updated_at) AS last_at
      FROM attendance_records GROUP BY teacher_id
    ),
    grd AS (
      SELECT teacher_id, COUNT(*)::int AS n, MAX(updated_at) AS last_at
      FROM grades GROUP BY teacher_id
    ),
    les AS (
      SELECT teacher_id, MAX(updated_at) AS last_at
      FROM lessons GROUP BY teacher_id
    )
    SELECT
      s.id,
      s.name,
      s.email,
      s.signed_up_at,
      COALESCE(cls.class_count, 0) AS class_count,
      COALESCE(stu.student_count, 0) AS student_count,
      COALESCE(att.n, 0)            AS attendance_count,
      COALESCE(grd.n, 0)            AS grade_count,
      GREATEST(att.last_at, grd.last_at, les.last_at) AS last_active_at
    FROM scoped s
    LEFT JOIN cls ON cls.teacher_id = s.id
    LEFT JOIN stu ON stu.teacher_id = s.id
    LEFT JOIN att ON att.teacher_id = s.id
    LEFT JOIN grd ON grd.teacher_id = s.id
    LEFT JOIN les ON les.teacher_id = s.id
  `);
  /* postgres-js `db.execute()` natijani TOʻGʻRIDAN-TOʻGʻRI massiv
     qilib qaytaradi. neon-http esa `{ rows: [...] }` qaytarardi —
     Supabase'ga koʻchishda shu farq tuzatildi. */
  const rawRows = result as unknown as Array<{
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

  /* Raw SQL sana ustunlarini Date EMAS, ISO-string sifatida qaytarishi
     mumkin (Drizzle query builder'dan farqli) — shu yerda bir marta
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
  };
}

export async function getSignupTrends(): Promise<SignupTrends> {
  await requireAdmin();

  const since30 = new Date(Date.now() - 30 * DAY_MS);

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
    signupsByDay,
    planBreakdown: planRows.map((r) => ({ plan: r.plan, n: r.n })),
  };
}

import "server-only";
import {
  and,
  asc,
  count,
  desc,
  eq,
  ilike,
  inArray,
  isNull,
  isNotNull,
  gt,
  lte,
  max,
  or,
  sql,
  type SQL,
  type SQLWrapper,
} from "drizzle-orm";
import { db } from "@/server/db/client";
import { user, session, teachers } from "@/server/db/schema";
import {
  teacherActivitySummary,
  teacherSessionStats,
  hasActivityViews,
} from "@/server/db/views";
import { ACTIVATED_MIN_DAYS, QUIET_AFTER_DAYS } from "@/lib/faollik";
import { requireAdmin } from "@/server/session";

/* ════════════════════════════════════════════════════════════════════
   ADMIN → FOYDALANUVCHILAR — kross-tenant oʻqish.

   Plugin `listUsers` teachers bilan JOIN qilolmagani uchun jadval
   custom Drizzle soʻrov; mutatsiyalar esa `auth.api.*` orqali
   (actions/admin/users.ts).
   ════════════════════════════════════════════════════════════════════ */

/* ⚠️ FAOLLIK TAʼRIFI BU YERDA EMAS — `v_teacher_activity_summary` da.

   Ilgari faollik faqat `attendance_records` + `grades` boʻyicha
   oʻlchanardi. Natijada dars rejalashtirgan, jadval tuzgan, standart
   yozgan yoki test oʻtkazgan oʻqituvchi «hech qachon ishlamagan» boʻlib
   koʻrinardi. Lokal bazada oʻlchandi: 8 oʻqituvchidan 6 tasi shu
   sababli notoʻgʻri «faolsiz» edi.

   Batafsil sabab va 12 boʻlim roʻyxati: drizzle/views/faollik.sql */

/** Oʻqituvchining mahsulot bilan munosabati — bitta qatorda.

    ⭐ TAKRORLANISH BOʻYICHA, TURI BOʻYICHA EMAS. «Faollashgan» degani
    «davomat qoʻygan» emas, «kamida 3 xil KUNDA ishlagan». Sabab: 400 ta
    davomat yozuvi bir kunda — bu bitta ommaviy amal, odat emas. Kun
    boʻyicha oʻlchovni ommaviy amal bilan shishirib boʻlmaydi. */
export type ActivationStatus =
  /** Hech qanday ish yozuvi yoʻq. */
  | "never"
  /** Ish bor, lekin 3 kundan kam — sinab koʻrgan, odat boʻlmagan. */
  | "trying"
  /** ≥3 faol kun va oxirgi 14 kun ichida ishlagan. */
  | "activated"
  /** ≥3 faol kun, lekin 14+ kun jim. */
  | "quiet";

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
  /** Oxirgi kirish (session) — login, ish qilgani EMAS. */
  lastSeen: Date | null;
  /** Oxirgi real ish — 12 boʻlimning har biri hisobga olinadi. */
  lastActiveAt: Date | null;
  /** Oxirgi ish QAYSI boʻlimda edi ("davomat", "jadval"…). */
  lastArea: string | null;
  /** Ish qilingan alohida kunlar — ommaviy amaldan himoyalangan oʻlchov. */
  activeDaysTotal: number;
  activeDays30d: number;
  /** Nechta boʻlim ishlatilgan (12 dan) — chuqurlik emas, KENGLIK. */
  areas30d: number;
  sessions30d: number;
  /** Median, oʻrtacha EMAS: seans taqsimoti ikki choʻqqili. */
  medianMinutes30d: number | null;
  activationStatus: ActivationStatus;
  /** true = admin/test hisob — voronka statistikasidan chiqarilgan. */
  excludeFromMetrics: boolean;
};

export type AdminUsersPage = {
  items: AdminUserListItem[];
  total: number;
  page: number;
  pageSize: number;
  /** false = `faollik.sql` bazaga hali qoʻllanmagan (quyidagi izohga qarang). */
  activityAvailable: boolean;
};

/** Sortlanishi mumkin boʻlgan ustunlar — OQ ROʻYXAT.

    Foydalanuvchi kiritgan matn hech qachon `ORDER BY` ga
    toʻgʻridan-toʻgʻri tushmaydi; faqat shu kalitlar qabul qilinadi.

    ⛔ Sinf/oʻquvchi soni bu yerda YOʻQ — ular `v_teacher_totals` dan
    ALOHIDA soʻrov bilan, paginatsiyadan keyin olinadi (LessonLab bilan
    dublikatsiz sanash uchun). Ular boʻyicha sortlash uchun avval oʻsha
    koʻrinishni ham asosiy soʻrovga qoʻshish kerak. */
export const USER_SORT_KEYS = [
  "created",
  "name",
  "last_active",
  "active_days",
] as const;
export type UserSortKey = (typeof USER_SORT_KEYS)[number];

export type AdminUsersFilter = {
  search?: string;
  role?: string; // "super_admin" | "school_admin" | "teacher"
  banned?: boolean;
  plan?: string;
  status?: ActivationStatus;
  /** Oxirgi 30 kunda shu boʻlimda ishlaganlar. */
  area?: string;
  sort?: UserSortKey;
  dir?: "asc" | "desc";
  page?: number;
  pageSize?: number;
};

function statusOf(
  activeDaysTotal: number,
  lastActiveAt: Date | null,
): ActivationStatus {
  if (!lastActiveAt) return "never";
  if (activeDaysTotal < ACTIVATED_MIN_DAYS) return "trying";
  const quietSince = Date.now() - QUIET_AFTER_DAYS * 24 * 60 * 60 * 1000;
  return lastActiveAt.getTime() >= quietSince ? "activated" : "quiet";
}

/* ════════════════════════════════════════════════════════════════════
   YAGONA SANOQ — `v_teacher_totals` ko'rinishidan.

   Ko'rinish `drizzle/views/lessonlab-yangi.sql` da (fayl oxiri).
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

  /* ── Faollik koʻrinishiga tayanadigan filtrlar ──────────────────
     Bular faqat koʻrinish mavjud boʻlgandagina qoʻllanadi; aks holda
     jimgina eʼtiborsiz qoladi (ekranda ogohlantirish chiqadi). */
  const activityAvailable = await hasActivityViews();
  const act = teacherActivitySummary;
  const quietCutoff = sql`now() - ${`${QUIET_AFTER_DAYS} days`}::interval`;

  if (activityAvailable && params.status) {
    const enough = sql`coalesce(${act.activeDaysTotal}, 0) >= ${ACTIVATED_MIN_DAYS}`;
    conditions.push(
      params.status === "never"
        ? isNull(act.lastAt)
        : params.status === "trying"
          ? and(isNotNull(act.lastAt), sql`not (${enough})`)!
          : params.status === "activated"
            ? and(enough, gt(act.lastAt, quietCutoff))!
            : and(enough, lte(act.lastAt, quietCutoff))!,
    );
  }

  if (activityAvailable && params.area) {
    /* Boʻlim boʻyicha filtr — xulosa emas, xom koʻrinishdan.
       `EXISTS` shu bois: bitta mos qator topilishi kifoya, oʻqituvchining
       barcha harakatlarini sanash shart emas. */
    conditions.push(
      sql`EXISTS (
        SELECT 1 FROM v_teacher_activity va
        WHERE va.teacher_id = ${user.id}
          AND va.area = ${params.area}
          AND va.at > now() - interval '30 days'
      )`,
    );
  }

  const where = conditions.length ? and(...conditions) : undefined;

  /* ── Sortlash ──────────────────────────────────────────────────
     ⚠️ IKKINCHI MEZON (`user.id`) SHART — sort BARQAROR boʻlishi uchun.
     Busiz bir xil qiymatli qatorlar (masalan hech qachon ishlamagan
     oʻnlab hisob, hammasida `last_at = NULL`) Postgres xohlagan
     tartibda chiqadi va sahifalar orasida sakraydi: bitta odam ikkinchi
     sahifada QAYTA koʻrinib, boshqasi umuman tushib qolardi.

     `NULLS LAST` — «hech qachon ishlamagan»lar oxirida tursin, aks
     holda kamayish tartibida sahifa boshini boʻsh qatorlar egallardi. */
  const dir = params.dir === "asc" ? asc : desc;
  const sortKey: UserSortKey = params.sort ?? "created";
  const sortColumn: SQLWrapper =
    sortKey === "name"
      ? user.name
      : sortKey === "last_active"
        ? act.lastAt
        : sortKey === "active_days"
          ? act.activeDaysTotal
          : user.createdAt;
  /* Koʻrinish yoʻq boʻlsa faollik ustunlari boʻyicha sortlash ham
     mumkin emas — jimgina roʻyxatdan oʻtish tartibiga qaytamiz. */
  const usesActivitySort = sortKey === "last_active" || sortKey === "active_days";
  const orderBy =
    activityAvailable || !usesActivitySort
      ? [sql`${dir(sortColumn)} NULLS LAST`, desc(user.id)]
      : [desc(user.createdAt), desc(user.id)];

  /* ⚠️ JOIN FAQAT KOʻRINISH MAVJUD BOʻLSA — yoʻq jadvalga join
     qilingan soʻrov butun sahifani yiqitadi. Shu bois ikki tarmoq;
     `$dynamic()` shart qoʻshishga ruxsat beradi.

     Sanoq soʻrovi ham AYNAN shu join'ni oladi: filtr koʻrinish
     ustunlari ustida ishlaydi, busiz «87 ta hisob» deb yozilib
     ekranda 12 ta qator chiqardi. */
  const rowsQuery = db
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
    .leftJoin(teachers, eq(teachers.id, user.id))
    .$dynamic();

  const countQuery = db
    .select({ total: count() })
    .from(user)
    .leftJoin(teachers, eq(teachers.id, user.id))
    .$dynamic();

  if (activityAvailable) {
    rowsQuery.leftJoin(act, eq(act.teacherId, user.id));
    countQuery.leftJoin(act, eq(act.teacherId, user.id));
  }

  const [baseRows, [{ total }]] = await Promise.all([
    rowsQuery
      .where(where)
      .orderBy(...orderBy)
      .limit(pageSize)
      .offset((page - 1) * pageSize),
    countQuery.where(where),
  ]);

  const ids = baseRows.map((r) => r.id);
  const [totals, lastSeens, activity, sessionStats] = ids.length
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
        /* Faollik qiymatlari SAHIFA qatorlari uchun alohida olinadi.
           Join yuqorida faqat filtr/sort uchun kerak edi; qiymatlarni
           shu yerdan olish ikkala tarmoq (koʻrinish bor/yoʻq) uchun
           bitta yigʻish kodini saqlab qoladi. */
        activityAvailable
          ? db
              .select({
                teacherId: act.teacherId,
                lastAt: act.lastAt,
                lastArea: act.lastArea,
                activeDaysTotal: act.activeDaysTotal,
                activeDays30d: act.activeDays30d,
                areas30d: act.areas30d,
              })
              .from(act)
              .where(inArray(act.teacherId, ids))
          : Promise.resolve([]),
        activityAvailable
          ? db
              .select({
                teacherId: teacherSessionStats.teacherId,
                sessions30d: teacherSessionStats.sessions30d,
                medianMinutes30d: teacherSessionStats.medianMinutes30d,
              })
              .from(teacherSessionStats)
              .where(inArray(teacherSessionStats.teacherId, ids))
          : Promise.resolve([]),
      ])
    : [[], [], [], []];

  const classMap = new Map(totals.map((t) => [t.teacherId, t.classCount]));
  const studentMap = new Map(totals.map((t) => [t.teacherId, t.studentCount]));
  const seenMap = new Map(lastSeens.map((s) => [s.userId, s.last]));
  const actMap = new Map(activity.map((a) => [a.teacherId, a]));
  const sessMap = new Map(sessionStats.map((s) => [s.teacherId, s]));

  return {
    items: baseRows.map((r) => {
      const a = actMap.get(r.id);
      const s = sessMap.get(r.id);
      const lastActiveAt = a?.lastAt ?? null;
      const activeDaysTotal = a?.activeDaysTotal ?? 0;

      return {
        ...r,
        classCount: classMap.get(r.id) ?? 0,
        studentCount: studentMap.get(r.id) ?? 0,
        lastActiveAt,
        lastArea: a?.lastArea ?? null,
        activeDaysTotal,
        activeDays30d: a?.activeDays30d ?? 0,
        areas30d: a?.areas30d ?? 0,
        sessions30d: s?.sessions30d ?? 0,
        medianMinutes30d: s?.medianMinutes30d ?? null,
        activationStatus: statusOf(activeDaysTotal, lastActiveAt),
        lastSeen: seenMap.get(r.id) ?? null,
        excludeFromMetrics: r.excludeFromMetrics ?? false,
      };
    }),
    total,
    page,
    pageSize,
    activityAvailable,
  };
}

/* ════════════════════════════════════════════════════════════════════
   QULFLANIB QOLISHDAN HIMOYA UCHUN OʻQISHLAR.

   Shartlarning oʻzi `actions/admin/users.ts` da (u yerda amal bilan bir
   joyda turgani oʻqishga qulay), bazaga murojaat esa shu yerda —
   loyihada DB klienti faqat DAL qatlamidan chaqiriladi.
   ════════════════════════════════════════════════════════════════════ */

/** Faol (bloklanmagan) super_admin hisoblari soni. */
export async function countActiveSuperAdmins(): Promise<number> {
  await requireAdmin();
  const [row] = await db.execute<{ n: number }>(sql`
    SELECT COUNT(*)::int AS n FROM "user"
    WHERE 'super_admin' = ANY(string_to_array(coalesce(role, 'teacher'), ','))
      AND coalesce(banned, false) = false
  `);
  return Number(row?.n ?? 0);
}

/** Rol darvozalari uchun minimal snapshot — hisob topilmasa `null`. */
export async function getUserRoleSnapshot(
  userId: string,
): Promise<{ role: string | null; banned: boolean | null } | null> {
  await requireAdmin();
  const [row] = await db
    .select({ role: user.role, banned: user.banned })
    .from(user)
    .where(eq(user.id, userId));
  return row ?? null;
}

/** Hisobda parol bilan kirish bormi (Google-only boʻlsa `false`). */
export async function hasPasswordAccount(email: string): Promise<boolean> {
  await requireAdmin();
  const [row] = await db.execute<{ n: number }>(sql`
    SELECT COUNT(*)::int AS n
    FROM account a JOIN "user" u ON u.id = a.user_id
    WHERE u.email = ${email} AND a.provider_id = 'credential'
  `);
  return Number(row?.n ?? 0) > 0;
}

/** Test/admin hisobini voronka statistikasidan chiqarish (yoki qaytarish). */
export async function setExcludeFromMetrics(
  userId: string,
  excluded: boolean,
): Promise<void> {
  await requireAdmin();
  await db
    .update(teachers)
    .set({ excludeFromMetrics: excluded })
    .where(eq(teachers.id, userId));
}

/** Jadval «Tarif» filtri uchun mavjud tariflar roʻyxati.

    ⚠️ Qoʻlda yozilgan roʻyxat EMAS — `teachers.plan` matn ustuni va
    yangi tarif qoʻshilganda filtr oʻzi bilib oladi. Qoʻlda yozilsa
    yangi tarif filtrga tushmay qolardi va uni topib boʻlmasdi. */
export async function listPlanOptions(): Promise<string[]> {
  await requireAdmin();
  const rows = await db
    .selectDistinct({ plan: teachers.plan })
    .from(teachers)
    .orderBy(teachers.plan);
  return rows.map((r) => r.plan).filter(Boolean);
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

  const activityAvailable = await hasActivityViews();
  const act = teacherActivitySummary;

  const [totals, sessions, activity, sessionStats] = await Promise.all([
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
    // Faollik ham roʻyxat bilan AYNI koʻrinishdan — ikki ekran bir xil
    // raqam koʻrsatishi uchun (avval ular ajralib ketgan edi).
    activityAvailable
      ? db.select().from(act).where(eq(act.teacherId, userId))
      : Promise.resolve([]),
    activityAvailable
      ? db
          .select()
          .from(teacherSessionStats)
          .where(eq(teacherSessionStats.teacherId, userId))
      : Promise.resolve([]),
  ]);

  const a = activity[0];
  const s = sessionStats[0];
  const lastActiveAt = a?.lastAt ?? null;
  const activeDaysTotal = a?.activeDaysTotal ?? 0;

  return {
    ...row,
    classCount: totals[0]?.classCount ?? 0,
    studentCount: totals[0]?.studentCount ?? 0,
    lastSeen: sessions[0]?.updatedAt ?? null,
    lastActiveAt,
    lastArea: a?.lastArea ?? null,
    activeDaysTotal,
    activeDays30d: a?.activeDays30d ?? 0,
    areas30d: a?.areas30d ?? 0,
    sessions30d: s?.sessions30d ?? 0,
    medianMinutes30d: s?.medianMinutes30d ?? null,
    activationStatus: statusOf(activeDaysTotal, lastActiveAt),
    excludeFromMetrics: row.excludeFromMetrics ?? false,
    sessions,
  };
}

/* ════════════════════════════════════════════════════════════════════
   SEANSLAR — qaysi qurilmadan kirilgan.

   ⚠️ «Foydalanuvchi mobil» degan yorliq YOʻQ — ataylab. Bitta odam
   ertalab telefonda, kechqurun noutbukda ishlaydi; uni bitta qurilmaga
   bogʻlash yolgʻon boʻlardi. Shuning uchun qurilma faqat SEANS
   darajasida koʻrsatiladi (kim qachon nimadan kirgan), agregat esa
   `getDeviceBreakdown` da — foydalanuvchi emas, seans boʻyicha ulush.

   User-Agent parsi bazada emas, JS'da (`@/lib/user-agent`): SQL ichida
   regexp yozilsa taʼrif ikki joyda ikki xil boʻlib ketardi. */

export type AdminUserSession = {
  id: string;
  updatedAt: Date;
  ipAddress: string | null;
  userAgent: string | null;
};

export async function listUserSessionsForAdmin(
  userId: string,
): Promise<AdminUserSession[]> {
  await requireAdmin();
  return db
    .select({
      id: session.id,
      updatedAt: session.updatedAt,
      ipAddress: session.ipAddress,
      userAgent: session.userAgent,
    })
    .from(session)
    .where(eq(session.userId, userId))
    .orderBy(desc(session.updatedAt))
    .limit(10);
}

import "server-only";
import { count, gt, sql } from "drizzle-orm";
import { db } from "@/server/db/client";
// classes/students bu yerda ishlatilmaydi: sinf va oʻquvchi sanogʻi
// quyidagi raw SQL ichida class_teachers/enrollments orqali olinadi.
import { user, session, teachers } from "@/server/db/schema";
import { hasActivityViews } from "@/server/db/views";
import { ACTIVATED_MIN_DAYS } from "@/lib/faollik";
import { requireAdmin } from "@/server/session";
import { parseUserAgent, type DeviceKind } from "@/lib/user-agent";

/* ════════════════════════════════════════════════════════════════════
   ADMIN → PLATFORMA STATISTIKASI (kross-tenant agregatlar).

   Voronka "faol"ni sessiya/kirish orqali EMAS, real ish orqali
   oʻlchaydi — kirish faollik emas. Xuddi shu mantiq scripts/metrics.ts'da
   (terminal skript) ham bor; bu yerda ekvivalenti admin panelga
   koʻchirilgan, chunki panelni tekshirish uchun kimdir terminalga
   kirmasligi kerak.

   ⚠️ "Real ish" — 12 BOʻLIM, davomat/baho emas. Ilgari faqat davomat
   va baho sanalardi va dars rejalashtirgan, jadval tuzgan, standart
   yozgan yoki test oʻtkazgan oʻqituvchi "hech qachon ishlamagan" boʻlib
   koʻrinardi. Taʼrif endi drizzle/views/faollik.sql da.

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
  reason:
    | "no_class"
    | "no_students"
    | "no_activity"
    /** Ishlagan, lekin 3 kundan kam — sinab koʻrgan, odat boʻlmagan. */
    | "tried_once"
    | "went_quiet";
  lastActiveAt: Date | null;
  /** Oxirgi ish qaysi boʻlimda edi — nima qilganini koʻrsatish uchun. */
  lastArea: string | null;
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

  /* Bu sahifaning butun mazmuni — faollik. Koʻrinish yoʻq boʻlsa nollar
     bilan chizish YOLGʻON boʻlardi, shuning uchun ochiq xato. */
  if (!(await hasActivityViews())) {
    throw new Error(
      "Faollik koʻrinishlari bazada yoʻq. Qoʻllash: drizzle/views/faollik.sql",
    );
  }

  /* Har bir oʻqituvchi uchun bitta qator: roʻyxat maʼlumoti + faollik.
     Sahifa koʻrish/session bu yerda FAOLLIK sifatida hisoblanmaydi.

     ⚠️ KORRELYATSIYALANGAN SUBQUERY EMAS — HAR JADVAL BIR MARTA.

     Ilgari har ustun `(SELECT … WHERE x.teacher_id = t.id)` shaklida
     edi. Postgres uni inline qilib, HAR oʻqituvchi uchun
     `attendance_records` ni boshidan skanerlardi (oʻlchandi: 51 loop ×
     4202 qator). Kichik bazada bu 23 ms, lekin xarajat oʻqituvchi ×
     yozuv, yaʼni KVADRATIK — 500 oʻqituvchi va 500k davomatda panel
     ochilmay qoladi. Endi har jadval bitta GROUP BY bilan yigʻiladi.

     ⚠️ Faollik koʻrinishi 19 ta jadval ustidan UNION qiladi va bu
     soʻrov HAMMA oʻqituvchi uchun ishlaydi. Hozir hajm kichik; sekinlik
     sezilsa koʻrinishni MATERIALIZED qilib, kunlik yangilash kerak. */
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
    )
    /* ⛔ FAOLLIK BU YERDA QAYTA TAʼRIFLANMAYDI — v_teacher_activity_summary.

       ⚠️ Bu izoh JS shablon satri ICHIDA — teskari qoʻshtirnoq (backtick)
       ishlatmang, u satrni uzib yuboradi va TypeScript xatosi butunlay
       boshqa qatorni koʻrsatadi.

       Ilgari bu soʻrov davomat/baho/darsni oʻzi sanardi, users.ts esa
       davomat/bahoni: BITTA odam ikki ekranda ikki xil «oxirgi ish»
       sanasi bilan koʻrinardi. Endi ikkalasi ham shu koʻrinishdan
       oʻqiydi (drizzle/views/faollik.sql). */
    SELECT
      s.id,
      s.name,
      s.email,
      s.signed_up_at,
      COALESCE(cls.class_count, 0)     AS class_count,
      COALESCE(stu.student_count, 0)   AS student_count,
      COALESCE(a.active_days_total, 0) AS active_days_total,
      a.last_area                      AS last_area,
      a.last_at                        AS last_active_at
    FROM scoped s
    LEFT JOIN cls ON cls.teacher_id = s.id
    LEFT JOIN stu ON stu.teacher_id = s.id
    LEFT JOIN v_teacher_activity_summary a ON a.teacher_id = s.id
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
    active_days_total: number;
    last_area: string | null;
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

  /* ⭐ FAOLLASHUV — TAKRORLANISH BOʻYICHA, TURI BOʻYICHA EMAS.

     Ilgari «bitta davomat yozuvi bor» = faollashgan edi. Lekin bir
     kunda kiritilgan 400 ta yozuv — bitta ommaviy amal, odat emas.
     Kamida 3 xil KUNDA ishlagan boʻlsa, bu qaytib kelish demak, va
     uni ommaviy amal bilan shishirib boʻlmaydi. */
  const activated = rows.filter((r) => r.active_days_total >= ACTIVATED_MIN_DAYS);
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
      r.active_days_total < ACTIVATED_MIN_DAYS
        ? true
        : r.last_active_at === null || r.last_active_at.getTime() < twoWeeksAgo.getTime(),
    )
    .map((r) => ({
      id: r.id,
      name: r.name,
      email: r.email,
      /* Tartib muhim: eng ERTA toʻsiq birinchi aytiladi. Sinfi yoʻq
         odamga «davomat belgilamagan» deyish foydasiz — u hali
         belgilay olmaydi ham. */
      reason:
        r.class_count === 0
          ? ("no_class" as const)
          : r.student_count === 0
            ? ("no_students" as const)
            : r.active_days_total === 0
              ? ("no_activity" as const)
              : r.active_days_total < ACTIVATED_MIN_DAYS
                ? ("tried_once" as const)
                : ("went_quiet" as const),
      lastActiveAt: r.last_active_at,
      lastArea: r.last_area,
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

/* ════════════════════════════════════════════════════════════════════
   QURILMA TAQSIMOTI — mobil/planshet/kompyuter ulushi.

   ⚠️ MAXRAJ — SEANS, FOYDALANUVCHI EMAS. «Foydalanuvchilarning 40%
   mobil» degan gap notoʻgʻri boʻlardi: bir odam ikkala qurilmadan ham
   kiradi. Bu yerdagi savol boshqa — «ilovaga kirishlarning qanchasi
   telefondan?» — mobil UI'ga qancha kuch sarflash kerakligini aynan
   shu raqam belgilaydi.

   Oyna: oxirgi 30 kun ichida yangilangan seanslar. Eski seanslarni
   ham qoʻshsak, allaqachon almashtirilgan qurilmalar raqamni
   suzdirardi. */

export type DeviceBreakdown = {
  device: DeviceKind;
  sessions: number;
  /** Foizda, butun songa yaxlitlangan. */
  share: number;
}[];

export async function getDeviceBreakdown(): Promise<DeviceBreakdown> {
  await requireAdmin();

  const since30 = new Date(Date.now() - 30 * DAY_MS);

  /* Faqat UA ustuni tortiladi — parsi JS'da (`@/lib/user-agent`).
     Hajm kichik: 30 kunlik seanslar soni foydalanuvchilar sonidan bir
     necha barobar, yaʼni mingdan oshmaydi. */
  const rows = await db
    .select({ userAgent: session.userAgent })
    .from(session)
    .where(gt(session.updatedAt, since30));

  const counts = new Map<DeviceKind, number>();
  for (const r of rows) {
    const kind = parseUserAgent(r.userAgent).device;
    counts.set(kind, (counts.get(kind) ?? 0) + 1);
  }

  const total = rows.length;
  const order: DeviceKind[] = ["mobile", "tablet", "desktop", "unknown"];
  return order
    .map((device) => {
      const sessions = counts.get(device) ?? 0;
      return {
        device,
        sessions,
        share: total ? Math.round((sessions / total) * 100) : 0,
      };
    })
    .filter((d) => d.sessions > 0);
}

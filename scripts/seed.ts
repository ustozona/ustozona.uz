import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { count, eq } from "drizzle-orm";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { APIError } from "better-auth/api";
import * as schema from "@/server/db/schema";
import { CLASS_DATA } from "@/lib/grades-data";
import { BUILTIN_STATUSES } from "@/lib/attendance-data";
import { defaultSkills, defaultRewards } from "@/lib/behavior-data";
import { demoAttendanceRecords, demoTimetableEvents } from "./demo-attendance";
import { demoBehaviorData } from "./demo-behavior";
import { resolveDefaultLinks } from "@/lib/relations";
import { UNITS, LESSONS } from "@/lib/lessons-data";
import { DEMO_CALENDAR, DEMO_CLASS_IDS } from "./demo-calendar";
import { defaultBellConfig } from "@/lib/bell-schedule";
import { STANDARDS_DATA } from "@/lib/standards-data";
import { SEED_NOTIFICATIONS } from "@/store/useNotificationsStore";

/* ════════════════════════════════════════════════════════════════════
   SEED — demo oʻqituvchi + mavjud frontend seed modullaridan baza.

   Ishga tushirish:
     npx tsx --env-file=.env.local scripts/seed.ts

   IDEMPOTENT: har ishga tushirishda demo oʻqituvchining domen qatorlari
   oʻchirilib (classes CASCADE butun daraxtni tozalaydi) qayta yoziladi.
   String id'lar seed modullardagi bilan AYNAN bir xil saqlanadi
   ("5-a", "s-0-abdulloh-xasanov", ...) — bu id'lar faqat demo
   oʻqituvchiga tegishli.

   Server db client'i (src/server/db/client.ts) EMAS — u `server-only`
   import qiladi, tsx ostida ishlamaydi; bu skript oʻz clientini quradi.
   Better Auth API orqali yaratish — parol hash toʻgʻri boʻlishi uchun.
   ════════════════════════════════════════════════════════════════════ */

const DEMO = {
  name: "Otabek Abdusattorov",
  email: "demo@ustozona.uz",
  password: "demo12345",
  subject: "Ingliz tili",
};

const CHUNK = 400;

async function insertChunked<T>(
  label: string,
  rows: T[],
  insert: (batch: T[]) => Promise<unknown>
) {
  for (let i = 0; i < rows.length; i += CHUNK) {
    await insert(rows.slice(i, i + CHUNK));
  }
  console.log(`  + ${label}: ${rows.length}`);
}

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL topilmadi. Ishga tushirish: npx tsx --env-file=.env.local scripts/seed.ts"
    );
  }
  const db = drizzle(postgres(url, { prepare: false, max: 1 }), { schema });

  /* ── 1. Demo oʻqituvchi (Better Auth API — toʻgʻri parol hash) ───── */
  const auth = betterAuth({
    baseURL: process.env.BETTER_AUTH_URL ?? "http://localhost:3000",
    secret: process.env.BETTER_AUTH_SECRET,
    database: drizzleAdapter(db, { provider: "pg", schema }),
    emailAndPassword: { enabled: true },
    user: {
      additionalFields: {
        role: { type: "string", defaultValue: "teacher", input: false },
      },
    },
  });

  let userId: string;
  try {
    const res = await auth.api.signUpEmail({
      body: { name: DEMO.name, email: DEMO.email, password: DEMO.password },
    });
    userId = res.user.id;
    console.log(`Demo oʻqituvchi yaratildi: ${DEMO.email}`);
  } catch (err) {
    if (!(err instanceof APIError)) throw err;
    const [existing] = await db
      .select({ id: schema.user.id })
      .from(schema.user)
      .where(eq(schema.user.email, DEMO.email));
    if (!existing) throw err;
    userId = existing.id;
    console.log(`Demo oʻqituvchi mavjud: ${DEMO.email}`);
  }

  await db
    .insert(schema.teachers)
    .values({ id: userId, name: DEMO.name, email: DEMO.email, subject: DEMO.subject })
    .onConflictDoUpdate({
      target: schema.teachers.id,
      set: { name: DEMO.name, subject: DEMO.subject, updatedAt: new Date() },
    });

  /* ── 2. Eski domen qatorlari tozalanadi (idempotentlik) ──────────── */
  // classes CASCADE: students → grades/attendance_records/student_relations,
  // topics → assignments. Statuses alohida jadval.
  await db.delete(schema.classes).where(eq(schema.classes.teacherId, userId));
  await db
    .delete(schema.attendanceStatuses)
    .where(eq(schema.attendanceStatuses.teacherId, userId));
  // Rejalashtirish domeni classId'ga FK'siz — CASCADE qamramaydi, alohida tozalanadi.
  await db.delete(schema.units).where(eq(schema.units.teacherId, userId));
  await db.delete(schema.lessons).where(eq(schema.lessons.teacherId, userId));
  await db
    .delete(schema.timetableVersions)
    .where(eq(schema.timetableVersions.teacherId, userId));
  await db.delete(schema.calendars).where(eq(schema.calendars.teacherId, userId));
  await db
    .delete(schema.standardSets)
    .where(eq(schema.standardSets.teacherId, userId));
  await db.delete(schema.classNotes).where(eq(schema.classNotes.teacherId, userId));
  await db
    .delete(schema.notifications)
    .where(eq(schema.notifications.teacherId, userId));
  await db.delete(schema.feedback).where(eq(schema.feedback.teacherId, userId));
  // Xulq: events/redemptions classes CASCADE bilan ketadi, skills/rewards
  // teacher-scoped (class FK yoʻq) — alohida tozalanadi.
  await db
    .delete(schema.behaviorSkills)
    .where(eq(schema.behaviorSkills.teacherId, userId));
  await db
    .delete(schema.behaviorRewards)
    .where(eq(schema.behaviorRewards.teacherId, userId));
  console.log("Eski demo qatorlar tozalandi.");

  /* ── 3. Jurnal domeni: CLASS_DATA dan ────────────────────────────── */
  const classRows: (typeof schema.classes.$inferInsert)[] = [];
  const studentRows: (typeof schema.students.$inferInsert)[] = [];
  const topicRows: (typeof schema.topics.$inferInsert)[] = [];
  const assignmentRows: (typeof schema.assignments.$inferInsert)[] = [];
  const gradeRows: (typeof schema.grades.$inferInsert)[] = [];

  Object.values(CLASS_DATA)
    .filter((data) => DEMO_CLASS_IDS.includes(data.info.id))
    .forEach((data, classIdx) => {
    const classId = data.info.id;
    classRows.push({
      id: classId,
      teacherId: userId,
      name: data.info.name,
      color: data.info.color ?? null,
      time: data.info.time ?? null,
      sortOrder: classIdx,
    });
    data.students.forEach((s, i) => {
      studentRows.push({
        id: s.id,
        teacherId: userId,
        classId,
        name: s.name,
        initials: s.initials,
        status: s.status ?? "active",
        gender: s.gender ?? null,
        birthDate: s.birthDate ?? null,
        parentName: s.parentName ?? null,
        parentPhone: s.parentPhone ?? null,
        studentPhone: s.studentPhone ?? null,
        sortOrder: i,
      });
    });
    data.topics.forEach((t, i) => {
      topicRows.push({
        id: t.id,
        teacherId: userId,
        classId,
        groupId: t.groupId ?? null,
        name: t.name,
        color: t.color,
        purpose: t.purpose,
        weightPercent: t.weightPercent,
        scaleKind: t.scaleKind ?? null,
        sortOrder: i,
      });
    });
    data.assignments.forEach((a, i) => {
      assignmentRows.push({
        id: a.id,
        teacherId: userId,
        classId,
        topicId: a.topicId,
        title: a.title,
        maxScore: a.maxScore,
        date: a.date ?? null,
        sortOrder: i,
      });
    });
    for (const g of data.grades) {
      gradeRows.push({
        teacherId: userId,
        studentId: g.studentId,
        assignmentId: g.assignmentId,
        score: g.score,
        isDraft: g.isDraft ?? false,
        // eski isMissing belgisi missing'ga normallanadi
        missing: g.missing ?? (g.isMissing ? "absent" : null),
      });
    }
  });

  await insertChunked("classes", classRows, (b) => db.insert(schema.classes).values(b));
  await insertChunked("students", studentRows, (b) => db.insert(schema.students).values(b));
  await insertChunked("topics", topicRows, (b) => db.insert(schema.topics).values(b));
  await insertChunked("assignments", assignmentRows, (b) =>
    db.insert(schema.assignments).values(b)
  );
  await insertChunked("grades", gradeRows, (b) => db.insert(schema.grades).values(b));

  /* ── 4. Davomat: built-in holatlar + seed yozuvlar ───────────────── */
  const statusRows = BUILTIN_STATUSES.map((s, i) => ({
    teacherId: userId,
    key: s.key,
    label: s.label,
    icon: s.icon,
    scoreImpact: s.scoreImpact,
    active: s.active,
    builtIn: s.builtIn,
    tone: s.tone,
    sortOrder: i,
  }));
  await insertChunked("attendance_statuses", statusRows, (b) =>
    db.insert(schema.attendanceStatuses).values(b)
  );

  const recordRows: (typeof schema.attendanceRecords.$inferInsert)[] = [];
  for (const classId of DEMO_CLASS_IDS) {
    const records = demoAttendanceRecords(classId);
    for (const r of records) {
      recordRows.push({
        teacherId: userId,
        classId,
        studentId: r.studentId,
        date: r.date,
        status: r.status,
        note: r.note ?? null,
      });
    }
  }
  await insertChunked("attendance_records", recordRows, (b) =>
    db.insert(schema.attendanceRecords).values(b)
  );

  /* ── 4.4. Xulq: default koʻnikma/mukofotlar + ~6 hafta event ─────── */
  // Id'lar DAL server-side seed bilan bir xil (bhs-{slug}-{teacherId}) —
  // demo teacher birinchi fetch'da qayta seed olmaydi (jadvallar boʻsh emas).
  const nowIso = new Date().toISOString();
  const skillRows = defaultSkills(userId).map((s, i) => ({
    id: s.id,
    teacherId: userId,
    name: s.name,
    emoji: s.emoji,
    points: s.points,
    description: s.description ?? null,
    sortOrder: i,
    updatedAt: nowIso,
  }));
  await insertChunked("behavior_skills", skillRows, (b) =>
    db.insert(schema.behaviorSkills).values(b)
  );

  const rewardRows = defaultRewards(userId).map((r, i) => ({
    id: r.id,
    teacherId: userId,
    name: r.name,
    emoji: r.emoji,
    cost: r.cost,
    sortOrder: i,
    updatedAt: nowIso,
  }));
  await insertChunked("behavior_rewards", rewardRows, (b) =>
    db.insert(schema.behaviorRewards).values(b)
  );

  const behavior = demoBehaviorData(userId);
  const behaviorEventRows = behavior.events.map((e) => ({
    id: e.id,
    teacherId: userId,
    classId: e.classId,
    studentId: e.studentId,
    skillId: e.skillId ?? null,
    name: e.name,
    emoji: e.emoji,
    points: e.points,
    description: e.description ?? null,
    note: e.note ?? null,
    date: e.date,
    createdAt: e.createdAt,
  }));
  await insertChunked("behavior_events", behaviorEventRows, (b) =>
    db.insert(schema.behaviorEvents).values(b)
  );

  const behaviorRedemptionRows = behavior.redemptions.map((r) => ({
    id: r.id,
    teacherId: userId,
    classId: r.classId,
    studentId: r.studentId,
    rewardId: r.rewardId ?? null,
    name: r.name,
    emoji: r.emoji,
    cost: r.cost,
    date: r.date,
    createdAt: r.createdAt,
  }));
  await insertChunked("behavior_redemptions", behaviorRedemptionRows, (b) =>
    db.insert(schema.behaviorRedemptions).values(b)
  );

  /* ── 4.5. Rejalashtirish domeni: darslar banki, jadval, kalendar ── */
  const unitRows = UNITS.filter((u) => DEMO_CLASS_IDS.includes(u.classId)).map((u, i) => ({
    id: u.id,
    teacherId: userId,
    classId: u.classId,
    number: u.number,
    title: u.title,
    description: u.description,
    sortOrder: i,
  }));
  await insertChunked("units", unitRows, (b) => db.insert(schema.units).values(b));

  const lessonRows = LESSONS.filter((l) => DEMO_CLASS_IDS.includes(l.classId)).map((l, i) => ({
    id: l.id,
    teacherId: userId,
    classId: l.classId,
    unitId: l.unitId ?? null,
    number: l.number,
    title: l.title,
    status: l.status,
    sortOrder: i,
    data: l as unknown as Record<string, unknown>,
  }));
  await insertChunked("lessons", lessonRows, (b) => db.insert(schema.lessons).values(b));

  // Jadval eventlari davomat dars kunlari bilan BITTA manbadan
  // (DEMO_TIMETABLE, scripts/demo-attendance.ts) — davomat jurnali
  // "rejalashtirilgan kunlar" koʻrinishida shu jadvalni koʻradi.
  const timetableEvents = demoTimetableEvents();
  await db.insert(schema.timetableVersions).values({
    id: "tt-seed-v1",
    teacherId: userId,
    effectiveFrom: DEMO_CALENDAR.range.start,
    note: "Dastlabki jadval",
    createdAt: new Date().toISOString(),
    bellConfig: defaultBellConfig() as unknown as Record<string, unknown>,
    events: timetableEvents,
  });
  console.log(`  + timetable_versions: 1 (${timetableEvents.length} event)`);

  await db.insert(schema.calendars).values({
    teacherId: userId,
    data: DEMO_CALENDAR as unknown as Record<string, unknown>,
  });
  console.log("  + calendars: 1");

  /* ── 4.7. Standartlar (7-bosqich) ────────────────────── */
  // Bitta demo papka: STANDARDS_DATA (ingliz tili) 7-a sinfiga biriktirilgan.
  const demoStandardSet = {
    id: "std-seed-english",
    name: "Ingliz tili — asosiy standartlar",
    subject: DEMO.subject,
    classIds: ["7-a"],
    standards: STANDARDS_DATA,
    grade: "7-sinf",
  };
  await db.insert(schema.standardSets).values({
    id: demoStandardSet.id,
    teacherId: userId,
    kind: "class",
    name: demoStandardSet.name,
    subject: demoStandardSet.subject,
    sortOrder: 0,
    data: demoStandardSet as unknown as Record<string, unknown>,
  });
  console.log("  + standard_sets: 1");

  /* ── 4.8. Bildirishnomalar + fikr-mulohaza (8-bosqich) ───────────── */
  const notificationRows = SEED_NOTIFICATIONS.map((n, i) => ({
    id: n.id,
    teacherId: userId,
    kind: n.kind,
    title: n.title,
    body: n.body ?? null,
    href: n.href ?? null,
    read: n.read,
    createdAt: n.createdAt,
    sortOrder: i,
  }));
  await insertChunked("notifications", notificationRows, (b) =>
    db.insert(schema.notifications).values(b)
  );

  /* Fikr-mulohaza endi UMUMIY doska (barcha oʻqituvchilarga koʻrinadi) —
     demo hisobga soxta SEED_FEEDBACK yozish endi notoʻgʻri (haqiqiy
     foydalanuvchilar buni "boshqalarning fikri" deb koʻradi). Shu sabab
     bu yerda feedback seed qilinmaydi. */

  /* ── 5. Qarindoshlik juftlari ────────────────────────────────────── */
  // resolveDefaultLinks() butun CLASS_DATA'dan (5 ta sinfdan tashqarisi ham)
  // oʻqiydi — faqat haqiqatan yozilgan oʻquvchilar juftligi qoldiriladi
  // (aks holda studentA/B FK buziladi).
  const insertedStudentIds = new Set(studentRows.map((s) => s.id));
  const relationRows = resolveDefaultLinks()
    .filter(([a, b]) => insertedStudentIds.has(a) && insertedStudentIds.has(b))
    .map(([a, b]) => ({
      teacherId: userId,
      studentA: a < b ? a : b,
      studentB: a < b ? b : a,
    }));
  await insertChunked("student_relations", relationRows, (b) =>
    db.insert(schema.studentRelations).values(b)
  );

  /* ── 6. Yakuniy hisobot ──────────────────────────────────────────── */
  const report: [string, { count: number }[]][] = [
    ["classes", await db.select({ count: count() }).from(schema.classes).where(eq(schema.classes.teacherId, userId))],
    ["students", await db.select({ count: count() }).from(schema.students).where(eq(schema.students.teacherId, userId))],
    ["topics", await db.select({ count: count() }).from(schema.topics).where(eq(schema.topics.teacherId, userId))],
    ["assignments", await db.select({ count: count() }).from(schema.assignments).where(eq(schema.assignments.teacherId, userId))],
    ["grades", await db.select({ count: count() }).from(schema.grades).where(eq(schema.grades.teacherId, userId))],
    ["attendance_statuses", await db.select({ count: count() }).from(schema.attendanceStatuses).where(eq(schema.attendanceStatuses.teacherId, userId))],
    ["attendance_records", await db.select({ count: count() }).from(schema.attendanceRecords).where(eq(schema.attendanceRecords.teacherId, userId))],
    ["behavior_skills", await db.select({ count: count() }).from(schema.behaviorSkills).where(eq(schema.behaviorSkills.teacherId, userId))],
    ["behavior_events", await db.select({ count: count() }).from(schema.behaviorEvents).where(eq(schema.behaviorEvents.teacherId, userId))],
    ["behavior_rewards", await db.select({ count: count() }).from(schema.behaviorRewards).where(eq(schema.behaviorRewards.teacherId, userId))],
    ["behavior_redemptions", await db.select({ count: count() }).from(schema.behaviorRedemptions).where(eq(schema.behaviorRedemptions.teacherId, userId))],
    ["student_relations", await db.select({ count: count() }).from(schema.studentRelations).where(eq(schema.studentRelations.teacherId, userId))],
    ["standard_sets", await db.select({ count: count() }).from(schema.standardSets).where(eq(schema.standardSets.teacherId, userId))],
    ["notifications", await db.select({ count: count() }).from(schema.notifications).where(eq(schema.notifications.teacherId, userId))],
    ["feedback", await db.select({ count: count() }).from(schema.feedback).where(eq(schema.feedback.teacherId, userId))],
  ];
  console.log("\nBazadagi qator sonlari (demo teacher):");
  for (const [name, [row]] of report) console.log(`  ${name}: ${row.count}`);
  console.log(`\nKirish: ${DEMO.email} / ${DEMO.password}`);
}

main().catch((err) => {
  console.error("Seed xatosi:", err);
  process.exit(1);
});

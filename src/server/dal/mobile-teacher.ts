import "server-only";
import { randomUUID } from "node:crypto";
import { and, asc, eq, inArray, isNull, sql } from "drizzle-orm";
import { db } from "@/server/db/client";
import { assignments, attendanceRecords, attendanceStatuses, behaviorEvents, behaviorSkills, classes, enrollments, grades, students } from "@/server/db/schema";
import { ForbiddenError, requireTeacher } from "@/server/session";
import { assertTeachesClass, visibleClassIds } from "@/server/workspace";
import { activeClassRoster, activeClassRosterWithStart } from "@/server/dal/class-roster";
import { applyAttendanceBatch } from "@/server/dal/attendance";
import { applyGradesBatch } from "@/server/dal/grades";
import { applyBehaviorBatch, getBehaviorPayload } from "@/server/dal/behavior";
import { BUILTIN_STATUSES, isEnrolledOn } from "@/lib/attendance-data";
import { getTimetablePayload } from "@/server/dal/timetable";
import { normalizeLegacyVersions, resolveVersionForDate } from "@/lib/timetable-versions";
import { dateKeyToDate } from "@/lib/date-keys";

/* ════════════════════════════════════════════════════════════════════
   MOBIL ILOVA — ustozning «Bugun» va tezkor davomati.

   Yangi ruxsat mantigʻi YOʻQ: hamma narsa saytdagi DAL orqali oʻtadi
   (`requireTeacher`, `visibleClassIds`, `assertTeachesClass`,
   `applyAttendanceBatch` egalik filtri). Bearer token Better Auth
   `bearer()` plagini orqali oddiy sessiyaga aylanadi.

   Sana HAR DOIM mijozdan keladi ("YYYY-MM-DD"): server UTC'da,
   ustoz esa Toshkent vaqtida yashaydi.
   ════════════════════════════════════════════════════════════════════ */

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function isDateKey(v: string | null): v is string {
  return !!v && DATE_RE.test(v) && !Number.isNaN(dateKeyToDate(v).getTime());
}

export type MobileLesson = {
  id: string;
  classId: string;
  className: string;
  subject: string | null;
  startMin: number;
  endMin: number;
  /** Shu kun uchun davomat belgilangan oʻquvchilar soni. */
  marked: number;
};

export type MobileClass = { id: string; name: string; subject: string | null };

export type MobileToday = { date: string; lessons: MobileLesson[]; classes: MobileClass[] };

export async function getMobileToday(date: string): Promise<MobileToday> {
  const teacher = await requireTeacher();
  const [ids, timetable] = await Promise.all([visibleClassIds("data"), getTimetablePayload()]);

  const classRows = ids.length
    ? await db
        .select({ id: classes.id, name: classes.name, subject: classes.subject, sortOrder: classes.sortOrder })
        .from(classes)
        .where(and(inArray(classes.id, ids), isNull(classes.archivedAt)))
    : [];
  classRows.sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name));
  const byId = new Map(classRows.map((c) => [c.id, c]));

  // JS: 0=Yakshanba … 6=Shanba; jadval: 1=Dushanba … 6=Shanba.
  const weekday = dateKeyToDate(date).getDay();
  const version = resolveVersionForDate(normalizeLegacyVersions(timetable.versions), date);
  const events = (version?.events ?? [])
    .filter((e) => e.day === weekday && byId.has(e.classId))
    .sort((a, b) => a.startMin - b.startMin);

  const lessonClassIds = [...new Set(events.map((e) => e.classId))];
  const marks = lessonClassIds.length
    ? await db
        .select({ classId: attendanceRecords.classId })
        .from(attendanceRecords)
        .where(
          and(
            eq(attendanceRecords.teacherId, teacher.id),
            eq(attendanceRecords.date, date),
            inArray(attendanceRecords.classId, lessonClassIds)
          )
        )
    : [];
  const markedBy = new Map<string, number>();
  for (const m of marks) markedBy.set(m.classId, (markedBy.get(m.classId) ?? 0) + 1);

  return {
    date,
    lessons: events.map((e) => {
      const c = byId.get(e.classId)!;
      return {
        id: e.id,
        classId: e.classId,
        className: c.name,
        subject: c.subject,
        startMin: e.startMin,
        endMin: e.endMin,
        marked: markedBy.get(e.classId) ?? 0,
      };
    }),
    classes: classRows.map(({ id, name, subject }) => ({ id, name, subject })),
  };
}

/** Faol holatlar — saytdagi kabi: toʻplam qulflangan (4 ta built-in),
    DB'dan faqat `active` olinadi. Butun davomat tarixini yuklamaslik
    uchun `getAttendancePayload` ishlatilmaydi. */
async function activeStatuses(teacherId: string) {
  const rows = await db
    .select({ key: attendanceStatuses.key, active: attendanceStatuses.active })
    .from(attendanceStatuses)
    .where(eq(attendanceStatuses.teacherId, teacherId));
  const active = new Map(rows.map((r) => [r.key, r.active]));
  return BUILTIN_STATUSES.filter((s) => active.get(s.key) ?? s.active);
}

export type MobileAttendanceSheet = {
  classId: string;
  date: string;
  statuses: { key: string; label: string; tone: string }[];
  students: { id: string; name: string; status: string | null }[];
};

export async function getMobileAttendance(classId: string, date: string): Promise<MobileAttendanceSheet> {
  const ctx = await assertTeachesClass(classId);
  const [roster, statuses, records] = await Promise.all([
    activeClassRosterWithStart(classId),
    activeStatuses(ctx.teacherId),
    db
      .select({ studentId: attendanceRecords.studentId, status: attendanceRecords.status })
      .from(attendanceRecords)
      .where(
        and(
          eq(attendanceRecords.teacherId, ctx.teacherId),
          eq(attendanceRecords.classId, classId),
          eq(attendanceRecords.date, date)
        )
      ),
  ]);
  const byStudent = new Map(records.map((r) => [r.studentId, r.status]));
  return {
    classId,
    date,
    statuses: statuses.map(({ key, label, tone }) => ({ key, label, tone })),
    /* Bola sinfga yozilishidan OLDINGI kun uchun varaqda chiqmaydi — belgi
       baribir saqlanmasdi (`applyAttendanceBatch`). Shu kunga yozuvi allaqachon
       bor boʻlsa koʻrinadi: tarix yashirilmaydi. */
    students: roster
      .filter((s) => isEnrolledOn(s.startedAt, date) || byStudent.has(s.id))
      .map((s) => ({ id: s.id, name: s.name, status: byStudent.get(s.id) ?? null })),
  };
}

/** `rejected` — belgisi saqlanmagan oʻquvchilar id'si: bola shu kunda hali sinfda emas edi. */
export async function setMobileAttendance(
  classId: string,
  date: string,
  marks: { studentId: string; status: string }[]
): Promise<{ rejected: string[] }> {
  const ctx = await assertTeachesClass(classId);
  const [statuses, roster] = await Promise.all([activeStatuses(ctx.teacherId), activeClassRoster(classId)]);
  const allowed = new Set(statuses.map((s) => s.key));
  const rosterIds = new Set(roster.map((s) => s.id));
  const recordsUpsert = marks
    .filter((m) => rosterIds.has(m.studentId) && allowed.has(m.status))
    .map((m) => ({ classId, studentId: m.studentId, date, status: m.status, note: null }));
  if (recordsUpsert.length === 0) return { rejected: [] };
  // Egalik filtri va idempotent upsert — saytdagi bilan aynan bir yoʻl.
  const result = await applyAttendanceBatch({ statusesUpsert: [], statusesDelete: [], recordsUpsert, recordsDelete: [] });
  return { rejected: result.rejected.map((k) => k.studentId) };
}

/* ── Tezkor baho ─────────────────────────────────────────────────────
   Faqat oʻqituvchining OʻZ ustunlari (assignments.teacherId) va sinfning
   joriy roʻyxati. Yozish saytdagi `applyGradesBatch` orqali — egalik va
   koʻrinuvchanlik filtrlari oʻsha yerda ham ikkinchi marta ishlaydi.
   Yangi ustun boʻlimsiz (`topicId: null`) yaratiladi — jurnal uni
   «Boʻlimsiz» guruhida koʻrsatadi; oʻqituvchi keyin saytda koʻchira oladi. */

export type MobileGradeColumn = { id: string; title: string; maxScore: number; date: string | null };

export type MobileGradeSheet = {
  classId: string;
  columns: MobileGradeColumn[];
  column: MobileGradeColumn | null;
  students: { id: string; name: string; score: number | null }[];
};

async function ownColumns(teacherId: string, classId: string): Promise<MobileGradeColumn[]> {
  const rows = await db
    .select({ id: assignments.id, title: assignments.title, maxScore: assignments.maxScore, date: assignments.date, createdAt: assignments.createdAt })
    .from(assignments)
    .where(and(eq(assignments.teacherId, teacherId), eq(assignments.classId, classId)));
  rows.sort((a, b) => (b.date ?? "").localeCompare(a.date ?? "") || b.createdAt.getTime() - a.createdAt.getTime());
  return rows.slice(0, 30).map(({ id, title, maxScore, date }) => ({ id, title, maxScore, date }));
}

export async function getMobileGrades(classId: string, columnId: string | null): Promise<MobileGradeSheet> {
  const ctx = await assertTeachesClass(classId);
  const [columns, roster] = await Promise.all([ownColumns(ctx.teacherId, classId), activeClassRoster(classId)]);
  const column = columnId ? columns.find((c) => c.id === columnId) ?? null : columns[0] ?? null;
  const scores = column
    ? await db
        .select({ studentId: grades.studentId, score: grades.score })
        .from(grades)
        .where(and(eq(grades.teacherId, ctx.teacherId), eq(grades.assignmentId, column.id)))
    : [];
  const byStudent = new Map(scores.map((s) => [s.studentId, s.score]));
  return {
    classId,
    columns,
    column,
    students: roster.map((s) => ({ id: s.id, name: s.name, score: column ? byStudent.get(s.id) ?? null : null })),
  };
}

export async function createMobileColumn(
  classId: string,
  title: string,
  maxScore: number,
  date: string
): Promise<string> {
  const ctx = await assertTeachesClass(classId);
  const [{ n }] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(assignments)
    .where(and(eq(assignments.teacherId, ctx.teacherId), eq(assignments.classId, classId)));
  const id = randomUUID();
  await applyGradesBatch({
    classesUpsert: [], classesDelete: [], studentsUpsert: [], studentsDelete: [],
    topicsUpsert: [], topicsDelete: [], assignmentsDelete: [], gradesUpsert: [], gradesDelete: [],
    assignmentsUpsert: [{ id, classId, topicId: null, title, maxScore, date, kind: "manual", sortOrder: n }],
  });
  return id;
}

export async function setMobileGrades(
  classId: string,
  columnId: string,
  scores: { studentId: string; score: number | null }[]
): Promise<void> {
  const ctx = await assertTeachesClass(classId);
  const [column] = (await ownColumns(ctx.teacherId, classId)).filter((c) => c.id === columnId);
  if (!column) throw new ForbiddenError("Bu ustunga ruxsat yoʻq");
  const rosterIds = new Set((await activeClassRoster(classId)).map((s) => s.id));
  const valid = scores.filter(
    (s) => rosterIds.has(s.studentId) && (s.score === null || (s.score >= 0 && s.score <= column.maxScore))
  );
  const upserts = valid.filter((s) => s.score !== null);
  const deletes = valid.filter((s) => s.score === null);
  if (!upserts.length && !deletes.length) return;
  await applyGradesBatch({
    classesUpsert: [], classesDelete: [], studentsUpsert: [], studentsDelete: [],
    topicsUpsert: [], topicsDelete: [], assignmentsUpsert: [], assignmentsDelete: [],
    gradesUpsert: upserts.map((s) => ({ studentId: s.studentId, assignmentId: columnId, score: s.score, isDraft: false, missing: null })),
    gradesDelete: deletes.map((s) => ({ studentId: s.studentId, assignmentId: columnId })),
  });
}

/* ── Xulq ballari ────────────────────────────────────────────────────
   Koʻnikmalar (emoji + ball) oʻqituvchining oʻziniki; birinchi marta
   boʻsh boʻlsa saytdagi seed (`getBehaviorPayload`) standartlarini
   yaratadi. Berish — koʻnikma nusxasi voqea sifatida, `applyBehaviorBatch`
   orqali (sinf/oʻquvchi egaligi oʻsha yerda ham tekshiriladi). */

export type MobileBehavior = {
  classId: string;
  skills: { id: string; name: string; emoji: string; points: number }[];
  students: { id: string; name: string; total: number }[];
};

async function ownSkills(teacherId: string) {
  const rows = await db
    .select({ id: behaviorSkills.id, name: behaviorSkills.name, emoji: behaviorSkills.emoji, points: behaviorSkills.points, description: behaviorSkills.description })
    .from(behaviorSkills)
    .where(eq(behaviorSkills.teacherId, teacherId))
    .orderBy(asc(behaviorSkills.sortOrder));
  return rows;
}

export async function getMobileBehavior(classId: string): Promise<MobileBehavior> {
  const ctx = await assertTeachesClass(classId);
  let skills = await ownSkills(ctx.teacherId);
  if (skills.length === 0) {
    await getBehaviorPayload(); // standart koʻnikmalar seed
    skills = await ownSkills(ctx.teacherId);
  }
  const [roster, totals] = await Promise.all([
    activeClassRoster(classId),
    db
      .select({ studentId: behaviorEvents.studentId, total: sql<number>`coalesce(sum(${behaviorEvents.points}),0)::int` })
      .from(behaviorEvents)
      .where(and(eq(behaviorEvents.teacherId, ctx.teacherId), eq(behaviorEvents.classId, classId)))
      .groupBy(behaviorEvents.studentId),
  ]);
  const byStudent = new Map(totals.map((t) => [t.studentId, t.total]));
  return {
    classId,
    skills: skills.map(({ id, name, emoji, points }) => ({ id, name, emoji, points })),
    students: roster.map((s) => ({ id: s.id, name: s.name, total: byStudent.get(s.id) ?? 0 })),
  };
}

export async function giveMobileBehavior(
  classId: string,
  skillId: string,
  studentIds: string[],
  date: string
): Promise<void> {
  const ctx = await assertTeachesClass(classId);
  const skill = (await ownSkills(ctx.teacherId)).find((s) => s.id === skillId);
  if (!skill) throw new ForbiddenError("Bu koʻnikmaga ruxsat yoʻq");
  const roster = new Set((await activeClassRoster(classId)).map((s) => s.id));
  const targets = [...new Set(studentIds)].filter((id) => roster.has(id));
  if (targets.length === 0) return;
  const groupId = targets.length > 1 ? randomUUID() : null;
  const createdAt = new Date().toISOString();
  await applyBehaviorBatch({
    skillsUpsert: [], skillsDelete: [], eventsDelete: [], rewardsUpsert: [], rewardsDelete: [],
    redemptionsUpsert: [], redemptionsDelete: [], deletionsInsert: [], autoSettingsUpsert: [],
    eventsUpsert: targets.map((studentId) => ({
      id: randomUUID(),
      classId,
      studentId,
      skillId: skill.id,
      name: skill.name,
      emoji: skill.emoji,
      points: skill.points,
      description: skill.description ?? null,
      note: null,
      date,
      createdAt,
      groupId,
      source: null,
    })),
  });
}

/* ── Offline sinxron: bitta soʻrovda hammasi ─────────────────────────
   Ilova bu surʼatni telefonda saqlaydi va barcha ekranlar undan
   oʻqiydi (internetsiz ham). Hajmni cheklash: davomat — oxirgi 7 kun,
   jurnal — har sinfdan oxirgi 10 ustun. Qamrov saytdagi bilan bir xil
   (visibleClassIds + oʻqituvchining oʻz yozuvlari). */

export type MobileSync = {
  date: string;
  classes: { id: string; name: string; subject: string | null }[];
  /** `joinedAt` — sinfga yozilish sanasi (faqat koʻchirilgan bolada): undan oldingi
      kunlarga belgi saqlanmaydi. */
  rosters: Record<string, { id: string; name: string; joinedAt?: string }[]>;
  timetable: { day: number; classId: string; startMin: number; endMin: number; id: string }[];
  statuses: { key: string; label: string; tone: string }[];
  attendance: Record<string, Record<string, Record<string, string>>>; // date → class → student → status
  skills: { id: string; name: string; emoji: string; points: number }[];
  behaviorTotals: Record<string, Record<string, number>>; // class → student → total
  gradeColumns: Record<string, MobileGradeColumn[]>;
  gradeScores: Record<string, Record<string, number | null>>; // column → student → score
};

export async function getMobileSync(date: string): Promise<MobileSync> {
  const teacher = await requireTeacher();
  const tid = teacher.id;
  const [ids, timetable] = await Promise.all([visibleClassIds("data"), getTimetablePayload()]);

  const classRows = ids.length
    ? await db
        .select({ id: classes.id, name: classes.name, subject: classes.subject, sortOrder: classes.sortOrder })
        .from(classes)
        .where(and(inArray(classes.id, ids), isNull(classes.archivedAt)))
    : [];
  classRows.sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name));
  const classIds = classRows.map((c) => c.id);

  const version = resolveVersionForDate(normalizeLegacyVersions(timetable.versions), date);
  const own = new Set(classIds);
  const events = (version?.events ?? [])
    .filter((e) => own.has(e.classId))
    .map((e) => ({ id: e.id, classId: e.classId, day: e.day, startMin: e.startMin, endMin: e.endMin }));

  const from = (() => {
    const d = dateKeyToDate(date);
    d.setDate(d.getDate() - 6);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  })();

  let skills = await ownSkills(tid);
  if (skills.length === 0) {
    await getBehaviorPayload();
    skills = await ownSkills(tid);
  }

  const [rosterRows, statuses, records, totals, columnRows] = await Promise.all([
    classIds.length
      ? db
          .select({ classId: enrollments.classId, id: students.id, name: students.name, status: students.status, startedAt: enrollments.startedAt })
          .from(enrollments)
          .innerJoin(students, eq(students.id, enrollments.studentId))
          .where(and(inArray(enrollments.classId, classIds), isNull(enrollments.endedAt)))
      : Promise.resolve([]),
    activeStatuses(tid),
    classIds.length
      ? db
          .select({ classId: attendanceRecords.classId, studentId: attendanceRecords.studentId, date: attendanceRecords.date, status: attendanceRecords.status })
          .from(attendanceRecords)
          .where(
            and(
              eq(attendanceRecords.teacherId, tid),
              inArray(attendanceRecords.classId, classIds),
              sql`${attendanceRecords.date} >= ${from}`,
              sql`${attendanceRecords.date} <= ${date}`
            )
          )
      : Promise.resolve([]),
    classIds.length
      ? db
          .select({ classId: behaviorEvents.classId, studentId: behaviorEvents.studentId, total: sql<number>`coalesce(sum(${behaviorEvents.points}),0)::int` })
          .from(behaviorEvents)
          .where(and(eq(behaviorEvents.teacherId, tid), inArray(behaviorEvents.classId, classIds)))
          .groupBy(behaviorEvents.classId, behaviorEvents.studentId)
      : Promise.resolve([]),
    classIds.length
      ? db
          .select({ id: assignments.id, classId: assignments.classId, title: assignments.title, maxScore: assignments.maxScore, date: assignments.date, createdAt: assignments.createdAt })
          .from(assignments)
          .where(and(eq(assignments.teacherId, tid), inArray(assignments.classId, classIds)))
      : Promise.resolve([]),
  ]);

  const rosters: MobileSync["rosters"] = {};
  /* Bugungi kunga hali sinfga yozilmagan bola (koʻchirish kelajak sanaga
     qoʻyilgan) varaqda chiqmaydi — belgisi saqlanmasdi. Oxirgi 7 kunda
     yozuvi bor boʻlsa qoladi. */
  const withRecord = new Set(records.map((r) => `${r.classId}|${r.studentId}`));
  for (const r of rosterRows) {
    if (r.status === "archived") continue;
    if (!isEnrolledOn(r.startedAt, date) && !withRecord.has(`${r.classId}|${r.id}`)) continue;
    (rosters[r.classId] ??= []).push({ id: r.id, name: r.name, ...(r.startedAt ? { joinedAt: r.startedAt } : {}) });
  }
  for (const list of Object.values(rosters)) list.sort((a, b) => a.name.localeCompare(b.name, "uz"));

  const attendance: MobileSync["attendance"] = {};
  for (const r of records) ((attendance[r.date] ??= {})[r.classId] ??= {})[r.studentId] = r.status;

  const behaviorTotals: MobileSync["behaviorTotals"] = {};
  for (const t of totals) (behaviorTotals[t.classId] ??= {})[t.studentId] = t.total;

  const gradeColumns: MobileSync["gradeColumns"] = {};
  columnRows.sort((a, b) => (b.date ?? "").localeCompare(a.date ?? "") || b.createdAt.getTime() - a.createdAt.getTime());
  for (const c of columnRows) {
    const list = (gradeColumns[c.classId] ??= []);
    if (list.length < 10) list.push({ id: c.id, title: c.title, maxScore: c.maxScore, date: c.date });
  }
  const columnIds = Object.values(gradeColumns).flat().map((c) => c.id);
  const scoreRows = columnIds.length
    ? await db
        .select({ assignmentId: grades.assignmentId, studentId: grades.studentId, score: grades.score })
        .from(grades)
        .where(and(eq(grades.teacherId, tid), inArray(grades.assignmentId, columnIds)))
    : [];
  const gradeScores: MobileSync["gradeScores"] = {};
  for (const g of scoreRows) (gradeScores[g.assignmentId] ??= {})[g.studentId] = g.score;

  return {
    date,
    classes: classRows.map(({ id, name, subject }) => ({ id, name, subject })),
    rosters,
    timetable: events,
    statuses: statuses.map(({ key, label, tone }) => ({ key, label, tone })),
    attendance,
    skills: skills.map(({ id, name, emoji, points }) => ({ id, name, emoji, points })),
    behaviorTotals,
    gradeColumns,
    gradeScores,
  };
}

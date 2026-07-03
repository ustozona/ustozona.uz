import "server-only";
import { and, asc, eq, inArray, or, sql } from "drizzle-orm";
import { db } from "@/server/db/client";
import {
  assignments,
  classes,
  grades,
  students,
  topics,
  type AssignmentRow,
  type ClassRow,
  type GradeRow,
  type StudentRow,
  type TopicRow,
} from "@/server/db/schema";
import { requireTeacher } from "@/server/session";
import type {
  Assignment,
  ClassData,
  ClassInfo,
  Grade,
  GradeMissing,
  GradingScale,
  InputMode,
  Student,
  Topic,
  TopicColor,
  TopicPurpose,
} from "@/lib/grades-data";
import type { ClassColor } from "@/lib/class-colors";
import type { GradesBatch } from "@/lib/sync/grades-batch";

/* ════════════════════════════════════════════════════════════════════
   GRADES DAL — useGradesStore'ning server tomoni.

   Oʻqish: 5 jadval → frontend `Record<classId, ClassData>` (shakl
   grades-data.ts tiplariga AYNAN mos — store hech narsa oʻgirmaydi).

   Yozish: GradesBatch FK-xavfsiz tartibda qoʻllanadi. Tranzaksiya yoʻq
   (neon-http drayveri) — buning oʻrniga hamma upsert idempotent va
   sync qatlami xatoda BUTUN batch'ni qayta yuboradi.

   Xavfsizlik: har amal sessiyadagi teacher bilan cheklanadi —
   upsert'larda `setWhere`(egasi boshqa boʻlsa update NO-OP),
   delete'larda `eq(teacherId)`, bola-qatorlarda esa ota-id'lar
   oʻqituvchining oʻz toʻplamiga filtrlab olinadi.
   ════════════════════════════════════════════════════════════════════ */

const CHUNK = 400;

function chunks<T>(rows: T[]): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < rows.length; i += CHUNK) out.push(rows.slice(i, i + CHUNK));
  return out;
}

/* ── Oʻqish: DB qatorlari → frontend tiplari ─────────────────────────── */

function rowToInfo(c: ClassRow): ClassInfo {
  return {
    id: c.id,
    name: c.name,
    ...(c.color ? { color: c.color as ClassColor } : {}),
    ...(c.time ? { time: c.time } : {}),
    ...(c.grade != null ? { grade: c.grade } : {}),
    ...(c.subject ? { subject: c.subject } : {}),
    ...(c.icon ? { icon: c.icon } : {}),
    ...(c.description ? { description: c.description } : {}),
  };
}

function rowToStudent(s: StudentRow): Student {
  return {
    id: s.id,
    name: s.name,
    initials: s.initials,
    status: s.status as Student["status"],
    ...(s.gender ? { gender: s.gender as Student["gender"] } : {}),
    ...(s.birthDate ? { birthDate: s.birthDate } : {}),
    ...(s.parentName ? { parentName: s.parentName } : {}),
    ...(s.parentPhone ? { parentPhone: s.parentPhone } : {}),
    ...(s.studentPhone ? { studentPhone: s.studentPhone } : {}),
  };
}

function rowToTopic(t: TopicRow): Topic {
  return {
    id: t.id,
    ...(t.groupId ? { groupId: t.groupId } : {}),
    name: t.name,
    color: t.color as TopicColor,
    purpose: t.purpose as TopicPurpose,
    weightPercent: t.weightPercent,
    inputMode: t.inputMode as InputMode,
    ...(t.scaleKind ? { scaleKind: t.scaleKind as GradingScale } : {}),
    passLabel: t.passLabel,
    failLabel: t.failLabel,
  };
}

function rowToAssignment(a: AssignmentRow): Assignment {
  return {
    id: a.id,
    title: a.title,
    maxScore: a.maxScore,
    topicId: a.topicId,
    ...(a.date ? { date: a.date } : {}),
  };
}

function rowToGrade(g: GradeRow): Grade {
  return {
    studentId: g.studentId,
    assignmentId: g.assignmentId,
    score: g.score,
    ...(g.isDraft ? { isDraft: true } : {}),
    ...(g.missing ? { missing: g.missing as GradeMissing } : {}),
  };
}

export async function getGradesPayload(): Promise<Record<string, ClassData>> {
  const teacher = await requireTeacher();
  const tid = teacher.id;

  const [classRows, studentRows, topicRows, assignmentRows, gradeRows] =
    await Promise.all([
      db.select().from(classes).where(eq(classes.teacherId, tid)).orderBy(asc(classes.sortOrder), asc(classes.createdAt)),
      db.select().from(students).where(eq(students.teacherId, tid)).orderBy(asc(students.sortOrder), asc(students.createdAt)),
      db.select().from(topics).where(eq(topics.teacherId, tid)).orderBy(asc(topics.sortOrder), asc(topics.createdAt)),
      db.select().from(assignments).where(eq(assignments.teacherId, tid)).orderBy(asc(assignments.sortOrder), asc(assignments.createdAt)),
      db.select().from(grades).where(eq(grades.teacherId, tid)),
    ]);

  const map: Record<string, ClassData> = {};
  for (const c of classRows) {
    map[c.id] = { info: rowToInfo(c), students: [], topics: [], assignments: [], grades: [] };
  }
  for (const s of studentRows) map[s.classId]?.students.push(rowToStudent(s));
  for (const t of topicRows) map[t.classId]?.topics.push(rowToTopic(t));

  const classByAssignment = new Map<string, string>();
  for (const a of assignmentRows) {
    classByAssignment.set(a.id, a.classId);
    map[a.classId]?.assignments.push(rowToAssignment(a));
  }
  for (const g of gradeRows) {
    const classId = classByAssignment.get(g.assignmentId);
    if (classId) map[classId]?.grades.push(rowToGrade(g));
  }
  return map;
}

/* ── Yozish: batch'ni qoʻllash ───────────────────────────────────────── */

async function ownedIds(
  table: typeof classes | typeof students | typeof topics | typeof assignments,
  tid: string
): Promise<Set<string>> {
  const rows = await db.select({ id: table.id }).from(table).where(eq(table.teacherId, tid));
  return new Set(rows.map((r) => r.id));
}

export async function applyGradesBatch(batch: GradesBatch): Promise<void> {
  const teacher = await requireTeacher();
  const tid = teacher.id;
  const now = new Date();

  /* 1. Sinflar (bolalarning FK nishoni — birinchi). */
  for (const part of chunks(batch.classesUpsert)) {
    await db
      .insert(classes)
      .values(
        part.map((c) => ({
          id: c.id,
          teacherId: tid,
          name: c.name,
          color: c.color ?? null,
          time: c.time ?? null,
          grade: c.grade ?? null,
          subject: c.subject ?? null,
          icon: c.icon ?? null,
          description: c.description ?? null,
          sortOrder: c.sortOrder,
        }))
      )
      .onConflictDoUpdate({
        target: classes.id,
        set: {
          name: sql`excluded.name`,
          color: sql`excluded.color`,
          time: sql`excluded.time`,
          grade: sql`excluded.grade`,
          subject: sql`excluded.subject`,
          icon: sql`excluded.icon`,
          description: sql`excluded.description`,
          sortOrder: sql`excluded.sort_order`,
          updatedAt: now,
        },
        setWhere: eq(classes.teacherId, tid),
      });
  }

  /* 2. Bola-qatorlar faqat oʻz sinf/toifa/id'lariga yozilsin. */
  const ownClasses = await ownedIds(classes, tid);

  const studentUpserts = batch.studentsUpsert.filter((s) => ownClasses.has(s.classId));
  for (const part of chunks(studentUpserts)) {
    await db
      .insert(students)
      .values(
        part.map((s) => ({
          id: s.id,
          teacherId: tid,
          classId: s.classId,
          name: s.name,
          initials: s.initials,
          status: s.status ?? "active",
          gender: s.gender ?? null,
          birthDate: s.birthDate ?? null,
          parentName: s.parentName ?? null,
          parentPhone: s.parentPhone ?? null,
          studentPhone: s.studentPhone ?? null,
          sortOrder: s.sortOrder,
        }))
      )
      .onConflictDoUpdate({
        target: students.id,
        set: {
          classId: sql`excluded.class_id`,
          name: sql`excluded.name`,
          initials: sql`excluded.initials`,
          status: sql`excluded.status`,
          gender: sql`excluded.gender`,
          birthDate: sql`excluded.birth_date`,
          parentName: sql`excluded.parent_name`,
          parentPhone: sql`excluded.parent_phone`,
          studentPhone: sql`excluded.student_phone`,
          sortOrder: sql`excluded.sort_order`,
          updatedAt: now,
        },
        setWhere: eq(students.teacherId, tid),
      });
  }

  const topicUpserts = batch.topicsUpsert.filter((t) => ownClasses.has(t.classId));
  for (const part of chunks(topicUpserts)) {
    await db
      .insert(topics)
      .values(
        part.map((t) => ({
          id: t.id,
          teacherId: tid,
          classId: t.classId,
          groupId: t.groupId ?? null,
          name: t.name,
          color: t.color,
          purpose: t.purpose,
          weightPercent: t.weightPercent,
          inputMode: t.inputMode,
          scaleKind: t.scaleKind ?? null,
          passLabel: t.passLabel,
          failLabel: t.failLabel,
          sortOrder: t.sortOrder,
        }))
      )
      .onConflictDoUpdate({
        target: topics.id,
        set: {
          classId: sql`excluded.class_id`,
          groupId: sql`excluded.group_id`,
          name: sql`excluded.name`,
          color: sql`excluded.color`,
          purpose: sql`excluded.purpose`,
          weightPercent: sql`excluded.weight_percent`,
          inputMode: sql`excluded.input_mode`,
          scaleKind: sql`excluded.scale_kind`,
          passLabel: sql`excluded.pass_label`,
          failLabel: sql`excluded.fail_label`,
          sortOrder: sql`excluded.sort_order`,
          updatedAt: now,
        },
        setWhere: eq(topics.teacherId, tid),
      });
  }

  /* 3. Topshiriqlar — toifa ham oʻzimizniki boʻlsin. */
  const ownTopics = await ownedIds(topics, tid);
  const assignmentUpserts = batch.assignmentsUpsert.filter(
    (a) => ownClasses.has(a.classId) && ownTopics.has(a.topicId)
  );
  for (const part of chunks(assignmentUpserts)) {
    await db
      .insert(assignments)
      .values(
        part.map((a) => ({
          id: a.id,
          teacherId: tid,
          classId: a.classId,
          topicId: a.topicId,
          title: a.title,
          maxScore: a.maxScore,
          date: a.date ?? null,
          sortOrder: a.sortOrder,
        }))
      )
      .onConflictDoUpdate({
        target: assignments.id,
        set: {
          classId: sql`excluded.class_id`,
          topicId: sql`excluded.topic_id`,
          title: sql`excluded.title`,
          maxScore: sql`excluded.max_score`,
          date: sql`excluded.date`,
          sortOrder: sql`excluded.sort_order`,
          updatedAt: now,
        },
        setWhere: eq(assignments.teacherId, tid),
      });
  }

  /* 4. Baholar — oʻquvchi ham, topshiriq ham oʻzimizniki boʻlsin. */
  const [ownStudents, ownAssignments] = await Promise.all([
    ownedIds(students, tid),
    ownedIds(assignments, tid),
  ]);
  const gradeUpserts = batch.gradesUpsert.filter(
    (g) => ownStudents.has(g.studentId) && ownAssignments.has(g.assignmentId)
  );
  for (const part of chunks(gradeUpserts)) {
    await db
      .insert(grades)
      .values(
        part.map((g) => ({
          teacherId: tid,
          studentId: g.studentId,
          assignmentId: g.assignmentId,
          score: g.score,
          isDraft: g.isDraft,
          missing: g.missing,
        }))
      )
      .onConflictDoUpdate({
        target: [grades.studentId, grades.assignmentId],
        set: {
          score: sql`excluded.score`,
          isDraft: sql`excluded.is_draft`,
          missing: sql`excluded.missing`,
          updatedAt: now,
        },
        setWhere: eq(grades.teacherId, tid),
      });
  }

  /* 5. Oʻchirishlar — teskari FK tartibda, hammasi teacherId bilan. */
  for (const part of chunks(batch.gradesDelete)) {
    await db
      .delete(grades)
      .where(
        and(
          eq(grades.teacherId, tid),
          or(
            ...part.map((k) =>
              and(eq(grades.studentId, k.studentId), eq(grades.assignmentId, k.assignmentId))
            )
          )
        )
      );
  }
  for (const part of chunks(batch.assignmentsDelete)) {
    await db
      .delete(assignments)
      .where(and(eq(assignments.teacherId, tid), inArray(assignments.id, part)));
  }
  for (const part of chunks(batch.topicsDelete)) {
    await db.delete(topics).where(and(eq(topics.teacherId, tid), inArray(topics.id, part)));
  }
  for (const part of chunks(batch.studentsDelete)) {
    await db
      .delete(students)
      .where(and(eq(students.teacherId, tid), inArray(students.id, part)));
  }
  for (const part of chunks(batch.classesDelete)) {
    await db.delete(classes).where(and(eq(classes.teacherId, tid), inArray(classes.id, part)));
  }
}

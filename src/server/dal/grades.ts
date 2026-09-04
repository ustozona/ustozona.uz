import "server-only";
import { and, asc, eq, inArray, or, sql } from "drizzle-orm";
import { db } from "@/server/db/client";
import {
  activitySets,
  assignments,
  classTeachers,
  classes,
  enrollments,
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
import {
  requireWorkspace,
  taughtClassIds,
  visibleClassIds,
  visibleStudentIds,
} from "@/server/workspace";
import { parseClassName } from "@/lib/class-naming";
import type {
  Assignment,
  ClassData,
  ClassInfo,
  Grade,
  GradeMissing,
  GradingScale,
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

   ⚠️ ISTISNO — `students` va `classes` oʻchirilishi. Bu ikki jadval
   MAYDONGA tegishli, oʻqituvchiga emas, shu bois `eq(teacherId)`
   naqshi ularga qoʻllanmaydi. Oʻrniga «ajrat yoki oʻchir» mantigʻi
   ishlaydi: yozuv faqat undan boshqa hech kim foydalanmayotgan
   boʻlsa oʻchadi (`detachOrDeleteStudents` / `detachOrDeleteClasses`
   — fayl oxirida, sabab oʻsha yerda yozilgan).
   ════════════════════════════════════════════════════════════════════ */

const CHUNK = 400;

function chunks<T>(rows: T[]): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < rows.length; i += CHUNK) out.push(rows.slice(i, i + CHUNK));
  return out;
}

/* ── Oʻqish: DB qatorlari → frontend tiplari ─────────────────────────── */

function rowToInfo(c: ClassRow): ClassInfo {
  // Eski qatorlarda section/label yoʻq — nomdan ajratib olamiz (lazy migratsiya:
  // sinf keyingi saqlanishida qiymatlar bazaga yoziladi). Idempotent.
  const legacy = c.section == null && c.label == null ? parseClassName(c.name) : null;
  const section = c.section ?? legacy?.section;
  const label = c.label ?? legacy?.label;
  return {
    id: c.id,
    name: c.name,
    ...(c.color ? { color: c.color as ClassColor } : {}),
    ...(c.time ? { time: c.time } : {}),
    ...(c.grade != null ? { grade: c.grade } : legacy?.grade != null ? { grade: legacy.grade } : {}),
    ...(section ? { section } : {}),
    ...(label ? { label } : {}),
    ...(c.gradeByYear ? { gradeByYear: c.gradeByYear } : {}),
    ...(c.subject ? { subject: c.subject } : {}),
    ...(c.icon ? { icon: c.icon } : {}),
    ...(c.archivedAt ? { archivedAt: c.archivedAt } : {}),
  };
}

function rowToStudent(s: StudentRow): Student {
  return {
    id: s.id,
    studentNumber: s.studentNumber,
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
    ...(t.scaleKind ? { scaleKind: t.scaleKind as GradingScale } : {}),
  };
}

function rowToAssignment(a: AssignmentRow): Assignment {
  return {
    id: a.id,
    title: a.title,
    maxScore: a.maxScore,
    topicId: a.topicId,
    ...(a.date ? { date: a.date } : {}),
    ...(a.dueDate ? { dueDate: a.dueDate } : {}),
    ...(a.kind ? { kind: a.kind as Assignment["kind"] } : {}),
    ...(a.instructions ? { instructions: a.instructions } : {}),
    ...(a.sourceSessionId ? { sourceSessionId: a.sourceSessionId } : {}),
    ...(a.setId ? { setId: a.setId } : {}),
    ...(a.groupId ? { groupId: a.groupId } : {}),
    ...(a.standardIds?.length ? { standardIds: a.standardIds } : {}),
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

  const myClassIds = await visibleClassIds("data");

  const [classRows, rosterRows, topicRows, assignmentRows, gradeRows] =
    await Promise.all([
      myClassIds.length
        ? db.select().from(classes).where(inArray(classes.id, myClassIds)).orderBy(asc(classes.sortOrder), asc(classes.createdAt))
        : Promise.resolve([]),
      // Bola endi sinfga YOZILISH orqali bogʻlanadi va bir nechta guruhda
      // boʻlishi mumkin — shuning uchun bir xil `student` bir nechta
      // ClassData ichida chiqishi normal.
      myClassIds.length
        ? db
            .select({ classId: enrollments.classId, student: students })
            .from(enrollments)
            .innerJoin(students, eq(students.id, enrollments.studentId))
            .where(inArray(enrollments.classId, myClassIds))
            .orderBy(asc(enrollments.sortOrder), asc(students.createdAt))
        : Promise.resolve([]),
      db.select().from(topics).where(eq(topics.teacherId, tid)).orderBy(asc(topics.sortOrder), asc(topics.createdAt)),
      db.select().from(assignments).where(eq(assignments.teacherId, tid)).orderBy(asc(assignments.sortOrder), asc(assignments.createdAt)),
      db.select().from(grades).where(eq(grades.teacherId, tid)),
    ]);

  const map: Record<string, ClassData> = {};
  for (const c of classRows) {
    map[c.id] = { info: rowToInfo(c), students: [], topics: [], assignments: [], grades: [] };
  }
  for (const r of rosterRows) map[r.classId]?.students.push(rowToStudent(r.student));
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

/** MUALLIFLIK boʻyicha qamrov — `topics`/`assignments`/`activitySets`
    uchun `teacherId` "kim yaratgan" degani va shundayligicha qoladi
    (docs/ish-maydoni-arxitektura.md §3.2). */
async function ownedIds(
  table: typeof topics | typeof assignments | typeof activitySets,
  tid: string
): Promise<Set<string>> {
  const rows = await db.select({ id: table.id }).from(table).where(eq(table.teacherId, tid));
  return new Set(rows.map((r) => r.id));
}

export async function applyGradesBatch(batch: GradesBatch): Promise<void> {
  const teacher = await requireTeacher();
  const ctx = await requireWorkspace();
  const tid = teacher.id;
  const now = new Date();

  /* 1. Sinflar (bolalarning FK nishoni — birinchi).

     ⚠️ Sinf va uni KIM OʻTISHI bitta tranzaksiyada: koʻrinuvchanlik
     `class_teachers` ga tayanadi, demak biri yozilib ikkinchisi
     yozilmasa oʻqituvchi oʻzi yaratgan sinfni koʻrmay qoladi — va uni
     interfeys orqali tuzatib ham boʻlmaydi (sinf koʻrinmagach unga
     oʻqituvchi biriktirish tugmasi ham yoʻq). */
  for (const part of chunks(batch.classesUpsert)) {
    await db.transaction(async (tx) => {
    await tx
      .insert(classes)
      .values(
        part.map((c) => ({
          id: c.id,
          workspaceId: ctx.workspaceId,
          name: c.name,
          color: c.color ?? null,
          time: c.time ?? null,
          grade: c.grade ?? null,
          section: c.section ?? null,
          label: c.label ?? null,
          gradeByYear: c.gradeByYear ?? null,
          subject: c.subject ?? null,
          icon: c.icon ?? null,
          sortOrder: c.sortOrder,
          archivedAt: c.archivedAt ?? null,
        }))
      )
      .onConflictDoUpdate({
        target: classes.id,
        set: {
          name: sql`excluded.name`,
          color: sql`excluded.color`,
          time: sql`excluded.time`,
          grade: sql`excluded.grade`,
          section: sql`excluded.section`,
          label: sql`excluded.label`,
          gradeByYear: sql`excluded.grade_by_year`,
          subject: sql`excluded.subject`,
          icon: sql`excluded.icon`,
          sortOrder: sql`excluded.sort_order`,
          archivedAt: sql`excluded.archived_at`,
          updatedAt: now,
        },
        setWhere: eq(classes.workspaceId, ctx.workspaceId),
      });

      /* Yaratuvchi — EGA. `onConflictDoNothing` muhim: mavjud sinf
         qayta upsert qilinsa, hamkasbning `teacher` roli ega'ga
         koʻtarilib ketmasin. */
      await tx
        .insert(classTeachers)
        .values(part.map((c) => ({ classId: c.id, teacherId: tid, role: "owner" })))
        .onConflictDoNothing();
    });
  }

  /* 2. Bola-qatorlar faqat oʻz sinf/toifa/id'lariga yozilsin. */
  const ownClasses = new Set(await visibleClassIds("data"));

  const studentUpserts = batch.studentsUpsert.filter((s) => ownClasses.has(s.classId));
  for (const part of chunks(studentUpserts)) {
    // Bola va uning sinfga yozilishi — bitta tranzaksiyada (sinf holati
    // bilan bir xil sabab: yarim yozuv qolmasin).
    await db.transaction(async (tx) => {
    await tx
      .insert(students)
      .values(
        part.map((s) => ({
          id: s.id,
          workspaceId: ctx.workspaceId,
          name: s.name,
          initials: s.initials,
          status: s.status ?? "active",
          gender: s.gender ?? null,
          birthDate: s.birthDate ?? null,
          parentName: s.parentName ?? null,
          parentPhone: s.parentPhone ?? null,
          studentPhone: s.studentPhone ?? null,
        }))
      )
      .onConflictDoUpdate({
        target: students.id,
        set: {
          name: sql`excluded.name`,
          initials: sql`excluded.initials`,
          status: sql`excluded.status`,
          gender: sql`excluded.gender`,
          birthDate: sql`excluded.birth_date`,
          parentName: sql`excluded.parent_name`,
          parentPhone: sql`excluded.parent_phone`,
          studentPhone: sql`excluded.student_phone`,
          updatedAt: now,
        },
        setWhere: eq(students.workspaceId, ctx.workspaceId),
      });

      // Sinfga bogʻlanish endi YOZILISH orqali. `sortOrder` shu yerda,
      // chunki bola ikki guruhda turlicha tartibda turishi mumkin.
      await tx
        .insert(enrollments)
        .values(
          part.map((s) => ({ classId: s.classId, studentId: s.id, sortOrder: s.sortOrder }))
        )
        .onConflictDoUpdate({
          target: [enrollments.classId, enrollments.studentId],
          set: { sortOrder: sql`excluded.sort_order` },
        });
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
          scaleKind: t.scaleKind ?? null,
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
          scaleKind: sql`excluded.scale_kind`,
          sortOrder: sql`excluded.sort_order`,
          updatedAt: now,
        },
        setWhere: eq(topics.teacherId, tid),
      });
  }

  /* 3. Topshiriqlar — toifa ham oʻzimizniki boʻlsin. */
  const ownTopics = await ownedIds(topics, tid);
  const assignmentUpserts = batch.assignmentsUpsert.filter(
    (a) => ownClasses.has(a.classId) && (a.topicId === null || ownTopics.has(a.topicId))
  );
  /* Biriktirilgan toʻplam (R215) — begonasi yozilmasin. Roʻyxat faqat
     kerak boʻlganda soʻraladi: topshiriqlarning katta qismi mazmunsiz. */
  const ownSets = assignmentUpserts.some((a) => a.setId)
    ? await ownedIds(activitySets, tid)
    : new Set<string>();
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
          dueDate: a.dueDate ?? null,
          kind: a.kind ?? "manual",
          instructions: a.instructions ?? null,
          setId: a.setId && ownSets.has(a.setId) ? a.setId : null,
          /* Egalik tekshiruvi kerak emas: guruh kaliti begona qatorga
             havola qilmaydi (FK yoʻq), va guruh baribir shu oʻqituvchining
             topshiriqlari doirasida qidiriladi (`assignments_teacher_idx`). */
          groupId: a.groupId ?? null,
          standardIds: a.standardIds ?? null,
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
          dueDate: sql`excluded.due_date`,
          kind: sql`excluded.kind`,
          instructions: sql`excluded.instructions`,
          setId: sql`excluded.set_id`,
          groupId: sql`excluded.group_id`,
          standardIds: sql`excluded.standard_ids`,
          sortOrder: sql`excluded.sort_order`,
          updatedAt: now,
        },
        setWhere: eq(assignments.teacherId, tid),
      });
  }

  /* 4. Baholar — oʻquvchi qamrovda, topshiriq esa oʻzimiz yaratganidan. */
  const [studentIds, ownAssignments] = await Promise.all([
    visibleStudentIds("data"),
    ownedIds(assignments, tid),
  ]);
  const ownStudents = new Set(studentIds);
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
  /* ⚠️ Oʻquvchi va sinf OʻCHIRISHI — maydon filtri YETARLI EMAS.

     Ilgari bu ikki amal faqat `workspaceId` bilan cheklangan edi. Yakka
     oʻqituvchi davrida bu zararsiz koʻrinardi (maydon = oʻqituvchining
     oʻzi), lekin ikkinchi oʻqituvchi qoʻshilishi bilan u maʼlumot
     yoʻqotish yoʻliga aylanadi: B oʻqituvchining brauzeridagi store
     diffi A oʻqituvchining sinfini va undagi HAMMA bahoni cascade
     bilan oʻchirib yuborardi — jimgina, tasdiqsiz, qaytarilmas.

     Toʻgʻri semantika (docs/ish-maydoni-arxitektura.md §10.5):
     «oʻchirish» — bu MENING roʻyxatimdan olib tashlash. Yozuvning oʻzi
     faqat undan boshqa hech kim foydalanmayotgan boʻlsa oʻchadi. */
  await detachOrDeleteStudents(batch.studentsDelete);
  await detachOrDeleteClasses(batch.classesDelete, tid, ctx.workspaceId);
}

/**
 * Oʻquvchini roʻyxatdan olib tashlaydi.
 *
 * Bola MAYDONGA tegishli, oʻqituvchiga emas — demak uni butunlay
 * oʻchirish faqat boshqa hech bir oʻqituvchi uni oʻqitmayotganda
 * mumkin. Aks holda faqat MENING darslarimdagi yozilishlari uziladi:
 * hamkasbning jurnalida bola va uning baholari joyida qoladi.
 */
async function detachOrDeleteStudents(ids: string[]): Promise<void> {
  if (ids.length === 0) return;

  /* ⛔ `taughtClassIds` — `visibleClassIds("data")` EMAS: admin butun
     maydonni koʻradi, lekin hech kimning bolasini oʻchira olmaydi
     (docs/ish-maydoni-arxitektura.md §11.6). */
  const mine = await taughtClassIds();
  const targets = new Set<string>();
  if (mine.length > 0) {
    const rows = await db
      .selectDistinct({ id: enrollments.studentId })
      .from(enrollments)
      .where(inArray(enrollments.classId, mine));
    for (const r of rows) targets.add(r.id);
  }
  /* Qamrovdan tashqaridagi id jimgina tashlab yuboriladi — client
     eskirgan holatdan begona id yuborishi mumkin. */
  const scoped = ids.filter((id) => targets.has(id));
  if (scoped.length === 0) return;

  for (const part of chunks(scoped)) {
    if (mine.length > 0) {
      await db
        .delete(enrollments)
        .where(and(inArray(enrollments.studentId, part), inArray(enrollments.classId, mine)));
    }
  }

  /* Endi qaysi biri hali ham biror guruhda qolgan — oʻsha saqlanadi. */
  const stillEnrolled = new Set<string>();
  for (const part of chunks(scoped)) {
    const rows = await db
      .selectDistinct({ id: enrollments.studentId })
      .from(enrollments)
      .where(inArray(enrollments.studentId, part));
    for (const r of rows) stillEnrolled.add(r.id);
  }

  const orphaned = scoped.filter((id) => !stillEnrolled.has(id));
  for (const part of chunks(orphaned)) {
    await db.delete(students).where(inArray(students.id, part));
  }
}

/**
 * Sinfni oʻchiradi yoki undan chiqadi.
 *
 * Hamkasb ham shu darsni oʻtayotgan boʻlsa — sinf OʻCHMAYDI, faqat
 * mening biriktirishim uziladi. Bu «umumiy sinfdan chiqish» naqshining
 * aynan oʻzi va bizga ham shu kerak: sinf oʻchsa cascade
 * hamkasbning baholarini ham olib ketardi.
 */
async function detachOrDeleteClasses(
  ids: string[],
  tid: string,
  workspaceId: string
): Promise<void> {
  if (ids.length === 0) return;

  /* ⛔ Oʻchirish — admin istisnosiSIZ toʻplam (§11.6). */
  const mine = new Set(await taughtClassIds());
  const scoped = ids.filter((id) => mine.has(id));
  if (scoped.length === 0) return;

  /* Mendan boshqa oʻqituvchisi bor sinflar — ular saqlanadi.
     `createdAt` tartibi vorisni tanlash uchun kerak (pastda). */
  const others = new Map<string, { teacherId: string; role: string }[]>();
  const myRole = new Map<string, string>();
  for (const part of chunks(scoped)) {
    const rows = await db
      .select({
        classId: classTeachers.classId,
        teacherId: classTeachers.teacherId,
        role: classTeachers.role,
      })
      .from(classTeachers)
      .where(inArray(classTeachers.classId, part))
      .orderBy(asc(classTeachers.createdAt));
    for (const r of rows) {
      if (r.teacherId === tid) {
        myRole.set(r.classId, r.role);
        continue;
      }
      const list = others.get(r.classId);
      if (list) list.push({ teacherId: r.teacherId, role: r.role });
      else others.set(r.classId, [{ teacherId: r.teacherId, role: r.role }]);
    }
  }

  /* 🔴 EGA BU YOʻL BILAN SINFDAN CHIQIB KETMAYDI.
     ────────────────────────────────────────────────────────────────
     Bu funksiyaga buyruq store diff'idan keladi: «prev'da bor edi,
     next'da yoʻq» (lib/sync/grades-sync.ts). Yaʼni u foydalanuvchining
     aniq «men bu darsdan chiqaman» qarori EMAS — store'dan sinf
     yoʻqolishining har qanday sababi shu yoʻlga tushadi.

     Ega uchun oqibati ogʻir edi: uzilish → «egasiz sinf qolmasin»
     qoidasi ishga tushardi → eng eski hamkasb avtomatik EGA boʻlardi.
     Natijada sinf jimgina boshqa odamga oʻtib ketardi. 2026-08-27
     sinovida aynan shu kuzatildi: hamkasb «oʻchirish» ni bosgach
     eganing brauzerida sinf yoʻqoldi, sync uni uzdi va hamkasb
     sinfning egasi boʻlib qoldi.

     `removeClassTeacher` (aniq amal) egani chiqarishni allaqachon
     toʻsadi — bu yoʻl oʻsha tekshiruvni chetlab oʻtardi.

     ⛔ Ega uchun ikki maʼnoli yoʻl qoladi va ikkalasi ham oshkor:
     egalikni oʻtkazish, yoki avval hamkasbni darsdan chiqarish.
     Yolgʻiz sinfini oʻchirish esa pastda, `solo` da — u toʻsilmaydi. */
  const blocked = new Set(
    scoped.filter((id) => myRole.get(id) === "owner" && others.has(id))
  );
  const actionable = scoped.filter((id) => !blocked.has(id));
  if (actionable.length === 0) return;

  for (const part of chunks(actionable)) {
    await db
      .delete(classTeachers)
      .where(and(eq(classTeachers.teacherId, tid), inArray(classTeachers.classId, part)));
  }

  /* ⚠️ EGASIZ SINF QOLMASIN. Ega ulashilgan sinfdan chiqsa, sinf yetim
     qolardi: qolgan hamkasb dars oʻtaveradi, lekin hech kim hamkasb
     qoʻsha olmaydi va sinfni oʻchira olmaydi — interfeys orqali
     tuzatib boʻlmaydigan holat. Shu bois eng eski qolgan hamkasb
     avtomatik ega boʻladi.

     ⚠️ Faqat ega QOLMAGANDA — aks holda mavjud ega ustiga ikkinchi ega
     yaratilardi (men oddiy hamkasb sifatida chiqqan holatda). */
  for (const [classId, list] of others) {
    if (list.some((t) => t.role === "owner")) continue;
    const heir = list[0];
    if (!heir) continue;
    await db
      .update(classTeachers)
      .set({ role: "owner" })
      .where(
        and(eq(classTeachers.classId, classId), eq(classTeachers.teacherId, heir.teacherId))
      );
  }

  const solo = actionable.filter((id) => !others.has(id));
  for (const part of chunks(solo)) {
    await db
      .delete(classes)
      .where(and(eq(classes.workspaceId, workspaceId), inArray(classes.id, part)));
  }
}

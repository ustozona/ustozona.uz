import type {
  Assignment,
  ClassData,
  ClassInfo,
  Grade,
  Student,
  Topic,
} from "@/lib/grades-data";
import {
  emptyGradesBatch,
  isEmptyGradesBatch,
  type AssignmentUpsert,
  type ClassUpsert,
  type GradesBatch,
  type GradeUpsert,
  type StudentUpsert,
  type TopicUpsert,
} from "./grades-batch";

/* ════════════════════════════════════════════════════════════════════
   GRADES DIFF — classDataMap (prev, next) → GradesBatch | null.

   Store'dagi barcha yangilanishlar immutable boʻlgani uchun oʻzgarishni
   REFERENCE tenglik topadi: sinf obyekti bir xil boʻlsa — ichiga
   qaralmaydi; massiv bir xil boʻlsa — elementlarga qaralmaydi.
   Element darajasida: yangi id, yangi reference YOKI yangi pozitsiya
   (sortOrder) → upsert; prev'da bor, next'da yoʻq id → delete.

   Cheklov (v1): sinf REFERENSI oʻzgarmagan holda faqat tartibi
   oʻzgarsa — sortOrder yangilanmaydi (UI'da sinf reorder yoʻq hozircha).

   Oʻchirilgan sinf uchun bolalari sanab oʻtirilmaydi — serverda FK
   CASCADE butun daraxtni tozalaydi.
   ════════════════════════════════════════════════════════════════════ */

function toClassUpsert(info: ClassInfo, sortOrder: number): ClassUpsert {
  return {
    id: info.id,
    name: info.name,
    ...(info.color ? { color: info.color } : {}),
    ...(info.time ? { time: info.time } : {}),
    ...(info.grade != null ? { grade: info.grade } : {}),
    ...(info.section ? { section: info.section } : {}),
    ...(info.label ? { label: info.label } : {}),
    ...(info.gradeByYear ? { gradeByYear: info.gradeByYear } : {}),
    ...(info.subject ? { subject: info.subject } : {}),
    ...(info.icon ? { icon: info.icon } : {}),
    ...(info.archivedAt ? { archivedAt: info.archivedAt } : {}),
    sortOrder,
  };
}

function toStudentUpsert(classId: string, s: Student, sortOrder: number): StudentUpsert {
  return {
    id: s.id,
    classId,
    name: s.name,
    initials: s.initials,
    ...(s.status ? { status: s.status } : {}),
    ...(s.gender ? { gender: s.gender } : {}),
    ...(s.birthDate ? { birthDate: s.birthDate } : {}),
    ...(s.parentName ? { parentName: s.parentName } : {}),
    ...(s.parentPhone ? { parentPhone: s.parentPhone } : {}),
    ...(s.studentPhone ? { studentPhone: s.studentPhone } : {}),
    sortOrder,
  };
}

function toTopicUpsert(classId: string, t: Topic, sortOrder: number): TopicUpsert {
  return {
    id: t.id,
    classId,
    ...(t.groupId ? { groupId: t.groupId } : {}),
    name: t.name,
    color: t.color,
    purpose: t.purpose,
    weightPercent: t.weightPercent,
    ...(t.scaleKind ? { scaleKind: t.scaleKind } : {}),
    sortOrder,
  };
}

function toAssignmentUpsert(
  classId: string,
  a: Assignment,
  sortOrder: number
): AssignmentUpsert {
  return {
    id: a.id,
    classId,
    topicId: a.topicId,
    title: a.title,
    maxScore: a.maxScore,
    ...(a.date ? { date: a.date } : {}),
    ...(a.dueDate ? { dueDate: a.dueDate } : {}),
    ...(a.kind ? { kind: a.kind } : {}),
    ...(a.instructions ? { instructions: a.instructions } : {}),
    sortOrder,
  };
}

function toGradeUpsert(g: Grade): GradeUpsert {
  return {
    studentId: g.studentId,
    assignmentId: g.assignmentId,
    score: g.score,
    isDraft: g.isDraft ?? false,
    // eski isMissing belgisi missing'ga normallanadi (seed bilan bir xil qoida)
    missing: g.missing ?? (g.isMissing ? "absent" : null),
  };
}

/** id'li roʻyxat diffi: yangi/oʻzgargan/koʻchgan → upsert, yoʻqolgan → delete. */
function diffList<T extends { id: string }, U>(
  prev: T[],
  next: T[],
  toUpsert: (item: T, index: number) => U,
  upserts: U[],
  deletes: string[]
): void {
  const prevById = new Map<string, { item: T; index: number }>();
  prev.forEach((item, index) => prevById.set(item.id, { item, index }));

  next.forEach((item, index) => {
    const p = prevById.get(item.id);
    if (!p || p.item !== item || p.index !== index) upserts.push(toUpsert(item, index));
  });

  const nextIds = new Set(next.map((it) => it.id));
  for (const it of prev) if (!nextIds.has(it.id)) deletes.push(it.id);
}

function gradeKey(g: { studentId: string; assignmentId: string }): string {
  return `${g.studentId}|${g.assignmentId}`;
}

function diffGradesList(prev: Grade[], next: Grade[], batch: GradesBatch): void {
  const prevByKey = new Map<string, Grade>();
  for (const g of prev) prevByKey.set(gradeKey(g), g);

  const nextKeys = new Set<string>();
  for (const g of next) {
    const key = gradeKey(g);
    nextKeys.add(key);
    const p = prevByKey.get(key);
    if (!p || p !== g) batch.gradesUpsert.push(toGradeUpsert(g));
  }
  for (const g of prev) {
    if (!nextKeys.has(gradeKey(g))) {
      batch.gradesDelete.push({ studentId: g.studentId, assignmentId: g.assignmentId });
    }
  }
}

function pushWholeClass(batch: GradesBatch, classId: string, cd: ClassData): void {
  cd.students.forEach((s, i) => batch.studentsUpsert.push(toStudentUpsert(classId, s, i)));
  cd.topics.forEach((t, i) => batch.topicsUpsert.push(toTopicUpsert(classId, t, i)));
  cd.assignments.forEach((a, i) =>
    batch.assignmentsUpsert.push(toAssignmentUpsert(classId, a, i))
  );
  for (const g of cd.grades) batch.gradesUpsert.push(toGradeUpsert(g));
}

export function diffGradesMap(
  prev: Record<string, ClassData>,
  next: Record<string, ClassData>
): GradesBatch | null {
  if (prev === next) return null;
  const batch = emptyGradesBatch();

  for (const id of Object.keys(prev)) {
    if (!(id in next)) batch.classesDelete.push(id);
  }

  Object.keys(next).forEach((id, index) => {
    const n = next[id];
    const p = prev[id];
    if (p === n) return; // sinfga tegilmagan

    if (!p) {
      // yangi sinf — butunligicha
      batch.classesUpsert.push(toClassUpsert(n.info, index));
      pushWholeClass(batch, id, n);
      return;
    }

    if (p.info !== n.info) batch.classesUpsert.push(toClassUpsert(n.info, index));
    if (p.students !== n.students) {
      diffList(
        p.students,
        n.students,
        (s, i) => toStudentUpsert(id, s, i),
        batch.studentsUpsert,
        batch.studentsDelete
      );
    }
    if (p.topics !== n.topics) {
      diffList(
        p.topics,
        n.topics,
        (t, i) => toTopicUpsert(id, t, i),
        batch.topicsUpsert,
        batch.topicsDelete
      );
    }
    if (p.assignments !== n.assignments) {
      diffList(
        p.assignments,
        n.assignments,
        (a, i) => toAssignmentUpsert(id, a, i),
        batch.assignmentsUpsert,
        batch.assignmentsDelete
      );
    }
    if (p.grades !== n.grades) diffGradesList(p.grades, n.grades, batch);
  });

  return isEmptyGradesBatch(batch) ? null : batch;
}

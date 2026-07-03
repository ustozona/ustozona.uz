import { z } from "zod";

/* ════════════════════════════════════════════════════════════════════
   GRADES SYNC BATCH — client diff ↔ server action oʻrtasidagi shartnoma.

   Diff (grades-sync.ts) shu shakldagi batch yigʻadi; syncGradesAction
   zod bilan tekshirib DAL'ga uzatadi. Hamma upsert (id kaliti boʻyicha)
   idempotent — batch ikki marta yuborilsa zarar yoʻq (retry xavfsiz).

   `teacherId` bu yerda YOʻQ — u faqat serverda sessiyadan olinadi.
   ════════════════════════════════════════════════════════════════════ */

const id = z.string().min(1).max(200);

export const classUpsertSchema = z.object({
  id,
  name: z.string().min(1).max(200),
  color: z.string().max(50).optional(),
  time: z.string().max(100).optional(),
  grade: z.number().int().min(1).max(11).optional(),
  subject: z.string().max(200).optional(),
  icon: z.string().max(50).optional(),
  description: z.string().max(1000).optional(),
  sortOrder: z.number().int().min(0),
});

export const studentUpsertSchema = z.object({
  id,
  classId: id,
  name: z.string().min(1).max(300),
  initials: z.string().max(10),
  status: z.enum(["active", "away", "archived"]).optional(),
  gender: z.enum(["male", "female"]).optional(),
  birthDate: z.string().max(20).optional(),
  parentName: z.string().max(300).optional(),
  parentPhone: z.string().max(50).optional(),
  studentPhone: z.string().max(50).optional(),
  sortOrder: z.number().int().min(0),
});

export const topicUpsertSchema = z.object({
  id,
  classId: id,
  groupId: z.string().max(200).optional(),
  name: z.string().min(1).max(200),
  color: z.string().max(30),
  purpose: z.enum(["formative", "summative"]),
  weightPercent: z.number().int().min(0).max(1000),
  inputMode: z.enum(["score", "select"]),
  scaleKind: z.string().max(30).optional(),
  passLabel: z.string().max(100),
  failLabel: z.string().max(100),
  sortOrder: z.number().int().min(0),
});

export const assignmentUpsertSchema = z.object({
  id,
  classId: id,
  topicId: id,
  title: z.string().min(1).max(300),
  maxScore: z.number().int().min(1).max(100000),
  date: z.string().max(20).optional(),
  sortOrder: z.number().int().min(0),
});

export const gradeUpsertSchema = z.object({
  studentId: id,
  assignmentId: id,
  score: z.number().min(-1000).max(100000).nullable(),
  isDraft: z.boolean(),
  missing: z.enum(["absent", "unsubmitted"]).nullable(),
});

export const gradeKeySchema = z.object({ studentId: id, assignmentId: id });

export const gradesBatchSchema = z.object({
  classesUpsert: z.array(classUpsertSchema).max(500),
  classesDelete: z.array(id).max(500),
  studentsUpsert: z.array(studentUpsertSchema).max(5000),
  studentsDelete: z.array(id).max(5000),
  topicsUpsert: z.array(topicUpsertSchema).max(2000),
  topicsDelete: z.array(id).max(2000),
  assignmentsUpsert: z.array(assignmentUpsertSchema).max(5000),
  assignmentsDelete: z.array(id).max(5000),
  gradesUpsert: z.array(gradeUpsertSchema).max(20000),
  gradesDelete: z.array(gradeKeySchema).max(20000),
});

export type ClassUpsert = z.infer<typeof classUpsertSchema>;
export type StudentUpsert = z.infer<typeof studentUpsertSchema>;
export type TopicUpsert = z.infer<typeof topicUpsertSchema>;
export type AssignmentUpsert = z.infer<typeof assignmentUpsertSchema>;
export type GradeUpsert = z.infer<typeof gradeUpsertSchema>;
export type GradeKey = z.infer<typeof gradeKeySchema>;
export type GradesBatch = z.infer<typeof gradesBatchSchema>;

export function emptyGradesBatch(): GradesBatch {
  return {
    classesUpsert: [],
    classesDelete: [],
    studentsUpsert: [],
    studentsDelete: [],
    topicsUpsert: [],
    topicsDelete: [],
    assignmentsUpsert: [],
    assignmentsDelete: [],
    gradesUpsert: [],
    gradesDelete: [],
  };
}

export function isEmptyGradesBatch(b: GradesBatch): boolean {
  return (
    b.classesUpsert.length === 0 &&
    b.classesDelete.length === 0 &&
    b.studentsUpsert.length === 0 &&
    b.studentsDelete.length === 0 &&
    b.topicsUpsert.length === 0 &&
    b.topicsDelete.length === 0 &&
    b.assignmentsUpsert.length === 0 &&
    b.assignmentsDelete.length === 0 &&
    b.gradesUpsert.length === 0 &&
    b.gradesDelete.length === 0
  );
}

import { z } from "zod";

/* ════════════════════════════════════════════════════════════════════
   ATTENDANCE SYNC BATCH — client diff ↔ server action shartnomasi.

   Yozuv kaliti (classId, studentId, date) — DB PK bilan bir xil,
   upsert idempotent (retry xavfsiz). Holatlar kaliti — `key`
   (DB PK: teacherId+key; teacherId serverda sessiyadan).
   ════════════════════════════════════════════════════════════════════ */

const id = z.string().min(1).max(200);

// Statuslar toʻplami QULFLANGAN — faqat 4 ta built-in kalit qabul qilinadi.
export const statusUpsertSchema = z.object({
  key: z.enum(["present", "absent", "late", "excused"]),
  label: z.string().min(1).max(100),
  icon: z.string().min(1).max(50),
  scoreImpact: z.enum(["full", "half", "none", "excluded"]),
  active: z.boolean(),
  builtIn: z.boolean(),
  tone: z.enum(["success", "destructive", "warning", "info"]),
  sortOrder: z.number().int().min(0),
});

export const recordUpsertSchema = z.object({
  classId: id,
  studentId: id,
  date: z.string().min(8).max(20), // "YYYY-MM-DD"
  status: z.string().min(1).max(100),
  note: z.string().max(2000).nullable(),
});

export const recordKeySchema = z.object({
  classId: id,
  studentId: id,
  date: z.string().min(8).max(20),
});

export const attendanceBatchSchema = z.object({
  statusesUpsert: z.array(statusUpsertSchema).max(200),
  statusesDelete: z.array(z.string().min(1).max(100)).max(200),
  recordsUpsert: z.array(recordUpsertSchema).max(50000),
  recordsDelete: z.array(recordKeySchema).max(50000),
});

export type StatusUpsert = z.infer<typeof statusUpsertSchema>;
export type RecordUpsert = z.infer<typeof recordUpsertSchema>;
export type RecordKey = z.infer<typeof recordKeySchema>;
export type AttendanceBatch = z.infer<typeof attendanceBatchSchema>;

export function emptyAttendanceBatch(): AttendanceBatch {
  return { statusesUpsert: [], statusesDelete: [], recordsUpsert: [], recordsDelete: [] };
}

export function isEmptyAttendanceBatch(b: AttendanceBatch): boolean {
  return (
    b.statusesUpsert.length === 0 &&
    b.statusesDelete.length === 0 &&
    b.recordsUpsert.length === 0 &&
    b.recordsDelete.length === 0
  );
}

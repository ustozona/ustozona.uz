import "server-only";
import { and, eq, inArray, isNull } from "drizzle-orm";
import { db } from "@/server/db/client";
import { attendanceRecords, attendanceStatuses, classes } from "@/server/db/schema";
import { requireTeacher } from "@/server/session";
import { assertTeachesClass, visibleClassIds } from "@/server/workspace";
import { activeClassRoster } from "@/server/dal/class-roster";
import { applyAttendanceBatch } from "@/server/dal/attendance";
import { BUILTIN_STATUSES } from "@/lib/attendance-data";
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
    activeClassRoster(classId),
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
    students: roster.map((s) => ({ id: s.id, name: s.name, status: byStudent.get(s.id) ?? null })),
  };
}

export async function setMobileAttendance(
  classId: string,
  date: string,
  marks: { studentId: string; status: string }[]
): Promise<void> {
  const ctx = await assertTeachesClass(classId);
  const [statuses, roster] = await Promise.all([activeStatuses(ctx.teacherId), activeClassRoster(classId)]);
  const allowed = new Set(statuses.map((s) => s.key));
  const rosterIds = new Set(roster.map((s) => s.id));
  const recordsUpsert = marks
    .filter((m) => rosterIds.has(m.studentId) && allowed.has(m.status))
    .map((m) => ({ classId, studentId: m.studentId, date, status: m.status, note: null }));
  if (recordsUpsert.length === 0) return;
  // Egalik filtri va idempotent upsert — saytdagi bilan aynan bir yoʻl.
  await applyAttendanceBatch({ statusesUpsert: [], statusesDelete: [], recordsUpsert, recordsDelete: [] });
}

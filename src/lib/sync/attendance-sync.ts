import type { AttendanceRecord, AttendanceStatusDef } from "@/lib/attendance-data";
import {
  emptyAttendanceBatch,
  isEmptyAttendanceBatch,
  type AttendanceBatch,
  type RecordUpsert,
  type StatusUpsert,
} from "./attendance-batch";

/* ════════════════════════════════════════════════════════════════════
   ATTENDANCE DIFF — {recordsByClass, statuses} (prev, next) → batch.

   grades-sync bilan bir xil tamoyil: immutable yangilanishlar tufayli
   reference tenglik oʻzgarishni arzon topadi. Yozuv kaliti
   (studentId|date) sinf ichida; holat kaliti — `key`.

   Sinf kaliti next'da yoʻqolsa e'tiborsiz qoldiriladi — store hech
   qachon kalit oʻchirmaydi; sinf oʻchirilishini grades sync + FK
   CASCADE hal qiladi.
   ════════════════════════════════════════════════════════════════════ */

export type AttendanceSnapshot = {
  recordsByClass: Record<string, AttendanceRecord[]>;
  statuses: AttendanceStatusDef[];
};

function toStatusUpsert(s: AttendanceStatusDef, sortOrder: number): StatusUpsert {
  return {
    // Toʻplam qulflangan — key har doim 4 built-in'dan biri (zod tekshiradi)
    key: s.key as StatusUpsert["key"],
    label: s.label,
    icon: s.icon,
    scoreImpact: s.scoreImpact,
    active: s.active,
    builtIn: s.builtIn,
    tone: s.tone,
    sortOrder,
  };
}

function toRecordUpsert(classId: string, r: AttendanceRecord): RecordUpsert {
  return {
    classId,
    studentId: r.studentId,
    date: r.date,
    status: r.status,
    note: r.note ?? null,
  };
}

function recordKey(r: AttendanceRecord): string {
  return `${r.studentId}|${r.date}`;
}

function diffStatuses(
  prev: AttendanceStatusDef[],
  next: AttendanceStatusDef[],
  batch: AttendanceBatch
): void {
  const prevByKey = new Map<string, { item: AttendanceStatusDef; index: number }>();
  prev.forEach((item, index) => prevByKey.set(item.key, { item, index }));

  next.forEach((item, index) => {
    const p = prevByKey.get(item.key);
    if (!p || p.item !== item || p.index !== index) {
      batch.statusesUpsert.push(toStatusUpsert(item, index));
    }
  });

  const nextKeys = new Set(next.map((s) => s.key));
  for (const s of prev) if (!nextKeys.has(s.key)) batch.statusesDelete.push(s.key);
}

function diffClassRecords(
  classId: string,
  prev: AttendanceRecord[] | undefined,
  next: AttendanceRecord[],
  batch: AttendanceBatch
): void {
  if (!prev) {
    // sinf ilk marta store'ga tushdi (lazy seed + tahrir) — hammasi yoziladi
    for (const r of next) batch.recordsUpsert.push(toRecordUpsert(classId, r));
    return;
  }
  const prevByKey = new Map<string, AttendanceRecord>();
  for (const r of prev) prevByKey.set(recordKey(r), r);

  const nextKeys = new Set<string>();
  for (const r of next) {
    const key = recordKey(r);
    nextKeys.add(key);
    const p = prevByKey.get(key);
    if (!p || p !== r) batch.recordsUpsert.push(toRecordUpsert(classId, r));
  }
  for (const r of prev) {
    if (!nextKeys.has(recordKey(r))) {
      batch.recordsDelete.push({ classId, studentId: r.studentId, date: r.date });
    }
  }
}

export function diffAttendance(
  prev: AttendanceSnapshot,
  next: AttendanceSnapshot
): AttendanceBatch | null {
  if (prev.recordsByClass === next.recordsByClass && prev.statuses === next.statuses) {
    return null;
  }
  const batch = emptyAttendanceBatch();

  if (prev.statuses !== next.statuses) diffStatuses(prev.statuses, next.statuses, batch);

  if (prev.recordsByClass !== next.recordsByClass) {
    for (const [classId, nextArr] of Object.entries(next.recordsByClass)) {
      const prevArr = prev.recordsByClass[classId];
      if (prevArr === nextArr) continue;
      diffClassRecords(classId, prevArr, nextArr, batch);
    }
  }

  return isEmptyAttendanceBatch(batch) ? null : batch;
}

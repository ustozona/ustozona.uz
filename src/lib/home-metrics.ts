import type { ClassData } from "@/lib/grades-data";
import type { AttendanceRecord } from "@/lib/attendance-data";

/* ════════════════════════════════════════════════════════════════════
   BOSH SAHIFA METRIKALARI — hero chiplari uchun sof derive helperlar.

   Store'larga bogʻlanmaydi: page maʼlumotni uzatadi, bu yer faqat
   hisoblaydi (test qilish va qayta ishlatish oson boʻlishi uchun).
   ════════════════════════════════════════════════════════════════════ */

export type AttendanceEntryStatus = { entered: number; total: number };

/** Berilgan kunda jadvalda darsi bor sinflar boʻyicha davomat kiritilishi:
    `total` — shu kun darsi bor unikal sinflar, `entered` — shu kunga kamida
    bitta davomat yozuvi kiritilgan sinflar. */
export function attendanceEntryForDay(
  classIds: ReadonlyArray<string>,
  recordsByClass: Record<string, AttendanceRecord[]>,
  dateKey: string
): AttendanceEntryStatus {
  const unique = [...new Set(classIds)];
  let entered = 0;
  for (const id of unique) {
    if ((recordsByClass[id] ?? []).some((r) => r.date === dateKey)) entered++;
  }
  return { entered, total: unique.length };
}

/** Tekshirish qatori — muddati kelgan, lekin ball kiritilishi chala assignment. */
export type CheckRow = {
  classId: string;
  assignmentId: string;
  title: string;
  /** yyyy-mm-dd — dueDate, boʻlmasa date. */
  due: string;
  /** Baho yoki Q/T belgisi kiritilgan faol oʻquvchilar soni. */
  entered: number;
  /** Faol oʻquvchilar soni (roster). */
  total: number;
};

/** Tekshirilishi kutayotgan ishlar roʻyxati: sanasi (dueDate, boʻlmasa date)
    kelgan, lekin barcha faol oʻquvchilarga baho/belgi kiritilmagan
    assignmentlar (barcha sinflar boʻyicha, sana boʻyicha tartiblangan). */
export function pendingCheckRows(
  classDataMap: Record<string, ClassData | undefined>,
  todayKey: string
): CheckRow[] {
  const rows: CheckRow[] = [];
  for (const [classId, cd] of Object.entries(classDataMap)) {
    if (!cd) continue;
    const activeStudents = cd.students.filter((s) => s.status !== "archived");
    if (activeStudents.length === 0) continue;
    // assignmentId → baho yoki belgi kiritilgan oʻquvchilar toʻplami
    const scored = new Map<string, Set<string>>();
    for (const g of cd.grades) {
      if (g.score == null && !g.missing && !g.isMissing) continue;
      let set = scored.get(g.assignmentId);
      if (!set) scored.set(g.assignmentId, (set = new Set()));
      set.add(g.studentId);
    }
    for (const a of cd.assignments) {
      const due = a.dueDate ?? a.date;
      if (!due || due > todayKey) continue;
      const got = scored.get(a.id);
      const entered = activeStudents.filter((s) => got?.has(s.id)).length;
      if (entered < activeStudents.length) {
        rows.push({
          classId,
          assignmentId: a.id,
          title: a.title,
          due,
          entered,
          total: activeStudents.length,
        });
      }
    }
  }
  return rows.sort((a, b) => a.due.localeCompare(b.due));
}

/** Tekshirilishi kutayotgan ishlar soni — hero chipi (qatorlar bilan bir manba). */
export function pendingCheckCount(
  classDataMap: Record<string, ClassData | undefined>,
  todayKey: string
): number {
  return pendingCheckRows(classDataMap, todayKey).length;
}

/** Kelgusi summativ muddat qatori — "Ishlar navbati" uchun. */
export type DeadlineRow = {
  classId: string;
  assignmentId: string;
  title: string;
  /** yyyy-mm-dd */
  due: string;
};

/** Kelgusi summativ (nazorat) muddatlari: due > bugun. Muddati kelganlari
    tekshirish qatorlariga oʻtadi — bu roʻyxat faqat oldindagilar. */
export function upcomingSummativeDeadlines(
  classDataMap: Record<string, ClassData | undefined>,
  todayKey: string
): DeadlineRow[] {
  const rows: DeadlineRow[] = [];
  for (const [classId, cd] of Object.entries(classDataMap)) {
    if (!cd) continue;
    const summative = new Set(
      cd.topics.filter((t) => t.purpose === "summative").map((t) => t.id)
    );
    for (const a of cd.assignments) {
      const due = a.dueDate ?? a.date;
      if (!due || due <= todayKey || !summative.has(a.topicId)) continue;
      rows.push({ classId, assignmentId: a.id, title: a.title, due });
    }
  }
  return rows.sort((a, b) => a.due.localeCompare(b.due));
}

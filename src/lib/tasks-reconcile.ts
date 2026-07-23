import type { ClassData } from "@/lib/grades-data";
import type { Lesson } from "@/lib/lessons-data";
import { lessonSessions } from "@/lib/lessons-data";
import { addDaysKey } from "@/lib/date-keys";
import { gradingTaskId, lessonTaskId, type Task } from "@/lib/tasks-data";

/* ════════════════════════════════════════════════════════════════════
   DARS + BAHOLASH AVTO-VAZIFALARI — pure reconcile (derive-and-reconcile,
   useBehaviorStore/behavior-auto.ts patterni namuna).

   Faqat FARQ hisoblanadi — natija `TasksAutoReconciler` orqali
   useTasksStore'ga yoziladi. Qoidalar (reja, B3):
   - Lesson oynasi: [bugun-7, bugun+21]; oynadan tashqari yoki sessiyasi
     endi yo'q "todo" avto-vazifa pruning qilinadi (done/canceled tarixda qoladi).
   - Grading: mavjud BARCHA assignmentlar uchun (muddat: dueDate ?? date),
     oyna yo'q; assignment o'chsa "todo" pruning qilinadi.
   - Forward-only: reconciler faqat "todo → done" oʻtkazadi (lesson
     Completed / baholash toʻliq kiritilgan boʻlsa). Hech qachon
     "done → todo" qaytarmaydi (canceled ham tombstone — qayta tug'ilmaydi).
   - Sarlavha sinxroni: hali todo bo'lgan avto-vazifa sarlavhasi dars/
     topshiriq nomi o'zgarsa yangilanadi (done/canceled'ga tegilmaydi).
   ════════════════════════════════════════════════════════════════════ */

export type ReconcileResult = {
  /** Yangi yoki yangilanishi kerak boʻlgan avto-vazifalar. */
  upserts: Task[];
  /** Endi haqiqiy sessiya/assignment'ga mos kelmaydigan "todo" avto-vazifalar. */
  deleteIds: string[];
  /** Barcha oynadagi sessiya-vazifalari done boʻlgan darslar — Completed qilinishi kerak. */
  lessonsToComplete: string[];
};

function isLive(cd: ClassData | undefined): cd is ClassData {
  return !!cd && !cd.info.archivedAt;
}

export function reconcileLessonAndGradingTasks(
  items: Task[],
  lessons: Lesson[],
  classDataMap: Record<string, ClassData | undefined>,
  todayKey: string
): ReconcileResult {
  const existingById = new Map(items.map((t) => [t.id, t]));
  const upserts: Task[] = [];
  const keepLessonIds = new Set<string>();
  const keepGradingIds = new Set<string>();
  let seed = items.length;
  const nowIso = new Date().toISOString();

  /* ── Dars sessiyalari ── */
  const windowStart = addDaysKey(todayKey, -7);
  const windowEnd = addDaysKey(todayKey, 21);

  // Har dars uchun: shu oynadagi sessiya-vazifalar barchasi done'mi (Completed sinxroni uchun).
  const lessonsToComplete: string[] = [];

  for (const l of lessons) {
    const sessions = lessonSessions(l).filter((s) => {
      const cd = classDataMap[s.classId];
      return isLive(cd) && s.date >= windowStart && s.date <= windowEnd;
    });
    if (sessions.length === 0) continue;

    let allDone = true;
    for (const s of sessions) {
      const id = lessonTaskId(l.id, s.classId, s.date, s.startMin);
      keepLessonIds.add(id);
      const existing = existingById.get(id);

      if (!existing) {
        const bornDone = l.status === "Completed";
        if (!bornDone) allDone = false;
        upserts.push({
          id,
          title: l.title,
          status: bornDone ? "done" : "todo",
          priority: "none",
          dueDate: s.date,
          dueMin: s.startMin,
          classId: s.classId,
          tags: [],
          repeat: null,
          source: { kind: "lesson", lessonId: l.id, classId: s.classId, date: s.date, startMin: s.startMin },
          sortOrder: seed++,
          createdAt: nowIso,
          completedAt: bornDone ? nowIso : null,
        });
        continue;
      }

      if (existing.status !== "done") allDone = false;

      if (l.status === "Completed" && existing.status !== "done" && existing.status !== "canceled") {
        upserts.push({ ...existing, status: "done", completedAt: nowIso });
        continue;
      }
      if (existing.status === "todo" && existing.title !== l.title) {
        upserts.push({ ...existing, title: l.title });
      }
    }

    if (allDone && l.status !== "Completed") lessonsToComplete.push(l.id);
  }

  /* ── Baholash (topshiriqlar) ── */
  for (const [classId, cd] of Object.entries(classDataMap)) {
    if (!isLive(cd)) continue;
    const activeStudents = cd.students.filter((s) => s.status !== "archived");
    if (activeStudents.length === 0) continue;

    const scored = new Map<string, Set<string>>();
    for (const g of cd.grades) {
      if (g.score == null && !g.missing && !g.isMissing) continue;
      let set = scored.get(g.assignmentId);
      if (!set) scored.set(g.assignmentId, (set = new Set()));
      set.add(g.studentId);
    }

    for (const a of cd.assignments) {
      const due = a.dueDate ?? a.date;
      if (!due) continue;
      const id = gradingTaskId(classId, a.id);
      keepGradingIds.add(id);

      const entered = activeStudents.filter((s) => scored.get(a.id)?.has(s.id)).length;
      const completed = entered >= activeStudents.length;
      const existing = existingById.get(id);

      if (!existing) {
        upserts.push({
          id,
          title: a.title,
          status: completed ? "done" : "todo",
          priority: "none",
          dueDate: due,
          dueMin: null,
          classId,
          tags: [],
          repeat: null,
          source: { kind: "grading", classId, assignmentId: a.id },
          sortOrder: seed++,
          createdAt: nowIso,
          completedAt: completed ? nowIso : null,
        });
        continue;
      }

      if (completed && existing.status !== "done" && existing.status !== "canceled") {
        upserts.push({ ...existing, status: "done", completedAt: nowIso, dueDate: due, title: a.title });
        continue;
      }
      if (existing.status === "todo" && (existing.title !== a.title || existing.dueDate !== due)) {
        upserts.push({ ...existing, title: a.title, dueDate: due });
      }
    }
  }

  /* ── Pruning: endi mos kelmaydigan "todo" avto-vazifalar ── */
  const deleteIds: string[] = [];
  for (const t of items) {
    if (t.status !== "todo") continue; // done/canceled — tarix, tegilmaydi
    if (t.source.kind === "lesson" && !keepLessonIds.has(t.id)) deleteIds.push(t.id);
    else if (t.source.kind === "grading" && !keepGradingIds.has(t.id)) deleteIds.push(t.id);
  }

  return { upserts, deleteIds, lessonsToComplete };
}

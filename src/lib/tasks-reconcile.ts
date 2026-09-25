import type { ClassData } from "@/lib/grades-data";
import type { Lesson } from "@/lib/lessons-data";
import { isTaught, lessonClassIds, lessonSessions, sameRev } from "@/lib/lessons-data";
import { addDaysKey, dateToKey } from "@/lib/date-keys";
import { birthdayTaskId, birthdayTaskTitle, gradingTaskId, lessonTaskId, lessonTaskTitle, type Task, type TaskPriority } from "@/lib/tasks-data";
import { subjectLabel } from "@/lib/standards-data";

/* ════════════════════════════════════════════════════════════════════
   DARS + BAHOLASH AVTO-VAZIFALARI — pure reconcile (derive-and-reconcile,
   useBehaviorStore/behavior-auto.ts patterni namuna).

   Faqat FARQ hisoblanadi — natija `TasksAutoReconciler` orqali
   useTasksStore'ga yoziladi. Qoidalar (reja, B3):
   - Lesson oynasi: [bugun-7, bugun+21]; oynadan tashqari yoki sessiyasi
     endi yo'q "todo" avto-vazifa pruning qilinadi (done/canceled tarixda qoladi).
     Istisno — foydalanuvchi qayta ochgan (`reopenedAt`) ochiq vazifa.
   - Grading: mavjud BARCHA assignmentlar uchun (muddat: dueDate ?? date),
     oyna yo'q; assignment o'chsa "todo" pruning qilinadi.
   - Baholash — forward-only: faqat "todo → done" (toʻliq kiritilgan boʻlsa).
   - Dars ↔ dars vazifasi — ikki tomonlama, (dars × aʼzo sinf) boʻyicha:
     «Oʻtildi» (`isTaught`) → vazifa done; sinfdagi vazifalar hammasi done →
     «Oʻtildi». Ziddiyatda YANGIROQ amal yutadi. Vaqt emas, reviziya
     solishtiriladi: dars belgisi har oʻzgarganda yangi token oladi
     (`Lesson.taughtRevByClass`), vazifa esa holati qoʻyilgan paytdagi tokenni
     saqlaydi (`Task.taughtRevSeen`). Teng — vazifa yangiroq; farqli — dars.
       · «Oʻtildi» vazifa bajarilganidan keyin olingan → vazifa "done → todo";
       · vazifa «Oʻtildi»dan keyin qayta ochilgan → darsdan «Oʻtildi» olinadi.
   - Canceled — tombstone, qayta tug'ilmaydi va tegilmaydi.
   - Sarlavha sinxroni: hali todo bo'lgan avto-vazifa sarlavhasi dars/
     topshiriq nomi o'zgarsa yangilanadi (done/canceled'ga tegilmaydi).
   ════════════════════════════════════════════════════════════════════ */

export type ReconcileResult = {
  /** Yangi yoki yangilanishi kerak boʻlgan avto-vazifalar. */
  upserts: Task[];
  /** Endi haqiqiy sessiya/assignment'ga mos kelmaydigan "todo" avto-vazifalar. */
  deleteIds: string[];
  /** Sinf boʻyicha: shu sinfdagi dars vazifalari hammasi bajarildi → shu sinfda «Oʻtildi». */
  lessonsToComplete: { lessonId: string; classId: string }[];
  /** Sinf boʻyicha: oʻtilgan darsning vazifasi qoʻlda qayta ochildi → shu sinfda «Oʻtildi» olinadi. */
  lessonsToUncomplete: { lessonId: string; classId: string }[];
};

/* Avto-vazifalar muhimligi — FAQAT vazifa tugʻilganda qoʻyiladi.
   Dars va baholash kunning oʻzagi (yuqori); tugʻilgan kun tabrigi
   oʻtkazib yuborilsa dars kabi zarar qilmaydi (oʻrta).

   Sarlavhadan farqli oʻlaroq priority keyingi passlarda sinxronlanmaydi:
   muhimlik — foydalanuvchining qarori, u qoʻlda oʻzgartirgan qiymat
   reconciler tomonidan qaytarilmasligi kerak. */
const LESSON_PRIORITY: TaskPriority = "high";
const GRADING_PRIORITY: TaskPriority = "high";
const BIRTHDAY_PRIORITY: TaskPriority = "medium";

function isLive(cd: ClassData | undefined): cd is ClassData {
  return !!cd && !cd.info.archivedAt;
}

function isOpen(t: Task): boolean {
  return t.status === "todo" || t.status === "in-progress";
}

type LessonSlot = { task: Task; title: string };

/** Bitta (dars × sinf) juftligining shu passdagi vazifalari — holat boʻyicha. */
type ClassBucket = {
  done: LessonSlot[];
  open: LessonSlot[];
  /** Hali vazifasi yoʻq sessiyalar — sinf boʻyicha qaror chiqqach tugʻiladi. */
  fresh: { id: string; title: string; session: { date: string; startMin: number; endMin: number } }[];
  canceled: boolean;
};

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

  const lessonsToComplete: { lessonId: string; classId: string }[] = [];
  const lessonsToUncomplete: { lessonId: string; classId: string }[] = [];

  for (const l of lessons) {
    /* Koʻp sinfli mavzuda har sinf alohida oʻtiladi — shuning uchun hamma
       qaror (dars × sinf) juftligida. Faqat AʼZO sinflar: jadvalda qolib
       ketgan begona sinf `isTaught` da umumiy belgiga tushib, butun darsni
       «Oʻtildi» qilib yuborardi. */
    const members = new Set(lessonClassIds(l));
    const buckets = new Map<string, ClassBucket>();
    for (const s of lessonSessions(l)) {
      if (!members.has(s.classId) || !isLive(classDataMap[s.classId])) continue;
      const id = lessonTaskId(l.id, s.classId, s.date, s.startMin);
      const existing = existingById.get(id);
      // Oynadan tashqari sessiya faqat foydalanuvchi qayta ochgan vazifasi bilan kiradi —
      // aks holda u pruning'da oʻchib, qayta ochish darsga yetmasdi.
      const inWindow = s.date >= windowStart && s.date <= windowEnd;
      if (!inWindow && !(existing?.reopenedAt && isOpen(existing))) continue;
      keepLessonIds.add(id);

      let b = buckets.get(s.classId);
      if (!b) buckets.set(s.classId, (b = { done: [], open: [], fresh: [], canceled: false }));
      const info = classDataMap[s.classId]?.info;
      const title = lessonTaskTitle(l.title, info?.name, subjectLabel(info?.subject));
      if (!existing) b.fresh.push({ id, title, session: s });
      else if (existing.status === "done") b.done.push({ task: existing, title });
      else if (existing.status === "canceled") b.canceled = true;
      else b.open.push({ task: existing, title });
    }

    for (const [classId, b] of buckets) {
      const rev = l.taughtRevByClass?.[classId];
      const seen = rev ?? null;
      // Vazifa holati dars belgisining oxirgi oʻzgarishidan KEYIN qoʻyilgan.
      // `undefined` (eski vazifa) hech qachon yangiroq emas — oldingi xulq saqlanadi.
      const newer = (t: Task) => t.taughtRevSeen !== undefined && sameRev(t.taughtRevSeen, rev);
      let bornDone = false;
      let stillOpen = b.open;

      if (isTaught(l, classId)) {
        if (b.open.some(({ task }) => newer(task))) {
          /* Vazifa «Oʻtildi»dan keyin qoʻlda qayta ochilgan — darsdan belgi
             olinadi (ilgari vazifa shu yerda darhol yana done boʻlardi). */
          lessonsToUncomplete.push({ lessonId: l.id, classId });
        } else {
          // Dars belgisi yangiroq — ochiq vazifalar bajarilgan boʻladi.
          for (const { task, title } of b.open) {
            upserts.push({ ...task, title, status: "done", completedAt: nowIso, taughtRevSeen: seen });
          }
          stillOpen = [];
          bornDone = true;
        }
      } else {
        /* Dars oʻtilmagan. Belgi vazifa bajarilganidan KEYIN olingan boʻlsa
           (adashib qoʻyilgan «Oʻtildi» qaytarildi) — vazifa qayta ochiladi.
           Ilgari bu farqlanmasdi va quyidagi qoida belgini darhol qaytarardi. */
        const stale = rev !== undefined ? b.done.filter(({ task }) => !newer(task)) : [];
        for (const { task, title } of stale) {
          upserts.push({ ...task, title, status: "todo", completedAt: null, doneManually: false, taughtRevSeen: seen });
        }
        // Sinfdagi hamma vazifa (bekor qilingani ham toʻsiq) qoʻlda bajarilgan → «Oʻtildi».
        if (stale.length === 0 && b.done.length > 0 && b.open.length === 0 && !b.canceled && b.fresh.length === 0) {
          lessonsToComplete.push({ lessonId: l.id, classId });
        }
      }

      for (const { task, title } of stillOpen) {
        if (task.status === "todo" && task.title !== title) upserts.push({ ...task, title });
      }
      for (const { id, title, session: s } of b.fresh) {
        upserts.push({
          id,
          title,
          status: bornDone ? "done" : "todo",
          priority: LESSON_PRIORITY,
          dueDate: s.date,
          dueMin: s.startMin,
          dueEndMin: s.endMin,
          classId,
          tags: [],
          repeat: null,
          source: { kind: "lesson", lessonId: l.id, classId, date: s.date, startMin: s.startMin },
          estPomos: 1,
          sortOrder: seed++,
          createdAt: nowIso,
          completedAt: bornDone ? nowIso : null,
          taughtRevSeen: seen,
        });
      }
    }
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
          priority: GRADING_PRIORITY,
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

  return { upserts, deleteIds, lessonsToComplete, lessonsToUncomplete };
}

/* ════════════════════════════════════════════════════════════════════
   TUGʻILGAN KUN AVTO-VAZIFALARI (B4).

   Sozlamada oʻchirilgan boʻlsa — barcha "todo" tugʻilgan kun vazifalari
   pruning qilinadi (done/canceled tarixda qoladi). Yoqilgan boʻlsa —
   oyna [bugun-7, bugun+30] ichidagi tugʻilgan kunlar uchun vazifa
   yaratiladi. Bildirishnoma — sozlamadagi muddatda (birthdayLead kun
   oldin) bir marta, `notifiedAt` bilan idempotent.
   ════════════════════════════════════════════════════════════════════ */

export type BirthdaySettings = { birthdayTasks: boolean; birthdayLead: 0 | 1 | 3 };

export type BirthdayNotify = {
  taskId: string;
  studentId: string;
  studentName: string;
  className: string;
  dateKey: string;
};

export type BirthdayReconcileResult = {
  upserts: Task[];
  deleteIds: string[];
  notify: BirthdayNotify[];
};

/** Berilgan oy/kun uchun oynadagi eng yaqin yillik takror — topilmasa null. */
function occurrenceInWindow(
  month: number,
  day: number,
  todayKey: string,
  windowStart: string,
  windowEnd: string
): { dateKey: string; year: number } | null {
  const todayYear = Number(todayKey.slice(0, 4));
  for (const year of [todayYear - 1, todayYear, todayYear + 1]) {
    const dateKey = dateToKey(new Date(year, month - 1, day));
    if (dateKey >= windowStart && dateKey <= windowEnd) return { dateKey, year };
  }
  return null;
}

export function reconcileBirthdayTasks(
  items: Task[],
  classDataMap: Record<string, ClassData | undefined>,
  settings: BirthdaySettings,
  todayKey: string
): BirthdayReconcileResult {
  const existingById = new Map(items.map((t) => [t.id, t]));
  const upserts: Task[] = [];
  const notify: BirthdayNotify[] = [];
  const keepIds = new Set<string>();
  const nowIso = new Date().toISOString();

  if (settings.birthdayTasks) {
    const windowStart = addDaysKey(todayKey, -7);
    const windowEnd = addDaysKey(todayKey, 30);

    for (const [classId, cd] of Object.entries(classDataMap)) {
      if (!isLive(cd)) continue;
      for (const s of cd.students) {
        if (s.status === "archived" || !s.birthDate) continue;
        const [, m, d] = s.birthDate.split("-").map(Number);
        if (!m || !d) continue;
        const occ = occurrenceInWindow(m, d, todayKey, windowStart, windowEnd);
        if (!occ) continue;

        const id = birthdayTaskId(s.id, occ.year);
        keepIds.add(id);
        const existing = existingById.get(id);
        const leadStart = addDaysKey(occ.dateKey, -settings.birthdayLead);
        const shouldNotifyNow = todayKey >= leadStart && todayKey <= occ.dateKey;
        const title = birthdayTaskTitle(s.name, cd.info.name);

        if (!existing) {
          const task: Task = {
            id,
            title,
            status: "todo",
            priority: BIRTHDAY_PRIORITY,
            dueDate: occ.dateKey,
            dueMin: null,
            classId,
            tags: [],
            repeat: null,
            source: { kind: "birthday", studentId: s.id, year: occ.year },
            sortOrder: items.length + upserts.length,
            createdAt: nowIso,
            completedAt: null,
            notifiedAt: shouldNotifyNow ? nowIso : null,
          };
          upserts.push(task);
          if (shouldNotifyNow)
            notify.push({ taskId: id, studentId: s.id, studentName: s.name, className: cd.info.name, dateKey: occ.dateKey });
          continue;
        }

        // Sarlavha formati oʻzgarganda (yoki oʻquvchi/sinf nomi
        // tahrirlanganda) mavjud vazifa ham yangilanadi — bajarilmagan
        // vazifalarda eski matn qolib ketmasin.
        const needsTitle = existing.status === "todo" && existing.title !== title;
        const needsNotify = !existing.notifiedAt && shouldNotifyNow;
        if (needsTitle || needsNotify) {
          upserts.push({
            ...existing,
            ...(needsTitle ? { title } : {}),
            ...(needsNotify ? { notifiedAt: nowIso } : {}),
          });
        }
        if (needsNotify) {
          notify.push({ taskId: id, studentId: s.id, studentName: s.name, className: cd.info.name, dateKey: occ.dateKey });
        }
      }
    }
  }

  /* Pruning FAQAT sinf maʼlumoti haqiqatan yuklangan boʻlsa. Boʻsh
     `classDataMap` (hidratsiya oraligʻi yoki tarmoq xatosi) bilan
     pruning qilinsa, bugungi tugʻilgan kun vazifasi oʻchib, keyingi
     passda `notifiedAt: null` bilan qayta tugʻilar va TAKROR
     bildirishnoma yuborilardi — 2026-09 da qoʻngʻiroqchada bir
     oʻquvchi ikki marta shu sababdan chiqqan. */
  const deleteIds: string[] = [];
  if (Object.keys(classDataMap).length > 0) {
    for (const t of items) {
      if (t.status !== "todo") continue;
      if (t.source.kind === "birthday" && !keepIds.has(t.id)) deleteIds.push(t.id);
    }
  }

  return { upserts, deleteIds, notify };
}

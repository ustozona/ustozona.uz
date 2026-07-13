/* ════════════════════════════════════════════════════════════════════
   XULQ AVTO-BALL ENGINE — derive-and-reconcile (pure, React'siz).

   Davomat + jurnal maʼlumotlaridan "boʻlishi kerak boʻlgan" avto-eventlar
   toʻplamini chiqaradi (computeDesiredAutoEvents), soʻng mavjud holat
   bilan solishtirib minimal farqni beradi (reconcileAutoEvents).
   BehaviorAutoReconciler komponenti shu farqni store'ga yozadi.

   Tamoyillar:
   - Deterministik idlar: bir xil holat → bir xil id (dublikat imkonsiz,
     koʻp qurilmada server upsert idempotent).
   - Retro-tuzatish: davomat statusi/baho oʻzgarsa avto-event yangilanadi
     yoki olib tashlanadi (termostat — joriy holatni aks ettiradi).
   - Sozlama qiymati oʻzgarsa ESKI eventlar oʻzgarmaydi (snapshot):
     yangilash faqat `name` farqida (qoida TURI oʻzgargan degani).
   - `*Since` langari: undan oldingi sanalarga umuman tegilmaydi.
   - Tombstone: oʻqituvchi qasddan oʻchirgan avto-event (deletions
     jurnalidagi eventId) qayta yaratilmaydi.
   ════════════════════════════════════════════════════════════════════ */

import type { AttendanceRecord, LessonDay } from "@/lib/attendance-data";
import type { Assignment, Grade, Student } from "@/lib/grades-data";
import {
  todayDateKey,
  type BehaviorAutoSettings,
  type BehaviorAutoSource,
  type BehaviorEvent,
} from "@/lib/behavior-data";

/* ── Deterministik idlar ────────────────────────────────────────────── */

export function attAutoId(classId: string, studentId: string, date: string): string {
  return `bha:att:${classId}:${studentId}:${date}`;
}
export function streakAutoId(classId: string, studentId: string, date: string): string {
  return `bha:streak:${classId}:${studentId}:${date}`;
}
export function gradeAutoId(classId: string, studentId: string, assignmentId: string): string {
  return `bha:grade:${classId}:${studentId}:${assignmentId}`;
}
export function dueAutoId(classId: string, studentId: string, assignmentId: string): string {
  return `bha:due:${classId}:${studentId}:${assignmentId}`;
}

/* ── Avto-event snapshot konstantalari ──────────────────────────────── */

const AUTO_META = {
  late: { name: "Kechikdi", emoji: "23f0", description: "Davomatdan avtomatik" },
  absent: { name: "Sababsiz kelmadi", emoji: "1f6ab", description: "Davomatdan avtomatik" },
  present: { name: "Darsga keldi", emoji: "2705", description: "Davomatdan avtomatik" },
  graded: { name: "Topshiriq baholandi", emoji: "1f4dd", description: "Jurnaldan avtomatik" },
  due: { name: "Muddatida topshirilmadi", emoji: "23f3", description: "Jurnaldan avtomatik" },
} as const;

/** Streak nomi N ni oʻz ichiga oladi — N oʻzgarsa qoida turi ham oʻzgaradi. */
function streakName(n: number): string {
  return `Davomat seriyasi: ${n} dars`;
}

function makeEvent(
  id: string,
  studentId: string,
  source: BehaviorAutoSource,
  meta: { name: string; emoji: string; description: string },
  points: number,
  date: string
): BehaviorEvent {
  return {
    id,
    studentId,
    source,
    name: meta.name,
    emoji: meta.emoji,
    description: meta.description,
    points,
    date,
    createdAt: new Date().toISOString(), // mavjud eventda reconcile'da saqlanadi
  };
}

/* ── Davomat: har belgilangan holat uchun event ─────────────────────── */

export function computeAttendanceAutoEvents(
  classId: string,
  records: AttendanceRecord[],
  settings: BehaviorAutoSettings,
  todayKey: string
): BehaviorEvent[] {
  if (!settings.attendanceEnabled) return [];
  const out: BehaviorEvent[] = [];
  for (const r of records) {
    if (r.date < settings.attendanceSince || r.date > todayKey) continue;
    let rule: { name: string; emoji: string; description: string } | null = null;
    let points = 0;
    if (r.status === "late" && settings.lateEnabled) {
      rule = AUTO_META.late;
      points = settings.latePoints;
    } else if (r.status === "absent" && settings.absentEnabled) {
      rule = AUTO_META.absent;
      points = settings.absentPoints;
    } else if (r.status === "present" && settings.presentEnabled) {
      rule = AUTO_META.present;
      points = settings.presentPoints;
    }
    if (!rule || points === 0) continue;
    out.push(
      makeEvent(attAutoId(classId, r.studentId, r.date), r.studentId, "attendance", rule, points, r.date)
    );
  }
  return out;
}

/* ── Streak: zina modeli (milestone ladder) + checkpoint-reset ───────── */

/**
 * Zina jadvali: bazaviy marra B uchun B→+2, 2B→+3, 4B→+5, keyin har
 * 2B darsda +5. k = marra tartib raqami (1, 2, 3, …).
 */
export function streakMilestoneAt(k: number, base: number): { threshold: number; bonus: number } {
  if (k <= 0) return { threshold: 0, bonus: 0 };
  if (k === 1) return { threshold: base, bonus: 2 };
  if (k === 2) return { threshold: base * 2, bonus: 3 };
  return { threshold: base * 2 * (k - 1), bonus: 5 };
}

/** Hisoblagich qiymatidan keyingi (hali erishilmagan) marra. */
export function nextMilestone(counter: number, base: number): { threshold: number; bonus: number } {
  let k = 1;
  let m = streakMilestoneAt(k, base);
  while (m.threshold <= counter) {
    k += 1;
    m = streakMilestoneAt(k, base);
  }
  return m;
}

/** Checkpoint-reset: oxirgi erishilgan marra qiymati (yoki 0). */
export function checkpointFor(counter: number, base: number): number {
  let k = 1;
  let checkpoint = 0;
  let m = streakMilestoneAt(k, base);
  while (m.threshold <= counter) {
    checkpoint = m.threshold;
    k += 1;
    m = streakMilestoneAt(k, base);
  }
  return checkpoint;
}

export type StreakState = {
  /** Joriy hisoblagich (bonusdan keyin ham 0 ga tushmaydi). */
  count: number;
  /** Keyingi marra va uning bonusi. */
  nextThreshold: number;
  nextBonus: number;
  /** Oxirgi belgilangan kun kechikdi/sababli/belgilanmagan boʻlsa — pauza. */
  paused: boolean;
};

/**
 * computeStreakEvents va computeCurrentStreaks ikkalasi shu bitta
 * iteratsiyadan foydalanadi (drift boʻlmasin). `present` hisoblagichni
 * oshiradi; marraga yetganda `onMilestone` chaqiriladi va hisoblagich
 * DAVOM ETADI (0 ga tushmaydi). `late`/`excused`/belgilanmagan kun —
 * pauza (oʻzgartirmaydi). `absent` — checkpoint-reset (oxirgi marraga
 * qaytadi, 0 ga emas).
 */
function walkStreak(
  statusByDate: Map<string, string>,
  days: string[],
  base: number,
  onMilestone?: (date: string, threshold: number, bonus: number) => void
): StreakState {
  let counter = 0;
  let paused = false;
  let next = nextMilestone(counter, base);
  for (const date of days) {
    const status = statusByDate.get(date);
    if (status === "absent") {
      counter = checkpointFor(counter, base);
      next = nextMilestone(counter, base);
      paused = false;
    } else if (status === "present") {
      counter += 1;
      paused = false;
      if (counter === next.threshold) {
        onMilestone?.(date, next.threshold, next.bonus);
        next = nextMilestone(counter, base);
      }
    } else {
      // late / excused / belgilanmagan kun — pauza (hisoblagich oʻzgarmaydi).
      paused = true;
    }
  }
  return { count: counter, nextThreshold: next.threshold, nextBonus: next.bonus, paused };
}

function attendanceByStudent(
  records: AttendanceRecord[],
  since: string,
  todayKey: string
): Map<string, Map<string, string>> {
  const byStudent = new Map<string, Map<string, string>>();
  for (const r of records) {
    if (r.date < since || r.date > todayKey) continue;
    let m = byStudent.get(r.studentId);
    if (!m) byStudent.set(r.studentId, (m = new Map()));
    m.set(r.date, r.status);
  }
  return byStudent;
}

function windowLessonDays(lessonDays: LessonDay[], since: string, todayKey: string): string[] {
  return lessonDays
    .filter((d) => d.date >= since && d.date <= todayKey)
    .map((d) => d.date)
    .sort();
}

export function computeStreakEvents(
  classId: string,
  records: AttendanceRecord[],
  lessonDays: LessonDay[],
  settings: BehaviorAutoSettings,
  todayKey: string
): BehaviorEvent[] {
  if (!settings.attendanceEnabled || !settings.streakEnabled) return [];
  if (settings.streakN < 2) return [];

  const byStudent = attendanceByStudent(records, settings.attendanceSince, todayKey);
  const days = windowLessonDays(lessonDays, settings.attendanceSince, todayKey);

  const out: BehaviorEvent[] = [];
  for (const [studentId, statusByDate] of byStudent) {
    walkStreak(statusByDate, days, settings.streakN, (date, threshold, bonus) => {
      out.push(
        makeEvent(
          streakAutoId(classId, studentId, date),
          studentId,
          "streak",
          {
            name: streakName(threshold),
            emoji: "1f525",
            description: "Davomatdan avtomatik: ketma-ket darslar seriyasi",
          },
          bonus,
          date
        )
      );
    });
  }
  return out;
}

/** Joriy seriya holati (UI koʻrinuvchan hisoblagich uchun) — event yaratmaydi. */
export function computeCurrentStreaks(
  records: AttendanceRecord[],
  lessonDays: LessonDay[],
  settings: BehaviorAutoSettings,
  todayKey: string
): Map<string, StreakState> {
  const result = new Map<string, StreakState>();
  if (!settings.attendanceEnabled || !settings.streakEnabled || settings.streakN < 2) return result;

  const byStudent = attendanceByStudent(records, settings.attendanceSince, todayKey);
  const days = windowLessonDays(lessonDays, settings.attendanceSince, todayKey);

  for (const [studentId, statusByDate] of byStudent) {
    result.set(studentId, walkStreak(statusByDate, days, settings.streakN));
  }
  return result;
}

/* ── Jurnal: baholandi (+) va muddat oʻtib boʻsh (−) ────────────────── */

/** Jurnal qoidalari langar sanasi: topshiriqning oʻz sanasi (yoki muddati). */
function assignmentAnchorDate(a: Assignment): string | undefined {
  return a.date ?? a.dueDate;
}

export function computeJournalAutoEvents(
  classId: string,
  students: Student[],
  assignments: Assignment[],
  grades: Grade[],
  settings: BehaviorAutoSettings,
  todayKey: string
): BehaviorEvent[] {
  if (!settings.journalEnabled) return [];

  const gradeByKey = new Map<string, Grade>();
  for (const g of grades) gradeByKey.set(`${g.studentId}|${g.assignmentId}`, g);

  const out: BehaviorEvent[] = [];
  for (const a of assignments) {
    const anchor = assignmentAnchorDate(a);
    // Langarsiz yoki oynadan oldingi topshiriqlar qamralmaydi
    // (qoida yoqilgunga qadar boʻlgan tarixga retro-toshqin boʻlmasin).
    if (!anchor || anchor < settings.journalSince) continue;

    const duePassed = !!a.dueDate && a.dueDate < todayKey;

    for (const s of students) {
      const g = gradeByKey.get(`${s.id}|${a.id}`);
      const graded = !!g && g.score !== null && !g.isDraft;

      if (graded && settings.gradedEnabled && settings.gradedPoints > 0) {
        out.push(
          makeEvent(
            gradeAutoId(classId, s.id, a.id),
            s.id,
            "grade",
            AUTO_META.graded,
            settings.gradedPoints,
            a.date && a.date <= todayKey ? a.date : todayKey
          )
        );
      } else if (
        !graded &&
        duePassed &&
        settings.missedDueEnabled &&
        settings.missedDuePoints !== 0 &&
        // Muddat oynadan oldin boʻlsa — reconcile qamrovidan tashqarida.
        (a.dueDate as string) >= settings.journalSince &&
        // Q (qatnashmadi) — davomat konstrukti alohida qamraydi, minus adolatsiz.
        g?.missing !== "absent"
      ) {
        out.push(
          makeEvent(
            dueAutoId(classId, s.id, a.id),
            s.id,
            "grade",
            AUTO_META.due,
            settings.missedDuePoints,
            a.dueDate as string
          )
        );
      }
    }
  }
  return out;
}

/* ── Birlashtirish + reconcile ──────────────────────────────────────── */

export type ClassAutoInputs = {
  classId: string;
  records: AttendanceRecord[];
  lessonDays: LessonDay[];
  students: Student[];
  assignments: Assignment[];
  grades: Grade[];
};

export function computeDesiredAutoEvents(
  inputs: ClassAutoInputs,
  settings: BehaviorAutoSettings,
  todayKey: string = todayDateKey()
): Map<string, BehaviorEvent> {
  const desired = new Map<string, BehaviorEvent>();
  const all = [
    ...computeAttendanceAutoEvents(inputs.classId, inputs.records, settings, todayKey),
    ...computeStreakEvents(inputs.classId, inputs.records, inputs.lessonDays, settings, todayKey),
    ...computeJournalAutoEvents(
      inputs.classId,
      inputs.students,
      inputs.assignments,
      inputs.grades,
      settings,
      todayKey
    ),
  ];
  for (const e of all) desired.set(e.id, e);
  return desired;
}

export type AutoReconcileChanges = {
  toAdd: BehaviorEvent[];
  toUpdate: BehaviorEvent[];
  toRemoveIds: string[];
};

/**
 * Mavjud eventlar vs desired → minimal farq.
 * - Qoʻlda (source'siz) eventlarga TEGILMAYDI.
 * - Boshqarilmaydigan manba (toggle OFF) eventlariga tegilmaydi — tarix qoladi.
 * - `*Since`dan oldingi eventlarga tegilmaydi.
 * - Yangilash FAQAT `name` farqida (qoida turi oʻzgargan — mas. kechikdi →
 *   sababsiz tuzatildi); faqat points farqi = sozlama oʻzgarishi → snapshot qoladi.
 * - Tombstone (qasddan oʻchirilgan id) qayta yaratilmaydi.
 */
export function reconcileAutoEvents(
  existing: BehaviorEvent[],
  desired: Map<string, BehaviorEvent>,
  settings: BehaviorAutoSettings,
  tombstoneIds: Set<string>
): AutoReconcileChanges {
  const managedSince: Partial<Record<BehaviorAutoSource, string>> = {};
  if (settings.attendanceEnabled) {
    managedSince.attendance = settings.attendanceSince;
    if (settings.streakEnabled) managedSince.streak = settings.attendanceSince;
  }
  if (settings.journalEnabled) managedSince.grade = settings.journalSince;

  const changes: AutoReconcileChanges = { toAdd: [], toUpdate: [], toRemoveIds: [] };
  const existingById = new Map<string, BehaviorEvent>();

  for (const e of existing) {
    if (!e.source) continue; // qoʻlda berilgan
    const since = managedSince[e.source];
    if (since === undefined || e.date < since) continue; // boshqarilmaydi
    existingById.set(e.id, e);
    const want = desired.get(e.id);
    if (!want) {
      changes.toRemoveIds.push(e.id);
    } else if (want.name !== e.name) {
      // createdAt saqlanadi (note store qatlamida saqlanadi).
      changes.toUpdate.push({ ...want, createdAt: e.createdAt });
    }
  }

  for (const [id, want] of desired) {
    if (existingById.has(id)) continue;
    if (tombstoneIds.has(id)) continue;
    // Mavjud, lekin "boshqarilmaydigan" deb oʻtkazib yuborilgan id bilan
    // toʻqnashmasin — existing'da source'siz yoki eski-sanali nusxasi boʻlsa ham
    // id bir xil boʻlishi mumkin emas (desired faqat oyna ichida yasaladi).
    changes.toAdd.push(want);
  }

  return changes;
}

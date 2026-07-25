export type Unit = {
  id: string;
  classId: string;
  number: number;
  title: string;
  description: string;
};

export type LessonStatus = "Completed" | "Scheduled" | "Unscheduled" | "Draft";

export type Lesson = {
  id: string;
  classId: string;
  unitId: string | null;
  number: number;
  title: string;
  status: LessonStatus;
  /** Lessons sahifasidagi qisqa koʻrinish (masalan "Sep 5") — planner rejalaganda yangilanadi */
  date?: string;
  /** Lessons sahifasidagi qisqa koʻrinish (masalan "10:35 AM") */
  time?: string;
  classCount?: number;
  /** ── Planner kalendari uchun strukturali rejalashtirish ── */
  /** "YYYY-MM-DD" — kalendarga joylangan sana */
  scheduledDate?: string;
  /** 00:00 dan daqiqalar */
  startMin?: number;
  /** 00:00 dan daqiqalar */
  endMin?: number;
  /** ── Dars muharriri (lesson editor) ── */
  /** Tiptap kontenti (HTML) — dars matni */
  content?: string;
  /** Baholar (assignments) uchun biriktirilgan sinflar */
  assignmentClassIds?: string[];
  /** Bogʻlangan standartlar (ID/yorliqlar) */
  standards?: string[];
  /** ── Koʻp-sinf (Model A: bitta dars, koʻp sinf) ──
   *  Dars biriktirilgan barcha sinflar. Boʻsh/aniqlanmagan boʻlsa `classId` (legacy)
   *  yagona aʼzolik sifatida ishlatiladi. Manba: shu maydon (mavjud boʻlsa). */
  classIds?: string[];
  /** Har bir sinf uchun tanlangan boʻlim: classId → unitId|null */
  unitByClass?: Record<string, string | null>;
  /** Har bir sinf uchun alohida rejalashtirish: classId → sessiyalar massivi (koʻp sana). */
  scheduleByClass?: Record<string, LessonSession[]>;
  /** Oxirgi tahrir vaqti (ISO) — muharrir headerida nisbiy koʻrsatiladi. */
  updatedAt?: string;
};

/** Dars sessiyasi — bitta sana + vaqt oraligʻi. */
export type LessonSession = { date: string; startMin: number; endMin: number };

/** Darsning aʼzo sinflari — yangi `classIds` yoki legacy `classId`dan. */
export function lessonClassIds(l: Lesson): string[] {
  if (l.classIds && l.classIds.length) return l.classIds;
  return l.classId ? [l.classId] : [];
}

/** Kalendarga joylangan BARCHA sessiyalar (koʻp sinf, koʻp sana) — yagona manba.
    scheduleByClass boʻsh boʻlgan eski darslar uchun legacy maydonlardan asosiy
    sinf sessiyasi sintez qilinadi. Planner shu roʻyxatdan oʻqiydi. */
export function lessonSessions(l: Lesson): { classId: string; date: string; startMin: number; endMin: number }[] {
  const map = l.scheduleByClass;
  if (map && Object.keys(map).length) {
    const out: { classId: string; date: string; startMin: number; endMin: number }[] = [];
    for (const [classId, sessions] of Object.entries(map)) {
      for (const s of sessions ?? []) out.push({ classId, date: s.date, startMin: s.startMin, endMin: s.endMin });
    }
    return out;
  }
  if (l.scheduledDate && l.classId && l.startMin != null && l.endMin != null) {
    return [{ classId: l.classId, date: l.scheduledDate, startMin: l.startMin, endMin: l.endMin }];
  }
  return [];
}

/** Berilgan sinf kontekstidagi boʻlim idʼsi (per-class xarita yoki legacy). */
export function unitIdForClass(l: Lesson, classId: string): string | null {
  if (l.unitByClass && classId in l.unitByClass) return l.unitByClass[classId];
  const ids = lessonClassIds(l);
  if (ids[0] === classId) return l.unitId ?? null;
  return null;
}

export const UNITS: Unit[] = [
  { id: "u1", classId: "6-a", number: 1, title: "Salomlashish va tanishuv (Greetings)", description: "Kundalik muloqotda salomlashish, oʻzini tanishtirish va xushmuomalalik iboralari." },
  { id: "u2", classId: "6-a", number: 2, title: "Oila va doʻstlar (Family & Friends)", description: "Oila aʼzolari, egalik olmoshlari va kishilarni tasvirlash uchun soʻz boyligi." },
  { id: "u3", classId: "6-a", number: 3, title: "Kundalik mashgʻulotlar (Present Simple)", description: "Present Simple yordamida kundalik ish-harakatlar va vaqtni ifodalash." },
  { id: "u4", classId: "6-a", number: 4, title: "Sevimli mashgʻulotlar (Hobbies)", description: "Hobbi va qiziqishlar haqida gapirish, like / donʼt like konstruksiyalari." },
  { id: "u5", classId: "7-b", number: 1, title: "Salomlashish va tanishuv (Greetings)", description: "Kundalik muloqotda salomlashish, oʻzini tanishtirish va xushmuomalalik iboralari." },
  { id: "u6", classId: "7-b", number: 2, title: "Oila va doʻstlar (Family & Friends)", description: "Oila aʼzolari, egalik olmoshlari va kishilarni tasvirlash uchun soʻz boyligi." },
  { id: "u7", classId: "7-b", number: 3, title: "Kundalik mashgʻulotlar (Present Simple)", description: "Present Simple yordamida kundalik ish-harakatlar va vaqtni ifodalash." },
  { id: "u8", classId: "7-b", number: 4, title: "Sevimli mashgʻulotlar (Hobbies)", description: "Hobbi va qiziqishlar haqida gapirish, like / donʼt like konstruksiyalari." },
  { id: "u9", classId: "9-b", number: 1, title: "Oʻqish koʻnikmasi (Reading)", description: "Matnni tushunib oʻqish, asosiy gʻoyani topish va yangi soʻzlarni kontekstdan aniqlash." },
  { id: "u10", classId: "9-b", number: 2, title: "Yozish koʻnikmasi (Writing)", description: "Norasmiy xat va qisqa insho yozish, paragraf tuzilishi va bogʻlovchilar." },
];

export const LESSONS: Lesson[] = [
  { id: "l1", classId: "6-a", unitId: "u1", number: 1, title: "Salomlashish iboralari va tanishuv", status: "Completed", date: "Sep 5", time: "10:35 AM", classCount: 1 },
  { id: "l2", classId: "6-a", unitId: "u2", number: 1, title: "Oila aʼzolari va egalik olmoshlari", status: "Completed", date: "Sep 12", time: "10:35 AM", classCount: 1 },
  { id: "l3", classId: "6-a", unitId: "u3", number: 1, title: "Present Simple: kundalik ishlar", status: "Completed", date: "Apr 18", time: "1:00 PM", classCount: 2 },
  { id: "l4", classId: "6-a", unitId: "u3", number: 2, title: "Present Simple: savol va inkor shakllari", status: "Unscheduled", classCount: 1 },
  { id: "l5", classId: "6-a", unitId: "u4", number: 1, title: "Hobbilar haqida suhbat", status: "Draft" },
  { id: "l6", classId: "7-b", unitId: "u5", number: 1, title: "Salomlashish iboralari va tanishuv", status: "Completed", date: "Sep 5", time: "9:00 AM", classCount: 1 },
  { id: "l7", classId: "7-b", unitId: "u6", number: 1, title: "Oila aʼzolari va egalik olmoshlari", status: "Completed", date: "Sep 12", time: "9:00 AM", classCount: 1 },
  { id: "l8", classId: "7-b", unitId: "u7", number: 1, title: "Present Simple: kundalik ishlar", status: "Unscheduled", classCount: 2 },
  { id: "l9", classId: "7-b", unitId: "u7", number: 2, title: "Present Simple: savol va inkor shakllari", status: "Draft" },
  // 9-B Ingliz tili — standartlarga bogʻlangan (Faza 3: dars→qamrov avto demo).
  { id: "l10", classId: "9-b", unitId: "u9", number: 1, title: "Matnni oʻqib tushunish: asosiy gʻoya", status: "Completed", date: "Sep 8", time: "11:00 AM", classCount: 1, standards: ["R.01", "R.02"] },
  { id: "l11", classId: "9-b", unitId: "u10", number: 1, title: "Norasmiy xat yozish", status: "Completed", date: "Sep 15", time: "11:00 AM", classCount: 1, standards: ["W.01"] },
];

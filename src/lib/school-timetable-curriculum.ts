import { defaultBellConfig } from "@/lib/bell-schedule";
import { CLASS_COLORS } from "@/lib/class-colors";
import {
  subjectShort,
  WORK_DAYS,
  type SchoolClass,
  type SchoolStaff,
  type SchoolSubject,
  type SchoolTimetableDoc,
} from "@/lib/school-timetable";

/* ════════════════════════════════════════════════════════════════════
   MAKTAB SOZLAMASI → HUJJAT.

   ⛔ BU FAYLDA OʻQUV REJA SOATLARI YOʻQ — VA BOʻLMASLIGI KERAK.

   Ilgari bu yerda 16 fan × 7 daraja «shablon» soatlari turardi va
   izohda «rasmiy hujjat emas» deb yozilgan edi. Bu eng yomon variant
   boʻlib chiqdi: jadval koʻrinishidagi raqam ishonch uygʻotadi, izohni
   esa hech kim oʻqimaydi. Tekshirilganda raqamlar notoʻgʻri ham chiqdi
   (masalan 8–9-sinf haftasi 30 deb yozilgan, 2026/2027 qayta koʻrib
   chiqilgan rejada 35–36).

   Lekin asosiy sabab raqamlarning xatoligi emas. Hatto TOʻGʻRI rasmiy
   jadval ham maktabning haqiqiy rejasi emas:
     · tayanch reja har yili buyruq bilan oʻzgaradi;
     · unda «maktab ixtiyoridagi soatlar» bor;
     · ikkinchi til taʼlim tiliga bogʻliq;
     · har maktab har yili oʻzining «dars soatlari setkasini»
       shakllantiradi.

   Demak soatlarning YAGONA toʻgʻri manbai — maktabning oʻz tasdiqlangan
   setkasi. U zavuchning qoʻlida bor; sozlash uni KOʻCHIRIB olishga
   yordam beradi, oʻrniga oʻylab topmaydi.
   ════════════════════════════════════════════════════════════════════ */

/** Sinf darajalari — boshlangʻichdan yuqorigacha. */
export const GRADES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11] as const;
export type Grade = (typeof GRADES)[number];

/**
 * Fan NOMLARI — tez qoʻshish tugmalari uchun.
 *
 * ⚠️ Faqat nom: soat ham, «qaysi sinfda oʻtiladi» ham yoʻq. Bu
 * tasdiq emas, yozishni tejaydigan qisqa yoʻl — keraksizi bosilmaydi va
 * hujjatga tushmaydi. Roʻyxat eskirsa (fan nomi oʻzgarsa) zarari yoʻq:
 * foydalanuvchi oʻz nomini qoʻlda yozadi.
 */
export const SUBJECT_NAME_SUGGESTIONS: readonly string[] = [
  "Ona tili",
  "Adabiyot",
  "Matematika",
  "Ingliz tili",
  "Rus tili",
  "Tarix",
  "Geografiya",
  "Biologiya",
  "Fizika",
  "Kimyo",
  "Informatika",
  "Jismoniy tarbiya",
  "Tarbiya",
  "Texnologiya",
  "Musiqa",
  "Tasviriy sanʼat",
  "Tabiiy fanlar",
  "Iqtisodiyot",
];

/**
 * Parallel harflari — `5-A`, `5-B`, `5-D` …
 *
 * ⚠️ OʻZBEK alifbosi tartibi, rus alifbosidan translitteratsiya EMAS.
 * Oʻzbek lotin alifbosida «C» yoʻq, shuning uchun B dan keyin D keladi.
 */
export const SECTION_LETTERS = ["A", "B", "D", "E", "F", "G", "H", "I"] as const;
export const MAX_SECTIONS = SECTION_LETTERS.length;

export function sectionLetters(count: number): string[] {
  return SECTION_LETTERS.slice(0, Math.max(1, Math.min(MAX_SECTIONS, count)));
}

/* ─── Qoʻngʻiroq ─────────────────────────────────────────────────────── */

/** `bell-schedule.ts` dagi standart bilan bir xil. */
export const DEFAULT_LESSONS_PER_DAY = 6;
export const MIN_LESSONS_PER_DAY = 4;
export const MAX_LESSONS_PER_DAY = 10;

/**
 * Kuniga dars sonini xavfsiz oraliqqa keltiradi.
 *
 * ⚠️ `undefined` va `NaN` ham qabul qiladi: dev-serverdagi Fast Refresh
 * komponent holatini saqlab qoladi va `SchoolSetup` ga yangi maydon
 * qoʻshilganda eski obyektda u boʻlmaydi. Eksport qilingan funksiya
 * toʻliqsiz kirishdan qulamasligi kerak.
 */
export function clampLessonsPerDay(value: number | undefined): number {
  const n = Number(value);
  if (!Number.isFinite(n)) return DEFAULT_LESSONS_PER_DAY;
  return Math.max(MIN_LESSONS_PER_DAY, Math.min(MAX_LESSONS_PER_DAY, Math.round(n)));
}

/**
 * Bitta sinfning haftadagi katak soni. Bu TAXMIN EMAS — arifmetika:
 * sinf bir vaqtda faqat bitta darsda boʻladi.
 */
export function weeklyCapacity(lessonsPerDay: number | undefined): number {
  return clampLessonsPerDay(lessonsPerDay) * WORK_DAYS.length;
}

/* ─── Sozlama ────────────────────────────────────────────────────────── */

export type SetupSubject = { id: string; name: string };

export type SchoolSetup = {
  schoolName: string;
  periodLabel: string;
  /**
   * Daraja → nechta parallel. Kalit borligi «shu daraja maktabda bor».
   * Har daraja alohida: 5-sinfda A, B; 6-sinfda A, B, D boʻlishi odatiy.
   */
  sections: Partial<Record<Grade, number>>;
  /**
   * Daraja → smena. ⛔ Bashorat qilinmaydi — smena bino sigʻimiga
   * bogʻliq va foydalanuvchi OʻZI tanlaydi. Kalit yoʻq boʻlsa 1-smena.
   */
  shifts: Partial<Record<Grade, 1 | 2>>;
  lessonsPerDay: number;
  twoShift: boolean;
  /** Maktabda oʻtiladigan fanlar — foydalanuvchi qoʻshadi. */
  subjects: SetupSubject[];
  /**
   * Haftalik soat: `subjectId → daraja → soat`.
   *
   * ⚠️ DARAJA boʻyicha, sinf boʻyicha emas: bir darajadagi hamma
   * parallel bir xil soat oladi. Bu soddalashtirish ekranda OCHIQ
   * aytiladi. Ixtisoslashgan parallel (masalan chuqurlashtirilgan chet
   * tili) keyin sinf boʻyicha tuzatiladi.
   */
  hours: Record<string, Partial<Record<Grade, number>>>;
};

export function emptySetup(): SchoolSetup {
  return {
    schoolName: "",
    periodLabel: academicYearLabel(),
    sections: {},
    shifts: {},
    lessonsPerDay: DEFAULT_LESSONS_PER_DAY,
    twoShift: false,
    subjects: [],
    hours: {},
  };
}

/** «2026/2027» — joriy sanadan. Sentabrdan yangi oʻquv yili boshlanadi. */
export function academicYearLabel(now: Date = new Date()): string {
  const y = now.getFullYear();
  const start = now.getMonth() >= 8 ? y : y - 1;
  return `${start}/${start + 1}`;
}

export function setupGrades(setup: SchoolSetup): Grade[] {
  return GRADES.filter((g) => (setup.sections?.[g] ?? 0) > 0);
}

export function setupClassNames(setup: SchoolSetup): string[] {
  return setupGrades(setup).flatMap((grade) =>
    sectionLetters(setup.sections?.[grade] ?? 0).map((letter) => `${grade}-${letter}`)
  );
}

export function setupHours(setup: SchoolSetup, subjectId: string, grade: Grade): number {
  const h = Number(setup.hours?.[subjectId]?.[grade]);
  return Number.isFinite(h) && h > 0 ? h : 0;
}

export function setupWeeklyTotal(setup: SchoolSetup, grade: Grade): number {
  return (setup.subjects ?? []).reduce((sum, s) => sum + setupHours(setup, s.id, grade), 0);
}

/** Nomdan barqaror, takrorlanmaydigan id. */
export function newSubjectId(name: string, existing: readonly SetupSubject[]): string {
  const base =
    name
      .toLowerCase()
      .replace(/[ʻʼ'`]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "fan";
  let id = base;
  let n = 2;
  while (existing.some((s) => s.id === id)) id = `${base}-${n++}`;
  return id;
}

/**
 * Sozlamadan darssiz hujjat quradi.
 *
 * Fan kodi `subjectShort(nom)` dan, rangi `CLASS_COLORS` hovuzidan
 * navbat bilan — ikkalasi ham hosila, taxmin emas. Rejaga faqat soati
 * 0 dan katta fanlar tushadi.
 *
 * ⚠️ `assignments` boʻsh — kim oʻqitishini faqat maktab biladi
 * (`assignStaffBySubject`).
 */
export function buildSchoolDoc(setup: SchoolSetup): SchoolTimetableDoc {
  const bell = defaultBellConfig();
  bell.profile = setup.twoShift ? "double" : "single";
  const lessons = clampLessonsPerDay(setup.lessonsPerDay);
  bell.shift1 = { ...bell.shift1, lessonCount: lessons };
  bell.shift2 = { ...bell.shift2, lessonCount: lessons };

  const subjects: SchoolSubject[] = (setup.subjects ?? []).map((s, i) => ({
    id: s.id,
    name: s.name.trim(),
    short: subjectShort(s.name),
    color: CLASS_COLORS[i % CLASS_COLORS.length],
  }));

  const classes: SchoolClass[] = [];
  for (const grade of setupGrades(setup)) {
    const plan: Record<string, number> = {};
    for (const s of subjects) {
      const h = setupHours(setup, s.id, grade);
      if (h > 0) plan[s.id] = h;
    }
    for (const letter of sectionLetters(setup.sections?.[grade] ?? 0)) {
      classes.push({
        id: `cls-${grade}-${letter}`,
        name: `${grade}-${letter}`,
        shift: setup.twoShift ? (setup.shifts?.[grade] ?? 1) : 1,
        plan: { ...plan },
        assignments: {},
      });
    }
  }

  return {
    version: 1,
    schoolName: (setup.schoolName ?? "").trim(),
    periodLabel: (setup.periodLabel ?? "").trim(),
    bell,
    subjects,
    staff: [],
    classes,
    placements: [],
  };
}

/* ─── Oʻqituvchi biriktirish ─────────────────────────────────────────── */

/** Fan boʻyicha oʻqituvchi ismlari — `subjectId → ["Aliyev A.", …]`. */
export type StaffDraft = Record<string, string[]>;

/**
 * Fanga berilgan oʻqituvchilarni sinflar orasida NAVBAT BILAN taqsimlaydi.
 * Fanga oʻqituvchi berilmagan boʻlsa — biriktirilmay qoladi (jimgina
 * tasodifiy odamga berilmaydi).
 */
export function assignStaffBySubject(
  doc: SchoolTimetableDoc,
  draft: StaffDraft
): SchoolTimetableDoc {
  const staff: SchoolStaff[] = [];
  const pool = new Map<string, string[]>();

  for (const subject of doc.subjects) {
    const names = (draft[subject.id] ?? []).map((n) => n.trim()).filter(Boolean);
    if (names.length === 0) continue;
    const ids = names.map((name, i) => {
      const id = `stf-${subject.id}-${i}`;
      staff.push({ id, name, teacherId: null, homeroomOf: null });
      return id;
    });
    pool.set(subject.id, ids);
  }

  const classes = doc.classes.map((cls, ci) => {
    const assignments: Record<string, string> = {};
    for (const subjectId of Object.keys(cls.plan)) {
      const ids = pool.get(subjectId);
      if (ids && ids.length > 0) assignments[subjectId] = ids[ci % ids.length];
    }
    return { ...cls, assignments };
  });

  return { ...doc, staff, classes };
}

/**
 * Fanni qoplash uchun KAMIDA nechta oʻqituvchi kerak.
 *
 * ⛔ Ilgari «bitta oʻqituvchiga maqbul yuklama 20 soat» degan oʻylab
 * topilgan son ishlatilardi. Endi faqat arifmetika: bitta odam bir
 * vaqtda bitta sinfda boʻladi, demak haftasiga kuniga-dars × kun
 * katakdan (ikki smenada — ikki barobar) ortiq oʻqita olmaydi. Natija
 * «kerakli» emas, MATEMATIK MINIMUM — ekranda ham «kamida» deb yoziladi.
 */
export function minStaffCount(doc: SchoolTimetableDoc, subjectId: string): number {
  const total = doc.classes.reduce((sum, c) => sum + (c.plan[subjectId] ?? 0), 0);
  if (total === 0) return 0;
  const perTeacher =
    weeklyCapacity(doc.bell.shift1.lessonCount) * (doc.bell.profile === "double" ? 2 : 1);
  return Math.max(1, Math.ceil(total / perTeacher));
}

import { defaultBellConfig } from "@/lib/bell-schedule";
import type { ClassColor } from "@/lib/class-colors";
import type {
  Placement,
  SchoolClass,
  SchoolStaff,
  SchoolSubject,
  SchoolTimetableDoc,
} from "@/lib/school-timetable";

/* ════════════════════════════════════════════════════════════════════
   DEMO JADVAL — mehmon birinchi marta `/jadval` ga kirganda.

   Boʻsh toʻr «bu nima ekan?» degan savol qoldiradi; toʻla jadval esa
   birinchi soniyadayoq javob beradi. Zavuch «Tozalash» bosib oʻz
   maktabidan boshlaydi.

   ⚠️ Ismlar OʻYLAB TOPILGAN. Haqiqiy maktab varagʻidagi familiyalar
   koʻchirilmaydi.
   ════════════════════════════════════════════════════════════════════ */

type SubjectSeed = { id: string; name: string; short: string; color: ClassColor; staff: string[] };

const SUBJECTS: SubjectSeed[] = [
  { id: "mat", name: "Matematika", short: "Mat", color: "blue", staff: ["st-oripova", "st-nazarov", "st-umarova"] },
  { id: "ona", name: "Ona tili", short: "Ona", color: "violet", staff: ["st-tursunova", "st-mirzayeva"] },
  { id: "adb", name: "Adabiyot", short: "Adb", color: "fuchsia", staff: ["st-tursunova"] },
  { id: "ing", name: "Ingliz tili", short: "Ing", color: "teal", staff: ["st-ergasheva", "st-yoldosheva"] },
  { id: "fiz", name: "Fizika", short: "Fiz", color: "emerald", staff: ["st-qodirov"] },
  { id: "kim", name: "Kimyo", short: "Kim", color: "amber", staff: ["st-karimova"] },
  { id: "bio", name: "Biologiya", short: "Bio", color: "lime", staff: ["st-rahimov"] },
  { id: "tar", name: "Tarix", short: "Tar", color: "orange", staff: ["st-aliyev", "st-xoliqov"] },
  { id: "geo", name: "Geografiya", short: "Geo", color: "cyan", staff: ["st-tursunov"] },
  { id: "inf", name: "Informatika", short: "Inf", color: "indigo", staff: ["st-nazarov"] },
  { id: "jis", name: "Jismoniy tarbiya", short: "Jis", color: "yellow", staff: ["st-sattorov"] },
  { id: "trb", name: "Tarbiya", short: "Trb", color: "rose", staff: ["st-aliyev"] },
];

const STAFF_NAMES: Record<string, string> = {
  "st-oripova": "Oripova Nodira",
  "st-nazarov": "Nazarov Otabek",
  "st-umarova": "Umarova Lola",
  "st-tursunova": "Tursunova Malika",
  "st-mirzayeva": "Mirzayeva Sevara",
  "st-ergasheva": "Ergasheva Gulnora",
  "st-yoldosheva": "Yoʻldosheva Dilnoza",
  "st-qodirov": "Qodirov Behzod",
  "st-karimova": "Karimova Zilola",
  "st-rahimov": "Rahimov Jamshid",
  "st-aliyev": "Aliyev Sardor",
  "st-xoliqov": "Xoliqov Anvar",
  "st-tursunov": "Tursunov Ravshan",
  "st-sattorov": "Sattorov Farrux",
};

const CLASS_NAMES = [
  "5-A", "5-B", "5-V", "6-A", "6-B", "6-V", "7-A",
  "7-B", "7-V", "8-A", "8-B", "9-A", "9-B", "11-A",
];

/** Haftalik reja — soddalashtirilgan, lekin jami ~30 soatga yaqin. */
const PLAN: Record<string, number> = {
  mat: 5, ona: 4, adb: 2, ing: 3, fiz: 2, kim: 2,
  bio: 2, tar: 2, geo: 2, inf: 1, jis: 2, trb: 1,
};

/* Kun ritmi: qiyin fanlar ertalab. Har sinf shu naqshdan siljitib
   olinadi — jadval «avtomatik tuzilgandek» koʻrinadi, lekin oʻqilishi
   uchun ataylab sodda. */
const PATTERN: string[][] = [
  ["mat", "ona", "ing", "bio", "jis", ""],
  ["ona", "mat", "tar", "ing", "adb", ""],
  ["mat", "fiz", "ona", "geo", "ing", "jis"],
  ["ing", "mat", "adb", "ona", "bio", ""],
  ["fiz", "mat", "ing", "kim", "tar", "inf"],
  ["mat", "ing", "ona", "fiz", "geo", ""],
];

function staffFor(subjectId: string, classIndex: number, day: number): string {
  const seed = SUBJECTS.find((s) => s.id === subjectId);
  if (!seed) return "st-oripova";
  return seed.staff[(classIndex + day) % seed.staff.length];
}

export function demoDoc(): SchoolTimetableDoc {
  const subjects: SchoolSubject[] = SUBJECTS.map(({ id, name, short, color }) => ({
    id,
    name,
    short,
    color,
  }));

  const classes: SchoolClass[] = CLASS_NAMES.map((name, i) => ({
    id: `cls-${i}`,
    name,
    shift: 1,
    plan: { ...PLAN },
  }));

  const staff: SchoolStaff[] = Object.entries(STAFF_NAMES).map(([id, name], i) => ({
    id,
    name,
    teacherId: null,
    homeroomOf: i < classes.length ? classes[i].id : null,
  }));

  const placements: Placement[] = [];
  let n = 0;

  for (let ci = 0; ci < classes.length; ci++) {
    for (let day = 1; day <= 6; day++) {
      const row = PATTERN[(ci + day) % PATTERN.length];
      for (let p = 1; p <= 6; p++) {
        const subjectId = row[(p - 1 + day) % row.length];
        if (!subjectId) continue;
        /* Shanba qisqartirilgan — 4 soatdan keyin dars yoʻq. */
        if (day === 6 && p > 4) continue;
        placements.push({
          id: `pl-${n++}`,
          classId: classes[ci].id,
          day,
          period: p,
          shift: 1,
          subjectId,
          staffId: staffFor(subjectId, ci, day),
        });
      }
    }
  }

  /* Guruhga boʻlingan dars — chet tili ikki guruh, bitta katakda. */
  const splitIdx = placements.findIndex(
    (p) => p.classId === "cls-6" && p.day === 1 && p.period === 3
  );
  if (splitIdx >= 0) {
    const base = placements[splitIdx];
    placements[splitIdx] = { ...base, subjectId: "ing", staffId: "st-ergasheva", group: 0 };
    placements.push({
      ...base,
      id: `pl-${n++}`,
      subjectId: "ing",
      staffId: "st-yoldosheva",
      group: 1,
    });
  }

  return {
    version: 1,
    schoolName: "30-umumiy oʻrta taʼlim maktabi",
    periodLabel: "2026/2027 · 1-yarim yillik",
    bell: defaultBellConfig(),
    subjects,
    staff,
    classes,
    placements,
  };
}

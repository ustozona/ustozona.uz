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
   birinchi soniyadayoq javob beradi. Zavuch keyin oʻz maktabidan
   boshlaydi.

   ⚠️ Darslar OʻQUV REJASIDAN hosil qilinadi, qotirilgan naqshdan emas.
   Sabab: naqsh bilan reja bir-biriga mos kelmasa qoldiq daftari
   yolgʻon gapiradi — baʼzi fan ortiqcha, baʼzisi umuman qoʻyilmagan
   boʻlib qoladi va hisoblagich hech qachon nolga tushmaydi.
   Bu yerda esa har fan aynan rejadagi soatcha qoʻyiladi.

   ⚠️ Ismlar OʻYLAB TOPILGAN. Haqiqiy maktab varagʻidagi familiyalar
   koʻchirilmaydi.
   ════════════════════════════════════════════════════════════════════ */

type SubjectSeed = {
  id: string;
  name: string;
  short: string;
  color: ClassColor;
  /** Shu fanni oʻqitadigan xodimlar — sinflar orasida navbat bilan taqsimlanadi. */
  staff: string[];
};

const SUBJECTS: SubjectSeed[] = [
  { id: "mat", name: "Matematika", short: "Mat", color: "blue", staff: ["mat-1", "mat-2", "mat-3", "mat-4"] },
  { id: "ona", name: "Ona tili", short: "Ona", color: "violet", staff: ["ona-1", "ona-2", "ona-3"] },
  { id: "fiz", name: "Fizika", short: "Fiz", color: "emerald", staff: ["fiz-1", "fiz-2"] },
  { id: "kim", name: "Kimyo", short: "Kim", color: "amber", staff: ["kim-1", "kim-2"] },
  { id: "ing", name: "Ingliz tili", short: "Ing", color: "teal", staff: ["ing-1", "ing-2"] },
  { id: "adb", name: "Adabiyot", short: "Adb", color: "fuchsia", staff: ["adb-1", "adb-2"] },
  { id: "bio", name: "Biologiya", short: "Bio", color: "lime", staff: ["bio-1", "bio-2"] },
  { id: "tar", name: "Tarix", short: "Tar", color: "orange", staff: ["tar-1", "tar-2"] },
  { id: "geo", name: "Geografiya", short: "Geo", color: "cyan", staff: ["geo-1", "geo-2"] },
  { id: "inf", name: "Informatika", short: "Inf", color: "indigo", staff: ["inf-1"] },
  { id: "trb", name: "Tarbiya", short: "Trb", color: "rose", staff: ["trb-1"] },
  { id: "jis", name: "Jismoniy tarbiya", short: "Jis", color: "yellow", staff: ["jis-1", "jis-2"] },
];

/* ⚠️ Har xodim BITTA fan oʻqitadi va yuklamasi haftalik katak sonidan
   (34) past. Ilgari bitta oʻqituvchi ikki fanga biriktirilgan edi va
   yuklamasi 56 soatga chiqib ketardi — bunday jadval matematik jihatdan
   tuzilmaydi, natijada demo 32 soat qoldiq bilan ochilardi. Fan boʻyicha
   oʻqituvchi soni: kerakli soat / ~20. */
const STAFF_NAMES: Record<string, string> = {
  "mat-1": "Oripova Nodira",
  "mat-2": "Nazarov Otabek",
  "mat-3": "Umarova Lola",
  "mat-4": "Xudoyberdiyev Aziz",
  "ona-1": "Tursunova Malika",
  "ona-2": "Mirzayeva Sevara",
  "ona-3": "Qosimova Nigora",
  "fiz-1": "Qodirov Behzod",
  "fiz-2": "Ismoilov Ulugʻbek",
  "kim-1": "Karimova Zilola",
  "kim-2": "Yusupova Shahnoza",
  "ing-1": "Ergasheva Gulnora",
  "ing-2": "Yoʻldosheva Dilnoza",
  "adb-1": "Rustamova Feruza",
  "adb-2": "Sharipov Doniyor",
  "bio-1": "Rahimov Jamshid",
  "bio-2": "Toshpoʻlatova Nilufar",
  "tar-1": "Aliyev Sardor",
  "tar-2": "Xoliqov Anvar",
  "geo-1": "Tursunov Ravshan",
  "geo-2": "Boboyeva Zebo",
  "inf-1": "Sodiqov Jasur",
  "trb-1": "Normatova Dilbar",
  "jis-1": "Sattorov Farrux",
  "jis-2": "Egamberdiyev Otabek",
};

const CLASS_NAMES = [
  "5-A", "5-B", "5-V", "6-A", "6-B", "6-V", "7-A",
  "7-B", "7-V", "8-A", "8-B", "9-A", "9-B", "11-A",
];

/** Haftalik oʻquv rejasi — jami 28 soat. */
const PLAN: Record<string, number> = {
  mat: 5, ona: 4, ing: 3, adb: 2, fiz: 2, kim: 2,
  bio: 2, tar: 2, geo: 2, jis: 2, inf: 1, trb: 1,
};

const DAYS = [1, 2, 3, 4, 5, 6];
/** Shanba qisqartirilgan. */
function periodsOnDay(day: number): number {
  return day === 6 ? 4 : 6;
}

/**
 * Qoldiq relsi boʻsh koʻrinmasligi uchun ataylab qoldirilgan soatlar:
 * `classIndex → [subjectId, qancha qoldirilsin]`. Zavuch darhol
 * ishlaydigan narsa koʻradi.
 */
const LEFT_UNPLACED: Record<number, [string, number][]> = {
  6: [["fiz", 2], ["kim", 1]],
  4: [["geo", 2]],
  9: [["inf", 1]],
};

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
    /* Har sinfda har fan uchun xodim — rejadagi HAR fan uchun, dars
       qoʻyilgan-qoʻyilmaganidan qatʼi nazar. */
    assignments: Object.fromEntries(
      SUBJECTS.map((s) => [s.id, s.staff[i % s.staff.length]])
    ),
  }));

  const staff: SchoolStaff[] = Object.entries(STAFF_NAMES).map(([id, name], i) => ({
    id,
    name,
    teacherId: null,
    homeroomOf: i < classes.length ? classes[i].id : null,
  }));

  const placements: Placement[] = [];
  let n = 0;

  /* Xodim bandligi — `staffId|day|period`. Demo ATAYLAB ziddiyatsiz
     quriladi va oxirida aniq ikkitasi kiritiladi (pastga qarang):
     oʻnlab ziddiyat mahsulotni buzuq koʻrsatadi, nolinchisi esa asosiy
     funksiyani koʻrsatmaydi. */
  const busy = new Set<string>();
  const busyKey = (staffId: string, day: number, period: number) =>
    `${staffId}|${day}|${period}`;

  const allSlots: { day: number; period: number }[] = [];
  for (const day of DAYS) {
    for (let p = 1; p <= periodsOnDay(day); p++) allSlots.push({ day, period: p });
  }

  classes.forEach((cls, ci) => {
    /* 1) Rejadan «qoʻyiladigan soatlar xaltasi» — ogʻirligi boʻyicha
          tartiblangan, ertalabgi fanlar oldin. */
    const skip = new Map(LEFT_UNPLACED[ci] ?? []);
    const bag: string[] = [];
    for (const s of SUBJECTS) {
      const hours = (cls.plan[s.id] ?? 0) - (skip.get(s.id) ?? 0);
      for (let h = 0; h < hours; h++) bag.push(s.id);
    }

    /* 2) Boshlanish nuqtasi sinfga qarab siljiydi — aks holda hamma
          sinf bir xil jadval oladi va bitta oʻqituvchi bir vaqtda oʻnta
          sinfda paydo boʻladi. */
    const offset = (ci * 5) % allSlots.length;
    const ordered = [...allSlots.slice(offset), ...allSlots.slice(0, offset)];
    const taken = new Set<string>();

    for (const subjectId of bag) {
      const staffId = cls.assignments[subjectId];
      const slot = ordered.find(
        (x) =>
          !taken.has(`${x.day}|${x.period}`) && !busy.has(busyKey(staffId, x.day, x.period))
      );
      /* Boʻsh katak topilmasa soat qoʻyilmaydi — qoldiq daftarida
         koʻrinadi. Jimgina ustma-ust yozishdan koʻra shu toʻgʻri. */
      if (!slot) continue;

      taken.add(`${slot.day}|${slot.period}`);
      busy.add(busyKey(staffId, slot.day, slot.period));
      placements.push({
        id: `pl-${n++}`,
        classId: cls.id,
        day: slot.day,
        period: slot.period,
        shift: 1,
        subjectId,
        staffId,
      });
    }
  });

  /* 3) Ikkita ataylab kiritilgan ziddiyat — asosiy funksiya birinchi
        ekranda koʻrinishi uchun. Har biri: bitta xodimni boshqa sinfdagi
        band vaqtiga koʻchiramiz. */
  injectConflict(placements, "cls-1");
  injectConflict(placements, "cls-3");

  /* Guruhga boʻlingan dars — chet tili ikki guruh, bitta katakda.
     Mavjud ingliz tili darsini ikkiga boʻlamiz: reja soati oʻzgarmaydi
     (qoldiq faqat `group === 0` ni sanaydi). */
  const ingSeed = SUBJECTS.find((x) => x.id === "ing");
  for (const target of placements.filter((p) => p.classId === "cls-6" && p.subjectId === "ing")) {
    /* Ikkinchi guruh oʻqituvchisi oʻsha vaqtda BOʻSH boʻlishi shart —
       aks holda guruhga boʻlish oʻzi kutilmagan ziddiyat yaratadi.
       Shuning uchun mos dars TOPILGUNCHA aylanamiz, bittasiga
       qotirilmaymiz. */
    const otherIng = ingSeed?.staff.find(
      (id) =>
        id !== target.staffId &&
        !placements.some(
          (p) => p.staffId === id && p.day === target.day && p.period === target.period
        )
    );
    if (!otherIng) continue;
    target.group = 0;
    placements.push({ ...target, id: `pl-${n++}`, staffId: otherIng, group: 1 });
    break;
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

/**
 * `donorId` sinfdagi bitta darsni boshqa sinfdagi xuddi shu xodimning
 * darsi vaqtiga koʻchiradi — oʻqituvchi ikki joyda boʻlib qoladi. Demo
 * uchun: asosiy funksiya birinchi ekranda koʻrinsin.
 *
 * ⚠️ Faqat donor sinfda oʻsha vaqt BOʻSH boʻlsa koʻchiriladi. Ilgari
 * band boʻlsa oʻrin almashtirilardi va almashtirilgan dars boshqa joyda
 * yangi, kutilmagan ziddiyat hosil qilardi.
 *
 * «Qurbon» sinf qatʼiy berilmaydi — mos keladigani topilmasa
 * ziddiyat umuman kiritilmay qolardi.
 */
function injectConflict(placements: Placement[], donorId: string): void {
  const mine = placements.filter((p) => p.classId === donorId);
  const occupied = new Set(mine.map((p) => `${p.day}|${p.period}`));

  for (const donor of mine) {
    const victim = placements.find(
      (p) =>
        p.classId !== donorId &&
        p.staffId === donor.staffId &&
        !occupied.has(`${p.day}|${p.period}`)
    );
    if (!victim) continue;
    occupied.delete(`${donor.day}|${donor.period}`);
    donor.day = victim.day;
    donor.period = victim.period;
    return;
  }
}

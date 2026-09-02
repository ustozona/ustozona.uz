import type { BellConfig } from "@/lib/bell-schedule";
import { computePeriods, defaultBellConfig, type PeriodRow } from "@/lib/bell-schedule";
import type { ClassColor } from "@/lib/class-colors";

/* ════════════════════════════════════════════════════════════════════
   MAKTAB DARS JADVALI — model va sof mantiq.

   Bu OʻQITUVCHI jadvali EMAS (`src/lib/timetable.ts`). Ikkisi boshqa
   domen:

   | | Oʻqituvchi jadvali | Maktab jadvali |
   |---|---|---|
   | Egasi | oʻqituvchi | ish maydoni (maktab) |
   | Katak | `(kun, vaqt) → sinf` | `(sinf, kun, soat) → fan + oʻqituvchi` |
   | Ziddiyat | yoʻq | oʻqituvchi ikki joyda — ASOSIY tekshiruv |

   Fayl neytral: `"use server"` ham, `server-only` ham YOʻQ — klient
   store, server DAL va chop etish varagʻi shu yerdan oʻqiydi.
   (AGENTS.md: `"use server"` faylda tip eksporti prodni buzadi.)

   Hujjat butunligicha JSONB'da yashaydi — `planning.ts` dagi qoida bilan
   bir xil sabab: UI uni butunligicha oʻqib-yozadi, oʻquvchi/vaqt boʻyicha
   SQL agregatsiya yoʻq.
   ════════════════════════════════════════════════════════════════════ */

/** Ish kunlari — ISO: 1=Dushanba … 6=Shanba. */
export const WORK_DAYS = [1, 2, 3, 4, 5, 6] as const;

export const DAY_NAMES: Record<number, string> = {
  1: "Dushanba",
  2: "Seshanba",
  3: "Chorshanba",
  4: "Payshanba",
  5: "Juma",
  6: "Shanba",
};

/** Fan — maktab boʻyicha bir marta taʼriflanadi. */
export type SchoolSubject = {
  id: string;
  name: string;
  /** Zich toʻrdagi 3 harfli kod ("Mat", "Ing"). Boʻsh boʻlsa nomdan hosil qilinadi. */
  short: string;
  color: ClassColor;
};

/** Xodim — varaqdagi «familiya». `teacherId` nashr paytida bogʻlanadi (§6). */
export type SchoolStaff = {
  id: string;
  name: string;
  /** Ustozona hisobi bilan bogʻlangan boʻlsa — `teachers.id`. */
  teacherId?: string | null;
  /** Sinf rahbari boʻlgan sinf id'si (varaq pastidagi qator). */
  homeroomOf?: string | null;
};

/** Sinf ustuni + oʻquv rejasi soatlari (`subjectId → haftalik soat`). */
export type SchoolClass = {
  id: string;
  name: string;
  /** Qaysi smenada oʻqiydi. */
  shift: 1 | 2;
  plan: Record<string, number>;
};

/** Bitta katakdagi dars. Guruhga boʻlingan darsda `group` 0 va 1 boʻladi. */
export type Placement = {
  id: string;
  classId: string;
  /** ISO kun (1..6). */
  day: number;
  /** Period smena ichidagi tartibi — `PeriodRow.index`. */
  period: number;
  shift: 1 | 2;
  subjectId: string;
  staffId: string;
  /** Guruh raqami (0-asosli). `undefined` — butun sinf. */
  group?: number;
  /** Qulflangan katakni avtomatik tuzuvchi ham, ommaviy siljitish ham qoʻzgʻatmaydi. */
  locked?: boolean;
};

export type SchoolTimetableDoc = {
  version: 1;
  /** Maktab nomi — varaq sarlavhasida chiqadi. */
  schoolName: string;
  /** "2026/2027 · 1-yarim yillik" kabi erkin matn. */
  periodLabel: string;
  bell: BellConfig;
  subjects: SchoolSubject[];
  staff: SchoolStaff[];
  classes: SchoolClass[];
  placements: Placement[];
};

/* ─────────────────────────────────────────────────────────────────────
   ⚠️ Period ADRESI — `{shift, index}`, `startMin` EMAS.

   Oʻqituvchi jadvalida hodisa absolyut vaqt saqlaydi va qoʻngʻiroq
   jadvali oʻzgarganda darslar kataklardan «tushib ketadi»
   (`bell-schedule.ts` dagi koʻchirish funksiyasi shuning uchun bor).
   Maktab jadvalida bu xato takrorlanmaydi: katak tartib raqami bilan
   adreslanadi, vaqt esa faqat koʻrsatish uchun hisoblanadi.
   ───────────────────────────────────────────────────────────────────── */

export function periodsOf(doc: SchoolTimetableDoc): PeriodRow[] {
  return computePeriods(doc.bell);
}

export function periodsForShift(doc: SchoolTimetableDoc, shift: 1 | 2): PeriodRow[] {
  return periodsOf(doc).filter((p) => p.shift === shift);
}

/* ─────────────────────────────────────────────────────────────────────
   Indekslash — barcha tekshiruvlar shu yerdan oʻtadi.
   ───────────────────────────────────────────────────────────────────── */

export function slotKey(classId: string, day: number, shift: 1 | 2, period: number): string {
  return `${classId}|${day}|${shift}|${period}`;
}

function timeKey(day: number, shift: 1 | 2, period: number): string {
  return `${day}|${shift}|${period}`;
}

export type TimetableIndex = {
  /** Katakdagi darslar (guruhga boʻlinganda bittadan ortiq). */
  bySlot: Map<string, Placement[]>;
  /** Vaqt boʻyicha xodim bandligi: `timeKey → staffId → darslar`. */
  staffAt: Map<string, Map<string, Placement[]>>;
};

export function indexDoc(doc: SchoolTimetableDoc): TimetableIndex {
  const bySlot = new Map<string, Placement[]>();
  const staffAt = new Map<string, Map<string, Placement[]>>();

  for (const p of doc.placements) {
    const sk = slotKey(p.classId, p.day, p.shift, p.period);
    const slot = bySlot.get(sk);
    if (slot) slot.push(p);
    else bySlot.set(sk, [p]);

    const tk = timeKey(p.day, p.shift, p.period);
    let byStaff = staffAt.get(tk);
    if (!byStaff) {
      byStaff = new Map();
      staffAt.set(tk, byStaff);
    }
    const list = byStaff.get(p.staffId);
    if (list) list.push(p);
    else byStaff.set(p.staffId, [p]);
  }

  return { bySlot, staffAt };
}

export function placementsAt(
  index: TimetableIndex,
  classId: string,
  day: number,
  shift: 1 | 2,
  period: number
): Placement[] {
  return index.bySlot.get(slotKey(classId, day, shift, period)) ?? [];
}

/* ─────────────────────────────────────────────────────────────────────
   ZIDDIYAT — bitta xodim bir vaqtda ikki sinfda.

   ⚠️ Guruhga boʻlingan dars ziddiyat EMAS: bitta oʻqituvchi bitta
   sinfning bitta guruhini oʻqitadi, ikkinchi guruhda boshqasi turadi.
   Shuning uchun tekshiruv SINF boʻyicha guruhlanadi — bir xil sinfdagi
   ikki yozuv hisobga olinmaydi.
   ───────────────────────────────────────────────────────────────────── */

export type Conflict = {
  staffId: string;
  day: number;
  shift: 1 | 2;
  period: number;
  classIds: string[];
};

export function findConflicts(doc: SchoolTimetableDoc, index?: TimetableIndex): Conflict[] {
  const idx = index ?? indexDoc(doc);
  const out: Conflict[] = [];

  for (const [tk, byStaff] of idx.staffAt) {
    const [dayRaw, shiftRaw, periodRaw] = tk.split("|");
    for (const [staffId, list] of byStaff) {
      const classIds = Array.from(new Set(list.map((p) => p.classId)));
      if (classIds.length < 2) continue;
      out.push({
        staffId,
        day: Number(dayRaw),
        shift: Number(shiftRaw) as 1 | 2,
        period: Number(periodRaw),
        classIds,
      });
    }
  }

  out.sort((a, b) => a.day - b.day || a.shift - b.shift || a.period - b.period);
  return out;
}

/** Ziddiyatda qatnashgan katak kalitlari — toʻrni boʻyash uchun. */
export function conflictSlotKeys(conflicts: Conflict[]): Set<string> {
  const keys = new Set<string>();
  for (const c of conflicts) {
    for (const classId of c.classIds) {
      keys.add(slotKey(classId, c.day, c.shift, c.period));
    }
  }
  return keys;
}

/* ─────────────────────────────────────────────────────────────────────
   QOʻYISH HOLATI — karta olinganda toʻrt rang (§12.5).
   ───────────────────────────────────────────────────────────────────── */

export type DropState = "ok" | "caution" | "clash" | "blocked" | "occupied";

export type DropReason = {
  state: DropState;
  /** Katak ostida chiqadigan qisqa sabab. Boʻsh boʻlsa yozilmaydi. */
  label: string;
};

export type DropQuery = {
  classId: string;
  subjectId: string;
  staffId: string;
  day: number;
  shift: 1 | 2;
  period: number;
};

/**
 * Katak shu darsni qabul qila oladimi.
 *
 * Tartib muhim — birinchi mos kelgan holat gʻolib:
 * 1. sinf boshqa smenada oʻqiydi        → blocked
 * 2. katak band                          → occupied
 * 3. oʻqituvchi shu vaqtda boshqa sinfda → clash
 * 4. shu kuni shu fan allaqachon bor     → caution
 * 5. kunning oxirgi soati                → caution
 * 6. qolgani                             → ok
 */
export function dropStateFor(
  doc: SchoolTimetableDoc,
  index: TimetableIndex,
  q: DropQuery
): DropReason {
  const cls = doc.classes.find((c) => c.id === q.classId);
  if (!cls || cls.shift !== q.shift) return { state: "blocked", label: "" };

  const here = placementsAt(index, q.classId, q.day, q.shift, q.period);
  if (here.length > 0) return { state: "occupied", label: "" };

  const busy = index.staffAt.get(timeKey(q.day, q.shift, q.period))?.get(q.staffId);
  if (busy && busy.length > 0) return { state: "clash", label: "band" };

  const sameSubjectToday = doc.placements.some(
    (p) => p.classId === q.classId && p.day === q.day && p.subjectId === q.subjectId
  );
  if (sameSubjectToday) return { state: "caution", label: "takror" };

  const shiftPeriods = periodsForShift(doc, q.shift);
  const last = shiftPeriods.length ? shiftPeriods[shiftPeriods.length - 1].index : 0;
  if (q.period === last) return { state: "caution", label: `${last}-soat` };

  return { state: "ok", label: "boʻsh" };
}

/* ─────────────────────────────────────────────────────────────────────
   QOLDIQ DAFTARI — oʻquv rejasidan qoʻyilmagan soatlar (§12.7).

   Chap rels ham hisobot, ham karta manbai: «7-A da fizikadan 2 soat
   qoldi» — bitta obyekt.
   ───────────────────────────────────────────────────────────────────── */

export type LedgerRow = {
  classId: string;
  className: string;
  subjectId: string;
  /** Rejadagi soat. */
  planned: number;
  /** Varaqqa qoʻyilgani. */
  placed: number;
  /** Qolgani — manfiy boʻlsa rejadan ortiq qoʻyilgan. */
  left: number;
  /** Shu sinf-fanga biriktirilgan xodim (varaqdan aniqlanadi, boʻlmasa null). */
  staffId: string | null;
};

export function buildLedger(doc: SchoolTimetableDoc): LedgerRow[] {
  const placedBy = new Map<string, number>();
  const staffBy = new Map<string, string>();

  for (const p of doc.placements) {
    const k = `${p.classId}|${p.subjectId}`;
    /* Guruhga boʻlingan dars — bitta soat, ikkita yozuv. Reja soati
       guruhlarni sanamaydi, shuning uchun guruhli yozuvlardan faqat
       birinchisi (group 0 yoki undefined) hisoblanadi. */
    if (p.group == null || p.group === 0) {
      placedBy.set(k, (placedBy.get(k) ?? 0) + 1);
    }
    if (!staffBy.has(k)) staffBy.set(k, p.staffId);
  }

  const rows: LedgerRow[] = [];
  for (const cls of doc.classes) {
    for (const [subjectId, planned] of Object.entries(cls.plan)) {
      const k = `${cls.id}|${subjectId}`;
      const placed = placedBy.get(k) ?? 0;
      rows.push({
        classId: cls.id,
        className: cls.name,
        subjectId,
        planned,
        placed,
        left: planned - placed,
        staffId: staffBy.get(k) ?? null,
      });
    }
  }
  return rows;
}

/** Sinf ustuni pastidagi «Jami soat» — qoʻyilgani / rejadagi. */
export type HoursTotal = { classId: string; placed: number; planned: number };

export function hoursTotals(doc: SchoolTimetableDoc): HoursTotal[] {
  const ledger = buildLedger(doc);
  return doc.classes.map((cls) => {
    const rows = ledger.filter((r) => r.classId === cls.id);
    return {
      classId: cls.id,
      placed: rows.reduce((a, r) => a + r.placed, 0),
      planned: rows.reduce((a, r) => a + r.planned, 0),
    };
  });
}

/* ─────────────────────────────────────────────────────────────────────
   Yordamchilar
   ───────────────────────────────────────────────────────────────────── */

export function subjectShort(name: string): string {
  const clean = name.trim();
  if (!clean) return "—";
  return clean.slice(0, 3);
}

export function findSubject(doc: SchoolTimetableDoc, id: string): SchoolSubject | undefined {
  return doc.subjects.find((s) => s.id === id);
}

export function findStaff(doc: SchoolTimetableDoc, id: string): SchoolStaff | undefined {
  return doc.staff.find((s) => s.id === id);
}

export function findClass(doc: SchoolTimetableDoc, id: string): SchoolClass | undefined {
  return doc.classes.find((c) => c.id === id);
}

/** Xodim familiyasi + ism bosh harfi ("Oripova N.") — katakda shu koʻrinadi. */
export function staffShort(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length < 2) return name;
  return `${parts[0]} ${parts[1][0]}.`;
}

export function emptyDoc(schoolName = ""): SchoolTimetableDoc {
  return {
    version: 1,
    schoolName,
    periodLabel: "",
    bell: defaultBellConfig(),
    subjects: [],
    staff: [],
    classes: [],
    placements: [],
  };
}

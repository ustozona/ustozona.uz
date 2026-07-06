import { buildSlots, DOUBLE_SHIFT_DEFAULTS, type ShiftConfig, type SchoolProfile, type TimetableEvent } from "@/lib/timetable";

/* ════════════════════════════════════════════════════════════════════
   QOʻNGʻIROQ JADVALI (bell schedule) — sozlamalar va period hisoblari

   Maktab smenasi (1 yoki 2) va har smenaning dars/tanaffus parametrlari
   shu yerda. Period qatorlari ("1-soat", "2-soat" …) shu sozlamadan
   HOSIL qilinadi. "Dars soatlari" katak gridi shu qatorlardan foydalanadi.
   ════════════════════════════════════════════════════════════════════ */

export type BellConfig = {
  profile: SchoolProfile;   // "single" (1 smena) | "double" (2 smena)
  shift1: ShiftConfig;
  shift2: ShiftConfig;
};

/** Standart: 1 smena, Oʻzbekiston odatiy (08:00, 45 daq, 5 daq tanaffus, 3-darsdan keyin katta tanaffus) */
export function defaultBellConfig(): BellConfig {
  return {
    profile: "single",
    shift1: { ...DOUBLE_SHIFT_DEFAULTS.shift1 },
    shift2: { ...DOUBLE_SHIFT_DEFAULTS.shift2 },
  };
}

/** Bitta period qatori (jadvaldagi "N-soat") */
export type PeriodRow = {
  shift: Shift1or2;
  index: number;    // smena ichidagi 1-based tartib
  label: string;    // "1-soat"
  startMin: number;
  endMin: number;
};
type Shift1or2 = 1 | 2;

/** Sozlamadan period qatorlarini hosil qilish (1-smena, kerak boʻlsa 2-smena) */
export function computePeriods(c: BellConfig): PeriodRow[] {
  const rows: PeriodRow[] = [];
  buildSlots(c.shift1).forEach((s) =>
    rows.push({ shift: 1, index: s.index, label: `${s.index}-soat`, startMin: s.startMin, endMin: s.endMin })
  );
  if (c.profile === "double") {
    buildSlots(c.shift2).forEach((s) =>
      rows.push({ shift: 2, index: s.index, label: `${s.index}-soat`, startMin: s.startMin, endMin: s.endMin })
    );
  }
  return rows;
}

/** Hodisa biror period qatoriga toʻgʻri keladimi (boshlanish vaqti boʻyicha) */
export function isPeriodTime(periods: PeriodRow[], startMin: number): boolean {
  return periods.some((p) => p.startMin === startMin);
}

/** Qoʻngʻiroq jadvali oʻzgarganda darslarni yangi period vaqtlariga koʻchirish.

    Eventlar absolyut vaqt saqlaydi, grid esa periodni startMin mosligi
    bilan topadi — konfig oʻzgarsa darslar kataklardan "tushib ketadi".
    Shu funksiya eski periodga aynan mos eventlarni (shift, index) kaliti
    boʻyicha yangi period vaqtiga koʻchiradi; mos kelmaganlar (erkin-vaqtli
    toʻgaraklar) tegilmaydi. `moved` — vaqti haqiqatan oʻzgarganlar soni. */
export function remapEventsForBellChange(
  events: TimetableEvent[],
  oldCfg: BellConfig,
  newCfg: BellConfig
): { events: TimetableEvent[]; moved: number } {
  const oldPeriods = computePeriods(oldCfg);
  const newByKey = new Map(computePeriods(newCfg).map((p) => [`${p.shift}:${p.index}`, p]));
  let moved = 0;
  const next = events.map((ev) => {
    const op = oldPeriods.find((p) => p.startMin === ev.startMin);
    if (!op) return ev;
    const np = newByKey.get(`${op.shift}:${op.index}`);
    if (!np || (np.startMin === op.startMin && np.endMin === op.endMin)) return ev;
    moved++;
    // Katakni toʻliq egallagan dars yangi katakni ham toʻliq egallaydi;
    // erkin rejimda choʻzilgani davomiyligini saqlab faqat siljiydi.
    const dur = ev.endMin === op.endMin ? np.endMin - np.startMin : ev.endMin - ev.startMin;
    return { ...ev, startMin: np.startMin, endMin: np.startMin + dur };
  });
  return { events: next, moved };
}

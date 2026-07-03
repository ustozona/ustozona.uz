import { format, parseISO } from "date-fns";
import { uz } from "date-fns/locale";

/**
 * Takrorlanish modeli — TickTick uslubidagi tahrirlagich uchun yagona manba.
 *
 * Kodlash (rule string):
 *   every:<basis>:<interval>:<unit>[:days=0,5]
 * Masalan:  every:due:1:week:days=5   → har juma (muddat sanasidan)
 *           every:done:2:day          → bajarilgandan 2 kun keyin
 *
 * Eski formatlar ("daily", "every-monday", …) ham oʻqiladi (orqaga moslik).
 */

export type RecurrenceUnit = "day" | "week" | "month" | "year";
/** Keyingi muddat nimadan hisoblanadi: muddat sanasi yoki bajarilgan sana. */
export type RecurrenceBasis = "due" | "done";

export interface Recurrence {
  interval: number;       // "Har N …"
  unit: RecurrenceUnit;
  weekdays: number[];     // 0=Yakshanba … 6=Shanba (faqat unit=week uchun)
  basis: RecurrenceBasis;
}

const UNITS: RecurrenceUnit[] = ["day", "week", "month", "year"];
const LEGACY_WEEKDAYS = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];

/** Hafta dushanbadan boshlanadi: indekslar tartibi M T W T F S S → 1..6,0. */
export const WEEKDAY_ORDER = [1, 2, 3, 4, 5, 6, 0];
export const WEEKDAY_SHORT: Record<number, string> = {
  1: "Du", 2: "Se", 3: "Cho", 4: "Pay", 5: "Ju", 6: "Sha", 0: "Yak",
};
const WEEKDAYS_MON_FRI = [1, 2, 3, 4, 5];

const fmtLocal = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

function defaultRecurrence(unit: RecurrenceUnit = "day"): Recurrence {
  return { interval: 1, unit, weekdays: [], basis: "due" };
}

/** Rule string → tuzilma. Boʻsh/nullable boʻlsa null. */
export function parseRule(rule: string | null | undefined): Recurrence | null {
  if (!rule) return null;
  const r = rule.toLowerCase().trim();

  // Yangi format
  if (r.startsWith("every:")) {
    const parts = r.split(":");
    // every : basis : interval : unit [ : days=... ]
    const basis: RecurrenceBasis = parts[1] === "done" ? "done" : "due";
    const interval = Math.max(1, parseInt(parts[2] || "1", 10) || 1);
    const unit = (UNITS.includes(parts[3] as RecurrenceUnit) ? parts[3] : "day") as RecurrenceUnit;
    let weekdays: number[] = [];
    const daysPart = parts.find((p) => p.startsWith("days="));
    if (daysPart) {
      weekdays = daysPart
        .slice(5)
        .split(",")
        .map((n) => parseInt(n, 10))
        .filter((n) => n >= 0 && n <= 6);
    }
    return { interval, unit, weekdays, basis };
  }

  // Eski formatlar
  if (r === "daily" || r === "every-day") return defaultRecurrence("day");
  if (r === "weekly" || r === "every-week") return defaultRecurrence("week");
  if (r === "monthly" || r === "every-month") return defaultRecurrence("month");
  if (r === "yearly" || r === "every-year") return defaultRecurrence("year");
  if (r === "weekdays" || r === "every-weekday")
    return { interval: 1, unit: "week", weekdays: [...WEEKDAYS_MON_FRI], basis: "due" };

  const wd = r.match(/every-([a-z]+)/);
  if (wd) {
    const idx = LEGACY_WEEKDAYS.indexOf(wd[1]);
    if (idx >= 0) return { interval: 1, unit: "week", weekdays: [idx], basis: "due" };
  }
  return null;
}

/** Tuzilma → kanonik rule string. */
export function buildRule(rec: Recurrence): string {
  let s = `every:${rec.basis}:${rec.interval}:${rec.unit}`;
  if (rec.unit === "week" && rec.weekdays.length > 0) {
    const sorted = [...rec.weekdays].sort((a, b) => WEEKDAY_ORDER.indexOf(a) - WEEKDAY_ORDER.indexOf(b));
    s += `:days=${sorted.join(",")}`;
  }
  return s;
}

/** Dushanba-boshli hafta uchun haftaning boshlanishi (00:00). */
function startOfWeekMon(d: Date): Date {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const day = x.getDay(); // 0=Yak
  const diff = day === 0 ? 6 : day - 1;
  x.setDate(x.getDate() - diff);
  return x;
}

/**
 * Keyingi takror sanasini hisoblaydi (joyida oldinga surish — TickTick uslubi).
 * `fromISO` — joriy muddat (yoki bajarilgan sana, basis=done boʻlsa).
 */
export function nextDate(rec: Recurrence, fromISO: string | null): string | null {
  const base = fromISO ? new Date(`${fromISO}T00:00:00`) : new Date();
  base.setHours(0, 0, 0, 0);
  const n = Math.max(1, rec.interval);

  if (rec.unit === "day") {
    base.setDate(base.getDate() + n);
    return fmtLocal(base);
  }

  if (rec.unit === "week") {
    const set = new Set(rec.weekdays.length ? rec.weekdays : [base.getDay()]);
    const baseWeek = startOfWeekMon(base).getTime();
    for (let step = 1; step <= 7 * (n + 1); step++) {
      const cand = new Date(base);
      cand.setDate(cand.getDate() + step);
      if (!set.has(cand.getDay())) continue;
      const weekDiff = Math.round((startOfWeekMon(cand).getTime() - baseWeek) / (7 * 86400000));
      // Shu hafta ichidagi keyingi kun yoki N-haftadan keyin
      if (weekDiff === 0 || weekDiff >= n) return fmtLocal(cand);
    }
    return null;
  }

  if (rec.unit === "month") {
    base.setMonth(base.getMonth() + n);
    return fmtLocal(base);
  }

  // year
  base.setFullYear(base.getFullYear() + n);
  return fmtLocal(base);
}

/**
 * Inson oʻqiydigan qisqa yorliq (oʻzbekcha). `refISO` — oy kuni / yil sanasi
 * kabi tafsilotlar uchun tayanch sana (odatda vazifaning muddati).
 */
export function recurrenceLabel(rule: string | null | undefined, refISO?: string | null): string | null {
  const rec = parseRule(rule);
  if (!rec) return null;
  const ref = refISO ? parseISO(refISO) : new Date();
  const n = rec.interval;

  if (rec.unit === "day") return n === 1 ? "Har kuni" : `Har ${n} kunda`;

  if (rec.unit === "week") {
    const days = rec.weekdays.length ? rec.weekdays : [ref.getDay()];
    const sorted = [...days].sort((a, b) => WEEKDAY_ORDER.indexOf(a) - WEEKDAY_ORDER.indexOf(b));
    const isWorkweek = sorted.length === 5 && WEEKDAYS_MON_FRI.every((d) => sorted.includes(d));
    if (isWorkweek && n === 1) return "Har ish kuni";
    const names = sorted.map((d) => WEEKDAY_SHORT[d]).join(", ");
    const head = n === 1 ? "Har hafta" : `Har ${n} haftada`;
    return `${head} (${names})`;
  }

  if (rec.unit === "month") {
    const head = n === 1 ? "Har oy" : `Har ${n} oyda`;
    return `${head} (${ref.getDate()}-kun)`;
  }

  const head = n === 1 ? "Har yili" : `Har ${n} yilda`;
  return `${head} (${format(ref, "d-MMMM", { locale: uz })})`;
}

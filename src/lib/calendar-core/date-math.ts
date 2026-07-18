/* ════════════════════════════════════════════════════════════════════
   CALENDAR-CORE · SANA/VAQT MATEMATIKASI — yagona manba

   Konvensiyalar (butun loyiha boʻylab):
    • Sana = "YYYY-MM-DD" kaliti, lexikografik solishtiriladi.
      toISOString() TAQIQ (UTC+5 da kun -1 ga suriladi) — [[date-keys]].
    • Vaqt = 00:00 dan daqiqalar (integer).
    • Hafta DUSHANBA-birinchi; ISO kun fazosi 1=Du .. 7=Ya
      (TimetableEvent.day shu fazoda, faqat 1..6 ishlatiladi).
    • JS Date.getDay() (0=Ya) fazosiga oʻtish FAQAT jsDayToIsoDay/
      isoDayToJsDay orqali.
   ════════════════════════════════════════════════════════════════════ */

import { addDaysKey, dateKeyToDate, dateToKey, todayKey } from "@/lib/date-keys";

export { addDaysKey, dateKeyToDate, dateToKey, todayKey };

/** 00:00 dan daqiqalar → "HH:MM". (fmtMin bilan bir xil — u alias.) */
export function minToHHMM(min: number): string {
  return `${String(Math.floor(min / 60)).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`;
}

/** "HH:MM" → 00:00 dan daqiqalar. */
export function hhmmToMin(s: string): number {
  const [h, m] = s.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}

/** Daqiqani step'ga tutish (snap), default 15. */
export function snapMin(m: number, step = 15): number {
  return Math.round(m / step) * step;
}

export function clamp(v: number, lo: number, hi: number): number {
  return Math.min(Math.max(v, lo), hi);
}

/** JS `Date.getDay()` (0=Ya..6=Sha) → ISO kun (1=Du..7=Ya). */
export function jsDayToIsoDay(jsDay: number): number {
  return jsDay === 0 ? 7 : jsDay;
}

/** ISO kun (1=Du..7=Ya) → JS `Date.getDay()` (0=Ya..6=Sha). */
export function isoDayToJsDay(isoDay: number): number {
  return isoDay === 7 ? 0 : isoDay;
}

/** Sana kalitining ISO kuni (1=Du..7=Ya). */
export function isoDayOfKey(key: string): number {
  return jsDayToIsoDay(dateKeyToDate(key).getDay());
}

/** Dushanba boshlangʻich hafta boshi (vaqt 00:00). */
export function startOfWeekMon(d: Date): Date {
  const x = new Date(d);
  const dow = (x.getDay() + 6) % 7; // Ya=0 → 6, Du=1 → 0
  x.setDate(x.getDate() - dow);
  x.setHours(0, 0, 0, 0);
  return x;
}

export function addDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

/** Kalit haftasining dushanba kaliti. */
export function startOfWeekMonKey(key: string): string {
  return dateToKey(startOfWeekMon(dateKeyToDate(key)));
}

export function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

/** Anchor haftasining 7 kuni (Du..Ya). Vaqt komponenti nollashtirilmaydi —
    faqat sana kaliti ishlatiladigan joylarda farqi yoʻq (PlannerView semantikasi). */
export function getWeekDates(anchor: Date): Date[] {
  const dow = anchor.getDay();
  const monday = new Date(anchor);
  monday.setDate(anchor.getDate() - ((dow + 6) % 7));
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

/** Anchor haftasining 7 kun kaliti (Du..Ya). */
export function getWeekKeys(anchorKey: string): string[] {
  const mon = startOfWeekMonKey(anchorKey);
  return Array.from({ length: 7 }, (_, i) => addDaysKey(mon, i));
}

export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

/** Oy toʻri — DUSHANBA-birinchi, bosh/oxirda null toʻldirma (uzunlik 7 ga karrali). */
export function getMonthGrid(year: number, month: number): (Date | null)[] {
  const firstDow = new Date(year, month, 1).getDay();
  const offset = (firstDow + 6) % 7;
  const days = getDaysInMonth(year, month);
  const cells: (Date | null)[] = [];
  for (let i = 0; i < offset; i++) cells.push(null);
  for (let d = 1; d <= days; d++) cells.push(new Date(year, month, d));
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

/** getMonthGrid, lekin sana kalitlari bilan. */
export function getMonthGridKeys(year: number, month: number): (string | null)[] {
  return getMonthGrid(year, month).map((d) => (d ? dateToKey(d) : null));
}

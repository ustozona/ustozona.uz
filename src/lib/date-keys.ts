/* ════════════════════════════════════════════════════════════════════
   SANA KALITLARI — "YYYY-MM-DD" ↔ Date yagona yordamchilari

   MUHIM: toISOString() ishlatilmaydi — u UTC'ga oʻtkazadi va UTC+
   mintaqalarda (Oʻzbekiston +5) kun -1 ga suriladi. Date mahalliy
   12:00 bilan quriladi (DST chetlanishidan saqlanish).
   Kalitlar lexikografik solishtiriladi ("2025-09-02" < "2025-11-04").
   ════════════════════════════════════════════════════════════════════ */

/** "YYYY-MM-DD" → JS Date (mahalliy, vaqt 12:00). */
export function dateKeyToDate(key: string): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1, 12, 0, 0);
}

/** JS Date → "YYYY-MM-DD". */
export function dateToKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** Kalitga kun qoʻshish (manfiy ham mumkin). */
export function addDaysKey(key: string, days: number): string {
  const d = dateKeyToDate(key);
  d.setDate(d.getDate() + days);
  return dateToKey(d);
}

/** Bugungi sana kaliti. */
export function todayKey(): string {
  return dateToKey(new Date());
}

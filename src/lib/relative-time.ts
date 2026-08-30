/* ════════════════════════════════════════════════════════════════════
   NISBIY VAQT — "3 soat oldin", "2 kun oldin"

   `Intl.RelativeTimeFormat("uz")` ba'zi muhitlarda inglizchaga qaytadi
   (ICU ma'lumoti toʻliq emas), shuning uchun qoʻlda. Bir haftadan
   oshganda toʻliq sanaga oʻtamiz — "5 hafta oldin" degandan koʻra
   "1-avgust" aniqroq. Toʻliq sana `title=` da har doim boʻladi.
   ════════════════════════════════════════════════════════════════════ */

import { formatFullDateUz } from "./localization";

const MIN = 60_000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;

/** ISO satr yoki Date → "3 soat oldin" / "kecha" / toʻliq sana. */
export function relativeTimeUz(value: string | Date, now: Date = new Date()): string {
  const then = typeof value === "string" ? new Date(value) : value;
  const diff = now.getTime() - then.getTime();

  if (diff < MIN) return "hozirgina";
  if (diff < HOUR) {
    const m = Math.floor(diff / MIN);
    return `${m} daqiqa oldin`;
  }
  if (diff < DAY) {
    const h = Math.floor(diff / HOUR);
    return `${h} soat oldin`;
  }
  const days = Math.floor(diff / DAY);
  if (days === 1) return "kecha";
  if (days < 7) return `${days} kun oldin`;
  return formatFullDateUz(then);
}

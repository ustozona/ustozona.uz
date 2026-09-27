import { MONTHS_UZ } from "@/lib/localization";

/* ════════════════════════════════════════════════════════════════════
   MUDDAT KOʻRINISHI — «28-sentabr, 23:59».

   Vaqt har doim TOSHKENT boʻyicha (`due_at` serverda `+05:00` bilan
   yoziladi) — oʻqituvchi qaysi mintaqada boʻlmasin, muddat bolalar
   koʻradigan vaqt bilan bir xil koʻrinsin.

   Oy nomi: oʻzbekchada `MONTHS_UZ` (brauzerlarning bir qismida `uz`
   uchun ICU maʼlumoti yoʻq va «M09» chiqadi — `NextLessonsCard` dagi
   bilan bir xil muammo); boshqa tilda Intl, u ham boʻlmasa raqam.
   ════════════════════════════════════════════════════════════════════ */

const TZ = "Asia/Tashkent";

function partsOf(date: Date) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: TZ,
    day: "numeric",
    month: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value ?? 0);
  return { day: get("day"), month: get("month"), hour: get("hour"), minute: get("minute") };
}

export function formatDue(iso: string, locale: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const { day, month, hour, minute } = partsOf(date);
  const time = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;

  if (locale === "uz") {
    return `${day}-${MONTHS_UZ[(month - 1) % 12].toLowerCase()}, ${time}`;
  }
  try {
    const label = new Intl.DateTimeFormat(locale, { timeZone: TZ, day: "numeric", month: "long" }).format(
      date,
    );
    if (!/M\d/.test(label)) return `${label}, ${time}`;
  } catch {
    /* noma'lum til kodi — raqamga tushamiz */
  }
  return `${String(day).padStart(2, "0")}.${String(month).padStart(2, "0")}, ${time}`;
}

/** `YYYY-MM-DD` — bugundan `offset` kun keyin, Toshkent boʻyicha. */
export function dateKeyInTashkent(offset: number, now = new Date()): string {
  const shifted = new Date(now.getTime() + offset * 24 * 60 * 60 * 1000);
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(shifted);
  // en-CA → "2026-09-28"
  return parts;
}

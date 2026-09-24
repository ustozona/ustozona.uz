import { CALENDAR_TZID } from "@/lib/calendar-core/timezone";

/* ⛔ `toLocaleDateString("uz-UZ", …)` ISHLATMANG — GIDRATATSIYANI BUZADI.

   Nodeʼning ICU maʼlumoti bilan brauzerniki bir xil emas: server
   «2026-07-18», Chrome esa «18/07/2026» chizardi va React butun
   daraxtni qayta quruvchi hydration xatosi berardi (kuzatilgan
   2026-09-06, foydalanuvchilar jadvalidagi «Roʻyxatdan oʻtgan» ustunida).

   Yechim ikki qismli:
     1. Barqaror lokal (`en-GB`) + `formatToParts` — natija ICU
        versiyasiga bogʻliq emas, qismlarni oʻzimiz yigʻamiz.
     2. Vaqt mintaqasi QATʼIY belgilangan. Busiz Vercel (UTC) va
        foydalanuvchi (UTC+5) yarim tundan keyin BOSHQA kun
        koʻrsatardi — xuddi shu xato, faqat kuniga bir marta.

   Admin jadvallari (foydalanuvchilar, audit) sanani shu yerdan oladi. */
const DATE_TIME_PARTS = new Intl.DateTimeFormat("en-GB", {
  timeZone: CALENDAR_TZID,
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

function parts(d: Date | string): Record<string, string> {
  const date = typeof d === "string" ? new Date(d) : d;
  const p: Record<string, string> = {};
  for (const part of DATE_TIME_PARTS.formatToParts(date)) p[part.type] = part.value;
  return p;
}

/** «18.07.2026» — Toshkent vaqti boʻyicha. */
export function fmtDate(d: Date | string | null): string {
  if (!d) return "—";
  const p = parts(d);
  return `${p.day}.${p.month}.${p.year}`;
}

/** «18.07.2026, 14:05» — Toshkent vaqti boʻyicha. */
export function fmtDateTime(d: Date | string): string {
  const p = parts(d);
  return `${p.day}.${p.month}.${p.year}, ${p.hour}:${p.minute}`;
}

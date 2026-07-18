import { minToHHMM } from "./date-math";
import { CALENDAR_TZID } from "./timezone";
import type { CalendarOccurrence } from "./occurrence";

/* ════════════════════════════════════════════════════════════════════
   CALENDAR-CORE · ICS — RFC 5545 (iCalendar) eksport skeleti.

   H-bosqich stub: hozircha HECH YERDA chaqirilmaydi, faqat kelajakdagi
   ".ics yuklab olish" / tashqi sinxron (Google/Telegram) uchun ildiz.
   occurrence.ts'dagi moslik jadvaliga qarang. Recurrence (RRULE) hali
   yozilmaydi — har occurrence alohida VEVENT sifatida eksport qilinadi
   (versiya/takrorlanish siqilmagan, lekin toʻgʻri).
   ════════════════════════════════════════════════════════════════════ */

function icsEscape(text: string): string {
  return text.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}

function dateKeyToIcsDate(dateKey: string): string {
  return dateKey.replace(/-/g, "");
}

function dateTimeToIcs(dateKey: string, min: number): string {
  return `${dateKeyToIcsDate(dateKey)}T${minToHHMM(min).replace(":", "")}00`;
}

/** Bitta CalendarOccurrence'ni bitta VEVENT blokiga aylantiradi. */
function occurrenceToVEvent(o: CalendarOccurrence): string {
  const lines = ["BEGIN:VEVENT", `UID:${o.id}@ustozona.uz`, `SUMMARY:${icsEscape(o.title || o.source)}`];
  if (o.allDay || o.startMin == null) {
    lines.push(`DTSTART;VALUE=DATE:${dateKeyToIcsDate(o.dateKey)}`);
  } else {
    lines.push(`DTSTART;TZID=${CALENDAR_TZID}:${dateTimeToIcs(o.dateKey, o.startMin)}`);
    if (o.endMin != null) lines.push(`DTEND;TZID=${CALENDAR_TZID}:${dateTimeToIcs(o.dateKey, o.endMin)}`);
  }
  lines.push("END:VEVENT");
  return lines.join("\r\n");
}

/** Occurrence roʻyxatini bitta .ics kalendar faylga aylantiradi. */
export function toICalendar(occurrences: CalendarOccurrence[]): string {
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Ustozona//Calendar//UZ",
    "CALSCALE:GREGORIAN",
    ...occurrences.map(occurrenceToVEvent),
    "END:VCALENDAR",
  ].join("\r\n");
}

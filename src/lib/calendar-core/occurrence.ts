import type { TimetableEvent } from "@/lib/timetable";

/* ════════════════════════════════════════════════════════════════════
   CALENDAR-CORE · OCCURRENCE — barcha kalendar yuzalari uchun yagona
   "koʻrinish" tipi.

   FEDERATSIYA PRINTSIPI: bu FAQAT OʻQILADIGAN proyeksiya. Har bir manba
   (jadval versiyasi, dars sessiyasi, vazifa, taʼtil…) oʻz modulida
   yashaydi va oʻsha yerda tahrirlanadi; CalendarOccurrence hech qachon
   bazaga qaytib yozilmaydi. Tahrir amali `ref` orqali egasiga boradi.

   RFC 5545 (iCalendar) / RFC 8984 (JSCalendar) MOSLIK JADVALI —
   kelajakdagi eksport/sinxron uchun ildiz (toICalendar, H-bosqich):

   ┌────────────────────────────┬──────────────────────────────────────┐
   │ Bizning model              │ iCalendar ekvivalenti                │
   ├────────────────────────────┼──────────────────────────────────────┤
   │ TimetableVersion oynasi    │ master VEVENT + RRULE:FREQ=WEEKLY;   │
   │ (effectiveFrom..rangeEnd)  │ BYDAY=…;UNTIL=versionRangeEnd        │
   │ Yangi versiya              │ yangi UID seriya (≈ THISANDFUTURE)   │
   │ Taʼtil / blok kun          │ EXDATE (slot-seriyalarda)            │
   │ Slot ustidagi sessiya      │ RECURRENCE-ID override               │
   │ Mustaqil sessiya           │ yakka VEVENT                         │
   │ dateKey+startMin           │ DTSTART;TZID=Asia/Tashkent           │
   │ allDay occurrence          │ DTSTART;VALUE=DATE                   │
   └────────────────────────────┴──────────────────────────────────────┘
   ════════════════════════════════════════════════════════════════════ */

export type OccurrenceSource =
  | "timetable-slot"   // versiyalangan haftalik jadvaldagi dars slotи
  | "lesson-session"   // aniq sanaga qadalgan dars sessiyasi (scheduleByClass)
  | "holiday"          // oʻquv yili taʼtili (academic-calendar)
  | "blocked-day"      // foydalanuvchi blok qilgan kun
  | "task-due"         // vazifa muddati (dueDate)
  | "birthday";        // oʻquvchi tugʻilgan kuni

/** Egasi-modulga qaytish manzili — tahrir/deep-link shu orqali. */
export type OccurrenceRef =
  | { kind: "timetable-slot"; event: TimetableEvent; versionId: string }
  | { kind: "lesson-session"; lessonId: string; classId: string }
  | { kind: "holiday"; holidayId: string }
  | { kind: "blocked-day"; label: string }
  | { kind: "task-due"; taskId: string }
  | { kind: "birthday"; studentId: string };

export type CalendarOccurrence = {
  /** `${source}:${masterId}:${dateKey}:${startMin|"allday"}` — barqaror. */
  id: string;
  source: OccurrenceSource;
  dateKey: string;
  /** allDay boʻlsa null. */
  startMin: number | null;
  endMin: number | null;
  allDay: boolean;
  /** Xom sarlavha (masalan dars nomi). Slotlar uchun UI sinf nomini
      classId dan oʻzi topadi (jonli roster pure qatlamga kirmaydi). */
  title: string;
  classId?: string;
  /** Takrorlanuvchi seriya/obyekt idʼsi (slot: event.id; sessiya: lessonId…). */
  masterId: string;
  versionId?: string;
  ref: OccurrenceRef;
};

export function occurrenceId(
  source: OccurrenceSource,
  masterId: string,
  dateKey: string,
  startMin: number | null,
): string {
  return `${source}:${masterId}:${dateKey}:${startMin ?? "allday"}`;
}

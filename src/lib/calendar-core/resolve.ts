import { resolveVersionForDate, type TimetableVersion } from "@/lib/timetable-versions";
import { getHolidayForDate, inRange, type AcademicYearCalendar } from "@/lib/academic-calendar";
import { lessonSessions, type Lesson } from "@/lib/lessons-data";
import { addDaysKey, hhmmToMin, isoDayOfKey } from "./date-math";
import { occurrenceId, type CalendarOccurrence } from "./occurrence";

/* ════════════════════════════════════════════════════════════════════
   CALENDAR-CORE · RESOLVER — manbalar federatsiyasi.

   Berilgan sana oraligʻi uchun barcha manbalarni (versiyalangan jadval,
   dars sessiyalari, taʼtillar, blok kunlar, vazifa muddatlari,
   tugʻilgan kunlar) kun-boʻyicha CalendarOccurrence roʻyxatiga
   proyeksiya qiladi. Sof funksiya — store/React yoʻq; hooklar
   (useResolvedSchedule) shu funksiyani memo bilan oʻraydi.
   ════════════════════════════════════════════════════════════════════ */

export type SessionMatchMode = "start-in-slot" | "overlap";

/** Sessiya jadval slotiga tegishlimi. Kanonik semantika — planner:
    sinf mos VA sessiya boshlanishi slot ichida ([start, end)).
    "overlap" — har qanday vaqt kesishuvi (TodayRail legacy xatti-harakati,
    unifikatsiya v2 — [[bu farq ataylab saqlangan]]). */
export function sessionMatchesSlot(
  slot: { classId: string; startMin: number; endMin: number },
  session: { classId: string; startMin: number; endMin: number },
  matchMode: SessionMatchMode = "start-in-slot",
): boolean {
  if (slot.classId !== session.classId) return false;
  if (matchMode === "overlap") {
    return session.startMin < slot.endMin && session.endMin > slot.startMin;
  }
  return session.startMin >= slot.startMin && session.startMin < slot.endMin;
}

/* Manba tiplarga strukturaviy (duck-typed) qaraladi — store tiplarini
   pure qatlamga import qilmaslik uchun. */
export type TaskLike = {
  id: string;
  title: string;
  dueDate?: string | null;
  /** "HH:MM" — berilsa vazifa vaqt oʻqida chiqadi, boʻlmasa butun-kun chip. */
  dueTime?: string | null;
  endTime?: string | null;
  classIds?: string[];
};
export type StudentLike = { id: string; name: string; birthDate?: string | null };
export type BlockedDayLike = { date: string; label: string };

export type ResolveSources = {
  versions?: TimetableVersion[];
  lessons?: Lesson[];
  calendar?: AcademicYearCalendar | null;
  blockedDays?: BlockedDayLike[];
  tasks?: TaskLike[];
  students?: StudentLike[];
  /** Berilsa — faqat shu sinfning slot/sessiyalari (sinf-detali rejimi). */
  classId?: string;
};

export type ResolveOptions = {
  /** Taʼtil/blok kuni yoki oʻquv yilidan tashqarida jadval slotlarini
      soʻndirish (default true — planner semantikasi). Sessiyalar hech
      qachon soʻndirilmaydi: koʻchirilishi kerakligi koʻrinib tursin. */
  suppressSlotsOnOffDays?: boolean;
};

const MAX_RANGE_DAYS = 400; // himoya: yil koʻrinishi + zaxira

/** [startKey..endKey] (inklyuziv) oraligʻini kun-boʻyicha resolve qiladi.
    Har kun roʻyxati: butun-kun avval, soʻng startMin boʻyicha. */
export function resolveOccurrences(
  startKey: string,
  endKey: string,
  sources: ResolveSources,
  opts: ResolveOptions = {},
): Map<string, CalendarOccurrence[]> {
  const { versions, lessons, calendar, blockedDays, tasks, students, classId } = sources;
  const suppressSlots = opts.suppressSlotsOnOffDays ?? true;

  const out = new Map<string, CalendarOccurrence[]>();
  if (startKey > endKey) return out;

  // ── Oldindan indekslar (oraliqdan qatʼi nazar bir marta) ──
  const blockedByDate = new Map<string, string>();
  for (const b of blockedDays ?? []) blockedByDate.set(b.date, b.label);

  const sessionsByDate = new Map<string, { lesson: Lesson; classId: string; startMin: number; endMin: number }[]>();
  for (const l of lessons ?? []) {
    for (const s of lessonSessions(l)) {
      if (classId && s.classId !== classId) continue;
      if (s.date < startKey || s.date > endKey) continue;
      const arr = sessionsByDate.get(s.date) ?? [];
      arr.push({ lesson: l, classId: s.classId, startMin: s.startMin, endMin: s.endMin });
      sessionsByDate.set(s.date, arr);
    }
  }

  const tasksByDate = new Map<string, TaskLike[]>();
  for (const task of tasks ?? []) {
    if (!task.dueDate || task.dueDate < startKey || task.dueDate > endKey) continue;
    const arr = tasksByDate.get(task.dueDate) ?? [];
    arr.push(task);
    tasksByDate.set(task.dueDate, arr);
  }

  // Tugʻilgan kunlar yil-agnostik: "MM-DD" boʻyicha.
  const birthdaysByMonthDay = new Map<string, StudentLike[]>();
  for (const st of students ?? []) {
    if (!st.birthDate || st.birthDate.length < 10) continue;
    const md = st.birthDate.slice(5, 10);
    const arr = birthdaysByMonthDay.get(md) ?? [];
    arr.push(st);
    birthdaysByMonthDay.set(md, arr);
  }

  // ── Kun-boʻyicha yurish ──
  let key = startKey;
  for (let i = 0; i < MAX_RANGE_DAYS && key <= endKey; i++, key = addDaysKey(key, 1)) {
    const day: CalendarOccurrence[] = [];

    const holiday = calendar ? getHolidayForDate(calendar, key) : null;
    if (holiday) {
      day.push({
        id: occurrenceId("holiday", holiday.id, key, null),
        source: "holiday", dateKey: key, startMin: null, endMin: null, allDay: true,
        title: holiday.name, masterId: holiday.id,
        ref: { kind: "holiday", holidayId: holiday.id },
      });
    }

    const blockLabel = blockedByDate.get(key);
    if (blockLabel !== undefined) {
      day.push({
        id: occurrenceId("blocked-day", key, key, null),
        source: "blocked-day", dateKey: key, startMin: null, endMin: null, allDay: true,
        title: blockLabel, masterId: key,
        ref: { kind: "blocked-day", label: blockLabel },
      });
    }

    for (const st of birthdaysByMonthDay.get(key.slice(5, 10)) ?? []) {
      day.push({
        id: occurrenceId("birthday", st.id, key, null),
        source: "birthday", dateKey: key, startMin: null, endMin: null, allDay: true,
        title: st.name, masterId: st.id,
        ref: { kind: "birthday", studentId: st.id },
      });
    }

    for (const task of tasksByDate.get(key) ?? []) {
      const startMin = task.dueTime ? hhmmToMin(task.dueTime) : null;
      const endMin =
        startMin == null ? null : Math.min(task.endTime ? hhmmToMin(task.endTime) : startMin + 45, 24 * 60);
      day.push({
        id: occurrenceId("task-due", task.id, key, startMin),
        source: "task-due", dateKey: key, startMin, endMin, allDay: startMin == null,
        title: task.title, classId: task.classIds?.[0], masterId: task.id,
        ref: { kind: "task-due", taskId: task.id },
      });
    }

    // Jadval slotlari — versiyalangan haftalik shablondan.
    const offDay =
      !!holiday || blockLabel !== undefined || (calendar ? !inRange(key, calendar.range) : false);
    if (versions?.length && !(suppressSlots && offDay)) {
      const isoDay = isoDayOfKey(key); // Ya=7 — jadvalda yoʻq, filter oʻzi tashlaydi
      const version = resolveVersionForDate(versions, key);
      for (const ev of version?.events ?? []) {
        if (ev.day !== isoDay) continue;
        if (classId && ev.classId !== classId) continue;
        day.push({
          id: occurrenceId("timetable-slot", ev.id, key, ev.startMin),
          source: "timetable-slot", dateKey: key, startMin: ev.startMin, endMin: ev.endMin,
          allDay: false, title: "", classId: ev.classId, masterId: ev.id, versionId: version!.id,
          ref: { kind: "timetable-slot", event: ev, versionId: version!.id },
        });
      }
    }

    // Dars sessiyalari — HECH QACHON soʻndirilmaydi (blok kunda ham koʻrinsin).
    for (const s of sessionsByDate.get(key) ?? []) {
      day.push({
        id: occurrenceId("lesson-session", `${s.lesson.id}:${s.classId}`, key, s.startMin),
        source: "lesson-session", dateKey: key, startMin: s.startMin, endMin: s.endMin,
        allDay: false, title: s.lesson.title, classId: s.classId, masterId: s.lesson.id,
        ref: { kind: "lesson-session", lessonId: s.lesson.id, classId: s.classId },
      });
    }

    if (day.length) {
      day.sort((a, b) => Number(!a.allDay) - Number(!b.allDay) || (a.startMin ?? 0) - (b.startMin ?? 0));
      out.set(key, day);
    }
  }

  return out;
}

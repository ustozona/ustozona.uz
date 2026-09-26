import { resolveOccurrences, sessionMatchesSlot } from "@/lib/calendar-core/resolve";
import { minToHHMM } from "@/lib/calendar-core/date-math";
import { addDaysKey, dateKeyToDate } from "@/lib/date-keys";
import { DAYS_UZ_SUN, MONTHS_UZ } from "@/lib/localization";
import { isTaught, lessonPlanState, lessonSessions, type Lesson } from "@/lib/lessons-data";
import { getHolidayForDate, type AcademicYearCalendar } from "@/lib/academic-calendar";
import type { TimetableVersion } from "@/lib/timetable-versions";
import type { Task } from "@/lib/tasks-data";

/* ════════════════════════════════════════════════════════════════════
   TELEGRAM KUNLIK XABARI — matn yasovchi (sof funksiya)

   Ikki xil xabar:
     evening — «Ertaga»: ertangi darslar, mavzusiz darslar, ertangi
               muddatlar va bugun «oʻtildi» deb belgilanmagan darslar
     morning — «Bugun»: bugungi darslar, mavzusiz darslar, bugungi va
               muddati oʻtgan vazifalar

   Kun darslari bosh sahifa va rejalashtiruvchi bilan BIR XIL manbadan
   (`calendar-core/resolve`): jadval sloti + unga tushgan dars sessiyasi,
   taʼtil va oʻquv yilidan tashqari kunlarda slot yoʻq. Slotga sessiya
   tushmagan boʻlsa — «mavzu biriktirilmagan», yaʼni rejalanmagan dars.

   «Dars rejasi tayyor emas» ATAYLAB sanalmaydi: `planReady` ni hamma
   belgilamaydi va u har kuni hamma dars uchun ogohlantirish boʻlib
   chiqardi — shovqin. Tayyor boʻlsa faqat ✅ belgisi qoʻyiladi.

   Aytadigan narsa boʻlmasa `null` — xabar YUBORILMAYDI.
   ════════════════════════════════════════════════════════════════════ */

export type DigestKind = "morning" | "evening";

export type DigestClass = { name: string; subject: string };

export type DigestInput = {
  kind: DigestKind;
  /** Bugun (Toshkent), `YYYY-MM-DD`. */
  todayKey: string;
  /** Hozirgi vaqt (Toshkent), 00:00 dan daqiqalar. */
  nowMin: number;
  versions: TimetableVersion[];
  lessons: Lesson[];
  calendar: AcademicYearCalendar | null;
  /** Yopilmagan vazifalar (done/canceled emas). */
  tasks: Task[];
  classes: Map<string, DigestClass>;
  siteUrl: string;
};

export type DigestMessage = {
  text: string;
  buttons: { text: string; url: string }[];
};

type Row = {
  startMin: number;
  classId: string;
  title: string | null;
  planReady: boolean;
};

const MAX_ROWS = 12;
const MAX_TASK_TITLES = 3;

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function dayLabel(key: string): string {
  const d = dateKeyToDate(key);
  return `${DAYS_UZ_SUN[d.getDay()].toLowerCase()}, ${d.getDate()}-${MONTHS_UZ[d.getMonth()].toLowerCase()}`;
}

/** Kun darslari: slotlar (sessiyasi bilan yoki usiz) + slotga tushmagan sessiyalar. */
function dayRows(key: string, input: DigestInput): Row[] {
  const occ =
    resolveOccurrences(key, key, {
      versions: input.versions,
      lessons: input.lessons,
      calendar: input.calendar,
    }).get(key) ?? [];

  const byId = new Map(input.lessons.map((l) => [l.id, l]));
  const slots = occ.filter((o) => o.source === "timetable-slot");
  const sessions = occ.filter((o) => o.source === "lesson-session");
  const usedSessions = new Set<string>();
  const rows: Row[] = [];

  for (const slot of slots) {
    if (!slot.classId || slot.startMin == null || slot.endMin == null) continue;
    const slotSpan = { classId: slot.classId, startMin: slot.startMin, endMin: slot.endMin };
    const match = sessions.find((s) => {
      if (usedSessions.has(s.id) || !s.classId || s.startMin == null || s.endMin == null) return false;
      return sessionMatchesSlot(slotSpan, { classId: s.classId, startMin: s.startMin, endMin: s.endMin });
    });
    if (match) usedSessions.add(match.id);
    const lesson = match ? byId.get(match.masterId) : undefined;
    rows.push({
      startMin: slot.startMin,
      classId: slot.classId,
      title: lesson?.title ?? null,
      planReady: lesson ? lessonPlanState(lesson) === "ready" : false,
    });
  }

  // Jadvaldan tashqari (qoʻlda qoʻyilgan) sessiyalar ham shu kunning darsi.
  for (const s of sessions) {
    if (usedSessions.has(s.id) || !s.classId || s.startMin == null) continue;
    const lesson = byId.get(s.masterId);
    rows.push({
      startMin: s.startMin,
      classId: s.classId,
      title: lesson?.title ?? s.title,
      planReady: lesson ? lessonPlanState(lesson) === "ready" : false,
    });
  }

  // Arxivlangan / oʻchirilgan sinfning qolib ketgan sloti xabarga chiqmasin.
  return rows
    .filter((r) => input.classes.has(r.classId))
    .sort((a, b) => a.startMin - b.startMin);
}

function rowLine(r: Row, classes: Map<string, DigestClass>): string {
  const c = classes.get(r.classId)!;
  const who = [`<b>${esc(c.name)}</b>`, c.subject && esc(c.subject)].filter(Boolean).join(" · ");
  const topic = r.title
    ? `${esc(r.title)}${r.planReady ? " ✅" : ""}`
    : "<i>mavzu biriktirilmagan</i> ⚠️";
  return `<code>${minToHHMM(r.startMin)}</code>  ${who} — ${topic}`;
}

function tasksDueOn(key: string, tasks: Task[]): Task[] {
  // Dars vazifalari darslar roʻyxatining oʻzida — ikki marta sanalmaydi.
  return tasks.filter((t) => t.dueDate === key && t.source?.kind !== "lesson");
}

function overdue(todayKey: string, tasks: Task[]): Task[] {
  return tasks.filter((t) => t.dueDate != null && t.dueDate < todayKey && t.source?.kind !== "lesson");
}

/** Bugun tugagan, lekin «oʻtildi» deb belgilanmagan darslar. */
function untaughtToday(todayKey: string, input: DigestInput): number {
  let n = 0;
  for (const l of input.lessons) {
    for (const s of lessonSessions(l)) {
      if (s.date !== todayKey || s.endMin > input.nowMin || !input.classes.has(s.classId)) continue;
      if (!isTaught(l, s.classId)) n++;
    }
  }
  return n;
}

function taskBlock(label: string, list: Task[]): string[] {
  if (!list.length) return [];
  const lines = [`${label}: ${list.length} ta vazifa`];
  for (const t of list.slice(0, MAX_TASK_TITLES)) lines.push(`   • ${esc(t.title)}`);
  if (list.length > MAX_TASK_TITLES) lines.push(`   • … yana ${list.length - MAX_TASK_TITLES} ta`);
  return lines;
}

export function buildDigest(input: DigestInput): DigestMessage | null {
  const { kind, todayKey, siteUrl } = input;
  const targetKey = kind === "evening" ? addDaysKey(todayKey, 1) : todayKey;

  // Yakshanba va taʼtilda slot yoʻq; qoʻlda qoʻyilgan sessiya boʻlsa baribir chiqadi.
  const rows = dayRows(targetKey, input);
  const unplanned = rows.filter((r) => !r.title).length;
  const due = tasksDueOn(targetKey, input.tasks);
  const late = kind === "morning" ? overdue(todayKey, input.tasks) : [];
  const notMarked = kind === "evening" ? untaughtToday(todayKey, input) : 0;

  // Muddati oʻtgan vazifalar YOLGʻIZ sabab emas: ular har kuni oʻzgarmay
  // takrorlanadi va faqat shu roʻyxat kelaversa bot «spam» boʻlib qoladi.
  // Boshqa sabab bilan ketayotgan xabarga qoʻshimcha boʻlib qoʻshiladi.
  if (!rows.length && !due.length && !notMarked) return null;

  const lines: string[] = [];
  const head = kind === "evening" ? "🌙 <b>Ertaga" : "☀️ <b>Bugun";
  const holiday = input.calendar ? getHolidayForDate(input.calendar, targetKey) : null;
  const count = rows.length
    ? ` · ${rows.length} ta dars`
    : holiday
      ? ` · ${esc(holiday.name)}`
      : " · dars yoʻq";
  lines.push(`${head}, ${dayLabel(targetKey)}${count}</b>`);

  if (rows.length) {
    lines.push("");
    for (const r of rows.slice(0, MAX_ROWS)) lines.push(rowLine(r, input.classes));
    if (rows.length > MAX_ROWS) lines.push(`… yana ${rows.length - MAX_ROWS} ta dars`);
  }

  const notes: string[] = [];
  if (unplanned) notes.push(`⚠️ ${unplanned} ta darsga mavzu biriktirilmagan`);
  notes.push(...taskBlock(kind === "evening" ? "📌 Ertaga muddati" : "📌 Bugun muddati", due));
  notes.push(...taskBlock("🔴 Muddati oʻtgan", late));
  if (notMarked) notes.push(`✅ Bugungi ${notMarked} ta darsga «oʻtildi» belgisi qoʻyilmagan`);
  if (notes.length) lines.push("", ...notes);

  const buttons: DigestMessage["buttons"] = [];
  if (unplanned) buttons.push({ text: "📝 Rejalash", url: `${siteUrl}/dashboard/planner` });
  if (notMarked) buttons.push({ text: "✅ Belgilash", url: `${siteUrl}/dashboard/lessons` });
  buttons.push({ text: "📅 Ustozona", url: `${siteUrl}/dashboard` });

  return { text: lines.join("\n"), buttons: buttons.slice(0, 3) };
}

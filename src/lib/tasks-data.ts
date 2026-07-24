import { addDaysKey, dateToKey, todayKey as todayKeyOf } from "@/lib/date-keys";
import { MONTHS_UZ } from "@/lib/localization";

/* ════════════════════════════════════════════════════════════════════
   VAZIFALAR — maʼlumot modeli (avto-vazifalar markazi, v1).

   4 manba: manual, lesson (har dars sessiyasi), grading (topshiriq),
   birthday (oʻquvchi tugʻilgan kuni). Avto-manbalar uchun deterministik
   id — reconciler (B3/B4) shu idlar orqali mavjud vazifani tanib oladi.
   Toʻliq reja: C:\Users\Maxdum\.claude\plans\task-sahifasini-yaratamiz-hamma-greedy-fox.md
   ════════════════════════════════════════════════════════════════════ */

export type TaskStatus = "todo" | "in-progress" | "done" | "canceled";
export type TaskPriority = "none" | "low" | "medium" | "high";

export type TaskSource =
  | { kind: "manual" }
  | { kind: "lesson"; lessonId: string; classId: string; date: string; startMin: number }
  | { kind: "grading"; classId: string; assignmentId: string }
  | { kind: "birthday"; studentId: string; year: number };

/** Yakunlangan pomodoro yozuvi — kun boʻyicha yigʻiladi (B6). */
export type FocusEntry = { date: string; minutes: number };

export type Task = {
  id: string;
  title: string;
  note?: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string | null;
  /** 00:00 dan daqiqalar — ixtiyoriy aniq vaqt (dars vazifalarida — boshlanish). */
  dueMin?: number | null;
  /** Tugash vaqti (00:00 dan daqiqalar) — faqat dars-manbali vazifalarda toʻldiriladi. */
  dueEndMin?: number | null;
  classId?: string | null;
  tags?: string[];
  /** Faqat manual vazifalarda ishlatiladi. */
  repeat?: { every: number; unit: "day" | "week" | "month" } | null;
  source: TaskSource;
  estPomos?: number;
  focus?: FocusEntry[];
  /** Reconciler avto-vazifani qayta ochmasligi uchun (foydalanuvchi qoʻlda done qilgan). */
  doneManually?: boolean;
  /** Tugʻilgan kun bildirishnomasi idempotentligi uchun. */
  notifiedAt?: string | null;
  sortOrder: number;
  createdAt: string;
  completedAt?: string | null;
};

/* ── Idlar ──────────────────────────────────────────────────────────── */

function uid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return `t-${crypto.randomUUID()}`;
  return `t-${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
}

export function manualTaskId(): string {
  return uid();
}

export function lessonTaskId(lessonId: string, classId: string, date: string, startMin: number): string {
  return `task:lesson:${lessonId}:${classId}:${date}:${startMin}`;
}

export function gradingTaskId(classId: string, assignmentId: string): string {
  return `task:grading:${classId}:${assignmentId}`;
}

export function birthdayTaskId(studentId: string, year: number): string {
  return `task:birthday:${studentId}:${year}`;
}

/* ── Yangi manual vazifa ───────────────────────────────────────────── */

export function newManualTask(input: {
  title: string;
  dueDate?: string | null;
  dueMin?: number | null;
  dueEndMin?: number | null;
  classId?: string | null;
  priority?: TaskPriority;
  estPomos?: number;
  sortOrder: number;
}): Task {
  return {
    id: manualTaskId(),
    title: input.title.trim(),
    status: "todo",
    priority: input.priority ?? "none",
    dueDate: input.dueDate ?? null,
    dueMin: input.dueMin ?? null,
    dueEndMin: input.dueEndMin ?? null,
    classId: input.classId ?? null,
    tags: [],
    repeat: null,
    source: { kind: "manual" },
    estPomos: input.estPomos || undefined,
    sortOrder: input.sortOrder,
    createdAt: new Date().toISOString(),
    completedAt: null,
  };
}

/* ── Ustuvorlik meta ──────────────────────────────────────────────────
   Ranglar mavjud semantik tokenlarga bogʻlangan (destructive/warning/info/muted) —
   xom Tailwind rang yoʻq. */

export const PRIORITY_ORDER: TaskPriority[] = ["high", "medium", "low", "none"];

export const PRIORITY_META: Record<
  TaskPriority,
  { ring: string; text: string; dot: string; checkbox: string }
> = {
  high: { ring: "ring-destructive/40", text: "text-destructive", dot: "bg-destructive", checkbox: "border-destructive" },
  medium: { ring: "ring-warning/40", text: "text-warning", dot: "bg-warning", checkbox: "border-warning" },
  low: { ring: "ring-info/40", text: "text-info", dot: "bg-info", checkbox: "border-info" },
  none: { ring: "ring-border", text: "text-muted-foreground", dot: "bg-muted-foreground/40", checkbox: "" },
};

/* ── Teglar (erkin) ───────────────────────────────────────────────────
   Bitta yagona uslub (student-notes NotesTab TAG_META bilan bir xil) —
   teg boʻyicha hashlangan rang yoʻq, dizayn tizimida ham qoʻllanmagan. */

export const TAG_PILL_CLASS = "bg-primary/10 text-primary border-primary/20";
export const TAG_DOT_CLASS = "bg-primary";

/** Barcha vazifalardagi noyob teglar (chap panel filtri uchun). */
export function collectTags(tasks: Task[]): string[] {
  const set = new Set<string>();
  for (const t of tasks) for (const tag of t.tags ?? []) set.add(tag);
  return [...set].sort();
}

/* ── Fokus (pomodoro) ─────────────────────────────────────────────── */

/** Daqiqani "1s 30 daq." / "45 daq." koʻrinishida qisqa formatlash. */
export function formatMinutes(total: number): string {
  if (total <= 0) return "0 daq.";
  const h = Math.floor(total / 60);
  const m = total % 60;
  if (h <= 0) return `${m} daq.`;
  return m > 0 ? `${h}s ${m} daq.` : `${h}s`;
}

/** Vazifaning barcha kunlar boʻyicha jamlangan fokus vaqti (daqiqa). */
export function totalFocusMinutes(task: Task): number {
  return (task.focus ?? []).reduce((sum, f) => sum + f.minutes, 0);
}

/** Bitta pomodoroning shu vazifa uchun amaldagi uzunligi — dars-manbali
    vazifada dars davomiyligi (dueEndMin − dueMin), aks holda umumiy sozlama. */
export function taskPomoLengthMin(task: Task, pomoMinutes: number): number {
  if (task.source.kind === "lesson" && task.dueMin != null && task.dueEndMin != null) {
    return Math.max(1, task.dueEndMin - task.dueMin);
  }
  return pomoMinutes;
}

/* ── Aqlli roʻyxatlar (chap panel) ────────────────────────────────── */

export type SmartListKey =
  | "today"
  | "tomorrow"
  | "week"
  | "planned"
  | "nodate"
  | "done"
  | "overdue";

export const SMART_LIST_KEYS: SmartListKey[] = [
  "today",
  "tomorrow",
  "week",
  "planned",
  "nodate",
  "done",
  "overdue",
];

function isActive(t: Task): boolean {
  return t.status !== "done" && t.status !== "canceled";
}

/** Vazifa berilgan aqlli roʻyxatga tegishlimi. `today` faqat aynan bugun muddatli vazifalar — oʻtganlar `overdue`da. */
export function matchesSmartList(t: Task, list: SmartListKey, todayKey: string): boolean {
  if (list === "done") return t.status === "done" || t.status === "canceled";
  if (!isActive(t)) return false;

  if (list === "nodate") return t.dueDate == null;
  if (list === "overdue") return t.dueDate != null && t.dueDate < todayKey;
  if (t.dueDate == null) return false;

  if (list === "today") return t.dueDate === todayKey;
  if (list === "tomorrow") return t.dueDate === addDaysKey(todayKey, 1);
  if (list === "week") {
    const tomorrow = addDaysKey(todayKey, 1);
    const weekEnd = addDaysKey(todayKey, 7);
    return t.dueDate > tomorrow && t.dueDate <= weekEnd;
  }
  // planned — istalgan muddatli faol vazifa (umumiy koʻrinish)
  return true;
}

/** Chap paneldagi son hisoblagichlari. */
export function smartListCounts(tasks: Task[], todayKey: string): Record<SmartListKey, number> {
  const counts = Object.fromEntries(SMART_LIST_KEYS.map((k) => [k, 0])) as Record<SmartListKey, number>;
  for (const list of SMART_LIST_KEYS) {
    counts[list] = tasks.filter((t) => matchesSmartList(t, list, todayKey)).length;
  }
  return counts;
}

/* ── Saralash ─────────────────────────────────────────────────────── */

const PRIORITY_RANK: Record<TaskPriority, number> = { high: 0, medium: 1, low: 2, none: 3 };

/** Roʻyxat ichidagi tartib: muddat (yoʻq=oxirida) → ustuvorlik → yaratilish tartibi. */
export function sortTasks(tasks: Task[]): Task[] {
  return [...tasks].sort((a, b) => {
    if (a.dueDate !== b.dueDate) {
      if (a.dueDate == null) return 1;
      if (b.dueDate == null) return -1;
      return a.dueDate.localeCompare(b.dueDate);
    }
    if ((a.dueMin ?? -1) !== (b.dueMin ?? -1)) return (a.dueMin ?? -1) - (b.dueMin ?? -1);
    if (a.priority !== b.priority) return PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority];
    return a.sortOrder - b.sortOrder;
  });
}

/* ── Sana boʻyicha guruhlash (oʻrta panel) ───────────────────────────
   `dateField: "dueDate"` — faol roʻyxatlar; `"completedAt"` — Bajarilganlar. */

export type TaskDateGroup = { key: string; tasks: Task[] };

/** "nodate" bundan tashqari kalitlar uchun sana yorligʻi ("5-sentabr"). Bugun/ertaga
    matnlari (i18n) komponentda `key === todayKey` / `addDaysKey(todayKey,1)` orqali. */
export function formatDateGroupLabel(key: string): string {
  if (key === "nodate") return "";
  const [, m, d] = key.split("-").map(Number);
  return `${d}-${MONTHS_UZ[m - 1].toLowerCase()}`;
}

export function groupTasksByDate(
  tasks: Task[],
  opts?: { dateField?: "dueDate" | "completedAt"; order?: "asc" | "desc" }
): TaskDateGroup[] {
  const field = opts?.dateField ?? "dueDate";
  const order = opts?.order ?? "asc";
  const buckets = new Map<string, Task[]>();

  for (const t of tasks) {
    const raw = field === "dueDate" ? t.dueDate : (t.completedAt ? t.completedAt.slice(0, 10) : null);
    const key = raw ?? "nodate";
    const arr = buckets.get(key);
    if (arr) arr.push(t);
    else buckets.set(key, [t]);
  }

  const keys = [...buckets.keys()].filter((k) => k !== "nodate").sort();
  if (order === "desc") keys.reverse();
  if (buckets.has("nodate")) keys.push("nodate");

  return keys.map((key) => ({
    key,
    tasks: sortTasks(buckets.get(key)!),
  }));
}

export { todayKeyOf as todayKey, dateToKey };

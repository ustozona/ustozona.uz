import { parseRule, nextDate } from "@/lib/recurrence";

export const TASK_STATUS = {
  TODO: "todo",
  IN_PROGRESS: "in-progress",
  DONE: "done",
  CANCELED: "canceled",
} as const;

export const ASSIGNEES = [
  { id: "u-1", name: "Maxdum", initials: "MZ" },
  { id: "u-2", name: "Aliyeva N.", initials: "AN" },
  { id: "u-3", name: "Karimov B.", initials: "KB" },
];

export type TaskPriority = "high" | "medium" | "low" | "none";
export type TaskStatus = typeof TASK_STATUS[keyof typeof TASK_STATUS];

export type TaskComment = {
  id: string;
  text: string;
  createdAt: string; // ISO date
};

export type PomodoroSession = {
  id: string;
  startedAt: string;    // ISO datetime
  durationMin: number;  // necha daqiqa ishladi
  type: "focus" | "break";
};

export type Subtask = {
  id: string;
  title: string;
  isDone: boolean;
};

export type Task = {
  id: string;
  title: string;
  description: string;
  dueDate: string | null;       // "YYYY-MM-DD" (Duration: boshlanish sanasi)
  endDate: string | null;       // "YYYY-MM-DD" or null (Duration: tugash sanasi)
  dueTime: string | null;       // "HH:mm" or null (Duration: boshlanish vaqti)
  endTime?: string | null;      // "HH:mm" or null (Duration: tugash vaqti)
  isRecurring?: boolean;
  recurrenceRule?: string | null; // e.g. "every-monday"
  mentions?: string[];
  priority: TaskPriority;
  status: TaskStatus;
  classIds: string[];           // [] = shaxsiy/umumiy vazifa
  assigneeIds?: string[];       // hamkorlik uchun o'qituvchilar ID lari
  tags: string[];
  comments: TaskComment[];
  attachments: string[];        // fayl nomlari (mock)
  subtasks?: Subtask[];         // ichki vazifalar
  pomodoroSessions: PomodoroSession[];  // vaqt statistikasi
  estimatedPomodoros: number;   // rejalashtirilgan pomodoro soni
  order?: number;               // qo'lda drag-tartiblash uchun (kichik = yuqori)
  createdAt: string;
  completedAt: string | null;
};

export const PRIORITY_STYLES: Record<TaskPriority, { bg: string; text: string; dot: string; label: string }> = {
  high:   { bg: "bg-destructive/10", text: "text-destructive", dot: "bg-destructive", label: "Yuqori" },
  medium: { bg: "bg-warning/10", text: "text-warning-foreground", dot: "bg-warning", label: "O'rta" },
  low:    { bg: "bg-info/10", text: "text-info", dot: "bg-info", label: "Past" },
  none:   { bg: "bg-muted", text: "text-muted-foreground", dot: "bg-muted-foreground/40", label: "Belgilanmagan" },
};

export const STATUS_STYLES: Record<TaskStatus, { bg: string; text: string }> = {
  [TASK_STATUS.TODO]:        { bg: "bg-muted", text: "text-muted-foreground" },
  [TASK_STATUS.IN_PROGRESS]: { bg: "bg-info/10", text: "text-info" },
  [TASK_STATUS.DONE]:        { bg: "bg-success/10", text: "text-success" },
  [TASK_STATUS.CANCELED]:    { bg: "bg-destructive/10", text: "text-destructive" },
};

export const STATUS_LABELS: Record<TaskStatus, string> = {
  [TASK_STATUS.TODO]: "Kutilmoqda",
  [TASK_STATUS.IN_PROGRESS]: "Jarayonda",
  [TASK_STATUS.DONE]: "Bajarildi",
  [TASK_STATUS.CANCELED]: "Bekor qilindi",
};

/**
 * Holat ranglari — yagona manba. `dot` = ro'yxat guruh sarlavhasidagi Tailwind
 * klass (TasksList), `cssVar` = donut/diagramma kabi inline rang kerak bo'lganda
 * (Tailwind v4 palitra tokeni, xom hex emas). Label = guruh sarlavhasi matni.
 */
export const STATUS_META: { id: TaskStatus; label: string; groupLabel: string; dot: string; cssVar: string }[] = [
  { id: TASK_STATUS.TODO,        label: "Kutilmoqda",    groupLabel: "Bajarilishi kerak", dot: "bg-purple-500",  cssVar: "var(--color-purple-500)" },
  { id: TASK_STATUS.IN_PROGRESS, label: "Jarayonda",     groupLabel: "Jarayonda",         dot: "bg-orange-500",  cssVar: "var(--color-orange-500)" },
  { id: TASK_STATUS.DONE,        label: "Bajarildi",     groupLabel: "Bajarildi",         dot: "bg-emerald-500", cssVar: "var(--color-emerald-500)" },
  { id: TASK_STATUS.CANCELED,    label: "Bekor qilindi", groupLabel: "Bekor qilindi",     dot: "bg-rose-500",    cssVar: "var(--color-rose-500)" },
];

/**
 * Takrorlanuvchi vazifaning keyingi muddatini hisoblaydi (joyida oldinga surish —
 * Todoist/TickTick uslubi). Qoʻllab-quvvatlanadigan qoidalar:
 *  - "daily" / "every-day"            → +1 kun
 *  - "weekly" / "every-week"          → +7 kun
 *  - "monthly" / "every-month"        → +1 oy
 *  - "every-monday" … "every-sunday"  → shu hafta kunining keyingi sanasi
 * `from` boʻsh boʻlsa bugundan hisoblanadi. Local sana (TZ off-by-one yoʻq).
 */
export function nextRecurrenceDate(from: string | null, rule: string | null | undefined): string | null {
  const rec = parseRule(rule);
  if (!rec) return null;
  return nextDate(rec, from);
}

// Helper sanalar
const today = new Date();
const formatDate = (date: Date) => date.toISOString().split("T")[0];
const addDays = (days: number) => {
  const d = new Date(today);
  d.setDate(d.getDate() + days);
  return formatDate(d);
};

export const TASKS_DATA: Task[] = [
  {
    id: "t-1",
    title: "Oʻquvchilarning 3 choraklik davomat hisobotini tayyorlash",
    description: "Barcha sinflar bo'yicha hisobot tayyorlab, direktor o'rinbosariga topshirish kerak.",
    dueDate: addDays(-2), // overdue
    endDate: null,
    dueTime: "14:30",
    isRecurring: false,
    recurrenceRule: null,
    mentions: [],
    priority: "high",
    status: TASK_STATUS.IN_PROGRESS,
    classIds: [],
    assigneeIds: ["u-1", "u-2"],
    tags: ["hisobot", "davomat"],
    comments: [
      { id: "c-1", text: "9-A sinf ma'lumotlari chala, kiritib qo'yish kerak.", createdAt: new Date().toISOString() }
    ],
    attachments: ["davomat_shablon.xlsx"],
    pomodoroSessions: [
      { id: "p-1", startedAt: new Date(today.getTime() - 1000 * 60 * 60).toISOString(), durationMin: 25, type: "focus" }
    ],
    estimatedPomodoros: 4,
    createdAt: addDays(-5),
    completedAt: null,
  },
  {
    id: "t-2",
    title: "Yangi dars rejasini yaratish",
    description: "Ingliz tili fani bo'yicha 8-sinflar uchun yangi dars rejasi (Reading unit).",
    dueDate: formatDate(today), // bugun
    endDate: null,
    dueTime: null,
    isRecurring: false,
    recurrenceRule: null,
    mentions: [],
    priority: "medium",
    status: TASK_STATUS.TODO,
    classIds: ["8-a"],
    tags: ["dars", "reja"],
    comments: [],
    attachments: [],
    pomodoroSessions: [],
    estimatedPomodoros: 2,
    createdAt: addDays(-1),
    completedAt: null,
  },
  {
    id: "t-3",
    title: "Oʻquvchilarning insholarini tekshirish va baholash",
    description: "O'quvchilar topshirgan norasmiy xatlarni (writing) ko'rib chiqib, baholash.",
    dueDate: addDays(-1), // o'tgan
    endDate: null,
    dueTime: null,
    isRecurring: false,
    recurrenceRule: null,
    mentions: [],
    priority: "low",
    status: TASK_STATUS.DONE,
    classIds: ["9-b"],
    tags: ["writing", "baholash"],
    comments: [],
    attachments: [],
    pomodoroSessions: [
      { id: "p-2", startedAt: new Date(today.getTime() - 1000 * 60 * 60 * 24).toISOString(), durationMin: 25, type: "focus" },
      { id: "p-3", startedAt: new Date(today.getTime() - 1000 * 60 * 60 * 23).toISOString(), durationMin: 25, type: "focus" }
    ],
    estimatedPomodoros: 2,
    createdAt: addDays(-5),
    completedAt: addDays(-1),
  },
  {
    id: "t-4",
    title: "Ota-onalarga ota-onalar majlisi haqida xabar yuborish",
    description: "Majlis juma kuni soat 17:00 da bo'ladi. Hamma ota-onalarni ogohlantirish kerak.",
    dueDate: addDays(2), // upcoming
    endDate: null,
    dueTime: null,
    isRecurring: false,
    recurrenceRule: null,
    mentions: [],
    priority: "medium",
    status: TASK_STATUS.TODO,
    classIds: ["8-b"],
    tags: ["majlis", "ota-onalar"],
    comments: [],
    attachments: ["majlis_kun_tartibi.pdf"],
    pomodoroSessions: [],
    estimatedPomodoros: 1,
    createdAt: addDays(-1),
    completedAt: null,
  },
  {
    id: "t-5",
    title: "Vocabulary testlarini baholash",
    description: "",
    dueDate: addDays(3), // upcoming
    endDate: null,
    dueTime: null,
    isRecurring: false,
    recurrenceRule: null,
    mentions: [],
    priority: "high",
    status: TASK_STATUS.TODO,
    classIds: ["9-a"],
    tags: ["test"],
    comments: [],
    attachments: [],
    pomodoroSessions: [],
    estimatedPomodoros: 3,
    createdAt: formatDate(today),
    completedAt: null,
  },
  {
    id: "t-6",
    title: "Maktab tadbiriga ssenariy yozish",
    description: "Navro'z bayrami munosabati bilan tadbir ssenariysi.",
    dueDate: null, // inbox
    endDate: null,
    dueTime: null,
    isRecurring: false,
    recurrenceRule: null,
    mentions: [],
    priority: "none",
    status: TASK_STATUS.TODO,
    classIds: [],
    tags: [],
    comments: [],
    attachments: [],
    pomodoroSessions: [],
    estimatedPomodoros: 4,
    createdAt: formatDate(today),
    completedAt: null,
  },
  {
    id: "t-7",
    title: "To'garak hujjatlarini rasmiylashtirish",
    description: "Speaking Club to'garagi uchun jurnal va ro'yxatlarni to'ldirish.",
    dueDate: formatDate(today), // bugun
    endDate: null,
    dueTime: null,
    isRecurring: true,
    recurrenceRule: "every-monday",
    mentions: [],
    priority: "medium",
    status: TASK_STATUS.IN_PROGRESS,
    classIds: ["club-1"],
    tags: ["to'garak", "hujjat"],
    comments: [],
    attachments: [],
    pomodoroSessions: [
      { id: "p-4", startedAt: new Date(today.getTime() - 1000 * 60 * 30).toISOString(), durationMin: 20, type: "focus" }
    ],
    estimatedPomodoros: 2,
    createdAt: addDays(-2),
    completedAt: null,
  },
  {
    id: "t-8",
    title: "Sinf jurnalini to'ldirish (May oyi)",
    description: "",
    dueDate: addDays(-5), // overdue
    endDate: null,
    dueTime: null,
    isRecurring: false,
    recurrenceRule: null,
    mentions: [],
    priority: "high",
    status: TASK_STATUS.TODO,
    classIds: ["5-a"],
    tags: ["jurnal"],
    comments: [],
    attachments: [],
    pomodoroSessions: [],
    estimatedPomodoros: 2,
    createdAt: addDays(-10),
    completedAt: null,
  },
  {
    id: "t-9",
    title: "Audio materiallar va dars resurslarini tayyorlash",
    description: "Listening mashqlari uchun audiolarni va flashcard'larni tayyorlab qo'yish.",
    dueDate: addDays(1), // upcoming
    endDate: null,
    dueTime: null,
    isRecurring: false,
    recurrenceRule: null,
    mentions: [],
    priority: "medium",
    status: TASK_STATUS.TODO,
    classIds: [],
    tags: ["resurs"],
    comments: [],
    attachments: [],
    pomodoroSessions: [],
    estimatedPomodoros: 4,
    createdAt: formatDate(today),
    completedAt: null,
  },
  {
    id: "t-10",
    title: "Olimpiada ishtirokchilari ro'yxatini shakllantirish",
    description: "Ingliz tili fanidan maktab bosqichiga qatnashuvchilar.",
    dueDate: addDays(7),
    endDate: null,
    dueTime: null,
    isRecurring: false,
    recurrenceRule: null,
    mentions: [],
    priority: "none",
    status: TASK_STATUS.TODO,
    classIds: ["8-a", "8-b"], // umumiy
    tags: ["olimpiada"],
    comments: [],
    attachments: [],
    pomodoroSessions: [],
    estimatedPomodoros: 1,
    createdAt: formatDate(today),
    completedAt: null,
  }
];

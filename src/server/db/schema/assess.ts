import {
  boolean,
  index,
  integer,
  jsonb,
  numeric,
  pgTable,
  primaryKey,
  real,
  text,
  timestamp,
  unique,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { teachers } from "./teachers";
import { classes, students } from "./classes";

/* ════════════════════════════════════════════════════════════════════
   BAHOLASH YADROSI — docs/ost-loyihalar-arxitektura.md, B boʻlim.

   Asosiy gʻoya: jonli kviz, oʻz tezligidagi kviz, interaktiv taqdimot,
   qogʻoz OMR va QR-kartalar — besh xil MAHSULOT emas, bitta narsani
   yigʻishning besh xil USULI. Hammasi bitta `responses` jadvaliga yozadi.

   v1 qamrovi qisqartirilgan (2026-07-29): xato-tasavvur diagnostikasi,
   oʻzlashtirish (`mastery.ts`) va unutilish (`decay.ts`) qatlamlari
   YOZILMAYDI. `misconceptions` jadvali va `responses.misconceptionId`
   sxemada QOLADI (boʻsh) — v2 da qaytish arzon boʻlsin.

   `standardId` ustunlari FK EMAS — standartlar `standard_sets.data`
   JSONB hujjati ichida yashaydi (relatsion `standards` jadvali yoʻq),
   xuddi `src/lib/standards-coverage.ts` dagi `lesson.standards[]` kabi
   boʻsh (loose) matn kaliti.
   ════════════════════════════════════════════════════════════════════ */

/** mcq | pairs | categories | sequence | cloze | wordlist | number
    | imagezone | hottext | text | draw — 11 shakl (B2/B3/B4). */
export type ActivityShape =
  | "mcq"
  | "pairs"
  | "categories"
  | "sequence"
  | "cloze"
  | "wordlist"
  | "number"
  | "imagezone"
  | "hottext"
  | "text"
  | "draw";

/** Baholash strategiyasi — SHAKLDAN ALOHIDA OʻQ (B4.2). */
export type GradingKind =
  | "exact"
  | "partial"
  | "numeric"
  | "mathEquiv"
  | "keyword"
  | "aiDraft"
  | "cj"
  | "manual"
  | "none";

export const activityBanks = pgTable(
  "activity_banks",
  {
    id: text("id").primaryKey(),
    teacherId: text("teacher_id")
      .notNull()
      .references(() => teachers.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    subject: text("subject"),
    grade: integer("grade"),
    /** private | school | public — standart `private` (R57/R67/R71). */
    visibility: text("visibility").notNull().default("private"),
    /** Umumiy bankdan nusxa olinganda MANBA saqlanadi (R75). */
    copiedFrom: text("copied_from"),
    /** Moderator sifat tekshiruvidan oʻtkazgan (Ochiq masalalar №14). */
    verified: boolean("verified").notNull().default(false),
    tags: jsonb("tags").$type<string[]>().notNull().default([]),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("activity_banks_teacher_idx").on(t.teacherId)]
);

export const activities = pgTable(
  "activities",
  {
    id: text("id").primaryKey(),
    teacherId: text("teacher_id")
      .notNull()
      .references(() => teachers.id, { onDelete: "cascade" }),
    bankId: text("bank_id").references(() => activityBanks.id, { onDelete: "set null" }),
    /** Loose kalit — standard_sets.data ichidagi id (FK emas). */
    standardId: text("standard_id"),
    shape: text("shape").$type<ActivityShape>().notNull(),
    title: text("title").notNull(),
    /** Elementlar tahrirlansa oshadi — `responses.itemVersion` shu bilan qulflanadi. */
    version: integer("version").notNull().default(1),
    /** teacher | ai | bank | student ← `student` = Flashcard Factory. */
    source: text("source").notNull().default("teacher"),
    /** student/ai manbali kontent oʻqituvchi tasdigʻisiz oʻyinga chiqmaydi. */
    approved: boolean("approved").notNull().default(true),
    grading: text("grading").$type<GradingKind>().notNull().default("exact"),
    /** Shakl darajasidagi sozlama (toifalar roʻyxati, cloze matni, rasm, ...). */
    config: jsonb("config").$type<Record<string, unknown>>().notNull().default({}),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("activities_teacher_idx").on(t.teacherId),
    index("activities_bank_idx").on(t.bankId),
  ]
);

export const activityItems = pgTable(
  "activity_items",
  {
    id: text("id").primaryKey(),
    activityId: text("activity_id")
      .notNull()
      .references(() => activities.id, { onDelete: "cascade" }),
    teacherId: text("teacher_id")
      .notNull()
      .references(() => teachers.id, { onDelete: "cascade" }),
    ordinal: integer("ordinal").notNull().default(0),
    /** Shaklga qarab: mcq {stem,options:[...]}, pairs {left,right}, ... */
    content: jsonb("content").$type<Record<string, unknown>>().notNull(),
  },
  (t) => [
    index("activity_items_activity_idx").on(t.activityId),
    index("activity_items_teacher_idx").on(t.teacherId),
  ]
);

/** v1 da BOʻSH qoladi — xato-tasavvur diagnostikasi v2 ga suriladi. */
export const misconceptions = pgTable("misconceptions", {
  id: text("id").primaryKey(),
  teacherId: text("teacher_id")
    .notNull()
    .references(() => teachers.id, { onDelete: "cascade" }),
  standardId: text("standard_id"),
  label: text("label").notNull(),
  remediationRef: text("remediation_ref"),
});

export const activitySets = pgTable(
  "activity_sets",
  {
    id: text("id").primaryKey(),
    teacherId: text("teacher_id")
      .notNull()
      .references(() => teachers.id, { onDelete: "cascade" }),
    classId: text("class_id")
      .notNull()
      .references(() => classes.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    /** formative | summative ← YADRO AJRATUVCHI (publish.ts shu bilan tekshiradi). */
    purpose: text("purpose").notNull(),
    /** [{ activityId, role }] — ROLLI roʻyxat (R46). role: entry|check|vocabulary|practice|exit. */
    items: jsonb("items").$type<{ activityId: string; role: string }[]>().notNull().default([]),
    /** none | deck | video | passage (B4.3). */
    containerKind: text("container_kind").notNull().default("none"),
    /** deck: null · video: YouTube id · passage: matn boʻlagi id. */
    containerRef: text("container_ref"),
    /** defaultTimeLimit va h.k. — toʻplam darajasidagi sozlama. */
    config: jsonb("config").$type<Record<string, unknown>>().notNull().default({}),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("activity_sets_teacher_idx").on(t.teacherId),
    index("activity_sets_class_idx").on(t.classId),
  ]
);

export const quizSessions = pgTable(
  "quiz_sessions",
  {
    id: text("id").primaryKey(),
    teacherId: text("teacher_id")
      .notNull()
      .references(() => teachers.id, { onDelete: "cascade" }),
    setId: text("set_id")
      .notNull()
      .references(() => activitySets.id, { onDelete: "cascade" }),
    /** MAJBURIY — sessiya sinfsiz boshlanmaydi (R43). */
    classId: text("class_id")
      .notNull()
      .references(() => classes.id, { onDelete: "cascade" }),
    /** Sessiyaning OʻZ nomi (R73) — boʻsh boʻlsa toʻplam nomi koʻrsatiladi. */
    title: text("title"),
    /** live | selfpaced | paper | qrcards | lecture — sessiya oʻrtasida almashadi (R106). */
    mode: text("mode").notNull(),
    /** `selfpaced` qaysi indeksgacha amal qiladi (R106). */
    modeBoundary: integer("mode_boundary"),
    /** draft | scheduled | running | paused | completed (R1). */
    state: text("state").notNull().default("draft"),
    /** Sessiya yopilgandan keyin ham SAQLANADI (R49). */
    joinCode: text("join_code"),
    currentIndex: integer("current_index").notNull().default(0),
    /** { templateId, memeSetId?, theme, pointsMultiplier?, shuffleAnswers,
        showQuestionOnDevice, gameShell, feedback, timer, focusMode,
        accommodationOverrides? } — SHABLON SHU YERDA, jadval yoʻq. */
    renderConfig: jsonb("render_config").$type<Record<string, unknown>>().notNull().default({}),
    /** { kind: "allItems" } | { kind: "correctCount", n } (R73). */
    completion: jsonb("completion").$type<Record<string, unknown>>().notNull().default({ kind: "allItems" }),
    runtimeRef: text("runtime_ref"),
    scheduledAt: timestamp("scheduled_at", { withTimezone: true }),
    openedAt: timestamp("opened_at", { withTimezone: true }),
    pausedAt: timestamp("paused_at", { withTimezone: true }),
    closedAt: timestamp("closed_at", { withTimezone: true }),
    dueAt: timestamp("due_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("quiz_sessions_teacher_idx").on(t.teacherId),
    index("quiz_sessions_class_idx").on(t.classId),
    index("quiz_sessions_set_idx").on(t.setId),
  ]
);

/** Guruh rejimi (B5.1) — FAQAT reyting/ball qatlami, javob egaligiga tegmaydi. */
export const sessionTeams = pgTable(
  "session_teams",
  {
    id: text("id").primaryKey(),
    sessionId: text("session_id")
      .notNull()
      .references(() => quizSessions.id, { onDelete: "cascade" }),
    teacherId: text("teacher_id")
      .notNull()
      .references(() => teachers.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    color: text("color"),
  },
  (t) => [index("session_teams_session_idx").on(t.sessionId)]
);

export const sessionParticipants = pgTable(
  "session_participants",
  {
    id: text("id").primaryKey(),
    sessionId: text("session_id")
      .notNull()
      .references(() => quizSessions.id, { onDelete: "cascade" }),
    /** STANDART HOLDA TOʻLADI (R43) — ishtirokchi sinf roʻyxatidan oʻz ismini
        TANLAYDI. Anonim (null) istisno, standart emas. */
    studentId: text("student_id").references(() => students.id, { onDelete: "set null" }),
    /** Har OʻQUVCHI oʻz qurilmasida, oʻz qatori bilan; guruh faqat birlashtiradi. */
    teamId: text("team_id").references(() => sessionTeams.id, { onDelete: "set null" }),
    displayName: text("display_name").notNull(),
    /** localStorage'dagi token'ning hash'i — akkauntsiz ishtirokchi. */
    tokenHash: text("token_hash").notNull(),
    /** Plickers karta raqami kabi belgi. */
    deviceLabel: text("device_label"),
    /** mobile | tablet | desktop — FAQAT qoʻpol toifa (R125). */
    deviceKind: text("device_kind"),
    /** Oʻyin iqtisodi (tanga, minora, kolleksiya) — SESSIYAGA XOS (B5.5). */
    gameState: jsonb("game_state").$type<Record<string, unknown>>().notNull().default({}),
    /** Video koʻrish telemetriyasi (B4.3). */
    progress: jsonb("progress").$type<Record<string, unknown>>().notNull().default({}),
    /** { tabSwitch: { total, byItem, lastAt } } (R124) — sessiya bilan oʻladi. */
    integrity: jsonb("integrity").$type<Record<string, unknown>>().notNull().default({}),
    joinedAt: timestamp("joined_at", { withTimezone: true }).notNull().defaultNow(),
    lastSeenAt: timestamp("last_seen_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("session_participants_session_idx").on(t.sessionId),
    index("session_participants_student_idx").on(t.studentId),
    index("session_participants_team_idx").on(t.teamId),
  ]
);

export const responses = pgTable(
  "responses",
  {
    id: text("id").primaryKey(),
    teacherId: text("teacher_id")
      .notNull()
      .references(() => teachers.id, { onDelete: "cascade" }),
    sessionId: text("session_id")
      .notNull()
      .references(() => quizSessions.id, { onDelete: "cascade" }),
    participantId: text("participant_id")
      .notNull()
      .references(() => sessionParticipants.id, { onDelete: "cascade" }),
    /** Anonim ishtirokchida null — jurnalga koʻchirish bosqichida jimgina oʻtkazib yuboriladi. */
    studentId: text("student_id").references(() => students.id, { onDelete: "set null" }),
    activityId: text("activity_id")
      .notNull()
      .references(() => activities.id, { onDelete: "cascade" }),
    itemId: text("item_id")
      .notNull()
      .references(() => activityItems.id, { onDelete: "cascade" }),
    /** Element tahrirlansa oʻtmishdagi javoblar qayta yozilmaydi. */
    itemVersion: integer("item_version").notNull().default(1),
    /** 1 dan boshlanadi — koʻp urinish ALOHIDA qator (R11). */
    attemptNo: integer("attempt_no").notNull().default(1),
    /** mcq: {optionId} · pairs: {matchedId} · sequence: {position} ... */
    answer: jsonb("answer").$type<Record<string, unknown>>().notNull(),
    isCorrect: boolean("is_correct"),
    /** 0..1 — QISMAN BAHOLASH (R26). Bitta javobli shakllarda 0 yoki 1. */
    score: numeric("score", { precision: 4, scale: 3 }),
    /** FAQAT mcq da toʻladi (v1 da yozilmaydi — v2 uchun ustun qoladi). */
    misconceptionId: text("misconception_id").references(() => misconceptions.id, {
      onDelete: "set null",
    }),
    standardId: text("standard_id"),
    /** teacher | ai | bank | student — activities.source'dan koʻchirilgan. */
    source: text("source"),
    /** Ishonch rejimi yoqilgan sessiyalarda toʻladi, aks holda null (R90). */
    confidence: text("confidence"),
    /** Shu javob paytida oʻquvchida yoqilgan ELEMENTGA TAʼSIR QILUVCHI moslashuvlar (R13). */
    accommodations: jsonb("accommodations").$type<string[]>(),
    elapsedMs: integer("elapsed_ms"),
    clientSeq: integer("client_seq"),
    answeredAt: timestamp("answered_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    unique("responses_participant_item_attempt_unique").on(
      t.participantId,
      t.itemId,
      t.itemVersion,
      t.attemptNo
    ),
    index("responses_student_standard_idx").on(t.studentId, t.standardId),
    index("responses_misconception_idx")
      .on(t.misconceptionId)
      .where(sql`${t.misconceptionId} is not null`),
    index("responses_session_idx").on(t.sessionId),
  ]
);

export const studentAccommodations = pgTable(
  "student_accommodations",
  {
    id: text("id").primaryKey(),
    teacherId: text("teacher_id")
      .notNull()
      .references(() => teachers.id, { onDelete: "cascade" }),
    studentId: text("student_id")
      .notNull()
      .references(() => students.id, { onDelete: "cascade" }),
    kind: text("kind").notNull(),
    config: jsonb("config").$type<Record<string, unknown>>().notNull().default({}),
    /** student (doimiy) | class | set | session — eng tor qamrov ustun turadi. */
    scope: text("scope").notNull().default("student"),
    scopeRef: text("scope_ref"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    unique("student_accommodations_unique").on(t.studentId, t.kind, t.scope, t.scopeRef),
    index("student_accommodations_teacher_idx").on(t.teacherId),
  ]
);

/** pending | needs_review | committed | rejected — KOʻRIB CHIQISH DARVOZASI. */
export const omrScans = pgTable(
  "omr_scans",
  {
    id: text("id").primaryKey(),
    teacherId: text("teacher_id")
      .notNull()
      .references(() => teachers.id, { onDelete: "cascade" }),
    sessionId: text("session_id")
      .notNull()
      .references(() => quizSessions.id, { onDelete: "cascade" }),
    imageUrl: text("image_url").notNull(),
    sheetLayout: jsonb("sheet_layout").$type<Record<string, unknown>>().notNull().default({}),
    detected: jsonb("detected").$type<Record<string, unknown>>().notNull().default({}),
    status: text("status").notNull().default("pending"),
    reviewedBy: text("reviewed_by").references(() => teachers.id, { onDelete: "set null" }),
    committedAt: timestamp("committed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("omr_scans_session_idx").on(t.sessionId)]
);

/* ── Qiyosiy baholash (CJ) — responses'ga TUSHMAYDI, natija darajasida. ── */

export const cjTasks = pgTable(
  "cj_tasks",
  {
    id: text("id").primaryKey(),
    teacherId: text("teacher_id")
      .notNull()
      .references(() => teachers.id, { onDelete: "cascade" }),
    classId: text("class_id")
      .notNull()
      .references(() => classes.id, { onDelete: "cascade" }),
    /** Qaysi toʻplam/sessiyadan `text`/`draw` javoblar yigʻilgan (ixtiyoriy). */
    setId: text("set_id").references(() => activitySets.id, { onDelete: "set null" }),
    title: text("title").notNull(),
    status: text("status").notNull().default("open"), // open | closed
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    closedAt: timestamp("closed_at", { withTimezone: true }),
  },
  (t) => [index("cj_tasks_teacher_idx").on(t.teacherId)]
);

/** `text`/`draw` javoblari TOʻGʻRIDAN-TOʻGʻRI CJ skriptidir — responseId shu javobga ishora qiladi. */
export const cjScripts = pgTable(
  "cj_scripts",
  {
    id: text("id").primaryKey(),
    taskId: text("task_id")
      .notNull()
      .references(() => cjTasks.id, { onDelete: "cascade" }),
    responseId: text("response_id").references(() => responses.id, { onDelete: "cascade" }),
    studentId: text("student_id").references(() => students.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("cj_scripts_task_idx").on(t.taskId)]
);

export const cjJudgements = pgTable(
  "cj_judgements",
  {
    id: text("id").primaryKey(),
    taskId: text("task_id")
      .notNull()
      .references(() => cjTasks.id, { onDelete: "cascade" }),
    teacherId: text("teacher_id")
      .notNull()
      .references(() => teachers.id, { onDelete: "cascade" }),
    leftScriptId: text("left_script_id")
      .notNull()
      .references(() => cjScripts.id, { onDelete: "cascade" }),
    rightScriptId: text("right_script_id")
      .notNull()
      .references(() => cjScripts.id, { onDelete: "cascade" }),
    winnerScriptId: text("winner_script_id")
      .notNull()
      .references(() => cjScripts.id, { onDelete: "cascade" }),
    judgedAt: timestamp("judged_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("cj_judgements_task_idx").on(t.taskId)]
);

/** `src/lib/cj-ranking.ts` (`rankScripts`) natijasining saqlangan koʻrinishi. */
export const cjRanks = pgTable(
  "cj_ranks",
  {
    taskId: text("task_id")
      .notNull()
      .references(() => cjTasks.id, { onDelete: "cascade" }),
    scriptId: text("script_id")
      .notNull()
      .references(() => cjScripts.id, { onDelete: "cascade" }),
    wins: integer("wins").notNull().default(0),
    comparisons: integer("comparisons").notNull().default(0),
    score: real("score").notNull().default(0),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.taskId, t.scriptId] })]
);

export type ActivityBankRow = typeof activityBanks.$inferSelect;
export type ActivityRow = typeof activities.$inferSelect;
export type ActivityItemRow = typeof activityItems.$inferSelect;
export type MisconceptionRow = typeof misconceptions.$inferSelect;
export type ActivitySetRow = typeof activitySets.$inferSelect;
export type QuizSessionRow = typeof quizSessions.$inferSelect;
export type SessionTeamRow = typeof sessionTeams.$inferSelect;
export type SessionParticipantRow = typeof sessionParticipants.$inferSelect;
export type ResponseRow = typeof responses.$inferSelect;
export type NewResponseRow = typeof responses.$inferInsert;
export type StudentAccommodationRow = typeof studentAccommodations.$inferSelect;
export type OmrScanRow = typeof omrScans.$inferSelect;
export type CjTaskRow = typeof cjTasks.$inferSelect;
export type CjScriptRow = typeof cjScripts.$inferSelect;
export type CjJudgementRow = typeof cjJudgements.$inferSelect;
export type CjRankRow = typeof cjRanks.$inferSelect;

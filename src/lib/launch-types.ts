/* ════════════════════════════════════════════════════════════════════
   TOPSHIRIQLAR — «BOSHLASH MARKAZI» UMUMIY TIPLARI.

   docs/topshiriq-boshlash-markazi.md. Neytral modul: `"use server"`
   fayli ham (`actions/assess-runs.ts`), mijoz ham shu yerdan import
   qiladi — server action faylidan tip eksport qilish TAQIQ (AGENTS.md).
   ════════════════════════════════════════════════════════════════════ */

import type { SetContentSummary } from "./baholash-shells";

/** Oʻtkazish oynasi uchun test pasporti — oʻyin mosligi shundan hisoblanadi. */
export type LaunchSetInfo = {
  setId: string;
  title: string;
  /** Toʻplamdagi faoliyatlar (savol + slayd). */
  itemCount: number;
  /** Baholanadigan savollar — jurnal maxraji. */
  gradedTotal: number;
  /** `formative` toʻplam jurnalga yozilmaydi (fon importi). */
  purpose: "formative" | "summative";
  /** Qobiq mosligi uchun (`shellAvailability`). */
  content: SetContentSummary;
  /** Variantli (mcq) savollar — qogʻoz, karta va pult faqat shularni oʻqiydi. */
  mcqCount: number;
  /** Slayd bor — taqdimot: jonli darsga eng mos. */
  hasSlides: boolean;
  /** LessonLab dvigateli (PDF varaq, OMR) sozlanganmi — qogʻoz yoʻli uchun. */
  engineReady: boolean;
  /** Rasm oʻqiydigan AI sozlanganmi — tezkor tekshirish (qoʻlda yozilgan varaq). */
  quickReady: boolean;
  /** Oʻyin qobiqlari serveri manzili berilganmi. */
  gamesReady: boolean;
};

/** Oʻqituvchi tanlaydigan usul — «Qanday oʻtkazamiz?» plitkalari. */
/** Oʻqituvchining BIRINCHI qarori — tugma nomi ham shu: «Darsda
    oʻtkazish» yoki «Uyga berish». Usul (jonli dars, qogʻoz, pult...)
    — ikkinchi qaror, faqat darsda. */
export type LaunchIntent = "class" | "home";

export type LaunchMode =
  | "live"
  | "game"
  | "selfpaced"
  | "paper"
  | "quick"
  | "cards"
  | "pult"
  | "homework";

/** Serverda darhol sessiya ochadigan usullar. Qolganlari oʻz yoʻlidan:
    `live` — Doska, `paper`/`cards`/`pult` — `applyOmrScan()`. */
export type RunStartKind = "selfpaced" | "homework" | "game";

/** Roʻyxat va natija ekranidagi ish turi — sessiyadan HISOBLANADI. */
export type RunKind = "live" | "game" | "homework" | "selfpaced" | "offline";

export type RunState = "draft" | "scheduled" | "running" | "paused" | "completed";

/** Bitta oʻtkazish (sessiya) — «Hozir ochiq» roʻyxatidagi qator. */
export type RunSummary = {
  sessionId: string;
  setId: string;
  classId: string;
  title: string;
  kind: RunKind;
  /** Oʻyin qobigʻi (`lib/baholash-shells.ts`) — faqat `game` da. */
  shellId: string | null;
  state: RunState;
  joinCode: string | null;
  /** ISO — uy vazifasi muddati. */
  dueAt: string | null;
  /** Muddat oʻtgan — sessiya ochiq boʻlsa ham javob qabul qilinmaydi. */
  pastDue: boolean;
  /** Ochiq, muddatsiz va 12 soatdan beri — dars allaqachon tugagan,
      yopish esdan chiqqan (masalan Doskada tashlab ketilgan jonli dars).
      «Hozir ochiq» emas — «Natija kutmoqda» guruhida turadi. */
  stale: boolean;
  createdAt: string;
  /** Sinfning joriy roʻyxati. */
  rosterSize: number;
  /** Qoʻshilgan oʻquvchilar (bola boʻyicha, qurilma emas). */
  joined: number;
  /** Barcha baholanadigan savolga javob bergan oʻquvchilar. */
  finished: number;
  /** Natija jurnalga yozilgan boʻlsa — ustun id'si. */
  publishedAssignmentId: string | null;
  /** Jurnalga yozish mumkinmi (summativ toʻplam + baholanadigan savol bor). */
  gradable: boolean;
};

export type RunRosterStatus = "waiting" | "working" | "done";

export type RunRosterRow = {
  studentId: string;
  /** Sinf roʻyxatidagi tartib raqami — QR-karta, varaq va pult raqami. */
  no: number;
  name: string;
  status: RunRosterStatus;
  /** Javob bergan baholanadigan savollar (birinchi urinish). */
  answered: number;
  /** 0..100, qoʻshilmagan boʻlsa `null`. */
  percent: number | null;
};

/** Natija qayerga yoziladi — `publish.ts → findPublishTarget` bilan AYNAN bir xil. */
export type RunTarget =
  | {
      kind: "existing";
      assignmentId: string;
      title: string;
      topicId: string | null;
      /** Test topshiriqqa biriktirilgan (hali yozilmagan) yoki allaqachon yozilgan. */
      published: boolean;
    }
  | { kind: "new" };

export type RunTopic = { id: string; name: string; color: string; purpose: string };

export type RunMonitorData = {
  run: RunSummary;
  className: string;
  /** Baholanadigan savollar soni — foiz maxraji. */
  gradedTotal: number;
  roster: RunRosterRow[];
  /** Roʻyxatsiz (anonim) ishtirokchilar — jurnalga tushmaydi. */
  anonymous: number;
  target: RunTarget;
  topics: RunTopic[];
  /** Yakunlangan yoki muddati oʻtgan — yarim natija jurnalga tushmasin. */
  canPublish: boolean;
  /** Hali baholanmagan ochiq javoblar — «Jurnalga» dan oldin koʻrinsin. */
  openAnswersPending: number;
  /** LessonLab dvigateli sozlanganmi — qogʻoz sessiyasiga varaq qoʻshish uchun. */
  engineReady: boolean;
};

export type PublishRunResult = {
  assignmentId: string;
  publishedCount: number;
  skippedAnonymous: number;
};

/** Pult rejimi uchun savol — varaq raqamlanishi bilan AYNAN bir xil. */
export type PultQuestion = {
  /** Varaqdagi savol raqami (1..N) — `applyOmrScan` shu kalit bilan yozadi. */
  no: number;
  stem: string;
  /** A..D — pultda 4 tugma, qolgan variant chizilmaydi. */
  options: { letter: string; text: string }[];
  /** Toʻgʻri harflar — faqat oʻqituvchi ekrani uchun. */
  correct: string[];
  /** Variantli savol emas (juftlik, ochiq javob) — pultda oʻtkazib yuboriladi. */
  gradable: boolean;
  /** 4 tadan koʻp variant bor — ogohlantirish. */
  truncated: boolean;
};

export type PultPlan = {
  title: string;
  className: string;
  roster: { no: number; id: string; name: string }[];
  questions: PultQuestion[];
  /** Shu test bu sinfda allaqachon qogʻoz/karta/pult bilan kiritilgan bolalar. */
  alreadyEntered: string[];
};

import { lessonModel, stagePlan, LESSON_MODELS } from "@/lib/lesson-models";
import type { GameFile } from "@/lib/games";

/* ════════════════════════════════════════════════════════════════════
   DARS STUDIYASI — dars rejasi va dars ssenariysining maʼlumot modeli.

   docs/dars-studiyasi-spec.md. Topshiriqlar sahifasi endi «ertaga 9-A da
   nima qilaman?» savoliga javob beradi: chapda — dars rejasi (model,
   bosqichlar, daqiqalar), oʻrtada — shu reja asosida tayyor ssenariy
   (bloklar ketma-ketligi), oʻngda — tanlangan blok uchun tavsiyalar.

   Saqlanishi — `lessons.data` JSONB ichida (`Lesson.studioByClass`),
   migratsiyasiz. Sinf boʻyicha, chunki bitta mavzu ikki sinfda turli
   sharoitda oʻtadi: 9-A da telefon bor, 9-B da yoʻq — tekshirish usuli
   ham, oʻyin ham boshqa.

   Blok — Doskaning bitta ekraniga mos keladigan birlik (kelgusi «Dars
   rejimi»): tushuntirish → taqdimot, tekshiruv → savol + yigʻish usuli,
   oʻyin → oʻyin oynasi, faoliyat → taymer/guruhlar. Shu sabab blokda
   faqat HAVOLA turadi (toʻplam `setId`, oʻyin nomi), mazmunning oʻzi
   mavjud jadvallarda qoladi.

   `server-only` EMAS — sof maʼlumot va funksiyalar; klient ham, AI
   tahlilchisi ham shu yerdan oladi.
   ════════════════════════════════════════════════════════════════════ */

/** Blok turi — ssenariydagi qadamning VAZIFASI (material turi emas). */
export const STUDIO_BLOCK_KINDS = [
  "warmup",
  "explain",
  "activity",
  "game",
  "check",
  "exit",
  "homework",
] as const;
export type StudioBlockKind = (typeof STUDIO_BLOCK_KINDS)[number];

/** Darsda javob yigʻish usuli. `oral` — texnikasiz (qoʻl koʻtarish,
    doskada yechish): har sinfda ishlaydi, jurnalga avtomatik tushmaydi. */
/* `quick` — tezkor tekshirish: oʻquvchi istalgan varaqqa javob harflarini
   yozadi, ustoz telefonda suratga oladi, AI oʻqiydi. Printer ham, oʻquvchi
   telefoni ham kerak emas — texnikasiz sinfning baholanadigan yoʻli. */
export const CHECK_METHODS = ["cards", "pult", "paper", "live", "selfpaced", "quick", "oral"] as const;
export type CheckMethod = (typeof CHECK_METHODS)[number];

/** Baholanadigan oʻyin qobiqlari (`lib/baholash-shells.ts`). */
export type GradedShellId = "arqon" | "poyga";

/** Mashq oʻyinlari — oʻz kontenti bilan, jurnalga tushmaydi. */
export const PRACTICE_GAME_FILES = ["xotira", "krossvord", "so-z-topish", "qaysi-katta"] as const satisfies readonly GameFile[];
export type PracticeGameFile = (typeof PRACTICE_GAME_FILES)[number];

export type StudioGame =
  | { type: "shell"; id: GradedShellId }
  | { type: "practice"; file: PracticeGameFile }
  | { type: "link"; url: string; label: string };

export type StudioBlock = {
  id: string;
  kind: StudioBlockKind;
  /** Boʻsh — tur nomi koʻrsatiladi (tarjima mijozda). */
  title?: string;
  /** AI yoki oʻqituvchi yozgan qisqa mazmun: nima qilinadi, nima soʻraladi. */
  brief?: string;
  /** Ulangan toʻplam (taqdimot yoki test) — `activity_sets.id`. */
  setId?: string | null;
  /** Toʻplam nomi — roʻyxatda soʻrovsiz koʻrinishi uchun nusxa. */
  setTitle?: string;
  /** Tekshiruv / uy vazifasi — tanlangan yigʻish usuli. */
  method?: CheckMethod;
  /** Oʻyin bloki — tanlangan oʻyin. */
  game?: StudioGame;
};

export type StudioStage = {
  id: string;
  /** Model bosqichining barqaror kodi (`LessonModelStage.code`). */
  code: string;
  name: string;
  minutes: number;
  goal: string;
  /** Oʻqituvchi nima qiladi (qisqa). */
  teacher?: string;
  /** Oʻquvchilar nima qiladi (qisqa). */
  students?: string;
  blocks: StudioBlock[];
};

export type LessonStudio = {
  v: 1;
  modelKey: string;
  duration: number;
  /** Dars maqsadi — «dars oxirida oʻquvchi …». */
  objective?: string;
  /** Muvaffaqiyat mezonlari (2–4 ta qisqa band). */
  criteria?: string[];
  stages: StudioStage[];
  /** Oʻqituvchi rejani koʻrib chiqib qabul qildi. */
  accepted: boolean;
  source: "ai" | "template";
  updatedAt: string;
};

/* ── Bosqich roli — model bosqichidan blok taklifiga ─────────────────
   13 modelning bosqichlari turli nomda, lekin darsdagi vazifasi beshta:
   boshlash, tushuntirish, mashq, tekshirish, yakun. Taklif shu rol
   boʻyicha tuziladi — yangi model qoʻshilsa faqat shu jadval toʻldiriladi,
   nomaʼlum kod «mashq» deb olinadi (eng xavfsiz: faoliyat bloki). */
export type StageRole = "warmup" | "explain" | "practice" | "check" | "wrap";

const ROLE_BY_CODE: Record<string, StageRole> = {
  ENGAGE: "warmup", REVIEW: "warmup", ATTENTION: "warmup", OBJECTIVES: "warmup", RECALL: "warmup",
  LEAD_IN: "warmup", PRE_TASK: "warmup", PRE_READING: "warmup", ANCHOR: "warmup", PROBLEM: "warmup",
  QUESTION: "warmup", PREDICT: "warmup", BRAIN_DUMP: "warmup", DRIVING_QUESTION: "warmup",
  EXPLAIN: "explain", I_DO: "explain", CONTENT: "explain", GUIDANCE: "explain", PRESENTATION: "explain",
  LANGUAGE_FOCUS: "explain", CONCEPTUALIZE: "explain", GENERALIZE: "explain", SOURCES: "explain",
  RUN: "explain", INVESTIGATE: "explain", CONCRETE: "explain", PICTORIAL: "explain",
  EVALUATE: "check", CHECK: "check", ASSESS: "check", QUIZ: "check", FEEDBACK: "check", CLAIM: "check",
  WRAP_UP: "wrap", REFLECT: "wrap", TRANSFER: "wrap",
};

export function stageRole(code: string): StageRole {
  return ROLE_BY_CODE[code] ?? "practice";
}

export function newId(prefix: string): string {
  const rnd =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID().slice(0, 8)
      : Math.random().toString(36).slice(2, 10);
  return `${prefix}-${rnd}`;
}

/** Sinf sharoitining ssenariy uchun muhim qismi. */
export type StudioEnvHint = {
  phones: boolean;
  /** Proyektor yoki smartdoska — ekranda koʻrsatish mumkin. */
  screen: boolean;
  printer: boolean;
  pult: boolean;
};

/** Sharoitga qarab tekshiruvning birinchi tavsiya qilinadigan usuli.
    Tartib `studio-advice.ts` dagi reyting bilan bir xil manbadan. */
export function defaultCheckMethod(env: StudioEnvHint): CheckMethod {
  if (env.phones && env.screen) return "live";
  if (env.printer) return "cards";
  if (env.pult) return "pult";
  if (env.phones) return "selfpaced";
  // Texnikasiz sinf: ogʻzaki emas — baholanadigan tezkor tekshirish.
  return "quick";
}

function block(kind: StudioBlockKind, extra: Partial<StudioBlock> = {}): StudioBlock {
  return { id: newId("b"), kind, ...extra };
}

/** Bosqich roli → standart bloklar. AI ishlamasa yoki oʻqituvchi «AI'siz»
    tanlasa ham ssenariy boʻsh boʻlmaydi — tuzilma tayyor, mazmun keyin. */
function blocksForRole(role: StageRole, env: StudioEnvHint, isLast: boolean): StudioBlock[] {
  switch (role) {
    case "warmup":
      return [block("warmup")];
    case "explain":
      return [block("explain")];
    case "practice":
      // Ekran boʻlsa — oʻyin (butun sinf koʻradi), boʻlmasa — juft/guruh ishi.
      return env.screen ? [block("activity"), block("game")] : [block("activity")];
    case "check":
      return isLast
        ? [block("check", { method: defaultCheckMethod(env) }), block("homework")]
        : [block("check", { method: defaultCheckMethod(env) })];
    case "wrap":
      return isLast ? [block("exit"), block("homework")] : [block("exit")];
  }
}

/** AI'siz ssenariy — model bosqichlari, daqiqalar va har bosqichga
    standart bloklar. Uy vazifasi doim oxirgi bosqichda bitta. */
export function templateStudio(opts: {
  modelKey: string;
  duration: number;
  env: StudioEnvHint;
  objective?: string;
}): LessonStudio {
  const model = lessonModel(opts.modelKey) ?? LESSON_MODELS[0];
  const rows = stagePlan(model.key, opts.duration);
  const stages: StudioStage[] = rows.map((row, i) => ({
    id: newId("s"),
    code: row.code,
    name: row.name,
    minutes: row.minutes,
    goal: row.goal,
    blocks: blocksForRole(stageRole(row.code), opts.env, i === rows.length - 1),
  }));
  ensureHomework(stages);
  return {
    v: 1,
    modelKey: model.key,
    duration: opts.duration,
    objective: opts.objective?.trim() || undefined,
    stages,
    accepted: false,
    source: "template",
    updatedAt: new Date().toISOString(),
  };
}

/** Uy vazifasi bloki faqat bitta va oxirgi bosqichda boʻlsin. */
export function ensureHomework(stages: StudioStage[]): void {
  if (!stages.length) return;
  let found: StudioBlock | null = null;
  for (const st of stages) {
    const hw = st.blocks.filter((b) => b.kind === "homework");
    if (hw.length && !found) found = hw[0];
    st.blocks = st.blocks.filter((b) => b.kind !== "homework");
  }
  stages[stages.length - 1].blocks.push(found ?? block("homework"));
}

/* ── Tayyorlik ───────────────────────────────────────────────────── */

/** Bu blok darsga tayyormi. Faoliyat va ogʻzaki tekshiruv materialsiz
    ham tayyor (oʻqituvchi yoʻriqnomasi yetarli); qolganlari — material
    yoki oʻyin tanlangach. */
export function blockReady(b: StudioBlock): boolean {
  switch (b.kind) {
    case "activity":
      return true;
    case "game":
      if (!b.game) return false;
      return b.game.type === "shell" ? Boolean(b.setId) : true;
    case "check":
      return Boolean(b.setId) || b.method === "oral";
    default:
      return Boolean(b.setId);
  }
}

export function studioBlocks(studio: LessonStudio): StudioBlock[] {
  return studio.stages.flatMap((s) => s.blocks);
}

export function studioReadiness(studio: LessonStudio): { ready: number; total: number } {
  const blocks = studioBlocks(studio);
  return { ready: blocks.filter(blockReady).length, total: blocks.length };
}

/** Bosqichlar daqiqalari yigʻindisi. */
export function studioMinutes(studio: LessonStudio): number {
  return studio.stages.reduce((sum, s) => sum + (Number.isFinite(s.minutes) ? s.minutes : 0), 0);
}

/* ── Oʻzgartirish yordamchilari (immutabel) ──────────────────────── */

export function patchStage(studio: LessonStudio, stageId: string, patch: Partial<StudioStage>): LessonStudio {
  return touch({ ...studio, stages: studio.stages.map((s) => (s.id === stageId ? { ...s, ...patch } : s)) });
}

export function patchBlock(studio: LessonStudio, blockId: string, patch: Partial<StudioBlock>): LessonStudio {
  return touch({
    ...studio,
    stages: studio.stages.map((s) =>
      s.blocks.some((b) => b.id === blockId)
        ? { ...s, blocks: s.blocks.map((b) => (b.id === blockId ? { ...b, ...patch } : b)) }
        : s,
    ),
  });
}

export function addBlock(studio: LessonStudio, stageId: string, kind: StudioBlockKind, env: StudioEnvHint): LessonStudio {
  const extra: Partial<StudioBlock> = kind === "check" ? { method: defaultCheckMethod(env) } : {};
  return touch({
    ...studio,
    stages: studio.stages.map((s) => (s.id === stageId ? { ...s, blocks: [...s.blocks, block(kind, extra)] } : s)),
  });
}

export function removeBlock(studio: LessonStudio, blockId: string): LessonStudio {
  return touch({
    ...studio,
    stages: studio.stages.map((s) => ({ ...s, blocks: s.blocks.filter((b) => b.id !== blockId) })),
  });
}

/** Blokni bosqich ichida bir pogʻona yuqori/pastga. */
export function moveBlock(studio: LessonStudio, blockId: string, dir: -1 | 1): LessonStudio {
  return touch({
    ...studio,
    stages: studio.stages.map((s) => {
      const i = s.blocks.findIndex((b) => b.id === blockId);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= s.blocks.length) return s;
      const blocks = [...s.blocks];
      [blocks[i], blocks[j]] = [blocks[j], blocks[i]];
      return { ...s, blocks };
    }),
  });
}

function touch(studio: LessonStudio): LessonStudio {
  return { ...studio, updatedAt: new Date().toISOString() };
}

/* ── Saqlangan hujjatni tekshirish ──────────────────────────────────
   `lessons.data` erkin JSONB: boshqa qurilma eski versiyani yozgan
   boʻlishi yoki maydon buzilgan boʻlishi mumkin. Oʻqishda yumshoq
   tozalaymiz — buzilgan blok tashlanadi, butun ssenariy emas. */

const isObj = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);
const str = (v: unknown, max: number): string | undefined =>
  typeof v === "string" && v.trim() ? v.trim().slice(0, max) : undefined;

const SHELL_IDS: readonly GradedShellId[] = ["arqon", "poyga"];

export function normalizeGame(raw: unknown): StudioGame | undefined {
  if (!isObj(raw)) return undefined;
  if (raw.type === "shell") {
    const id = SHELL_IDS.find((s) => s === raw.id);
    return id ? { type: "shell", id } : undefined;
  }
  if (raw.type === "practice") {
    const file = PRACTICE_GAME_FILES.find((f) => f === raw.file);
    return file ? { type: "practice", file } : undefined;
  }
  if (raw.type === "link") {
    const url = safeHttpUrl(raw.url);
    return url ? { type: "link", url, label: str(raw.label, 80) ?? new URL(url).hostname } : undefined;
  }
  return undefined;
}

/** Faqat http(s) havola — `javascript:` kabi sxema ssenariyga tushmasin. */
export function safeHttpUrl(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  try {
    const url = new URL(raw.trim());
    return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : null;
  } catch {
    return null;
  }
}

function normalizeBlock(raw: unknown): StudioBlock | null {
  if (!isObj(raw)) return null;
  const kind = STUDIO_BLOCK_KINDS.find((k) => k === raw.kind);
  if (!kind) return null;
  const method = CHECK_METHODS.find((m) => m === raw.method);
  return {
    id: str(raw.id, 60) ?? newId("b"),
    kind,
    title: str(raw.title, 120),
    brief: str(raw.brief, 600),
    setId: str(raw.setId, 200) ?? null,
    setTitle: str(raw.setTitle, 200),
    ...(method ? { method } : {}),
    ...(kind === "game" ? { game: normalizeGame(raw.game) } : {}),
  };
}

export function normalizeStudio(raw: unknown): LessonStudio | null {
  if (!isObj(raw) || !Array.isArray(raw.stages)) return null;
  const stages: StudioStage[] = raw.stages
    .map((s): StudioStage | null => {
      if (!isObj(s)) return null;
      const name = str(s.name, 80);
      if (!name) return null;
      const minutes = Math.round(Number(s.minutes));
      return {
        id: str(s.id, 60) ?? newId("s"),
        code: str(s.code, 40) ?? "STAGE",
        name,
        minutes: minutes >= 1 && minutes <= 180 ? minutes : 5,
        goal: str(s.goal, 300) ?? "",
        teacher: str(s.teacher, 400),
        students: str(s.students, 400),
        blocks: (Array.isArray(s.blocks) ? s.blocks : []).map(normalizeBlock).filter((b): b is StudioBlock => !!b),
      };
    })
    .filter((s): s is StudioStage => !!s);
  if (!stages.length) return null;
  const duration = Math.round(Number(raw.duration));
  return {
    v: 1,
    modelKey: lessonModel(String(raw.modelKey))?.key ?? LESSON_MODELS[0].key,
    duration: duration >= 10 && duration <= 180 ? duration : 45,
    objective: str(raw.objective, 400),
    criteria: Array.isArray(raw.criteria)
      ? raw.criteria.map((c) => str(c, 160)).filter((c): c is string => !!c).slice(0, 5)
      : undefined,
    stages,
    accepted: raw.accepted === true,
    source: raw.source === "ai" ? "ai" : "template",
    updatedAt: str(raw.updatedAt, 40) ?? new Date().toISOString(),
  };
}

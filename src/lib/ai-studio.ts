import { extractJson } from "@/lib/ai-materials";
import { insightPromptLines, normalizeInsight, type InsightForAi } from "@/lib/class-insight";
import {
  LESSON_MODELS, envLines, lessonModel, normalizeClassEnv, stagePlan, type ClassEnvironment,
} from "@/lib/lesson-models";
import {
  CHECK_METHODS, PRACTICE_GAME_FILES, STUDIO_BLOCK_KINDS, defaultCheckMethod, ensureHomework, newId,
  type CheckMethod, type LessonStudio, type StudioBlock, type StudioGame, type StudioStage,
} from "@/lib/lesson-studio";

/* ════════════════════════════════════════════════════════════════════
   AI DARS STUDIYASI — mavzu + sinf sharoiti + standartlar → dars rejasi
   va dars ssenariysi (bloklar) BITTA soʻrovda.

   Nega alohida modul, `ai-materials.ts` ga yangi tur emas: u yerdagi
   turlar toʻplam muharririga tushadigan MATERIAL (test, slayd), bu esa
   REJA — bosqichlar va bloklar. Lekin yoʻl bitta: `/api/ustozona-ai/
   generate` (kvota, provayder zanjiri, JSON rejimi umumiy) — ikkinchi
   AI yoʻli ochilmaydi.

   Natija oʻquvchiga ketmaydi: oʻqituvchi koʻrib, kerak joyini
   oʻzgartirib, «Qabul qilish» ni bosadi. Material (slayd, test) har
   blokda alohida, oʻqituvchi bosganda yaratiladi.

   Tahlil YUMSHOQ (`ai-materials.ts` bilan bir qoida): model bitta
   bosqichni buzsa — oʻsha bosqich model shablonidan olinadi, butun
   javob rad etilmaydi.

   Neytral modul: route ham, mijoz ham (tiplar) shu yerdan oladi.
   ════════════════════════════════════════════════════════════════════ */

export type AiStudioRequest = {
  kind: "studio";
  topic: string;
  subject?: string;
  grade?: number | null;
  className?: string;
  /** `workPlanPrompt()` — oldingi · joriy · keyingi mavzular. */
  plan?: string;
  modelKey: string;
  duration: number;
  objective?: string;
  env: ClassEnvironment;
  /** Sinfga bogʻlangan va shu darsga belgilangan standartlar. */
  standards?: { code: string; desc: string }[];
  /** Oldingi dars haqida oʻqituvchi mulohazasi. */
  reflection?: string;
  /** Sinfning oxirgi test natijasi (`lib/class-insight.ts`) — ismsiz. */
  insight?: InsightForAi;
  note?: string;
  locale?: string;
};

const isObj = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);

function oneLine(v: unknown, max: number): string {
  const s = typeof v === "string" ? v : typeof v === "number" ? String(v) : "";
  return s.replace(/\*\*|__/g, "").replace(/\s+/g, " ").trim().slice(0, max);
}

export function normalizeStudioRequest(body: unknown): AiStudioRequest | null {
  if (!isObj(body) || body.kind !== "studio") return null;
  const topic = oneLine(body.topic, 200);
  if (!topic) return null;
  const grade = Math.round(Number(body.grade));
  const duration = Math.round(Number(body.duration));
  const standards = (Array.isArray(body.standards) ? body.standards : [])
    .map((s) => (isObj(s) ? { code: oneLine(s.code, 40), desc: oneLine(s.desc, 240) } : null))
    .filter((s): s is { code: string; desc: string } => !!s && !!s.code)
    .slice(0, 8);
  return {
    kind: "studio",
    topic,
    subject: oneLine(body.subject, 80) || undefined,
    grade: grade >= 1 && grade <= 12 ? grade : null,
    className: oneLine(body.className, 40) || undefined,
    plan: typeof body.plan === "string" ? body.plan.slice(0, 1500) : undefined,
    modelKey: lessonModel(String(body.modelKey))?.key ?? LESSON_MODELS[0].key,
    duration: duration >= 10 && duration <= 180 ? duration : 45,
    objective: oneLine(body.objective, 400) || undefined,
    env: normalizeClassEnv(body.env),
    standards: standards.length ? standards : undefined,
    reflection: oneLine(body.reflection, 400) || undefined,
    insight: normalizeInsight(body.insight),
    note: oneLine(body.note, 500) || undefined,
    locale: oneLine(body.locale, 10) || undefined,
  };
}

const LANG_NAMES: Record<string, string> = {
  uz: "oʻzbek tili (lotin yozuvi)",
  "uz-Cyrl": "oʻzbek tili (kirill yozuvi)",
  ru: "rus tili",
  en: "ingliz tili",
  kk: "qozoq tili",
  ky: "qirgʻiz tili",
  kaa: "qoraqalpoq tili",
};

const BLOCK_GUIDE = `Blok turlari ("kind"):
- "warmup" — dars boshi: soʻz buluti yoki soʻrovnoma bilan qiziqtirish, oldingi bilimni eslatish.
- "explain" — tushuntirish: slaydlar/infografika bilan yangi mavzu (ekranda koʻrsatiladi).
- "activity" — juftlik yoki guruh ishi, amaliy mashq (taymer bilan), texnika shart emas.
- "game" — oʻyinli mustahkamlash (smartdoskada butun sinf yoki telefonda har kim).
- "check" — tushunishni tekshirish: 4–8 ta variantli savol.
- "exit" — chiqish chiptasi: dars oxirida 2–3 savol.
- "homework" — uy vazifasi (faqat bitta, eng oxirgi bosqichda).`;

const METHOD_GUIDE = `"check" bloki uchun "method" (javob yigʻish usuli) — sinf sharoitiga MOS boʻlsin:
- "live" — savol ekranda, javob telefonda (telefon VA ekran kerak);
- "selfpaced" — har kim oʻz telefonida (telefon kerak);
- "cards" — QR-kartalar: oʻquvchi kartani koʻtaradi, ustoz telefoni skanerlaydi (printer kerak, telefon kerak emas);
- "pult" — radio pult (pult toʻplami kerak);
- "paper" — qogʻoz varaq, ustoz telefoni skanerlaydi (printer kerak);
- "oral" — texnikasiz: qoʻl koʻtarish, doskada yechish.`;

export function buildStudioPrompt(r: AiStudioRequest): { system: string; prompt: string } {
  const model = lessonModel(r.modelKey) ?? LESSON_MODELS[0];
  const lang = LANG_NAMES[r.locale ?? "uz"] ?? LANG_NAMES.uz;
  const stages = stagePlan(model.key, r.duration);
  const system = `Sen — "Ustozona AI", tajribali metodist. Oʻqituvchiga aniq bir sinf uchun dars rejasi va darsda qadamma-qadam oʻtiladigan SSENARIY tuzasan.
Javob — FAQAT bitta JSON obyekt. Undan oldin ham, keyin ham hech narsa yozma: izoh, Markdown, \`\`\` boʻlmasin.
Tamoyillar: aniq maqsad va muvaffaqiyat mezoni; oʻquvchi faol (oʻqituvchi kam gapiradi); har 10–15 daqiqada tushunishni tekshirish; tabaqalashtirish; sinf sharoitida HAQIQATAN bajariladigan faoliyat.
Matn tili: ${lang}. Fan chet tili boʻlsa — blok mazmunidagi misollar shu chet tilida. Oʻzbekcha matnda ʻ (Oʻ, Gʻ) va ʼ ishlat.
Qisqa yoz: "teacher" va "students" — har biri ≤ 160 belgi, "brief" ≤ 220 belgi, "title" ≤ 60 belgi.

Dars modeli: ${model.name} (${model.source}). Bosqichlar AYNAN shular, shu tartibda, "code" oʻzgarmasin (daqiqa ±2 mumkin, jami ${r.duration}):
${stages.map((s) => `- ${s.code} «${s.name}» ~${s.minutes} daq — ${s.goal}`).join("\n")}

${BLOCK_GUIDE}
${METHOD_GUIDE}
Har bosqichda 1–2 blok. Kamida bitta "explain", bitta "check" va oxirida bitta "homework" boʻlsin.

JSON shakli:
{"objective":"dars oxirida oʻquvchi … (1 gap)","criteria":["muvaffaqiyat mezoni","…"],"stages":[{"code":"${stages[0]?.code ?? "STAGE"}","minutes":5,"teacher":"oʻqituvchi nima qiladi","students":"oʻquvchilar nima qiladi","blocks":[{"kind":"warmup","title":"…","brief":"aniq mazmun: qaysi savol, qaysi misol, qanday topshiriq"}]}]}
"check" blokida "method" ham boʻlsin. "game" blokida "game" — quyidagilardan biri: "arqon", "poyga" (telefonda, test asosida), ${PRACTICE_GAME_FILES.map((f) => `"${f}"`).join(", ")} (smartdoskada mashq).`;

  const lines = [`Mavzu: ${r.topic}`];
  if (r.subject) lines.push(`Fan: ${r.subject}`);
  if (r.grade) lines.push(`Sinf: ${r.grade}-sinf${r.className ? ` (${r.className})` : ""}`);
  lines.push(...envLines(r.env));
  if (r.objective) lines.push(`Oʻqituvchi yozgan maqsad: ${r.objective} — rejani shundan teskari qur.`);
  if (r.standards?.length) {
    lines.push(`Shu darsga bogʻlangan standartlar:\n${r.standards.map((s) => `- ${s.code}: ${s.desc}`).join("\n")}`);
  }
  if (r.plan?.trim()) {
    lines.push(`Sinfning ish rejasi:\n${r.plan.trim()}\nJORIY mavzuga tayan, keyingi mavzular materialini oldindan berma.`);
  }
  if (r.reflection) lines.push(`Oldingi dars haqida oʻqituvchi mulohazasi: «${r.reflection}» — kerak boʻlsa boshida qisqa takrorlash.`);
  if (r.insight) lines.push(...insightPromptLines(r.insight));
  if (r.note) lines.push(`Oʻqituvchining istagi: ${r.note}`);
  return { system, prompt: lines.join("\n") };
}

const GAME_IDS: Record<string, StudioGame> = {
  arqon: { type: "shell", id: "arqon" },
  poyga: { type: "shell", id: "poyga" },
  ...Object.fromEntries(PRACTICE_GAME_FILES.map((f) => [f, { type: "practice", file: f } as StudioGame])),
};

function methodFor(raw: unknown, r: AiStudioRequest): CheckMethod {
  const env = { phones: r.env.phones, screen: r.env.smartboard || r.env.projector, printer: r.env.printer, pult: r.env.pult };
  const asked = CHECK_METHODS.find((m) => m === raw);
  // Model sharoitga mos boʻlmagan usulni aytsa — tuzatamiz, rad etmaymiz.
  const fits =
    asked &&
    !((asked === "live" || asked === "selfpaced") && !env.phones) &&
    !(asked === "live" && !env.screen) &&
    !((asked === "cards" || asked === "paper") && !env.printer) &&
    !(asked === "pult" && !env.pult);
  return fits ? asked : defaultCheckMethod(env);
}

function parseBlock(raw: unknown, r: AiStudioRequest): StudioBlock | null {
  if (!isObj(raw)) return null;
  const kind = STUDIO_BLOCK_KINDS.find((k) => k === String(raw.kind ?? raw.type ?? "").toLowerCase());
  if (!kind) return null;
  const out: StudioBlock = {
    id: newId("b"),
    kind,
    title: oneLine(raw.title, 80) || undefined,
    brief: oneLine(raw.brief ?? raw.text ?? raw.content, 400) || undefined,
  };
  if (kind === "check") out.method = methodFor(raw.method, r);
  if (kind === "game") {
    const game = GAME_IDS[String(raw.game ?? "").toLowerCase()];
    // Telefonda oʻynaladigan oʻyin telefonsiz sinfga tavsiya qilinmaydi.
    if (game && !(game.type === "shell" && !r.env.phones)) out.game = game;
  }
  return out;
}

/** Model javobi → ssenariy. Hech narsa oʻqilmasa — `null`. */
export function parseAiStudio(r: AiStudioRequest, raw: string): LessonStudio | null {
  const json = extractJson(raw);
  if (!isObj(json) || !Array.isArray(json.stages)) return null;
  const model = lessonModel(r.modelKey) ?? LESSON_MODELS[0];
  const template = stagePlan(model.key, r.duration);
  const got = json.stages.filter(isObj);

  let parsedBlocks = 0;
  const stages: StudioStage[] = template.map((row, i) => {
    // Avval kod boʻyicha, boʻlmasa tartib boʻyicha — model kodni buzsa ham.
    const src = got.find((s) => String(s.code ?? "").toUpperCase() === row.code) ?? got[i];
    const minutes = Math.round(Number(src?.minutes));
    const blocks = (Array.isArray(src?.blocks) ? src!.blocks : [])
      .map((b) => parseBlock(b, r))
      .filter((b): b is StudioBlock => !!b)
      .slice(0, 3);
    parsedBlocks += blocks.length;
    return {
      id: newId("s"),
      code: row.code,
      name: row.name,
      minutes: minutes >= 1 && minutes <= r.duration ? minutes : row.minutes,
      goal: row.goal,
      teacher: oneLine(src?.teacher, 300) || undefined,
      students: oneLine(src?.students, 300) || undefined,
      blocks,
    };
  });
  if (parsedBlocks === 0) return null;
  ensureHomework(stages);

  return {
    v: 1,
    modelKey: model.key,
    duration: r.duration,
    objective: oneLine(json.objective, 300) || r.objective,
    criteria: (Array.isArray(json.criteria) ? json.criteria : [])
      .map((c) => oneLine(c, 160))
      .filter(Boolean)
      .slice(0, 4),
    stages,
    accepted: false,
    source: "ai",
    updatedAt: new Date().toISOString(),
  };
}

/* ════════════════════════════════════════════════════════════════════
   AI MATERIALLAR — «+ Yaratish» dagi tezkor yaratishning yagona manbasi.

   Oʻqituvchi mavzuni tanlaydi (ish rejadan yoki oʻzi yozadi), AI esa
   bir necha soniyada TAYYOR QORALAMA beradi: test, interaktiv dars
   (tushuntirish slaydlari + orada «tushundimi?» savollari), taqdimot,
   aqliy xarita yoki infografika. Natija oʻquvchiga toʻgʻridan-toʻgʻri
   KETMAYDI — avval toʻplam muharririda (yoki koʻrib chiqish oynasida)
   ochiladi va oʻqituvchi tekshiradi.

   Nega NEYTRAL modul (`"use server"` ham, `server-only` ham yoʻq):
   route soʻrovni tuzadi va javobni tahlil qiladi, mijoz esa faqat
   tiplarni oladi. `"use server"` faylda tip eksporti prodni buzadi
   (AGENTS.md), `server-only` esa mijozga tipni ham bermasdi.

   Tahlil YUMSHOQ: model bitta savolni buzsa, butun javob rad
   etilmaydi — yaroqsiz element tashlab ketiladi. Xato faqat hech
   narsa qolmaganda qaytadi.
   ════════════════════════════════════════════════════════════════════ */

export const AI_MATERIAL_KINDS = ["test", "lesson", "slides", "mindmap", "infographic"] as const;
export type AiMaterialKind = (typeof AI_MATERIAL_KINDS)[number];

export const AI_LEVELS = ["easy", "mixed", "hard"] as const;
export type AiLevel = (typeof AI_LEVELS)[number];

/** Test savollari soni — tanlov tugmalari. */
export const AI_TEST_COUNTS = [5, 10, 15] as const;

export type AiMaterialRequest = {
  kind: AiMaterialKind;
  topic: string;
  /** Fan nomi (koʻrinadigan yorliq). */
  subject?: string;
  grade?: number | null;
  className?: string;
  /** `workPlanPrompt()` — oldingi · joriy · keyingi mavzular. */
  plan?: string;
  /** Faqat test: savollar soni. */
  count?: number;
  level?: AiLevel;
  /** Oʻqituvchining erkin istagi («rus tilida», «rasmli masalalar»…). */
  note?: string;
  /** Interfeys tili — mazmun tili shundan olinadi (fan chet tili boʻlmasa). */
  locale?: string;
  /** Dars davomiyligi (daqiqa) — interaktiv dars hajmi shunga moslanadi. */
  durationMin?: number;
  /** Darslik matni (joylangan yoki sahifa suratidan oʻqilgan) — material
      FAQAT shu matndagi faktlarga tayanadi (davlat darsligidan chetga chiqmasin). */
  source?: string;
};

export type AiMcq = { q: string; options: string[]; answer: number };
export type AiSlideLayout = "title" | "text" | "list" | "quote";

export type AiDeckItem =
  | { type: "slide"; layout: AiSlideLayout; heading: string; body: string }
  | ({ type: "mcq" } & AiMcq)
  | { type: "poll"; q: string; options: string[] }
  | { type: "wordcloud"; q: string }
  | { type: "open"; q: string; sample?: string };

export type AiTest = { title: string; questions: AiMcq[] };
export type AiDeck = { title: string; items: AiDeckItem[] };
export type AiMindMap = {
  title: string;
  center: string;
  branches: { label: string; items: string[] }[];
};
export type AiInfographic = {
  title: string;
  subtitle: string;
  facts: { head: string; text: string }[];
};

export type AiMaterial =
  | { kind: "test"; data: AiTest }
  | { kind: "lesson"; data: AiDeck }
  | { kind: "slides"; data: AiDeck }
  | { kind: "mindmap"; data: AiMindMap }
  | { kind: "infographic"; data: AiInfographic };

/** Route javobidagi xato kodi — matnni mijoz oʻz tilida koʻrsatadi. */
export type AiMaterialError =
  | "auth"
  | "not_configured"
  | "bad_request"
  | "quota"
  | "failed"
  | "unreadable";

/* ── SOʻROV ────────────────────────────────────────────────────────── */

const TOPIC_MAX = 200;
const NOTE_MAX = 500;
const PLAN_MAX = 1500;

type Loose = Record<string, unknown>;

const isObj = (v: unknown): v is Loose => typeof v === "object" && v !== null && !Array.isArray(v);

/** Mijozdan kelgan tanani tekshiradi: nomaʼlum maydon tashlanadi,
    uzunliklar kesiladi. Mavzu yoʻq boʻlsa — `null`. */
export function normalizeMaterialRequest(body: unknown): AiMaterialRequest | null {
  if (!isObj(body)) return null;
  const kind = AI_MATERIAL_KINDS.find((k) => k === body.kind);
  const topic = oneLine(body.topic, TOPIC_MAX);
  if (!kind || !topic) return null;
  const count = Math.round(Number(body.count));
  const grade = Math.round(Number(body.grade));
  const duration = Math.round(Number(body.durationMin));
  return {
    kind,
    topic,
    subject: oneLine(body.subject, 80) || undefined,
    grade: grade >= 1 && grade <= 12 ? grade : null,
    className: oneLine(body.className, 40) || undefined,
    plan: typeof body.plan === "string" ? body.plan.slice(0, PLAN_MAX) : undefined,
    count: count >= 3 && count <= 20 ? count : 10,
    level: AI_LEVELS.find((l) => l === body.level) ?? "mixed",
    note: oneLine(body.note, NOTE_MAX) || undefined,
    locale: oneLine(body.locale, 10) || undefined,
    durationMin: duration >= 10 && duration <= 180 ? duration : undefined,
    source: sourceText(body.source),
  };
}

/** Darslik matni — qatorlar saqlanadi, ortiqcha boʻshliq qisqaradi. */
export const SOURCE_MAX = 8000;
function sourceText(raw: unknown): string | undefined {
  if (typeof raw !== "string") return undefined;
  const v = raw
    .replace(/\r\n?/g, "\n")
    .split("\n")
    .map((l) => l.replace(/[\t ]+/g, " ").trim())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
    .slice(0, SOURCE_MAX);
  return v.length >= 40 ? v : undefined;
}

/* ── PROMPT ────────────────────────────────────────────────────────── */

const LANG_NAMES: Record<string, string> = {
  uz: "oʻzbek tili (lotin yozuvi)",
  "uz-Cyrl": "oʻzbek tili (kirill yozuvi)",
  ru: "rus tili",
  en: "ingliz tili",
  kk: "qozoq tili",
  ky: "qirgʻiz tili",
  kaa: "qoraqalpoq tili",
};

const LEVEL_TEXT: Record<AiLevel, string> = {
  easy: "oson — asosiy tushunchalar, bevosita eslash va tanish",
  mixed: "aralash — oson, oʻrta va qiyin savollar taxminan teng",
  hard: "qiyin — qoʻllash, tahlil, koʻp bosqichli fikrlash",
};

const COMMON = `Sen — "Ustozona AI", maktab oʻqituvchisiga dars materiali tayyorlaysan.
Javob — FAQAT bitta JSON obyekt. Undan oldin ham, keyin ham hech narsa yozma: izoh, Markdown, \`\`\` belgisi boʻlmasin.
Umumiy qoidalar:
- Faktlar aniq va maktab darsligi darajasida boʻlsin. Ishonching komil boʻlmagan raqam, sana yoki nomni yozma.
- Oʻquvchi yoshiga mos, qisqa va tushunarli til.
- Formulalarni oddiy matnda yoz (x², H₂O, a/b) — LaTeX ham, Markdown ham ishlatma.
- Oʻzbekcha matnda apostrof oʻrniga ʻ (Oʻ, Gʻ) va ʼ (tutuq belgisi) ishlat.
- Oʻqituvchining istagi berilgan boʻlsa — mazmun va tilda unga ustuvorlik ber (JSON shakli oʻzgarmaydi).`;

const SLIDE_RULES = `Slayd qoidalari: "heading" ≤ 60 belgi. "layout":"text" — 1–3 qisqa gap (≤ 300 belgi). "layout":"list" — 3–5 band, har biri yangi qatorda (\\n), band ≤ 80 belgi. "layout":"quote" — "body" iqtibos yoki qoida, "heading" muallif yoki manba. Ekranda uzoqdan oʻqiladi — matn qisqa boʻlsin.`;

const MCQ_RULES = `Test savoli: 4 ta variant, faqat BITTASI toʻgʻri, "answer" — toʻgʻri variantning indeksi (0 dan 3 gacha). Notoʻgʻri variantlar ishonarli boʻlsin (oʻquvchilarning tipik xatolari). «Barcha javoblar toʻgʻri», «Hech biri», «A va B» kabi variant YOZMA — variantlar tartibi aralashtiriladi. Savol ≤ 200 belgi, variant ≤ 80 belgi.`;

function lessonSize(durationMin?: number): [number, number] {
  const d = durationMin ?? 45;
  if (d <= 30) return [8, 11];
  if (d >= 70) return [14, 20];
  return [11, 16];
}

function taskFor(r: AiMaterialRequest): string {
  switch (r.kind) {
    case "test":
      return `Vazifa: mavzu boʻyicha ${r.count} ta test savoli.
JSON shakli: {"title":"test nomi (≤ 60 belgi)","questions":[{"q":"savol matni","options":["…","…","…","…"],"answer":0}]}
${MCQ_RULES}
Aynan ${r.count} ta savol, takrorlanmasin. Qiyinlik: ${LEVEL_TEXT[r.level ?? "mixed"]}. Savollar turli darajada boʻlsin: eslash, tushunish, qoʻllash.`;
    case "lesson": {
      const [min, max] = lessonSize(r.durationMin);
      return `Vazifa: ${r.durationMin ?? 45} daqiqalik INTERAKTIV DARS — tushuntirish slaydlari va ularning orasida oʻquvchilar tushunganini tekshiradigan savollar. Oʻqituvchi slaydlarni ekranda koʻrsatadi, oʻquvchilar savollarga telefon, QR-karta yoki pult bilan javob beradi.
JSON shakli: {"title":"dars nomi (≤ 60 belgi)","items":[
{"type":"slide","layout":"title","heading":"mavzu nomi","body":"darsning maqsadi — 1 gap"},
{"type":"wordcloud","q":"bitta soʻz bilan javob beriladigan qiziqtiruvchi savol"},
{"type":"slide","layout":"text","heading":"…","body":"…"},
{"type":"slide","layout":"list","heading":"…","body":"band\\nband\\nband"},
{"type":"mcq","q":"…","options":["…","…","…","…"],"answer":1},
{"type":"poll","q":"…","options":["…","…","…"]},
{"type":"open","q":"…","sample":"qisqa namuna javob"}]}
Tuzilish (${min}–${max} ta element):
1. Sarlavha slaydi ("layout":"title").
2. Dars boshi — "wordcloud" yoki "poll": oldingi bilimni eslatuvchi yoki qiziqtiruvchi savol.
3. Asosiy qism: 2–3 ta tushuntirish slaydi, keyin bitta "mcq" (tushundimi?). Bu blok 2–3 marta takrorlanadi, har blok mavzuning keyingi qismini ochadi.
4. Xulosa slaydi ("layout":"list", 3–5 band).
5. Oxirida chiqish chiptasi — bitta "open" savol, qisqa namuna javob bilan.
${SLIDE_RULES}
${MCQ_RULES}
"poll" — 2–4 ta variant, toʻgʻri javob yoʻq. Qiyinlik: ${LEVEL_TEXT[r.level ?? "mixed"]}.`;
    }
    case "slides":
      return `Vazifa: mavzu boʻyicha TAQDIMOT — 7–10 ta slayd (smartdoska yoki proyektor uchun).
JSON shakli: {"title":"taqdimot nomi (≤ 60 belgi)","items":[{"type":"slide","layout":"title","heading":"…","body":"…"},{"type":"slide","layout":"text","heading":"…","body":"…"}]}
Tuzilish: sarlavha slaydi → mavzuni bosqichma-bosqich ochuvchi slaydlar (taʼrif, qoida, misol, qiziqarli fakt) → xulosa ("layout":"list"). Faqat "slide" elementlari.
${SLIDE_RULES}`;
    case "mindmap":
      return `Vazifa: mavzu boʻyicha AQLIY XARITA (mind map) — ekranda koʻrsatish yoki chop etish uchun.
JSON shakli: {"title":"…","center":"markaziy tushuncha","branches":[{"label":"shoxcha","items":["band","band"]}]}
Qoidalar: 4–6 ta shoxcha, har birida 2–4 ta band. "center" ≤ 30 belgi, "label" ≤ 24 belgi, band ≤ 36 belgi — gap emas, qisqa ibora. Shoxchalar mavzuning asosiy jihatlarini qamrasin (taʼrif, turlari, xossalari, misollar, qoʻllanilishi…).`;
    case "infographic":
      return `Vazifa: mavzu boʻyicha INFOGRAFIKA — eng muhim maʼlumot bitta rasmda.
JSON shakli: {"title":"…","subtitle":"…","facts":[{"head":"…","text":"…"}]}
Qoidalar: 4–6 ta fakt. "title" ≤ 50 belgi, "subtitle" ≤ 90 belgi, "head" ≤ 28 belgi, "text" ≤ 110 belgi. Har fakt mavzuning bitta muhim jihati: taʼrif, qoida yoki formula, misol, raqam yoki sana, qiziqarli fakt.`;
  }
}

/** System va user matni — route shu ikkisini provayderga uzatadi. */
export function buildMaterialPrompt(r: AiMaterialRequest): { system: string; prompt: string } {
  const lang = LANG_NAMES[r.locale ?? "uz"] ?? LANG_NAMES.uz;
  const system = `${COMMON}
- Mazmun tili: ${lang}. Fan chet tili boʻlsa (masalan, ingliz tili darsi), savol va matnni oʻsha chet tilida, oʻquvchi darajasiga mos yoz.

${taskFor(r)}`;

  const lines = [`Mavzu: ${r.topic}`];
  if (r.subject) lines.push(`Fan: ${r.subject}`);
  if (r.grade) lines.push(`Sinf: ${r.grade}-sinf${r.className ? ` (${r.className})` : ""}`);
  if (r.plan?.trim()) {
    lines.push(
      `Sinfning ish rejasi (choraklik):\n${r.plan.trim()}\nJORIY mavzuga tayan; oldingi mavzulardan takrorlash mumkin, keyingi mavzular materialini oldindan berma.`,
    );
  }
  if (r.note) lines.push(`Oʻqituvchining istagi: ${r.note}`);
  if (r.source) {
    lines.push(
      `MANBA — darslikdan olingan matn (oʻqituvchi berdi):\n"""\n${r.source}\n"""\n` +
        "Savol, javob va slayd mazmunini FAQAT shu matndagi faktlarga asosla. Matnda yoʻq fakt, raqam yoki nomni qoʻshma. " +
        "Matn tilini va atamalarini saqla. Mavzu nomi — faqat yoʻnalish uchun.",
    );
  }
  return { system, prompt: lines.join("\n") };
}

/* ── JAVOBNI TAHLIL QILISH ─────────────────────────────────────────── */

/** Model matnidan JSON obyektni ajratadi (``` qobigʻi, oldi-keyingi gap,
    oxirgi vergul — eng koʻp uchraydigan uchta buzilish). */
export function extractJson(raw: string): unknown {
  let s = raw.trim();
  const fence = s.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) s = fence[1].trim();
  const start = s.indexOf("{");
  const end = s.lastIndexOf("}");
  if (start < 0 || end <= start) return null;
  s = s.slice(start, end + 1);
  try {
    return JSON.parse(s);
  } catch {
    /* ikkinchi urinish pastda */
  }
  try {
    return JSON.parse(s.replace(/,\s*([}\]])/g, "$1"));
  } catch {
    return null;
  }
}

/** Bir qatorli matn: boʻshliqlar yigʻiladi, Markdown qalinligi olinadi. */
function oneLine(v: unknown, max: number): string {
  const s = typeof v === "string" ? v : typeof v === "number" ? String(v) : "";
  return s.replace(/\*\*|__/g, "").replace(/\s+/g, " ").trim().slice(0, max);
}

/** Koʻp qatorli matn (roʻyxat slaydi): qatorlar saqlanadi, boʻshlari tushadi. */
function multiLine(v: unknown, max: number): string {
  const s = Array.isArray(v) ? v.filter((x) => typeof x === "string").join("\n") : typeof v === "string" ? v : "";
  return s
    .replace(/\*\*|__/g, "")
    .split(/\r?\n/)
    .map((line) => line.replace(/[ \t]+/g, " ").trim())
    .filter(Boolean)
    .join("\n")
    .slice(0, max);
}

/** «A) matn», «1. matn» kabi prefikslarni olib tashlaydi — harfni biz qoʻyamiz. */
function stripOptionPrefix(s: string): string {
  return s.replace(/^(?:[A-Da-d]|[1-4])[).:]\s+/, "");
}

function shuffleMcq(m: AiMcq): AiMcq {
  const order = m.options.map((_, i) => i);
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  return { q: m.q, options: order.map((i) => m.options[i]), answer: order.indexOf(m.answer) };
}

/** Variantlar (2–4 ta, takrorsiz) va ularning manba indekslari. */
function cleanOptions(raw: unknown): { texts: string[]; from: number[]; flagged: number } {
  const list = Array.isArray(raw) ? raw : [];
  const texts: string[] = [];
  const from: number[] = [];
  let flagged = -1;
  list.forEach((o, i) => {
    const text = stripOptionPrefix(oneLine(isObj(o) ? o.text : o, 200));
    if (!text || texts.length >= 4) return;
    if (texts.some((x) => x.toLowerCase() === text.toLowerCase())) return;
    if (isObj(o) && (o.correct === true || o.isCorrect === true) && flagged < 0) flagged = texts.length;
    texts.push(text);
    from.push(i);
  });
  return { texts, from, flagged };
}

/** Toʻgʻri javob indeksi: son (0 dan), harf (A–D) yoki variant matni. */
function answerIndex(raw: unknown, texts: string[], from: number[]): number {
  const n = typeof raw === "number" ? raw : typeof raw === "string" && /^\d+$/.test(raw.trim()) ? Number(raw) : NaN;
  if (Number.isInteger(n)) {
    const at = from.indexOf(n);
    if (at >= 0) return at;
    // Model 1 dan sanagan boʻlsa: 4 variantli savolda "4" — faqat oxirgisi boʻla oladi.
    if (n === from.length) return from.length - 1;
    return -1;
  }
  if (typeof raw === "string") {
    const s = raw.trim();
    // Avval variant matni (variantlar «a», «b» kabi harflar boʻlishi ham mumkin), keyin harf.
    const clean = stripOptionPrefix(oneLine(s, 200)).toLowerCase();
    const byText = texts.findIndex((t) => t.toLowerCase() === clean);
    if (byText >= 0) return byText;
    if (/^[A-Da-d]$/.test(s)) return from.indexOf(s.toUpperCase().charCodeAt(0) - 65);
  }
  return -1;
}

function normMcq(raw: unknown): AiMcq | null {
  if (!isObj(raw)) return null;
  const q = oneLine(raw.q ?? raw.question ?? raw.stem, 500);
  if (!q) return null;
  const { texts, from, flagged } = cleanOptions(raw.options);
  if (texts.length < 2) return null;
  const answer = flagged >= 0 ? flagged : answerIndex(raw.answer ?? raw.correct, texts, from);
  if (answer < 0 || answer >= texts.length) return null;
  return shuffleMcq({ q, options: texts, answer });
}

const SLIDE_LAYOUTS_AI: readonly AiSlideLayout[] = ["title", "text", "list", "quote"];

function normItem(raw: unknown): AiDeckItem | null {
  if (!isObj(raw)) return null;
  const type = String(raw.type ?? "").toLowerCase();
  if (type === "slide") {
    const heading = oneLine(raw.heading ?? raw.title, 120);
    const body = multiLine(raw.body ?? raw.text ?? raw.bullets ?? raw.points, 1200);
    if (!heading && !body) return null;
    const asked = SLIDE_LAYOUTS_AI.find((l) => l === raw.layout);
    const layout: AiSlideLayout = asked ?? (body.includes("\n") ? "list" : "text");
    return { type: "slide", layout, heading, body };
  }
  if (type === "mcq" || type === "quiz" || type === "question") {
    const m = normMcq(raw);
    return m ? { type: "mcq", ...m } : null;
  }
  if (type === "poll") {
    const q = oneLine(raw.q ?? raw.question, 500);
    const { texts } = cleanOptions(raw.options);
    return q && texts.length >= 2 ? { type: "poll", q, options: texts } : null;
  }
  if (type === "wordcloud") {
    const q = oneLine(raw.q ?? raw.question, 500);
    return q ? { type: "wordcloud", q } : null;
  }
  if (type === "open" || type === "text") {
    const q = oneLine(raw.q ?? raw.question, 500);
    const sample = oneLine(raw.sample ?? raw.answer, 600);
    return q ? { type: "open", q, ...(sample ? { sample } : {}) } : null;
  }
  return null;
}

/** Model javobini tur boʻyicha tekshirib, xavfsiz shaklga keltiradi.
    Yaroqli hech narsa qolmasa — `null`. */
export function parseAiMaterial(r: Pick<AiMaterialRequest, "kind" | "topic">, raw: string): AiMaterial | null {
  const json = extractJson(raw);
  if (!isObj(json)) return null;
  const title = oneLine(json.title, 120) || r.topic;

  if (r.kind === "test") {
    const list = Array.isArray(json.questions) ? json.questions : Array.isArray(json.items) ? json.items : [];
    const questions = list.map(normMcq).filter((m): m is AiMcq => !!m).slice(0, 20);
    return questions.length ? { kind: "test", data: { title, questions } } : null;
  }

  if (r.kind === "lesson" || r.kind === "slides") {
    const list = Array.isArray(json.items) ? json.items : Array.isArray(json.slides) ? json.slides : [];
    let items = list.map(normItem).filter((it): it is AiDeckItem => !!it);
    if (r.kind === "slides") {
      items = items.filter((it) => it.type === "slide");
    }
    items = items.slice(0, 24);
    return items.length >= 2 ? { kind: r.kind, data: { title, items } } : null;
  }

  if (r.kind === "mindmap") {
    const center = oneLine(json.center, 60) || r.topic.slice(0, 60);
    const branches = (Array.isArray(json.branches) ? json.branches : [])
      .map((b) => {
        if (!isObj(b)) return null;
        const label = oneLine(b.label ?? b.title, 48);
        const items = (Array.isArray(b.items) ? b.items : Array.isArray(b.children) ? b.children : [])
          .map((x) => oneLine(isObj(x) ? x.label ?? x.text : x, 60))
          .filter(Boolean)
          .slice(0, 4);
        return label ? { label, items } : null;
      })
      .filter((b): b is { label: string; items: string[] } => !!b)
      .slice(0, 6);
    return branches.length >= 2 ? { kind: "mindmap", data: { title, center, branches } } : null;
  }

  const facts = (Array.isArray(json.facts) ? json.facts : [])
    .map((f) => {
      if (!isObj(f)) return null;
      const head = oneLine(f.head ?? f.title, 48);
      const text = oneLine(f.text ?? f.body, 180);
      return head || text ? { head, text } : null;
    })
    .filter((f): f is { head: string; text: string } => !!f)
    .slice(0, 6);
  return facts.length >= 2
    ? { kind: "infographic", data: { title, subtitle: oneLine(json.subtitle, 140), facts } }
    : null;
}

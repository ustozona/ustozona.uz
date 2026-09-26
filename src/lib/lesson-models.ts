/* ════════════════════════════════════════════════════════════════════
   JAHON DARS MODELLARI KATALOGI — bitta modelga yopishib olmaslik uchun.

   LessonLab Planner'dan koʻchirilgan (`lessonlab-scanner/services/
   pedagogy.py`, 2026-09-26): planner yaratuvchi tomonidan qulflandi,
   uning yaxshi imkoniyatlari Ustozona dars muharririga oʻtdi.

   Nega kerak: AI har darsni bitta tuzilma (masalan 5E) boʻyicha tuzsa,
   grammatika, yangi algoritm, dasturlash yoki takrorlash darsi notoʻgʻri
   shaklga tushadi. Bu yerda keng tarqalgan, tadqiqotga tayangan
   modellar va ularni QACHON tanlash qoidasi bor. Tanlov:
     1. oʻqituvchi oʻzi tanlasa — oʻsha (har doim ustun);
     2. aks holda fan + mavzu turiga qarab tavsiya (`selectModel`).

   Qaysi model tanlansa ham umumiy tamoyillar saqlanadi: aniq maqsad va
   muvaffaqiyat mezoni, faol oʻquvchi, formativ baholash, oldingi
   bilimni eslatish, tabaqalashtirish (`buildPlanPrompt`).

   `server-only` EMAS — sof maʼlumot va funksiyalar, klientda ishlaydi.
   ════════════════════════════════════════════════════════════════════ */

export type LessonModelStage = {
  /** Barqaror kod (AI va shablon uchun). */
  code: string;
  name: string;
  /** 45 daqiqadan ulush (yigʻindisi ≈ 1). */
  share: number;
  goal: string;
};

export type LessonModel = {
  key: string;
  name: string;
  source: string;
  bestFor: string;
  stages: LessonModelStage[];
};

const s = (code: string, name: string, share: number, goal: string): LessonModelStage => ({
  code, name, share, goal,
});

export const LESSON_MODELS: LessonModel[] = [
  {
    key: "5e",
    name: "5E (Engage–Explore–Explain–Elaborate–Evaluate)",
    source: "Bybee, BSCS — kashfiyotga asoslangan oʻqitish",
    bestFor: "tabiiy fanlar, hodisani kuzatib tushunish, tajriba darslari",
    stages: [
      s("ENGAGE", "Qiziqtirish", 0.1, "savol yoki hodisa bilan qiziqish uygʻotish, oldingi bilimni faollashtirish"),
      s("EXPLORE", "Kashf qilish", 0.24, "oʻquvchilar kuzatadi, sinaydi, maʼlumot yigʻadi"),
      s("EXPLAIN", "Tushuntirish", 0.2, "kashfiyotni tushuncha va atamalarga aylantirish"),
      s("ELABORATE", "Qoʻllash", 0.28, "yangi vaziyatda qoʻllash, chuqurlashtirish"),
      s("EVALUATE", "Baholash", 0.18, "formativ baholash, refleksiya, uy vazifa"),
    ],
  },
  {
    key: "explicit",
    name: "Aniq oʻqitish: I do – We do – You do",
    source: "Rosenshine tamoyillari; masʼuliyatni bosqichma-bosqich oʻtkazish",
    bestFor: "yangi usul/algoritm/qoida oʻrgatish (matematika, grammatika, yozish)",
    stages: [
      s("REVIEW", "Eslatish", 0.12, "oldingi darsni qisqa takrorlash (retrieval), uy vazifani tekshirish"),
      s("I_DO", "Koʻrsatish (I do)", 0.18, "oʻqituvchi namuna koʻrsatadi, fikrlashini ovoz chiqarib aytadi"),
      s("WE_DO", "Birga (We do)", 0.25, "birga bajarish, tez-tez savol berib tushunishni tekshirish"),
      s("YOU_DO", "Mustaqil (You do)", 0.3, "mustaqil mashq, oʻqituvchi aylanib yordam beradi"),
      s("CHECK", "Tekshirish", 0.15, "exit ticket, muvaffaqiyat mezoni boʻyicha xulosa, uy vazifa"),
    ],
  },
  {
    key: "gagne",
    name: "Gagnening 9 ta oʻquv hodisasi",
    source: "Robert Gagné — taʼlim shartlari",
    bestFor: "koʻp bosqichli bilim va koʻnikma, texnik fanlar, har qanday aniq tuzilgan dars",
    stages: [
      s("ATTENTION", "Diqqatni jalb qilish", 0.08, "qiziqarli savol, muammo yoki namoyish"),
      s("OBJECTIVES", "Maqsadni aytish", 0.04, "oʻquvchi dars oxirida nima qila olishini bilsin"),
      s("RECALL", "Oldingi bilimni eslatish", 0.08, "bogʻliq bilimni faollashtirish"),
      s("CONTENT", "Yangi material", 0.2, "boʻlaklab, misollar bilan taqdim etish"),
      s("GUIDANCE", "Yoʻnaltirish", 0.12, "namuna, mnemonika, tushunish uchun yordam"),
      s("PRACTICE", "Amaliyot", 0.22, "oʻquvchi oʻzi bajaradi"),
      s("FEEDBACK", "Fikr-mulohaza", 0.1, "aniq, darhol qaytariladigan izoh"),
      s("ASSESS", "Baholash", 0.1, "natijani tekshirish"),
      s("TRANSFER", "Mustahkamlash va koʻchirish", 0.06, "hayotga tatbiq, uy vazifa"),
    ],
  },
  {
    key: "ppp",
    name: "PPP (Presentation–Practice–Production)",
    source: "chet tili oʻqitishining klassik tuzilmasi",
    bestFor: "chet tili: yangi grammatika yoki soʻz boyligi",
    stages: [
      s("LEAD_IN", "Kirish", 0.1, "mavzuga kirish, kontekst yaratish"),
      s("PRESENTATION", "Taqdimot", 0.2, "yangi til birligini kontekstda koʻrsatish, maʼno va shaklni tekshirish (CCQ)"),
      s("PRACTICE", "Nazoratli mashq", 0.3, "aniqlikka qaratilgan mashqlar, juftlikda"),
      s("PRODUCTION", "Erkin qoʻllash", 0.28, "oʻquvchi yangi birlikni oʻz gapida ishlatadi (rol, suhbat)"),
      s("WRAP_UP", "Yakun", 0.12, "xatolar ustida ishlash, uy vazifa"),
    ],
  },
  {
    key: "tblt",
    name: "Vazifaga asoslangan til oʻqitish (TBLT)",
    source: "Jane Willis — pre-task / task cycle / language focus",
    bestFor: "chet tili: gapirish, muloqot, real vazifa",
    stages: [
      s("PRE_TASK", "Vazifaga tayyorgarlik", 0.15, "mavzu, kerakli soʻzlar, vazifani tushuntirish"),
      s("TASK", "Vazifa", 0.3, "juftlik/guruhda real muloqot vazifasi"),
      s("REPORT", "Taqdimot", 0.2, "guruhlar natijani sinfga aytadi"),
      s("LANGUAGE_FOCUS", "Til ustida ishlash", 0.25, "vazifada chiqqan til birliklari tahlili va mashqi"),
      s("REFLECT", "Xulosa", 0.1, "nimani oʻrgandik, uy vazifa"),
    ],
  },
  {
    key: "reading",
    name: "Oʻqish sikli: Pre – While – Post",
    source: "oʻqish koʻnikmasini oʻrgatish amaliyoti",
    bestFor: "matn bilan ishlash: chet tili oʻqish, ona tili, adabiyot",
    stages: [
      s("PRE_READING", "Oʻqishdan oldin", 0.18, "bashorat, kalit soʻzlar, qiziqish"),
      s("WHILE_READING", "Oʻqish davomida", 0.35, "skanlash/umumiy maʼno, keyin chuqur oʻqish vazifalari"),
      s("POST_READING", "Oʻqishdan keyin", 0.32, "muhokama, fikr bildirish, ijodiy vazifa"),
      s("REFLECT", "Xulosa", 0.15, "tushunishni tekshirish, uy vazifa"),
    ],
  },
  {
    key: "cpa",
    name: "CPA: Aniq – Tasvir – Mavhum",
    source: "Bruner; Singapur matematikasi amaliyoti",
    bestFor: "boshlangʻich va oʻrta sinf matematikasi: yangi tushuncha (kasr, oʻnlik, tenglama)",
    stages: [
      s("ANCHOR", "Muammo", 0.12, "hayotiy masala bilan boshlash"),
      s("CONCRETE", "Aniq predmet", 0.22, "real narsalar/manipulyativlar bilan bajarish"),
      s("PICTORIAL", "Tasvir", 0.22, "chizma, model, sxema bilan ifodalash"),
      s("ABSTRACT", "Mavhum", 0.26, "belgilar va formula bilan yozish, mashq"),
      s("REFLECT", "Umumlashtirish", 0.18, "qoida chiqarish, exit ticket, uy vazifa"),
    ],
  },
  {
    key: "problem",
    name: "Muammoli oʻqitish",
    source: "muammoga asoslangan taʼlim (masala yechish sikli)",
    bestFor: "matematika va fizikada masala yechish, mantiqiy fikrlash",
    stages: [
      s("PROBLEM", "Muammo", 0.15, "ochiq masala yoki savol qoʻyish"),
      s("EXPLORE", "Izlanish", 0.25, "guruhda yechim yoʻllarini qidirish"),
      s("SHARE", "Taqqoslash", 0.2, "turli yechimlarni taqqoslash, muhokama"),
      s("GENERALIZE", "Umumlashtirish", 0.2, "umumiy usul/qoidani chiqarish"),
      s("PRACTICE", "Mashq va tekshirish", 0.2, "yangi masalada qoʻllash, exit ticket"),
    ],
  },
  {
    key: "inquiry",
    name: "Savol – Dalil – Xulosa (tadqiqot)",
    source: "manbalar bilan ishlash, tarixiy va ijtimoiy tadqiqot",
    bestFor: "tarix, huquq, geografiya, ijtimoiy fanlar",
    stages: [
      s("QUESTION", "Asosiy savol", 0.12, "bahsli, ochiq savol qoʻyish"),
      s("SOURCES", "Manbalar", 0.3, "hujjat, xarita, rasm tahlili (kim, qachon, nima uchun)"),
      s("ARGUE", "Muhokama", 0.25, "dalil asosida fikr, qarama-qarshi qarash"),
      s("CLAIM", "Xulosa", 0.18, "dalil bilan asoslangan qisqa javob yozish"),
      s("REFLECT", "Bogʻlash", 0.15, "bugungi kun bilan bogʻlash, uy vazifa"),
    ],
  },
  {
    key: "primm",
    name: "PRIMM (Predict–Run–Investigate–Modify–Make)",
    source: "dasturlashni oʻqitish tadqiqotlari",
    bestFor: "informatika, dasturlash, algoritmlar",
    stages: [
      s("PREDICT", "Bashorat", 0.12, "kod nima qilishini oldindan aytish"),
      s("RUN", "Ishga tushirish", 0.1, "kodni ishlatib bashoratni tekshirish"),
      s("INVESTIGATE", "Tekshirish", 0.25, "kodni qatorma-qator tahlil, savollar"),
      s("MODIFY", "Oʻzgartirish", 0.25, "kodni oʻzgartirib yangi natija olish"),
      s("MAKE", "Yaratish", 0.28, "oʻz dasturini yozish, exit ticket"),
    ],
  },
  {
    key: "experiential",
    name: "Tajriba sikli (Kolb)",
    source: "David Kolb — tajribadan oʻrganish",
    bestFor: "texnologiya, jismoniy tarbiya, sanʼat, amaliy va hayotiy koʻnikmalar",
    stages: [
      s("EXPERIENCE", "Tajriba", 0.3, "oʻquvchi bajarib koʻradi"),
      s("REFLECT", "Mulohaza", 0.2, "nima boʻldi, nima qiyin boʻldi"),
      s("CONCEPTUALIZE", "Tushunchaga aylantirish", 0.2, "qoida va texnikani aniqlash"),
      s("APPLY", "Qayta qoʻllash", 0.3, "yaxshilangan usul bilan qayta bajarish, baholash"),
    ],
  },
  {
    key: "retrieval",
    name: "Takrorlash darsi: faol eslash va aralash mashq",
    source: "kognitiv psixologiya — retrieval practice, interleaving",
    bestFor: "takrorlash, mustahkamlash, nazorat ishiga tayyorgarlik",
    stages: [
      s("BRAIN_DUMP", "Eslab yozish", 0.15, "daftarni ochmasdan eslaganlarini yozish"),
      s("QUIZ", "Mini-test", 0.2, "past bosimli test yoki oʻyin"),
      s("GAPS", "Boʻshliqlar ustida ishlash", 0.25, "xato qilingan joylarni birga tahlil"),
      s("MIXED_PRACTICE", "Aralash mashq", 0.28, "turli mavzular aralash masalalar"),
      s("REFLECT", "Oʻz-oʻzini baholash", 0.12, "nima mustahkam, nima qayta kerak"),
    ],
  },
  {
    key: "project",
    name: "Loyiha darsi",
    source: "loyihaga asoslangan taʼlim (asosiy savol, mahsulot, taqdimot)",
    bestFor: "fanlararo mavzular, ijodiy mahsulot, bir necha darsga choʻzilgan ish",
    stages: [
      s("DRIVING_QUESTION", "Asosiy savol", 0.12, "real hayotiy vazifa va baholash mezoni"),
      s("PLAN", "Rejalashtirish", 0.15, "guruhlar, rollar, reja"),
      s("CREATE", "Yaratish", 0.4, "guruhda mahsulot ustida ishlash, oʻqituvchi maslahati"),
      s("PRESENT", "Taqdimot", 0.2, "natijani koʻrsatish, oʻzaro baholash"),
      s("REFLECT", "Xulosa", 0.13, "nimani oʻrgandik, keyingi qadam"),
    ],
  },
];

const BY_KEY = new Map(LESSON_MODELS.map((m) => [m.key, m]));

export function lessonModel(key: string): LessonModel | undefined {
  return BY_KEY.get(key);
}

/* ── Tanlash qoidasi (LessonLab `select_model` bilan AYNAN bir xil tartib) ──
   Fan sifatida katalog `id` va nomi birga beriladi (`"english Ingliz
   tili"`), shunda ham kod, ham nom boʻyicha topiladi. */
const LANG = /ingliz|english|nemis|german|fransuz|french|rus tili|russian|русск|koreys|arab|xitoy|chinese|turk tili|chet tili|foreign/;
const MATH = /matem|algebra|geometr|math|математ/;
const SCIENCE = /fizik|physics|kimyo|chemistry|biolog|tabiat|science|физик|хими|биолог|astronom|ekolog|ecology/;
const CS = /informat|dastur|computer|кибер|информат|\bit\b|programm/;
const SOCIAL = /tarix|history|huquq|law|geograf|iqtisod|economics|ijtimoiy|tarbiya|upbringing|davlat|история|география|обществ/;
const READING_SUBJ = /adabiyot|literature|o'qish|reading_literacy|литератур|чтение/;
const MOTHER = /ona tili|native_language|o'zbek tili|uzbek|родной/;
const ARTS = /jismoniy|physical_education|sport|musiqa|music|tasviriy|fine_arts|san'at|chizmachilik|technical_drawing|texnolog|technology|mehnat|labour|art|физкульт/;

const T_REVIEW = /takror|mustahkam|nazorat|test|imtihon|review|revision|umumlashtir|повтор|контрол/;
const T_GRAMMAR = /grammar|tense|zamon|present|past|future|perfect|article|preposition|modal|passive|conditional|qoida|kelishik|fe'l|ot so'z|sifat/;
const T_VOCAB = /vocabulary|lug'at|so'zlar|words/;
const T_READING = /reading|o'qish|matn|text|story|hikoya|she'r|poem|asar|rivoyat/;
const T_SPEAKING = /speaking|talk|discuss|interview|gapir|muloqot|suhbat|dialog|role/;
const T_PROJECT = /loyiha|project/;
const T_PROBLEM = /masala|problem|word problem|tenglama/;
const T_NEW_CONCEPT = /kasr|o'nli|fraction|decimal|foiz|percent|son|number|ko'paytirish|bo'lish/;

/** Oʻzbek apostroflari (ʻ ʼ ‘ ’ `) bitta shaklga — qidiruv ikkalasida ishlasin. */
function norm(text: string): string {
  return text.toLowerCase().replace(/[ʻʼ‘’`´]/g, "'");
}

export function selectModel(opts: {
  subject?: string;
  topic?: string;
  grade?: number | null;
}): { key: string; reason: string } {
  const sub = norm(opts.subject ?? "");
  const t = norm(opts.topic ?? "");
  const g = opts.grade ?? 0;

  if (T_REVIEW.test(t)) return { key: "retrieval", reason: "takrorlash/nazorat mavzusi — faol eslash eng samarali" };
  if (T_PROJECT.test(t)) return { key: "project", reason: "loyiha mavzusi" };
  if (LANG.test(sub)) {
    if (T_READING.test(t)) return { key: "reading", reason: "chet tili, matn bilan ishlash" };
    if (T_SPEAKING.test(t)) return { key: "tblt", reason: "chet tili, muloqot koʻnikmasi" };
    if (T_GRAMMAR.test(t) || T_VOCAB.test(t)) return { key: "ppp", reason: "chet tili, yangi grammatika/soʻz boyligi" };
    return { key: "tblt", reason: "chet tili — muloqotga yoʻnaltirilgan dars" };
  }
  if (MATH.test(sub)) {
    if (T_PROBLEM.test(t)) return { key: "problem", reason: "matematika, masala yechish" };
    if (g && g <= 6 && T_NEW_CONCEPT.test(t)) return { key: "cpa", reason: "quyi sinf matematikasi, yangi tushuncha" };
    return { key: "explicit", reason: "matematika, yangi usulni aniq oʻrgatish" };
  }
  if (CS.test(sub)) return { key: "primm", reason: "informatika/dasturlash" };
  if (SCIENCE.test(sub)) return { key: "5e", reason: "tabiiy fan, kashfiyotga asoslangan dars" };
  // Amaliy fanlar ijtimoiydan OLDIN: «Jismoniy tarbiya» dagi «tarbiya»
  // soʻzi uni ijtimoiy fan deb tanitib yubormasin.
  if (ARTS.test(sub)) return { key: "experiential", reason: "amaliy fan — bajarib oʻrganish" };
  if (SOCIAL.test(sub)) return { key: "inquiry", reason: "ijtimoiy fan, manba va dalil bilan ishlash" };
  if (READING_SUBJ.test(sub) || (MOTHER.test(sub) && T_READING.test(t)))
    return { key: "reading", reason: "matn bilan ishlash" };
  if (MOTHER.test(sub)) return { key: "explicit", reason: "ona tili, qoidani aniq oʻrgatish" };
  return { key: "gagne", reason: "umumiy tuzilma — har qanday mavzuga mos" };
}

export type StagePlanRow = { code: string; name: string; minutes: number; goal: string };

/** Model bosqichlari daqiqalari bilan (jami = duration). */
export function stagePlan(key: string, duration = 45): StagePlanRow[] {
  const model = lessonModel(key) ?? LESSON_MODELS[0];
  const mins = model.stages.map((st) => Math.max(2, Math.round(st.share * duration)));
  mins[mins.length - 1] += duration - mins.reduce((a, b) => a + b, 0); // yaxlitlash qoldigʻi oxirgisiga
  return model.stages.map((st, i) => ({ code: st.code, name: st.name, minutes: mins[i], goal: st.goal }));
}

/* ── Sinf holati — AI rejani aynan shu sinfga moslaydi ── */
export type ClassEnvironment = {
  smartboard: boolean;
  projector: boolean;
  movement: boolean;
  phones: boolean;
  studentCount: number | null;
  level: "strong" | "mixed" | "weak" | null;
};

export const EMPTY_CLASS_ENV: ClassEnvironment = {
  smartboard: false,
  projector: false,
  movement: false,
  phones: false,
  studentCount: null,
  level: null,
};

const LEVEL_UZ = { strong: "kuchli", mixed: "aralash", weak: "qiyinchilik bilan oʻzlashtiradigan" } as const;

function envLines(env: ClassEnvironment): string[] {
  const out: string[] = [];
  const tools = [
    env.smartboard && "smartdoska (interaktiv mashqlar mumkin)",
    env.projector && "proyektor (koʻrgazmali materiallar)",
    env.movement && "harakat uchun joy (oʻyinli faoliyatlar mumkin)",
    env.phones && "oʻquvchilarda telefon/planshet (onlayn kviz mumkin)",
  ].filter(Boolean);
  if (tools.length) out.push(`Sinf jihozlari: ${tools.join("; ")}.`);
  else out.push("Sinfda maxsus texnika yoʻq — faqat doska va daftar bilan ishlaydigan faoliyatlar tanla.");
  if (env.studentCount) out.push(`Oʻquvchilar soni: ${env.studentCount} — guruh ishlari hajmini shunga moslab.`);
  if (env.level) out.push(`Sinf darajasi: ${LEVEL_UZ[env.level]} — topshiriqlarni tabaqalashtir.`);
  return out;
}

/** AI uchun toʻliq soʻrov: model, bosqichlar, vaqt, maqsad va sinf holati. */
export function buildPlanPrompt(opts: {
  topic: string;
  modelKey: string;
  reason: string;
  duration: number;
  goal?: string;
  env?: ClassEnvironment | null;
  previousReflection?: string | null;
}): string {
  const model = lessonModel(opts.modelKey) ?? LESSON_MODELS[0];
  const lines = [
    `«${opts.topic || "Shu dars"}» mavzusi boʻyicha ${opts.duration} daqiqalik toʻliq dars rejasini tuz.`,
    "",
    `Dars modeli: ${model.name} (${model.source}). Sabab: ${opts.reason}.`,
    "Bosqichlar AYNAN shular boʻlsin (har biri alohida ## sarlavha, yonida daqiqasi), vaqtlar ±2 daqiqa:",
    ...stagePlan(model.key, opts.duration).map((st) => `- ${st.name} — ~${st.minutes} daq: ${st.goal}`),
    "",
  ];
  if (opts.goal?.trim()) {
    lines.push(
      `Dars maqsadi (oʻqituvchi yozgan): dars oxirida oʻquvchi ${opts.goal.trim()}`,
      "Rejani shu maqsaddan TESKARI qur: avval muvaffaqiyat mezoni va uni tekshirish usuli, keyin faoliyatlar.",
      "",
    );
  }
  if (opts.env) lines.push(...envLines(opts.env), "");
  if (opts.previousReflection?.trim()) {
    lines.push(`Oldingi dars haqida oʻqituvchi mulohazasi: «${opts.previousReflection.trim()}» — kerak boʻlsa boshida qisqa takrorlash qoʻsh.`, "");
  }
  lines.push(
    "Har bosqichda: oʻqituvchi nima qiladi, oʻquvchi nima qiladi, tushunishni qanday tekshiramiz.",
    "Oxirida: exit ticket (2–3 savol) va uy vazifa. Maqsadni > [!abstract] callout bilan boshla.",
  );
  return lines.join("\n");
}

function escapeHtml(text: string): string {
  return text.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

/** AI'siz shablon — tanlangan model bosqichlari, vaqti va maqsadi.
    Oʻqituvchi boʻsh sahifa emas, tuzilma oladi; faoliyatni oʻzi yozadi. */
export function skeletonHtml(opts: { modelKey: string; duration: number; goal?: string }): string {
  const model = lessonModel(opts.modelKey) ?? LESSON_MODELS[0];
  const parts: string[] = [];
  parts.push(
    `<p><strong>Dars modeli:</strong> ${escapeHtml(model.name)} · <strong>Davomiyligi:</strong> ${opts.duration} daqiqa</p>`,
  );
  if (opts.goal?.trim()) {
    parts.push(`<p><strong>Maqsad:</strong> dars oxirida oʻquvchi ${escapeHtml(opts.goal.trim())}</p>`);
  }
  for (const st of stagePlan(model.key, opts.duration)) {
    parts.push(
      `<h2>${escapeHtml(st.name)} — ${st.minutes} daq</h2>`,
      `<p><em>${escapeHtml(st.goal)}</em></p>`,
      "<ul><li><p></p></li></ul>",
    );
  }
  return parts.join("");
}

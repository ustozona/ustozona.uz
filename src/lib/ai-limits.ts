/* ════════════════════════════════════════════════════════════════════
   AI KVOTA — kun/oy hisobi va kreditlar YAGONA MANBADA.

   Kun Asia/Tashkent (UTC+5) boʻyicha, chunki oʻqituvchi uchun "bugun"
   Toshkent kuni. Ilgari `todayTashkent()` faqat route ichida edi va
   admin statistikasi uni takrorlashi kerak boʻlardi — ikki joyda ikki
   xil kun chegarasi esa hisobotni jimgina siljitadi.

   ── NEGA KUNLIK EMAS, OYLIK ─────────────────────────────────────────
   Ilgari limit "kuniga 30 xabar" edi. Oʻqituvchining ish ritmi esa
   tekis emas: dars tayyorlanadigan kuni 50 ta soʻrov, qolgan kunlari
   0 ta. Qattiq kunlik chegara aynan ish qizigan payt toʻsib qoʻyadi,
   haftaning qolgan qismida esa foydalanilmagan kvota bekorga yonadi.
   Shuning uchun chegara OYLIK KREDIT: oy davomida yigʻindi hisoblanadi,
   oʻqituvchi uni istagan kuniga taqsimlaydi.

   Telemetriya jadvali (`ai_usage`) oʻzgarmaydi — u kunlik qatorlarda
   qolaveradi (admin grafigi kunlik trendni koʻrsatadi). Faqat KVOTA
   TEKSHIRUVI oy boshidan beri yigʻindiga qaraydi.
   ════════════════════════════════════════════════════════════════════ */

const TASHKENT_OFFSET_MS = 5 * 3600_000;

/** Asia/Tashkent boʻyicha YYYY-MM-DD. */
export function todayTashkent(): string {
  return new Date(Date.now() + TASHKENT_OFFSET_MS).toISOString().slice(0, 10);
}

/** Bugundan `days` kun oldingi Toshkent kuni (YYYY-MM-DD). */
export function tashkentDaysAgo(days: number): string {
  return new Date(Date.now() + TASHKENT_OFFSET_MS - days * 86_400_000)
    .toISOString()
    .slice(0, 10);
}

/* Joriy Toshkent oyining birinchi kuni (YYYY-MM-01).

   `ai_usage.day` — matn ustuni (YYYY-MM-DD), shuning uchun oy chegarasi
   ham AYNAN shu shaklda boʻlishi shart: `day >= '2026-09-01'` leksik
   taqqoslash sifatida ishlaydi va sana turiga oʻgirish kerak emas. */
export function monthStartTashkent(): string {
  return `${todayTashkent().slice(0, 7)}-01`;
}

/* ── Taʼriflar va kreditlar ─────────────────────────────────────────

   `teachers.plan` — matn ustuni, default "free". Hozircha faqat
   "free" ishlatiladi; "pro" qatorlari FUNDAMENT sifatida oldindan
   yozib qoʻyilgan — premium ulanganda bu yerda hech nima
   oʻzgartirilmaydi, faqat `teachers.plan` qiymati "pro" boʻladi.

   `Record<AiPlan, …>` ataylab: yangi taʼrif qoʻshilib krediti
   unutilsa TypeScript xato beradi. */
export const AI_PLANS = ["free", "pro"] as const;
export type AiPlan = (typeof AI_PLANS)[number];

export function normalizeAiPlan(value: string | null | undefined): AiPlan {
  return (AI_PLANS as readonly string[]).includes(value ?? "")
    ? (value as AiPlan)
    : "free";
}

export type AiCredits = {
  /** Oyiga AI xabarlar soni. */
  messages: number;
  /** Oyiga hujjat (darslik/PDF) yuklashlar soni. */
  docs: number;
};

/* Raqamlar qayerdan: eski kunlik 30 xabar ≈ oyiga 900 edi, lekin bu
   chegara emas — faqat nazariy shift. Amalda tekin Gemini kvotasi
   butun maktabga ulashiladi, shuning uchun free uchun 300 olindi:
   kuniga oʻrtacha 10 ta, lekin bir kunda 100 tasini ham sarflasa
   boʻladi. Aniq raqam `/admin/ai` maʼlumoti toʻplangach qayta
   koʻriladi — shuning uchun env orqali deploy qilmasdan oʻzgartirsa
   boʻladigan qilib qoʻyilgan. */
const ENV_OVERRIDE: Record<AiPlan, { messages?: string; docs?: string }> = {
  free: { messages: process.env.AI_CREDIT_FREE, docs: process.env.AI_DOC_CREDIT_FREE },
  pro: { messages: process.env.AI_CREDIT_PRO, docs: process.env.AI_DOC_CREDIT_PRO },
};

const DEFAULT_CREDITS: Record<AiPlan, AiCredits> = {
  free: { messages: 300, docs: 40 },
  pro: { messages: 1500, docs: 200 },
};

/** Taʼrifga tegishli oylik kreditlar (env bilan bekor qilinishi mumkin). */
export function aiCredits(plan: string | null | undefined): AiCredits {
  const p = normalizeAiPlan(plan);
  const def = DEFAULT_CREDITS[p];
  const env = ENV_OVERRIDE[p];
  return {
    messages: Math.max(1, Number(env.messages) || def.messages),
    docs: Math.max(1, Number(env.docs) || def.docs),
  };
}

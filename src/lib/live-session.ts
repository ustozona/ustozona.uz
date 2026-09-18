/* ════════════════════════════════════════════════════════════════════
   JONLI SESSIYA — umumiy tiplar (docs/taqdimot-spec.md, R284).

   Neytral modul: `"use server"` fayli ham, mijoz ham shu yerdan import
   qiladi (AGENTS.md — server action faylidan tip eksport qilinmaydi).

   ARALASH MODEL (R284):
   • Oʻquvchi qurilmasi joriy qadamni har ~1,5 s da SOʻRAYDI (polling) —
     bitta raqam, yengil soʻrov; realtime ulanish egallamaydi.
   • Oʻqituvchi ekrani yangi javobni Supabase Realtime BROADCAST orqali
     «turtki» sifatida oladi. Turtkida MAʼLUMOT YOʻQ — ekran natijani
     egalik tekshiruvidan oʻtadigan server amali bilan oʻzi soʻraydi.
     Shuning uchun kanal nomi sizib ketsa ham hech narsa oshkor boʻlmaydi.
   • Realtime sozlanmagan boʻlsa oʻqituvchi ekrani ham soʻrovga oʻtadi.
   ════════════════════════════════════════════════════════════════════ */

/** Oʻquvchi qurilmasi soʻraydigan holat. */
export type LiveState = {
  /** Oʻqituvchi koʻrsatayotgan qadam (slayd yoki savol). */
  index: number;
  /** Toʻgʻri javob ochilganmi. */
  revealed: boolean;
  /** Sessiya tugaganmi — oʻquvchi yakuniy ekranga oʻtadi. */
  ended: boolean;
};

/** Bitta faoliyat (savol) boʻyicha jonli natija. */
export type LiveItemResult = {
  /** Javob bergan ishtirokchilar soni. */
  answered: number;
  /** Toʻgʻri javob berganlar. */
  correct: number;
  /** mcq/soʻrovnoma: variant id → tanlaganlar soni. */
  byOption: Record<string, number>;
  /** Soʻz buluti: kichik harfdagi soʻz → necha kishi yozdi. */
  words: Record<string, number>;
};

export type LiveResults = {
  /** Qoʻshilgan ishtirokchilar. */
  joined: number;
  /** activityId → natija. */
  items: Record<string, LiveItemResult>;
};

export type LiveSessionInfo = {
  sessionId: string;
  joinCode: string;
  /** Realtime kanal nomi — faqat oʻqituvchiga beriladi. */
  topic: string;
};

/** Oʻqituvchi ekrani uchun realtime ulanish sozlamasi — serverdan, faqat
    autentifikatsiyadan keyin beriladi (`server/realtime/config.ts`). */
export type RealtimeConfig = { url: string; key: string };

/** Oʻquvchi soʻrov oraligʻi va oʻqituvchi ekranining zaxira soʻrov oraligʻi. */
export const STUDENT_POLL_MS = 1500;
export const TEACHER_FALLBACK_POLL_MS = 2500;

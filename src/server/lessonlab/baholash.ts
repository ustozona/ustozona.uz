import "server-only";
import { lessonlab, isConfigured, LessonLabError } from "./client";
import { GAME_SHELLS, findShell, type GameShell } from "@/lib/baholash-shells";

/* ════════════════════════════════════════════════════════════════════
   «USTOZONA BAHOLASH» — LessonLab dvigateliga chaqiruvlar

   CHEGARA (buni buzmang):
     • Savol, javob, ball, jurnal — HAMMASI Ustozona bazasida qoladi.
     • LessonLab'ga faqat XIZMAT chaqiriladi: rasm → javoblar, savol
       soni → PDF varaq, mavzu → AI savollari.
     • Bu yerda LessonLab'ga oʻquvchi ismi yoki bahosi YOZILMAYDI.

   Shu sababli ikki tizim bir-birining ustiga yozmaydi va dublikat
   paydo boʻlmaydi — ular umuman bir xil maʼlumotni saqlamaydi.
   ════════════════════════════════════════════════════════════════════ */

export { isConfigured, LessonLabError };
export { GAME_SHELLS, findShell };
export type { GameShell };

/* ── Oʻyin qobiqlari ──────────────────────────────────────────────────
   Qobiq — brauzerda ishlaydigan HTML. Savolni u LessonLab'dan EMAS,
   Ustozonaning `/api/play/content` endpointidan oladi va javobni
   `/api/play/answer` ga yuboradi. Yaʼni qobiq faqat KOʻRINISH; ball
   har doim shu yerda hisoblanadi.

   «Tezlik hech qachon ballanmaydi» qoidasi (docs, R33) shu sababli
   buzilmaydi: qobiq oʻz ballini koʻrsatishi mumkin, lekin jurnalga
   `responses.isCorrect` boradi.                                        */

/** Qobiqni ochish havolasi.

    `src` — Ustozonaning OʻZ manzili: qobiq savolni shu yerdan soʻraydi.
    Uni parametr sifatida uzatamiz, LessonLab'da qotirib qoʻymaymiz —
    shunda bitta qobiq bir necha hamkorga xizmat qiladi va test/ishlab
    chiqarish muhitlari aralashib ketmaydi.

    DIQQAT — token URL'da boradi. Bu ataylab qabul qilingan: ishtirokchi
    tokeni FAQAT bitta sessiyaga tegishli va sessiya yopilishi bilan
    kuchini yoʻqotadi. Havolani boshqaga berish — oʻz oʻrniga boshqa
    bola oʻynashi bilan teng, akkaunt oʻgʻirlash emas. */
export function gameShellUrl(opts: {
  shellId: string;
  token: string;
  origin: string;
}): string | null {
  const shell = findShell(opts.shellId);
  const base = (process.env.LESSONLAB_GAMES_BASE ?? "").replace(/\/+$/, "");
  if (!shell || !base) return null;
  const q = new URLSearchParams({
    src: opts.origin.replace(/\/+$/, ""),
    token: opts.token,
  });
  return `${base}/${shell.file}?${q.toString()}`;
}

/* ── Qogʻoz test (OMR) ────────────────────────────────────────────── */

export type AnswerSheetRequest = {
  /** Nechta savol — varaq tuzilishi shunga qarab tanlanadi. */
  questionCount: number;
  /** Varaq sarlavhasi (test nomi). */
  title: string;
  /** Kimlar uchun — ism varaqqa bosiladi. Boʻsh boʻlsa imtihon rejimi. */
  students?: { ref: string; name: string }[];
};

export type OmrScanResult = {
  /** Savol raqami → 'A'|'B'|'C'|'D'|'X'(ikki belgi)|null(boʻsh). */
  answers: Record<string, string | null>;
  /** Savol raqami → 0..1 ishonch. Past boʻlsa oʻqituvchi koʻrib chiqadi. */
  confidence: Record<string, number>;
  /** Varaqdagi QR koʻrsatgan oʻquvchi havolasi (bizniki, biz bergan). */
  studentRef: string | null;
};

/** Rasmni LessonLab OMR dvigateliga yuborib javoblarni oladi.

    Baho BU YERDA hisoblanmaydi — funksiya faqat «qaysi katak
    belgilangan» degan xom natijani qaytaradi. Ballash Ustozonaning
    `submitResponse()` zanjiridan oʻtadi, aynan onlayn javob kabi. */
export async function scanOmrSheet(input: {
  imageBase64: string;
  questionCount: number;
  accessToken?: string;
}): Promise<OmrScanResult> {
  return lessonlab<OmrScanResult>({
    method: "POST",
    path: "/api/v1/scan/omr",
    body: {
      image: input.imageBase64,
      question_count: input.questionCount,
    },
    accessToken: input.accessToken,
    timeoutMs: 60_000, // rasm ogʻir, tarmoq sekin boʻlishi mumkin
  });
}

import "server-only";
import { lessonlab, lessonlabBinary, isConfigured, LessonLabError } from "./client";
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
/** Qobiq serveri sozlanganmi.

    `isConfigured()` dan ALOHIDA: dvigatel chaqiruvlari (PDF, OMR) imzo
    kalitini talab qiladi, oʻyin qobigʻi esa shunchaki statik sahifa
    manzili. Bittasi sozlanib, ikkinchisi sozlanmagan boʻlishi mumkin —
    ilgari ikkalasi bitta bayroqqa bogʻlangani uchun panel notoʻgʻri
    sababni koʻrsatardi. */
export function isGamesConfigured(): boolean {
  return Boolean(process.env.LESSONLAB_GAMES_BASE);
}

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

/* NEGA `/engine/*` — `/scan/*` EMAS

   LessonLab'da ikki xil endpoint bor:

     `/api/v1/scan/omr`     — oʻqituvchining LESSONLAB akkaunti kerak
                              (OAuth token), natija LessonLab jurnaliga
                              ham yoziladi.
     `/api/v1/engine/*`     — akkaunt kerak EMAS, faqat hamkor imzosi.
                              Toza funksiya: kirish → chiqish, hech
                              narsa saqlanmaydi.

   Ustozona oʻqituvchisida LessonLab akkaunti YOʻQ va boʻlishi ham shart
   emas — «hech qanday toʻsiqsiz ishlashi kerak» talabi shuni anglatadi.
   Shuning uchun hamma joyda `/engine/*` ishlatiladi. Yon foydasi: hech
   qanday maʼlumot koʻchmagani uchun dublikat ham, ustiga yozish ham
   printsipial ravishda mumkin emas. */

/** Varaq/karta QR'iga yoziladigan oʻquvchi.

    `no` — sinf ichidagi TARTIB RAQAMI, UUID emas. QR sigʻimi cheklangan
    va varaqni telefon kamerasi oʻqiydi: uzun matn modul sonini
    oshiradi va oʻqilmay qoladi. Raqamni Ustozona oʻquvchisiga qaytarish
    chaqiruvchining zimmasida (roʻyxatdagi tartib). */
export type SheetStudent = { no: number; name: string };

export type AnswerSheetRequest = {
  /** QR ga yoziladigan test raqami — BIZNIKI, oʻzgarmasdan qaytadi. */
  testRef: number;
  /** QR ga yoziladigan sinf raqami. */
  classRef?: number;
  /** Nechta savol — varaq tuzilishi shunga qarab tanlanadi. */
  questionCount: number;
  /** Varaq sarlavhasi (test nomi). */
  title: string;
  className?: string;
  /** Kimlar uchun — ism varaqqa bosiladi. Boʻsh boʻlsa imtihon rejimi
      (ismsiz varaq, oʻquvchi oʻzi yozadi). */
  students?: SheetStudent[];
};

export type PdfResult = { bytes: Uint8Array; filename: string };

/** Chop etishga tayyor OMR javob varaqlari (PDF). */
export async function answerSheetPdf(req: AnswerSheetRequest): Promise<PdfResult> {
  const out = await lessonlabBinary({
    method: "POST",
    path: "/api/v1/engine/answer-sheets",
    body: {
      test_ref: req.testRef,
      class_ref: req.classRef ?? 0,
      question_count: req.questionCount,
      title: req.title,
      class_name: req.className ?? "",
      ...(req.students?.length ? { students: req.students } : {}),
    },
    timeoutMs: 60_000, // koʻp varaqli PDF chizish sekin
  });
  return { bytes: out.bytes, filename: out.filename ?? "javob-varaqlari.pdf" };
}

/** Telefonsiz sinf uchun QR-kartalar (PDF). Har oʻquvchiga bitta karta:
    kartani burab javob beradi, oʻqituvchi butun sinfni bitta suratda
    oʻqiydi. */
export async function answerCardsPdf(input: {
  students: SheetStudent[];
  className?: string;
}): Promise<PdfResult> {
  const out = await lessonlabBinary({
    method: "POST",
    path: "/api/v1/engine/answer-cards",
    body: { students: input.students, class_name: input.className ?? "" },
    timeoutMs: 60_000,
  });
  return { bytes: out.bytes, filename: out.filename ?? "javob-kartalari.pdf" };
}

/** Bitta suratdan oʻqilgan bitta varaq. */
export type OmrSheet = {
  /** Varaqni chizishda biz bergan raqamlar — oʻzgarmasdan qaytadi. */
  testRef: number;
  classRef: number | null;
  studentRef: number | null;
  /** Ismsiz imtihon varagʻimi (kimniki ekani QR'dan bilinmaydi). */
  examMode: boolean;
  /** Savol raqami → 'A'|'B'|'C'|'D'|'X'(ikki belgi)|null(boʻsh). */
  answers: Record<string, string | null>;
  /** Savol raqami → 0..1 ishonch. Past boʻlsa oʻqituvchi koʻrib chiqadi. */
  confidence: Record<string, number>;
  /** Nechta langar topilgani — varaq sifati koʻrsatkichi. */
  anchor: { rows: number; cols: number; of: number };
};

export type OmrScanResult = { questionCount: number; sheets: OmrSheet[] };

type OmrWire = {
  question_count: number;
  sheets: {
    test_ref: number;
    class_ref: number | null;
    student_ref: number | null;
    exam_mode: boolean;
    answers: Record<string, string | null>;
    confidence: Record<string, number>;
    anchor: { rows: number; cols: number; of: number };
  }[];
};

/** Rasmni LessonLab OMR dvigateliga yuborib javoblarni oladi.

    Baho BU YERDA hisoblanmaydi — funksiya faqat «qaysi katak
    belgilangan» degan xom natijani qaytaradi. Ballash Ustozonaning
    `submitResponse()` zanjiridan oʻtadi, aynan onlayn javob kabi. Bu
    ataylab: baho bizning jurnalimizga tushadi, demak uni biz
    hisoblashimiz kerak.

    Bitta suratda bir nechta varaq boʻlishi mumkin (partadagi qator) —
    shuning uchun `sheets` roʻyxat. Ishonchsiz varaq roʻyxatga umuman
    kirmaydi. */
export async function scanOmrSheet(input: {
  image: Uint8Array;
  /** `image/jpeg` yoki `image/png` — boshqasini server rad etadi. */
  contentType: string;
  questionCount: number;
}): Promise<OmrScanResult> {
  const qs = new URLSearchParams({ question_count: String(input.questionCount) });
  const wire = await lessonlab<OmrWire>({
    method: "POST",
    // Query ham imzolanadi — shuning uchun u yoʻlning bir qismi.
    path: `/api/v1/engine/scan-omr?${qs.toString()}`,
    binary: { bytes: input.image, contentType: input.contentType },
    timeoutMs: 60_000, // rasm ogʻir, tarmoq sekin boʻlishi mumkin
  });
  return {
    questionCount: wire.question_count,
    sheets: (wire.sheets ?? []).map((s) => ({
      testRef: s.test_ref,
      classRef: s.class_ref,
      studentRef: s.student_ref,
      examMode: s.exam_mode,
      answers: s.answers,
      confidence: s.confidence,
      anchor: s.anchor,
    })),
  };
}

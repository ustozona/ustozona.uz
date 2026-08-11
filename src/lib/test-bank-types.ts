/* ════════════════════════════════════════════════════════════════════
   TEST BANKI — TURLAR

   ⛔ BU FAYL NEYTRAL BOʻLIB QOLISHI SHART: `"use server"` ham,
   `server-only` ham YOʻQ.

   Sabab AGENTS.md da oʻlchangan: `"use server"` faylda
   `export type { … }` yozilsa Turbopack tip-reeksportini RUNTIME
   eksportga aylantiradi va BARCHA Server Action'lar bitta chunkda
   qulaydi (`ReferenceError`). Shuning uchun turlar shu yerda turadi va
   ikkala tomon — server action ham, client komponent ham — SHU YERDAN
   import qiladi.
   ════════════════════════════════════════════════════════════════════ */

/** Uchta daraja — taʼrifi SQL da (`v_test_bank`), bu faqat nom.

      ommaviy      — boshqa ustozlar ulashgan (`is_public AND NOT is_in_baza`)
      tasdiqlangan — LessonLab tuzgan, ishonchli (`is_in_baza`)
      shaxsiy      — oʻqituvchining oʻz testlari (bogʻlangan telegram boʻyicha)

   ⚠️ `ommaviy` va `tasdiqlangan` ARALASHMAYDI. Ilgari baza testlari
   `is_public = TRUE` ham boʻlgani uchun ommaviy roʻyxatga tushib
   ketardi va «tasdiqlangan» belgisi maʼnosini yoʻqotardi. */
export const BANK_TIERS = ["ommaviy", "tasdiqlangan", "shaxsiy"] as const;
export type BankTier = (typeof BANK_TIERS)[number];

/** Bankdagi bitta test — roʻyxat kartochkasi uchun yetarli maʼlumot.
    Savollar bu yerda YOʻQ: roʻyxat uchun ular kerak emas va yuzta
    testning savollarini tortish sahifani sekinlashtirardi. */
export type BankTest = {
  id: number;
  title: string;
  /** `null` = «fansiz» / «sinfsiz» — bu HAQIQIY holat, xato emas.
      LessonLab'da test fan va sinf koʻrsatmasdan ham tuziladi. */
  subject: string | null;
  grade: string | null;
  author: string | null;
  questionCount: number;
  usageCount: number;
  tier: BankTier;
  /** Shu test SHU sinfga allaqachon berilganmi. Berilgan boʻlsa tugma
      «Berilgan» holatiga oʻtadi — bosib ikkinchi nusxa yaratib
      boʻlmaydi (bazada ham `UNIQUE (uz_class_id, ll_test_id)`). */
  alreadyInClass: boolean;
};

/** Filtr paneli uchun mavjud qiymatlar. Roʻyxatdan ALOHIDA olinadi:
    sahifalangan roʻyxatdan yigʻilsa filtr faqat joriy sahifadagi
    fanlarni koʻrsatardi va oʻqituvchi «fanim yoʻq» deb oʻylardi. */
export type BankFacets = {
  subjects: string[];
  grades: string[];
};

export type BankQuery = {
  tier: BankTier;
  /** `null` — filtrsiz; `""` — ataylab «fansiz/sinfsiz» tanlangan. */
  subject?: string | null;
  grade?: string | null;
  search?: string | null;
  page?: number;
};

export type BankPage = {
  tests: BankTest[];
  total: number;
  page: number;
  pageSize: number;
};

/** Bitta sinfga berilgan test natijasi. */
export type AssignedClass = {
  classId: string;
  setId: string;
  /** «Berish va boshlash» da ochilgan sessiya kodi.

      `null` uchta holatda: sessiya soʻralmagan; sinf allaqachon
      berilgan (`skipped`); yoki sessiya ochilmadi. Oxirgisida toʻplam
      BEKOR QILINMAYDI — u yaratilgan va oʻzi qimmatli, UI esa
      «sessiyani oʻzingiz boshlang» holatiga tushadi. */
  sessionCode: string | null;
};

/** Bank testini sinf(lar)ga berish natijasi.

    ⚠️ `ok: true` «hammasi berildi» degani EMAS — `skipped` boʻsh
    boʻlmasligi mumkin. Allaqachon berilgan sinf XATO emas: oʻqituvchi
    ikki marta bosgan boʻlishi yoki uchta sinfdan bittasiga oldin
    bergan boʻlishi mumkin. Shuning uchun butun amal yiqilmaydi, faqat
    oʻsha sinf `skipped` ga tushadi va oʻqituvchi buni koʻradi. */
export type AssignBankTestResult =
  | {
      ok: true;
      title: string;
      questionCount: number;
      /** Endi yaratilgan toʻplamlar. */
      created: AssignedClass[];
      /** Allaqachon shu test berilgan sinflar — tegilmadi. */
      skipped: AssignedClass[];
    }
  | { ok: false; reason: "not_found" }
  | { ok: false; reason: "no_class" }
  | { ok: false; reason: "no_usable_questions" };

/** Berishdan OLDIN savollarni koʻrish.

    Toʻgʻri javob ham qaytadi — ustoz test sifatini aynan shundan
    baholaydi. Bu sirlash emas: test allaqachon ochiq va uni botda
    `share_code` bilan ham koʻrish mumkin. */
export type BankPreview =
  | {
      ok: true;
      title: string;
      questions: { stem: string; options: { id: string; text: string; isCorrect: boolean }[] }[];
    }
  | { ok: false };

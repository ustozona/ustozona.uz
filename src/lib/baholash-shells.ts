/* ════════════════════════════════════════════════════════════════════
   OʻYIN QOBIQLARI KATALOGI — server ham, brauzer ham oʻqiydi.

   Qobiq — LessonLab tomonidagi HTML sahifa. Savolni u Ustozonaning
   `/api/play/content` endpointidan oladi, javobni `/api/play/answer`
   ga yuboradi. Yaʼni qobiq faqat KOʻRINISH beradi; savol, javob va
   ball Ustozona bazasida qoladi.

   ── NEGA BU FAYLDA IMKONIYAT MODELI BOR ──────────────────────────

   Ilgari qobiq faqat ikki narsani eʼlon qilardi: `shapes` va
   `minQuestions`. Panel esa faqat savol sonini tekshirardi. Qolgan
   hamma cheklov IZOHDA yozilgan edi — yaʼni kod tekshirmasdi.

   Bu ikki xavf tugʻdiradi:
     • qobiq chiza olmaydigan savol unga baribir yuborilardi
       (masalan 6 variantli mcq 4 tugmali qobiqqa);
     • javob egasi aniqlanmaydigan qobiq (umumiy ekran, javobni
       ustoz belgilaydi) baholanadigan sessiyaga tushib qolardi.

   Shuning uchun qobiq endi oʻz talab va imkoniyatlarini TIP DARAJASIDA
   eʼlon qiladi, moslik esa `shellAvailability()` bilan HISOBLANADI.
   Naqsh Wordwall'dan: u ham kontentga qarab qaysi shablon mos
   kelishini oʻzi hisoblaydi va mos kelmasa SABABINI aytadi.
   ════════════════════════════════════════════════════════════════════ */

/** Qobiq chiza oladigan savol shakllari. */
export type ShellShape = "mcq" | "pairs";

/**
 * Javob qanday olinadi — jurnal uchun HAL QILUVCHI oʻlchov.
 *
 * ⚠️ Muhim: «har bola oʻz qurilmasida» va «javob egasi aniq» — bu IKKI
 * BOSHQA narsa. Ilgari bu yerda `perDevice: boolean` turardi va u
 * ikkalasini bitta maydonga qoʻshib yuborgandi. Natijada QR-karta
 * rejimi notoʻgʻri bloklanardi.
 *
 *   • `device`  — har oʻquvchi oʻz telefonida, oʻz tokeni bilan.
 *   • `qrcard`  — Plickers naqshi: 30 oʻquvchi, BITTA qurilma
 *                 (oʻqituvchi kamerasi). Karta oʻzi roʻyxat
 *                 bogʻlovchisi, shuning uchun har javob `student_id`
 *                 bilan aniqlanadi — jurnalga toʻliq koʻchadi
 *                 (`quiz_sessions.mode = "qrcards"`,
 *                 `ost-loyihalar-arxitektura.md` 2438-satr).
 *   • `teacher` — ustoz butun sinf yoki jamoa uchun bitta javob
 *                 belgilaydi. Egasi YOʻQ → hech qachon baholanmaydi.
 *
 * Yaʼni chegara qurilmalar sonida emas, EGALIKDA.
 */
export type AnswerCapture = "device" | "qrcard" | "teacher";

export type GameShell = {
  id: string;
  name: string;
  /** LessonLab'dagi fayl nomi (`/edugames/<file>`). */
  file: string;
  description: string;

  /** Kontent talablari — mos qobiqni hisoblash uchun. */
  accepts: {
    shapes: ShellShape[];
    /** Qobiq nechta variantli `mcq` ni chiza oladi.
        ⚠️ Bizning zod sxemasi 2..8 variantga ruxsat beradi
        (`actions/assess.ts`), qobiqlar esa odatda 4 tada qotgan.
        True/False = 2 variantli `mcq` — alohida shakl emas. */
    optionRange: { min: number; max: number };
    /** Eng kam savol soni — undan kam boʻlsa qobiq maʼnosiz. */
    minQuestions: number;
    /** Eng koʻp savol — qobiq raundi cheklangan boʻlsa. */
    maxQuestions?: number;
  };

  supports: {
    /** Guruh reytingi (B5.1) — hali hech bir qobiqda qurilmagan. */
    teams: boolean;
    /** Javob QANDAY olinadi — jurnal uchun yagona muhim savol. */
    capture: AnswerCapture;
  };

  /** Natija jurnalga koʻchirilishi mumkinmi. `false` → «mashq». */
  gradable: boolean;
};

/* DIQQAT — bu roʻyxatga qobiq qoʻshishdan oldin tekshiring:

   LessonLabdagi oʻyinlardan IKKITASI (`arqon`, `poyga`) har-oʻquvchi
   baholanadigan sessiyaga mos keladi.

   Qolganlari — `krossvord`, `so-z-topish`, `xotira`, `qaysi-katta` —
   oʻz soʻz bazasi yoki oʻz generatoridan ishlaydi va oʻqituvchi
   testini butunlay eʼtiborsiz qoldiradi. Ularni bu yerga qoʻshish
   oʻqituvchini aldardi: u «Xotira» ni tanlab, oʻz testi oʻynalyapti
   deb oʻylardi, aslida bolalar boshqa soʻzlar bilan mashq qilardi va
   jurnalga hech narsa tushmasdi.

   Endi ularni qoʻshish MUMKIN — lekin `gradable: false` bilan, yaʼni
   «mashq» sifatida ochiq belgilangan holda. Yashirish oʻrniga rost
   aytish afzal.

   ⚠️ `optionRange` qiymatlari ATAYLAB TOR (2..4). LessonLab qobigʻi
   nechta tugma chiza olishini biz tashqaridan koʻra olmaymiz. Tor
   kontrakt xato tomonga xavfsiz: qobiq koʻrsatilmay qolishi — dars
   oʻrtasida buzilgan ekrandan yaxshiroq. Aniq qiymat maʼlum boʻlgach
   kengaytiriladi.

   Yangi qobiq qoʻshish uchun avval LessonLab tomonida u
   `LLQuiz.check()` orqali serverdan baholanadigan qilib moslanishi
   kerak (edugames/quiz-loader.js izohiga qarang). */
export const GAME_SHELLS: GameShell[] = [
  {
    id: "arqon",
    name: "Arqon tortish",
    file: "arqon.html",
    description:
      "Har toʻgʻri javob arqonni oʻz tomoningizga tortadi. Baholanadigan " +
      "sessiyada savol taymeri oʻchiriladi — sekin javob jazolanmaydi.",
    accepts: {
      shapes: ["mcq"],
      optionRange: { min: 2, max: 4 },
      minQuestions: 6,
    },
    supports: { teams: false, capture: "device" },
    gradable: true,
  },
  {
    id: "poyga",
    name: "Poyga",
    file: "poyga.html",
    description:
      "Har toʻgʻri javob mashinani marra tomon suradi. Baholanadigan " +
      "sessiyada jamoaviy musobaqa emas, yakka poyga: savollar testdan " +
      "olinadi va takrorlanmaydi.",
    accepts: {
      shapes: ["mcq"],
      optionRange: { min: 2, max: 4 },
      minQuestions: 5,
    },
    supports: { teams: false, capture: "device" },
    gradable: true,
  },
];

export function findShell(id: string): GameShell | null {
  return GAME_SHELLS.find((s) => s.id === id) ?? null;
}

/* ════════════════════════════════════════════════════════════════════
   MOSLIK HISOBI
   ════════════════════════════════════════════════════════════════════ */

/** Toʻplam kontentining qobiq uchun muhim boʻlgan qisqacha tavsifi. */
export type SetContentSummary = {
  /** Shakl boʻyicha faoliyat soni. Qobiq oʻqiy oladiganini shundan sanaydi. */
  countByShape: Partial<Record<string, number>>;
  /** `mcq` variantlarining eng kami va eng koʻpi. mcq boʻlmasa `null`. */
  minOptions: number | null;
  maxOptions: number | null;
};

export type ShellAvailability =
  | { ok: true }
  /** `reason` — oʻqituvchiga koʻrsatiladigan tayyor jumla. */
  | { ok: false; reason: string };

const SHAPE_LABEL: Record<ShellShape, string> = {
  mcq: "variantli",
  pairs: "juftlash",
};

/**
 * Qobiq shu toʻplam bilan ishlay oladimi.
 *
 * SOF funksiya — server ham, brauzer ham bir xil javob oladi. Sabab
 * matni shu yerda tugʻiladi, chunki «nega ishlamaydi» degan javob
 * qoidaning OʻZIDAN kelib chiqishi kerak: ikki joyda yozilsa ular
 * ertaga bir-biridan uzoqlashadi.
 */
export function shellAvailability(
  shell: GameShell,
  content: SetContentSummary
): ShellAvailability {
  // Javob egasi aniqlanmasa — bunday qobiq baholanadigan sessiyaga
  // umuman chiqmaydi. ⚠️ `qrcard` bu yerga TUSHMAYDI: bitta kamera
  // boʻlsa ham karta har javobni oʻz oʻquvchisiga bogʻlaydi.
  if (shell.supports.capture === "teacher") {
    return {
      ok: false,
      reason:
        "Bu oʻyinda javobni ustoz butun sinf uchun belgilaydi — qaysi " +
        "javob kimniki ekani aniqlanmaydi, shuning uchun jurnalga " +
        "koʻchirilmaydi.",
    };
  }
  if (!shell.gradable) {
    return {
      ok: false,
      reason: "Bu oʻyin mashq uchun — natijasi jurnalga tushmaydi.",
    };
  }

  const playable = shell.accepts.shapes.reduce(
    (sum, shape) => sum + (content.countByShape[shape] ?? 0),
    0
  );

  if (playable === 0) {
    const labels = shell.accepts.shapes.map((s) => SHAPE_LABEL[s]).join(" yoki ");
    return {
      ok: false,
      reason: `Bu oʻyin ${labels} savollarni oʻynaydi — testingizda bunday savol yoʻq.`,
    };
  }

  const { minQuestions, maxQuestions, optionRange } = shell.accepts;

  if (playable < minQuestions) {
    return {
      ok: false,
      reason: `Kamida ${minQuestions} savol kerak — hozir ${playable} ta.`,
    };
  }
  if (maxQuestions !== undefined && playable > maxQuestions) {
    return {
      ok: false,
      reason: `Koʻpi bilan ${maxQuestions} savol — hozir ${playable} ta.`,
    };
  }

  // Variant soni faqat `mcq` uchun maʼnoli; qobiq mcq oʻynamasa
  // yoki testda mcq boʻlmasa — tekshiriladigan narsa yoʻq.
  if (shell.accepts.shapes.includes("mcq") && content.maxOptions !== null) {
    const { min, max } = optionRange;
    if (content.maxOptions > max) {
      return {
        ok: false,
        reason: `Bu oʻyin ${min}–${max} variant bilan ishlaydi — testingizda ${content.maxOptions} variantli savol bor.`,
      };
    }
    if (content.minOptions !== null && content.minOptions < min) {
      return {
        ok: false,
        reason: `Bu oʻyin ${min}–${max} variant bilan ishlaydi — testingizda ${content.minOptions} variantli savol bor.`,
      };
    }
  }

  return { ok: true };
}

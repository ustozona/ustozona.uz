/* ════════════════════════════════════════════════════════════════════
   OʻYIN QOBIQLARI KATALOGI — server ham, brauzer ham oʻqiydi.

   Qobiq — LessonLab tomonidagi HTML sahifa. Savolni u Ustozonaning
   `/api/play/content` endpointidan oladi, javobni `/api/play/answer`
   ga yuboradi. Yaʼni qobiq faqat KOʻRINISH beradi; savol, javob va
   ball Ustozona bazasida qoladi.

   `minQuestions` — qobiq maʼnoli ishlashi uchun eng kam savol soni.
   Undan kam boʻlsa oʻqituvchiga tugma oʻchiq koʻrsatiladi: ishlamaydigan
   narsani bosdirib, keyin xato chiqarish — yomon tajriba.
   ════════════════════════════════════════════════════════════════════ */

export type GameShell = {
  id: string;
  name: string;
  /** LessonLab'dagi fayl nomi (`/edugames/<file>`). */
  file: string;
  description: string;
  /** Qobiq qaysi savol shakllarini chiza oladi. */
  shapes: ("mcq" | "pairs")[];
  /** Eng kam savol soni — undan kam boʻlsa qobiq maʼnosiz. */
  minQuestions: number;
};

/* DIQQAT — bu roʻyxatga qobiq qoʻshishdan oldin tekshiring:

   LessonLabdagi oltita oʻyindan IKKITASI (`arqon`, `poyga`) har-oʻquvchi
   baholanadigan sessiyaga mos keladi.

   Qolgan toʻrttasi — `krossvord`, `so-z-topish`, `xotira`,
   `qaysi-katta` — oʻz soʻz bazasi yoki oʻz generatoridan ishlaydi va
   oʻqituvchi testini butunlay eʼtiborsiz qoldiradi. Ularni bu yerga
   qoʻshish oʻqituvchini aldardi: u oʻz testi oʻynalyapti deb oʻylardi,
   aslida bolalar boshqa soʻzlar bilan mashq qilardi va jurnalga hech
   narsa tushmasdi.

   Ularni bu yerga qoʻshish oʻqituvchini aldardi: u «Xotira» ni tanlab,
   oʻz testi oʻynalyapti deb oʻylardi, aslida bolalar boshqa soʻzlar
   bilan mashq qilardi va jurnalga hech narsa tushmasdi.

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
    shapes: ["mcq"],
    minQuestions: 6,
  },
  {
    id: "poyga",
    name: "Poyga",
    file: "poyga.html",
    description:
      "Har toʻgʻri javob mashinani marra tomon suradi. Baholanadigan " +
      "sessiyada jamoaviy musobaqa emas, yakka poyga: savollar testdan " +
      "olinadi va takrorlanmaydi.",
    shapes: ["mcq"],
    minQuestions: 5,
  },
];

export function findShell(id: string): GameShell | null {
  return GAME_SHELLS.find((s) => s.id === id) ?? null;
}

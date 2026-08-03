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

export const GAME_SHELLS: GameShell[] = [
  {
    id: "arqon",
    name: "Arqon tortish",
    file: "arqon.html",
    description: "Ikki jamoa — toʻgʻri javob arqonni oʻz tomoniga tortadi.",
    shapes: ["mcq"],
    minQuestions: 6,
  },
  {
    id: "poyga",
    name: "Poyga",
    file: "poyga.html",
    description: "Har toʻgʻri javob mashinani oldinga suradi.",
    shapes: ["mcq"],
    minQuestions: 5,
  },
  {
    id: "xotira",
    name: "Xotira",
    file: "xotira.html",
    description: "Juftlarni yodda saqlab moslashtirish.",
    shapes: ["pairs"],
    minQuestions: 4,
  },
  {
    id: "qaysi-katta",
    name: "Qaysi katta",
    file: "qaysi-katta.html",
    description: "Ikki variantdan toʻgʻrisini tez tanlash.",
    shapes: ["mcq"],
    minQuestions: 5,
  },
  {
    id: "so-z-topish",
    name: "Soʻz topish",
    file: "so-z-topish.html",
    description: "Harflar orasidan javobni topish.",
    shapes: ["mcq"],
    minQuestions: 4,
  },
  {
    id: "krossvord",
    name: "Krossvord",
    file: "krossvord.html",
    description: "Savollar boʻyicha katakchalarni toʻldirish.",
    shapes: ["mcq"],
    minQuestions: 6,
  },
];

export function findShell(id: string): GameShell | null {
  return GAME_SHELLS.find((s) => s.id === id) ?? null;
}

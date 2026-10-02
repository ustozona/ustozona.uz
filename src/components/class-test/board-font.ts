import { Plus_Jakarta_Sans } from "next/font/google";

/* Sinf testi sahnasining shrifti — LessonLab botidagi smart doska bilan
   bir xil. `preload: false`: faqat sahna ochilganda yuklanadi.
   Kirill harflari shriftda yoʻq — ular ilova shriftiga qaytadi
   (`--font-sans`, `class-test-board.css`). */
const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin", "latin-ext"],
  weight: ["500", "600", "700", "800"],
  variable: "--font-board",
  display: "swap",
  preload: false,
});

export const BOARD_FONT_CLASS = jakarta.variable;

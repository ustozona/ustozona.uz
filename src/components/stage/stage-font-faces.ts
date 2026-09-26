import { Montserrat, Nunito, Onest, Rubik } from "next/font/google";

/* Sahna shriftlarining fayllari (roʻyxat va qalinliklar —
   `lib/stage-fonts.ts`). `preload: false`: sahifa ochilganda hech biri
   oldindan yuklanmaydi, brauzer faqat `--stage-font` orqali haqiqatda
   ishlatilgan shriftni oladi — maktab internetiga 4 ta shrift emas, bitta.
   Kirill subset'lari majburiy: uz-Cyrl, ru, kk, ky.

   ⚠️ `next/font` argumentlari LITERAL boʻlishi shart — umumiy
   oʻzgaruvchi (`{ subsets }`) build'da «Unexpected key» beradi. */

const nunito = Nunito({
  subsets: ["latin", "latin-ext", "cyrillic", "cyrillic-ext"],
  variable: "--font-stage-nunito",
  display: "swap",
  preload: false,
});
const rubik = Rubik({
  subsets: ["latin", "latin-ext", "cyrillic", "cyrillic-ext"],
  variable: "--font-stage-rubik",
  display: "swap",
  preload: false,
});
const montserrat = Montserrat({
  subsets: ["latin", "latin-ext", "cyrillic", "cyrillic-ext"],
  variable: "--font-stage-montserrat",
  display: "swap",
  preload: false,
});
const onest = Onest({
  subsets: ["latin", "latin-ext", "cyrillic", "cyrillic-ext"],
  variable: "--font-stage-onest",
  display: "swap",
  preload: false,
});

/** Sahna ildiziga `stage-font` bilan birga qoʻyiladi — 4 ta
    `--font-stage-*` oʻzgaruvchisini eʼlon qiladi. */
export const STAGE_FONT_CLASS = [nunito, rubik, montserrat, onest].map((f) => f.variable).join(" ");

import type { CSSProperties } from "react";

/* Sahna shriftlari — taqdimot va viktorina sahnasi uchun (dashboard
   shriftiga tegmaydi). Oʻqituvchi toʻplam boʻyicha tanlaydi
   (`activity_sets.config.stageFont`), muharrir, oʻquvchi ekrani va Doska
   bir xil chizadi.

   Roʻyxat ATAYLAB yopiq: har shrift 7 tilda — lotin ʻ ʼ, oʻzbek/rus
   kirillchasi, qozoq/qirgʻiz harflari (Ә Ғ Қ Ң Ө Ұ Ү Һ І) va qoraqalpoq
   Ǵ Ń — tekshirilgandan keyingina qoʻshiladi. Erkin tanlov kirillchasi
   yoʻq shriftda oʻquvchi ekranini buzardi.

   Qalinlik oʻqituvchiga berilmaydi: har shriftning oʻz optik vazni bor
   (Nunito 900 ≈ Rubik 800), shuning uchun sarlavha/tugma/matn qalinligi
   shu yerda shrift boʻyicha sozlangan. Shrift fayllari
   `components/stage/stage-font-faces.ts` da (`next/font`, preload yoʻq —
   brauzer faqat ishlatilgan shriftni yuklaydi). */

export const STAGE_FONTS = [
  { id: "nunito", label: "Nunito", note: "Yumaloq, oʻyinli", heading: 900, button: 800, text: 600 },
  { id: "rubik", label: "Rubik", note: "Zamonaviy, vazmin", heading: 800, button: 700, text: 500 },
  { id: "montserrat", label: "Montserrat", note: "Geometrik, kuchli", heading: 900, button: 800, text: 600 },
  { id: "onest", label: "Onest", note: "Kirillchada eng silliq", heading: 800, button: 700, text: 500 },
] as const;

export type StageFontId = (typeof STAGE_FONTS)[number]["id"];

export const STAGE_FONT_IDS = STAGE_FONTS.map((f) => f.id) as [StageFontId, ...StageFontId[]];

export const DEFAULT_STAGE_FONT: StageFontId = "nunito";

export function stageFontOf(id: string | null | undefined) {
  return STAGE_FONTS.find((f) => f.id === id) ?? STAGE_FONTS[0];
}

/** Sahna ildiziga qoʻyiladigan CSS oʻzgaruvchilari. `.stage-font` klassi
    bilan birga ishlaydi (src/styles/quiz-stage.css). */
export function stageFontVars(id: string | null | undefined): CSSProperties {
  const f = stageFontOf(id);
  return {
    "--stage-font": `var(--font-stage-${f.id})`,
    "--stage-w-heading": f.heading,
    "--stage-w-button": f.button,
    "--stage-w-text": f.text,
  } as CSSProperties;
}

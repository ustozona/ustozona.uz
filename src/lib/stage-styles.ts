/* Sahna uslublari — viktorina ekranining tayyor koʻrinishlari. Oʻqituvchi
   toʻplam boʻyicha bittasini tanlaydi (`activity_sets.config.stageStyle`).

   Alohida-alohida sozlama (joylashuv, plitka, natija…) ATAYLAB berilmaydi:
   ularning ixtiyoriy aralashmasi sahnani buzadi. Uslub — bir-biriga mos
   qarorlar toʻplami; farqi faqat CSS da (\`[data-stage-style]\`,
   src/styles/quiz-stage.css), komponentlar bitta.

   Ikkala uslubda ham bir xil: javob ranglari va shakllari, plitkadagi
   raqam + 1–6 klaviatura tugmalari, shrift, fon, progress, taymer. */

export const STAGE_STYLES = [
  {
    id: "classic",
    label: "Klassik",
    note: "2×2 tor, oq savol lentasi, qiya natija lentasi, qolgan javoblar xira",
  },
  {
    id: "modern",
    label: "Zamonaviy",
    note: "Keng ekranda bir qator, qorongʻi savol kartasi, ortiqcha javoblar yashirinadi",
  },
] as const;

export type StageStyleId = (typeof STAGE_STYLES)[number]["id"];

export const STAGE_STYLE_IDS = STAGE_STYLES.map((s) => s.id) as [StageStyleId, ...StageStyleId[]];

export function stageStyleOf(id: string | null | undefined) {
  return STAGE_STYLES.find((s) => s.id === id) ?? STAGE_STYLES[0];
}

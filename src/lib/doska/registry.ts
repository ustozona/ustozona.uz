import type { ClassColor } from "@/lib/class-colors";
import type { WidgetKind } from "./types";

/* ════════════════════════════════════════════════════════════════════
   VIDJET REYESTRI — metadata (nom, standart oʻlcham, chegaralar).

   Render komponentlari BU YERDA EMAS — ular
   `src/components/doska/widgets/index.ts` da. Sabab: reyestr server
   tomonda ham oʻqiladigan sof maʼlumot boʻlib qolsin, React'ga
   bogʻlanmasin.

   Vidjet paneli keyinchalik oʻqituvchi tanloviga koʻra filtrlanadi
   (R132 "Edit widget bar") — shuning uchun tartib shu yerda.
   ════════════════════════════════════════════════════════════════════ */

export type WidgetMeta = {
  kind: WidgetKind;
  /** Panelda koʻrinadigan nom. */
  label: string;
  /**
   * Vidjet tusi — IDENTIFIKATOR, semantik emas.
   *
   * Maqsad: sinf ekranida 5 metrdan qaysi vidjet qayerdaligini rang
   * boʻyicha tanish. Shuning uchun yangi vidjetga qoʻshni vidjetdan
   * farq qiladigan tus beriladi.
   *
   * ⚠️ Palitra `src/lib/class-colors.ts` dan — yangi rang ixtiro
   * qilinmaydi. U yerda 17 rang bor va ularning idrok yorqinligi (L)
   * bir diapazonda kalibrlangan, yaʼni ular bir oilaga oʻxshaydi.
   *
   * ⚠️ Doskaning brend rangi (yashil) tus sifatida ISHLATILMAYDI —
   * aks holda brend rangi vidjetlar orasida yoʻqoladi va faol holatni
   * koʻrsata olmaydi.
   */
  tint: ClassColor;
  /** Ekranga qoʻyilgandagi boshlangʻich oʻlcham (piksel). */
  defaultSize: { w: number; h: number };
  minSize: { w: number; h: number };
  /** Vidjetning boshlangʻich holati. */
  initialState: Record<string, unknown>;
};

export const WIDGET_REGISTRY: Record<WidgetKind, WidgetMeta> = {
  "clock.v1": {
    kind: "clock.v1",
    label: "Soat",
    tint: "blue",
    defaultSize: { w: 320, h: 160 },
    minSize: { w: 200, h: 110 },
    initialState: { showSeconds: true },
  },
  "timer.v1": {
    kind: "timer.v1",
    label: "Taymer",
    tint: "amber",
    defaultSize: { w: 340, h: 220 },
    minSize: { w: 260, h: 180 },
    initialState: { durationSec: 300, remainingSec: 300, running: false },
  },
  "traffic-light.v1": {
    kind: "traffic-light.v1",
    label: "Svetofor",
    tint: "red",
    defaultSize: { w: 160, h: 380 },
    minSize: { w: 110, h: 260 },
    initialState: { active: "red" },
  },
};

/** Panel tartibi — hozircha hammasi koʻrinadi. */
export const WIDGET_BAR_ORDER: WidgetKind[] = [
  "clock.v1",
  "timer.v1",
  "traffic-light.v1",
];

export function widgetMeta(kind: WidgetKind): WidgetMeta {
  return WIDGET_REGISTRY[kind];
}

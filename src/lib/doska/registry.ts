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
  /**
   * Vidjet ichida MATN tahrirlanadimi (matn, yopishqoq qogʻoz).
   *
   * Ikki joyda ishlatiladi:
   *   • ekranga qoʻyilganda darhol yozishga tayyor boʻladi — oʻqituvchi
   *     matn qoʻydi, demak yozmoqchi; ikkinchi marta bosishni kutish
   *     ortiqcha qadam
   *   • ikki marta bosilganda tahrirga kiradi (`InteractionLayer`)
   *
   * Boshqa vidjetlarda yoʻq: taymerni «tahrirlash» degan holat yoʻq.
   */
  editable?: boolean;
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
  "text.v1": {
    kind: "text.v1",
    label: "Matn",
    // ⚠️ `violet` EMAS — u `BackgroundPicker` («Fon») da band. Panelda
    // ikkita binafsha ikona boʻlsa ular bir vidjetdek koʻrinadi.
    tint: "indigo",
    // Keng va past — matn vidjeti sarlavha yoki topshiriq uchun, xat
    // uchun emas. Baland boʻlsa oʻqituvchi uni abzas deb toʻldiradi va
    // sinf ekranidan oʻqib boʻlmaydi.
    defaultSize: { w: 460, h: 180 },
    minSize: { w: 160, h: 72 },
    initialState: { text: "" },
    editable: true,
  },
  "sticky-note.v1": {
    kind: "sticky-note.v1",
    // ⚠️ Panel tugmasi 52px va yorligʻi `truncate` — 8 belgidan uzun
    // nom «Yopishq…» boʻlib kesiladi. «Yopishqoq» aynan shunday
    // kesilgan edi. Yangi vidjet nomini shu chegara bilan tanlang.
    label: "Eslatma",
    tint: "pink",
    // Deyarli kvadrat — haqiqiy yopishqoq qogʻoz kabi.
    defaultSize: { w: 280, h: 260 },
    minSize: { w: 140, h: 130 },
    initialState: { text: "" },
    editable: true,
  },
  "shape.v1": {
    kind: "shape.v1",
    label: "Shakl",
    // Qoʻshnilari: «Eslatma» (pushti) va ajratgichdan keyin «Fon»
    // (binafsha) — moviy ikkalasidan ham uzoq.
    tint: "cyan",
    // Deyarli kvadrat: uchburchak ham, aylana ham buzilmagan holda
    // chiqsin. Choʻzish oʻqituvchining ixtiyorida.
    defaultSize: { w: 300, h: 270 },
    // Uch harflari sigʻishi kerak — bundan kichigida figura harflar
    // orasida yoʻqoladi.
    minSize: { w: 110, h: 110 },
    initialState: { shape: "triangle", labels: true },
  },
};

/**
 * Panel tartibi — hozircha hammasi koʻrinadi.
 *
 * ⚠️ `shape.v1` bu yerda ATAYLAB YOʻQ. Oddiy tugma bitta vidjet
 * qoʻshadi, shakl esa toʻqqiz xil — unga tanlash paneli kerak.
 * Shuning uchun u `WidgetBar` da `ShapePicker` sifatida alohida
 * chiziladi, xuddi `BackgroundPicker` kabi.
 */
export const WIDGET_BAR_ORDER: WidgetKind[] = [
  "clock.v1",
  "timer.v1",
  "traffic-light.v1",
  "text.v1",
  "sticky-note.v1",
];

export function widgetMeta(kind: WidgetKind): WidgetMeta {
  return WIDGET_REGISTRY[kind];
}

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

/**
 * Vidjet nomining tarjima kaliti — `messages/*.json` dagi
 * `Doska.widgets.*`.
 *
 * Nega `kind` ning oʻzi emas: `kind` da nuqta bor (`"clock.v1"`),
 * next-intl esa nuqtani ichma-ich yoʻl deb oʻqiydi. Ustiga nom versiyaga
 * bogʻliq emas — `timer.v2` chiqsa ham u «Taymer» boʻlib qoladi.
 */
export type WidgetLabelKey =
  | "clock"
  | "timer"
  | "trafficLight"
  | "text"
  | "stickyNote"
  | "shape"
  | "presentation"
  | "wheel"
  | "dice"
  | "qr"
  | "sticker"
  | "groups"
  | "poll"
  | "score"
  | "noise"
  | "camera"
  | "countdown";

/**
 * «Hammasi» oynasidagi toifa (docs/doska-ux-tadqiqot.md §3 «Topish»).
 * Tarjima kaliti — `Doska.catalog.categories.*`. Boʻsh toifa (masalan
 * «Oʻyin») oynada chiqmaydi — vositasi qoʻshilganda oʻzi paydo boʻladi.
 */
export type WidgetCategory = "time" | "class" | "writing" | "media";

export const CATEGORY_ORDER: WidgetCategory[] = ["time", "class", "writing", "media"];

export type WidgetMeta = {
  kind: WidgetKind;
  category: WidgetCategory;
  /**
   * Panelda koʻrinadigan nom — tarjima KALITI, matn emas. Reyestr
   * Reactʼsiz qoladi, matnni esa komponent `useTranslations("Doska.widgets")`
   * orqali oladi.
   *
   * ⚠️ Panel tugmasi 64 px, yorligʻi `truncate` (12 px, uslub shrifti —
   * Onest / Nunito / Rubik). Chegara HARF SONI EMAS, piksel: «Gʻildirak»
   * 9 harf va sigʻadi, «Yopishqoq» ham 9 harf, lekin kengroq — shuning
   * uchun «Eslatma». Yangi nomni har tilda va eng keng uslubda (Oʻyinchoq,
   * Nunito 800) oʻlchab koʻring (docs/doska-gildirak-spec.md R308).
   */
  labelKey: WidgetLabelKey;
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
  /**
   * Ekranga qoʻyilganda sozlama kartasi DARHOL ochiladimi.
   *
   * Taymerda ha: oʻqituvchi taymer qoʻydi, demak birinchi savoli —
   * «necha daqiqa?». Kartani izlab topish ortiqcha qadam boʻlardi.
   * Soat yoki svetoforda yoʻq — ular sozlamasiz ham tayyor.
   */
  openSettingsOnAdd?: boolean;
  /**
   * Vidjetning hozirgi SAHIFASI — uning ustida yozilgan qoʻlyozma shu
   * sahifaga bogʻlanadi (docs/doska-qolyozma-tadqiqot.md R338).
   *
   * Taqdimotda: toʻplam + slayd raqami. Slayd almashsa eski slayddagi
   * belgilar yashirinadi, qaytilsa yana chiqadi. `null` — sahifa yoʻq
   * (toʻplam tanlanmagan): yozuv ekranning oʻziga tushadi.
   *
   * Sahifasiz vidjetlarda (taymer, soat) maydon yoʻq — ular ustidagi
   * yozuv ekranga tegishli.
   */
  inkPage?: (state: Record<string, unknown>) => string | null;
  /**
   * OXIRGI TANLOV — yangi vidjetga standart (R422). Shu kalitlar
   * oʻzgarganda qiymati eslab qolinadi va keyingi shu turdagi vidjet
   * shu bilan tugʻiladi: oʻqituvchi har darsda taymerni 5 daqiqadan
   * 10 ga qayta burmaydi.
   *
   * Faqat SOZLAMA kalitlari — mazmun (matn, ismlar, natija) EMAS:
   * kechagi roʻyxat yoki gʻolib yangi vidjetda chiqmasin.
   */
  remember?: readonly string[];
};

export const WIDGET_REGISTRY: Record<WidgetKind, WidgetMeta> = {
  "clock.v1": {
    kind: "clock.v1",
    category: "time",
    labelKey: "clock",
    tint: "blue",
    defaultSize: { w: 320, h: 160 },
    minSize: { w: 200, h: 110 },
    initialState: { showSeconds: true },
  },
  "timer.v1": {
    kind: "timer.v1",
    category: "time",
    labelKey: "timer",
    tint: "amber",
    defaultSize: { w: 340, h: 220 },
    minSize: { w: 260, h: 180 },
    // `view` va `sound` — 2-bosqichda qoʻshildi; eski taymerlarda yoʻq,
    // komponent ularni standart qiymat bilan oʻqiydi (TimerWidget).
    initialState: { durationSec: 300, remainingSec: 300, running: false, view: "both", sound: true },
    openSettingsOnAdd: true,
    // `remainingSec` alohida eslanmaydi — u `durationSec` dan olinadi (store).
    remember: ["mode", "durationSec", "view", "repeat", "warn", "tabTitle", "sound"],
  },
  "traffic-light.v1": {
    kind: "traffic-light.v1",
    category: "class",
    labelKey: "trafficLight",
    tint: "red",
    // 2-bosqichda kengaydi (160→180): pastda holat soʻzi turadi va
    // «Gaplashamiz» sinfdan oʻqiladigan kattalikda sigʻishi kerak.
    defaultSize: { w: 180, h: 420 },
    minSize: { w: 120, h: 300 },
    initialState: { active: "red" },
  },
  "text.v1": {
    kind: "text.v1",
    category: "writing",
    labelKey: "text",
    // ⚠️ `violet` EMAS — u `BackgroundPicker` («Fon») da band. Panelda
    // ikkita binafsha ikona boʻlsa ular bir vidjetdek koʻrinadi.
    tint: "indigo",
    // Keng va past — matn vidjeti sarlavha yoki topshiriq uchun, xat
    // uchun emas. Baland boʻlsa oʻqituvchi uni abzas deb toʻldiradi va
    // sinf ekranidan oʻqib boʻlmaydi.
    defaultSize: { w: 460, h: 180 },
    minSize: { w: 160, h: 72 },
    initialState: { text: "" },
    remember: ["color", "bold"],
    editable: true,
  },
  "sticky-note.v1": {
    kind: "sticky-note.v1",
    category: "writing",
    // «Yopishqoq» emas — u 54.6px va panelda «Yopishq…» boʻlib
    // kesilgan edi (`labelKey` izohi).
    labelKey: "stickyNote",
    tint: "pink",
    // Deyarli kvadrat — haqiqiy yopishqoq qogʻoz kabi.
    defaultSize: { w: 280, h: 260 },
    minSize: { w: 140, h: 130 },
    initialState: { text: "" },
    editable: true,
  },
  "shape.v1": {
    kind: "shape.v1",
    category: "writing",
    labelKey: "shape",
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
  "presentation.v1": {
    kind: "presentation.v1",
    category: "media",
    labelKey: "presentation",
    // Material turlaridagi taqdimot rangi (`material-kinds.ts`) bilan
    // bir xil — oʻqituvchi jurnalda koʻrgan belgini shu yerda taniydi.
    tint: "orange",
    // Proyektor uchun katta: savol va toʻrt variant uzoqdan oʻqilsin.
    defaultSize: { w: 880, h: 520 },
    minSize: { w: 420, h: 280 },
    initialState: { setId: null, index: 0, revealed: false, teams: null },
    inkPage: (state) =>
      typeof state.setId === "string" ? `${state.setId}#${Number(state.index ?? 0)}` : null,
  },
  "wheel.v1": {
    kind: "wheel.v1",
    category: "class",
    // «Ruletka» emas — kazino maʼnosi; Doska vidjetlari obyekt nomi
    // bilan ataladi (docs/doska-gildirak-spec.md R307).
    labelKey: "wheel",
    // Qoʻshnilari: «Svetofor» (qizil) va «Matn» (indigo). Moviy-yashil
    // ikkalasidan ham uzoq, oʻxshash «Shakl» (moviy) esa panelning
    // narigi chetida.
    tint: "teal",
    // Kvadrat — gʻildirak doira, choʻzilgan vidjetda u baribir qisqa
    // tomonga sigʻadi. Roʻyxat tomoni ham shu oʻlchamga sigʻishi kerak.
    defaultSize: { w: 440, h: 440 },
    minSize: { w: 240, h: 240 },
    // Holatning maʼnosi — `lib/doska/wheel.ts` dagi `WheelState`.
    initialState: {
      text: "",
      roster: null,
      picked: [],
      mode: "once",
      rotation: 0,
      sound: true,
      speed: "medium",
    },
    remember: ["mode", "sound", "speed", "view"],
  },
  "dice.v1": {
    kind: "dice.v1",
    category: "class",
    labelKey: "dice",
    // Qoʻshnisi «Gʻildirak» (teal) — sariq-yashil undan aniq farqlanadi.
    tint: "lime",
    // Uch zar yonma-yon sigʻadigan, son va harf uzoqdan oʻqiladigan.
    defaultSize: { w: 360, h: 300 },
    minSize: { w: 180, h: 160 },
    initialState: { mode: "dice", count: 1, min: 1, max: 30, values: [] },
    remember: ["mode", "count", "min", "max"],
  },
  "qr.v1": {
    kind: "qr.v1",
    category: "media",
    labelKey: "qr",
    // Qoʻshnisi «Taqdimot» (toʻq sariq) — binafsha-qizil undan aniq ajraladi,
    // «Fon» (binafsha) esa panelning narigi chetida.
    tint: "fuchsia",
    // Kvadratga yaqin: kod kvadrat, ostida qisqa yozuv sigʻadi.
    defaultSize: { w: 320, h: 360 },
    minSize: { w: 180, h: 200 },
    initialState: { text: "", caption: "" },
    openSettingsOnAdd: true,
  },
  "sticker.v1": {
    kind: "sticker.v1",
    category: "writing",
    labelKey: "sticker",
    // Qoʻshnilari «Eslatma» (pushti) va «Shakl» (moviy) — sariq ikkalasidan uzoq.
    tint: "yellow",
    // Kvadrat — belgi qisqa tomonga sigʻadi.
    defaultSize: { w: 200, h: 200 },
    minSize: { w: 64, h: 64 },
    initialState: { emoji: "⭐" },
    openSettingsOnAdd: true,
  },
  "groups.v1": {
    kind: "groups.v1",
    category: "class",
    labelKey: "groups",
    // Qoʻshnilari «Gʻildirak» (teal) va «Zar» (lime) — siyohrang ikkalasidan
    // uzoq. `violet` EMAS — u «Fon» tugmasida band.
    tint: "purple",
    // Keng: 4–6 guruh ustun boʻlib yonma-yon, ismlar uzoqdan oʻqilsin.
    defaultSize: { w: 640, h: 420 },
    minSize: { w: 300, h: 220 },
    initialState: { text: "", by: "count", n: 4, groups: [] },
    openSettingsOnAdd: true,
    remember: ["by", "n"],
  },
  "poll.v1": {
    kind: "poll.v1",
    category: "class",
    labelKey: "poll",
    // Qoʻshnisi «Guruhlar» (binafsha) — koʻk-yashil undan aniq ajraladi.
    tint: "emerald",
    // Keng: 5 ta variant yonma-yon, ostida tugma — doskada qoʻl yetadi.
    defaultSize: { w: 520, h: 380 },
    minSize: { w: 260, h: 220 },
    initialState: { type: "smiley", count: 3, votes: [], hidden: false, question: "" },
    remember: ["type", "count", "hidden"],
  },
  "score.v1": {
    kind: "score.v1",
    category: "class",
    labelKey: "score",
    // Qoʻshnisi «Ovoz berish» (zumrad) — qizgʻish undan aniq ajraladi.
    tint: "rose",
    // Keng: 2–3 jamoa yonma-yon, katta son uzoqdan oʻqilsin.
    defaultSize: { w: 520, h: 300 },
    minSize: { w: 260, h: 180 },
    initialState: { teams: [{ name: "", score: 0 }, { name: "", score: 0 }] },
  },
  "noise.v1": {
    kind: "noise.v1",
    category: "class",
    labelKey: "noise",
    // Svetofor (qizil) bilan bir maʼno — lekin qizil band; moviy-koʻk.
    tint: "sky",
    // Tik: ustun pastdan yuqoriga toʻladi.
    defaultSize: { w: 300, h: 380 },
    minSize: { w: 180, h: 220 },
    initialState: { limit: 60, smooth: "medium", sound: false, overs: 0 },
    remember: ["limit", "smooth", "sound"],
  },
  "camera.v1": {
    kind: "camera.v1",
    category: "media",
    labelKey: "camera",
    // Qoʻshnisi «QR kod» (binafsha-qizil) — yashil undan aniq ajraladi.
    // `indigo` EMAS — u «Matn» da band.
    tint: "green",
    // 16:9 — kamera kadri.
    defaultSize: { w: 640, h: 360 },
    minSize: { w: 240, h: 160 },
    initialState: { mirror: false },
    remember: ["mirror"],
  },
  "countdown.v1": {
    kind: "countdown.v1",
    category: "time",
    labelKey: "countdown",
    // 17 rang tugadi — takror boʻladi, lekin panelning NARIGI chetidagi
    // «QR kod» bilan: qoʻshnilari «Soat» (koʻk) va «Taymer» (sariq).
    tint: "fuchsia",
    defaultSize: { w: 360, h: 260 },
    minSize: { w: 200, h: 160 },
    // Boʻsh — kalendarning eng yaqin voqeasi koʻrinadi.
    initialState: { eventId: null, name: "", date: "", schoolOnly: false },
    remember: ["schoolOnly"],
  },
};

/**
 * Vositalar tartibi — panelda ham, «Hammasi» oynasida ham shu tartib.
 *
 * Qaysi biri panelda turishini oʻqituvchi tanlaydi (`lib/doska/prefs.ts`,
 * R132); tartib esa hammada bir xil — qoʻshilgan vosita oxiriga emas,
 * oʻz joyiga tushadi.
 *
 * `shape.v1` panelda oddiy tugma emas, `ShapePicker`: u bitta emas,
 * toʻqqiz figura qoʻyadi va oʻz tanlash paneliga ega. «Fon» esa bu
 * roʻyxatda yoʻq — u vosita emas, ekran sozlamasi va panelda doim turadi.
 */
export const TOOL_ORDER: WidgetKind[] = [
  "clock.v1",
  "timer.v1",
  "countdown.v1",
  "traffic-light.v1",
  // Sinfni boshqarish vositalari yonida (soat, taymer, svetofor) —
  // mazmun vositalaridan (matn, eslatma, taqdimot) oldin.
  "wheel.v1",
  "dice.v1",
  "groups.v1",
  "poll.v1",
  "score.v1",
  "noise.v1",
  "text.v1",
  "sticky-note.v1",
  "sticker.v1",
  "shape.v1",
  "presentation.v1",
  "qr.v1",
  "camera.v1",
];

export function widgetMeta(kind: WidgetKind): WidgetMeta {
  return WIDGET_REGISTRY[kind];
}

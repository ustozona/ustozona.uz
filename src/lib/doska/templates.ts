import type { WidgetKind } from "./types";

/* ════════════════════════════════════════════════════════════════════
   TAYYOR EKRANLAR — statik shablonlar (docs/doska-referens-koriklari.md
   R423).

   Server kerak emas: shablon — vidjetlar roʻyxati va fon. Tanlanganda
   YANGI ekran ochiladi, joriy ekranga tegilmaydi; vidjetlar boʻsh joyga
   qoʻyiladi (placement.ts). Nomi tarjimada: `Doska.templates.<id>`,
   shuning uchun `id` yozilgach oʻzgartirilmaydi.

   Vidjet holati reyestrdagi boshlangʻich va oʻqituvchining oxirgi
   tanlovi ustiga qoʻyiladi — faqat shablonga xos qiymat beriladi
   (masalan taymer daqiqasi).

   JOYLASHUV (R452): `at` berilsa — vidjet aniq joyga, vidjetlar
   maydonining ulushi sifatida (0…1, `placement.ts` → `rectInArea`). Ekran
   ochilgan paytdagi oyna oʻlchamiga koʻpaytiriladi, saqlanishi esa
   hozirgidek pikselda. `at` boʻlmasa — boʻsh joyga.

   ⚠️ YANGI SHABLON — «1:1 emas» tekshiruvidan oʻtadi
   (docs/doska-referens-koriklari.md R453): joylashuv, rang, shrift, tasvir
   va matn — beshalasi oʻzimizniki; boshqa xizmatning biror ekranini
   takrorlamaydi va undan fayl olinmaydi.
   ════════════════════════════════════════════════════════════════════ */

export type DoskaTemplateWidget = {
  kind: WidgetKind;
  initial?: Record<string, unknown>;
  /** Joy — vidjetlar maydonining ulushi (0…1). */
  at?: { x: number; y: number; w: number; h: number };
};

export type DoskaTemplate = {
  id: string;
  background: string;
  widgets: DoskaTemplateWidget[];
};

const minutes = (m: number) => ({ mode: "countdown", durationSec: m * 60, remainingSec: m * 60, running: false });

/** Kartaning faqat shablonga xos qiymati — qolgani reyestrdagi boshlangʻich holatdan. */
const card = (preset: string, tint: string) => ({ preset, tint });

export const DOSKA_TEMPLATES: DoskaTemplate[] = [
  {
    /**
     * Kun rejasi (R454): tepada keng sarlavha qatori — kun va sana (oʻzi
     * yangilanadi) va taymer; ostida teng uch ustun — bugungi darslar
     * (jadvaldan oʻzi) va toʻrtta karta. Bitta ekran har kuni toʻgʻri
     * kunni koʻrsatadi — kunlar uchun alohida ekran kerak emas.
     *
     * Ulushlar 1280×720 ga moslangan: maydon balandligi 542 px (tepada
     * burchak tugmalari, pastda panel — `placement.ts`), taymerning eng
     * kichik balandligi 180 px = 0,33 — shuning uchun ikkinchi qator 0,355
     * dan boshlanadi va taymer kartalarga kirmaydi.
     */
    id: "day-plan",
    background: "soft-warm",
    widgets: [
      { kind: "date.v1", at: { x: 0, y: 0, w: 0.7, h: 0.31 } },
      { kind: "timer.v1", initial: minutes(5), at: { x: 0.72, y: 0, w: 0.28, h: 0.31 } },
      { kind: "today.v1", initial: { view: "lessons" }, at: { x: 0, y: 0.355, w: 0.3, h: 0.645 } },
      { kind: "card.v1", initial: card("goal", "blue"), at: { x: 0.32, y: 0.355, w: 0.33, h: 0.315 } },
      { kind: "card.v1", initial: card("homework", "teal"), at: { x: 0.67, y: 0.355, w: 0.33, h: 0.315 } },
      { kind: "card.v1", initial: card("materials", "amber"), at: { x: 0.32, y: 0.685, w: 0.33, h: 0.315 } },
      { kind: "card.v1", initial: card("earlyFinish", "note"), at: { x: 0.67, y: 0.685, w: 0.33, h: 0.315 } },
    ],
  },
  {
    /** Dars boshi: bugungi jadval, kirish taymeri, jimlik svetofori. */
    id: "lesson-start",
    background: "chalkboard-green",
    widgets: [{ kind: "today.v1" }, { kind: "timer.v1", initial: minutes(5) }, { kind: "traffic-light.v1" }],
  },
  {
    /** Guruh ishi: guruhlar, ish vaqti, ovoz darajasi svetofori. */
    id: "group-work",
    background: "grid-paper",
    widgets: [{ kind: "groups.v1" }, { kind: "timer.v1", initial: minutes(10) }, { kind: "traffic-light.v1" }],
  },
  {
    /** Savol-javob: gʻildirak, javob vaqti, jamoalar hisobi. */
    id: "quiz",
    background: "chalkboard-black",
    widgets: [{ kind: "wheel.v1" }, { kind: "timer.v1", initial: minutes(1) }, { kind: "score.v1" }],
  },
  {
    /** Dars yakuni: kayfiyat soʻrovi va qisqa taymer. */
    id: "exit-ticket",
    background: "whiteboard",
    widgets: [{ kind: "poll.v1", initial: { type: "smiley", votes: [] } }, { kind: "timer.v1", initial: minutes(3) }],
  },
];

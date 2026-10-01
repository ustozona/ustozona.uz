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
   ════════════════════════════════════════════════════════════════════ */

export type DoskaTemplateWidget = { kind: WidgetKind; initial?: Record<string, unknown> };

export type DoskaTemplate = {
  id: string;
  background: string;
  widgets: DoskaTemplateWidget[];
};

const minutes = (m: number) => ({ mode: "countdown", durationSec: m * 60, remainingSec: m * 60, running: false });

export const DOSKA_TEMPLATES: DoskaTemplate[] = [
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

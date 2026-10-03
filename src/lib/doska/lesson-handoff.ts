import type { DoskaTemplateWidget } from "@/lib/doska/templates";
import type { LessonStudio, StudioBlock, StudioEnvHint } from "@/lib/lesson-studio";

/* ════════════════════════════════════════════════════════════════════
   DARS REJIMI — studiya ssenariysi → Doska ekranlari.

   docs/ustoz-pulti-spec.md §3. «▶ Darsni boshlash» (Topshiriqlar →
   Dars studiyasi) ssenariyni Doskaga beradi: har blok — bitta ekran
   (docs/dars-studiyasi-spec.md §4 «Blok = Doskaning bitta ekrani»).

   NEGA URL EMAS, localStorage: ssenariy URL ga sigʻmaydi, Doska esa
   dashboard'dan tashqarida (darslar storeʼi u yerda yuklanmaydi). Ikkala
   tab bir domen — studiya yozadi, Doska BIR MARTA oʻqiydi va oʻchiradi.
   10 daqiqadan eski yozuv eʼtiborsiz: eski tabdagi tasodifiy
   `?lesson=1` qayta ochilsa, oʻtgan haftaning darsi qaytib kelmasin.

   Ekran tuzilishi faqat MAVJUD vidjetlardan: taqdimot (slayd va savol),
   taymer, guruhlar, matn, sayt, havola — Doskada hech narsa
   cheklanmaydi, oʻqituvchi ekranni odatdagidek tahrirlay oladi.
   ════════════════════════════════════════════════════════════════════ */

const KEY = "ustozona-doska-lesson-handoff";
const TITLE_KEY = "ustozona-doska-lesson-title";
const MAX_AGE_MS = 10 * 60 * 1000;

export type LessonScreen = { widgets: DoskaTemplateWidget[] };

export type LessonHandoff = {
  v: 1;
  createdAt: number;
  title: string;
  classId: string;
  screens: LessonScreen[];
};

/** Studiya matnlari (mijoz tilida) — modul tarjimani bilmaydi. */
export type LessonScreenTexts = {
  kind: (kind: StudioBlock["kind"]) => string;
  gameName: (block: StudioBlock) => string;
  shellHint: string;
  homeworkHint: string;
};

const full = { x: 0, y: 0, w: 1, h: 1 };

function note(text: string): DoskaTemplateWidget {
  return { kind: "text.v1", initial: { text: text.slice(0, 600), paper: true }, at: { x: 0.1, y: 0.15, w: 0.8, h: 0.5 } };
}

function blockScreen(
  block: StudioBlock,
  stageMinutes: number,
  ctx: { classId: string; className: string; env: StudioEnvHint; origin: string; texts: LessonScreenTexts },
): LessonScreen {
  const title = block.title || ctx.texts.kind(block.kind);
  const heading = [title, block.brief].filter(Boolean).join("\n\n");
  const live = ctx.env.phones && ctx.env.screen;
  switch (block.kind) {
    case "activity":
      return {
        widgets: [
          { kind: "text.v1", initial: { text: heading.slice(0, 600), paper: true }, at: { x: 0, y: 0, w: 0.62, h: 0.42 } },
          {
            kind: "timer.v1",
            initial: { mode: "countdown", durationSec: stageMinutes * 60, remainingSec: stageMinutes * 60, running: false },
            at: { x: 0.65, y: 0, w: 0.35, h: 0.42 },
          },
          { kind: "groups.v1", initial: { roster: { classId: ctx.classId, className: ctx.className } }, at: { x: 0, y: 0.46, w: 1, h: 0.54 } },
        ],
      };
    case "game": {
      const g = block.game;
      if (g?.type === "practice") return { widgets: [{ kind: "embed.v1", initial: { url: `${ctx.origin}/games/${g.file}` }, at: full }] };
      if (g?.type === "link") {
        return {
          widgets: [
            note(heading),
            { kind: "link.v1", initial: { url: g.url, caption: g.label }, at: { x: 0.3, y: 0.68, w: 0.4, h: 0.32 } },
          ],
        };
      }
      return { widgets: [note(`${g ? ctx.texts.gameName(block) : title}\n\n${ctx.texts.shellHint}`)] };
    }
    case "homework":
      return { widgets: [note(`${title}\n\n${ctx.texts.homeworkHint}`)] };
    default: {
      if (!block.setId) return { widgets: [note(heading)] };
      // Jonli: tekshiruv «jonli dars» usulida; dars boshi va chiqish chiptasi —
      // telefon va ekran boʻlsa. Vidjet sessiyani shu ekranga kelinganda ochadi.
      const autoLive =
        (block.kind === "check" && block.method === "live" && live) ||
        ((block.kind === "warmup" || block.kind === "exit") && live);
      /* QR-karta / radio pult tekshiruvi — ekranga kelinganda SINF TESTI
         sahnasi oʻzi ochiladi (docs/sinf-testi-spec.md). Bir martalik
         bayroq: vidjet uni darhol oʻchiradi. */
      const autoClassTest =
        block.kind === "check" && (block.method === "cards" || block.method === "pult")
          ? block.method
          : null;
      return {
        widgets: [
          {
            kind: "presentation.v1",
            initial: {
              setId: block.setId,
              index: 0,
              revealed: false,
              classId: ctx.classId,
              ...(autoLive ? { autoLive: true } : {}),
              ...(autoClassTest ? { autoClassTest } : {}),
            },
            at: full,
          },
        ],
      };
    }
  }
}

export function buildLessonHandoff(
  studio: LessonStudio,
  ctx: { title: string; classId: string; className: string; env: StudioEnvHint; origin: string; texts: LessonScreenTexts },
): LessonHandoff {
  const screens = studio.stages.flatMap((stage) =>
    stage.blocks.map((block) => blockScreen(block, stage.minutes, ctx)),
  );
  return { v: 1, createdAt: Date.now(), title: ctx.title, classId: ctx.classId, screens };
}

export function writeLessonHandoff(h: LessonHandoff): boolean {
  try {
    localStorage.setItem(KEY, JSON.stringify(h));
    return true;
  } catch {
    return false;
  }
}

/** Doska: yozuvni bir marta oladi va oʻchiradi. Eski yoki buzilgan — `null`. */
export function takeLessonHandoff(): LessonHandoff | null {
  try {
    const raw = localStorage.getItem(KEY);
    localStorage.removeItem(KEY);
    if (!raw) return null;
    const h = JSON.parse(raw) as LessonHandoff;
    if (h?.v !== 1 || !Array.isArray(h.screens) || Date.now() - h.createdAt > MAX_AGE_MS) return null;
    return h;
  } catch {
    return null;
  }
}

/** Pult telefonda koʻrsatadigan dars nomi — shu tab uchun. */
export function setLessonTitle(title: string | null) {
  try {
    if (title) sessionStorage.setItem(TITLE_KEY, title);
    else sessionStorage.removeItem(TITLE_KEY);
  } catch {
    /* saqlanmasa — faqat nom koʻrinmaydi */
  }
}

export function lessonTitle(): string | null {
  try {
    return sessionStorage.getItem(TITLE_KEY);
  } catch {
    return null;
  }
}

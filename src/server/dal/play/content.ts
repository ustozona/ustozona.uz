import "server-only";
import { asc, eq, inArray } from "drizzle-orm";
import { db } from "@/server/db/client";
import { activities, activityItems, activitySets } from "@/server/db/schema";
import { requireParticipant } from "@/server/play/session";
import { slideLayoutOf, type SlideLayout } from "@/lib/slide-layouts";

/* ════════════════════════════════════════════════════════════════════
   ISHTIROKCHI KONTENTI — `isCorrect` HECH QACHON mijozga yuborilmaydi
   (A boʻlim, "read model qayta yoziladi, filtr almashtirilmaydi" qoidasi
   shu yerda: toʻgʻri javob serverda qoladi, `submitResponse()` uni
   solishtiradi).

   Har FAOLIYAT bitta "qadam" (`PlayStep`) — mcq bitta savol, pairs esa
   BUTUN juftliklar toʻplami bitta ekranda (moslashtirish taxtasi).
   ════════════════════════════════════════════════════════════════════ */

/** `activities.config.pointsMode` dan hosil qilingan koeffitsiyent —
    FAQAT oʻyin ballini (bu yerda hisoblanadigan koʻrsatkich) koʻpaytiradi.
    `responses.score`/`is_correct` (jurnal daftari) bunga hech qachon
    bogʻliq emas — ikkita daftar mustaqil (docs/ost-loyihalar-arxitektura.md
    R33: "oʻyin qatlami maʼlumot oladi, lekin unga yozmaydi"). */
export type PointsMultiplier = 0 | 1 | 2;

export type McqStep = {
  kind: "mcq";
  itemId: string;
  activityId: string;
  stem: string;
  options: { id: string; text: string }[];
  pointsMultiplier: PointsMultiplier;
};

export type PairsStep = {
  kind: "pairs";
  activityId: string;
  /** Chap ustun — asl tartibda. */
  left: { itemId: string; text: string }[];
  /** Oʻng ustun — ARALASHTIRILGAN (toʻgʻri javob = oʻz itemId'siga moslash). */
  right: { itemId: string; text: string }[];
  pointsMultiplier: PointsMultiplier;
};

/** Taqdimot slaydi — javob kutilmaydi, oʻquvchi oʻqib keyingisiga oʻtadi. */
export type SlideStep = {
  kind: "slide";
  activityId: string;
  layout: SlideLayout;
  title: string;
  body: string;
  imageUrl?: string;
  videoUrl?: string;
  /** Slaydning oʻz foni; yoʻq boʻlsa toʻplam foni (`stageTheme`). */
  bg?: string;
};

/** Soʻrovnoma — variantlar, toʻgʻri javobi yoʻq. */
export type PollStep = {
  kind: "poll";
  itemId: string;
  activityId: string;
  stem: string;
  options: { id: string; text: string }[];
};

/** Soʻz buluti — qisqa matnli javob. */
export type WordcloudStep = {
  kind: "wordcloud";
  itemId: string;
  activityId: string;
  stem: string;
};

/** Ochiq javob — erkin matn, oʻqituvchi keyin qoʻlda baholaydi. */
export type TextStep = {
  kind: "text";
  itemId: string;
  activityId: string;
  stem: string;
};

export type PlayStep = McqStep | PairsStep | SlideStep | PollStep | WordcloudStep | TextStep;

export type PlaySessionContent = {
  sessionId: string;
  mode: string;
  currentIndex: number;
  /** Toʻplam sahna mavzusi (`activity_sets.config.stageTheme`) — slayd foni. */
  stageTheme?: string;
  /** Toʻplam sahna shrifti (`activity_sets.config.stageFont`). */
  stageFont?: string;
  /** Toʻplam sahna uslubi (`activity_sets.config.stageStyle`). */
  stageStyle?: string;
  steps: PlayStep[];
};

function pointsMultiplierOf(config: Record<string, unknown>): PointsMultiplier {
  const mode = config.pointsMode;
  if (mode === "double") return 2;
  if (mode === "none") return 0;
  return 1;
}

function shuffled<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export async function getSessionContent(token: string): Promise<PlaySessionContent> {
  const { session } = await requireParticipant(token);

  const [set] = await db.select().from(activitySets).where(eq(activitySets.id, session.setId));
  const activityIds = set?.items.map((i) => i.activityId) ?? [];

  const activityRows =
    activityIds.length > 0
      ? await db.select().from(activities).where(inArray(activities.id, activityIds))
      : [];

  const itemRows =
    activityIds.length > 0
      ? await db
          .select()
          .from(activityItems)
          .where(inArray(activityItems.activityId, activityIds))
          .orderBy(asc(activityItems.ordinal))
      : [];

  const shapeByActivity = new Map(activityRows.map((a) => [a.id, a.shape]));
  const titleByActivity = new Map(activityRows.map((a) => [a.id, a.title]));
  const configByActivity = new Map(activityRows.map((a) => [a.id, a.config]));
  const itemsByActivity = new Map<string, typeof itemRows>();
  for (const item of itemRows) {
    const list = itemsByActivity.get(item.activityId) ?? [];
    list.push(item);
    itemsByActivity.set(item.activityId, list);
  }

  const steps: PlayStep[] = [];
  for (const activityId of activityIds) {
    const shape = shapeByActivity.get(activityId);
    const items = itemsByActivity.get(activityId) ?? [];
    // Slaydda element yoʻq — shu sababli boʻsh-element tekshiruvidan OLDIN.
    if (shape === "slide") {
      const config = (configByActivity.get(activityId) ?? {}) as {
        heading?: string;
        bg?: string;
        body?: string;
        layout?: string;
        imageUrl?: string;
        videoUrl?: string;
      };
      steps.push({
        kind: "slide",
        activityId,
        layout: slideLayoutOf(config.layout),
        title: config.heading ?? titleByActivity.get(activityId) ?? "",
        body: config.body ?? "",
        imageUrl: config.imageUrl,
        videoUrl: config.videoUrl,
        bg: config.bg,
      });
      continue;
    }
    if (items.length === 0) continue;
    const pointsMultiplier = pointsMultiplierOf(configByActivity.get(activityId) ?? {});

    if (shape === "mcq") {
      const item = items[0];
      const content = item.content as {
        stem: string;
        options: { id: string; text: string; isCorrect: boolean }[];
      };
      steps.push({
        kind: "mcq",
        itemId: item.id,
        activityId,
        stem: content.stem,
        /* Oʻz tezligidagi rejimda variantlar har oʻquvchiga aralashtiriladi:
           rang/tartib («men qizilni bosdim») javobni bildirmasin. Jonli
           rejimda EMAS — u yerda telefon rangi proyektordagi bilan mos
           boʻlishi kerak. */
        options: (session.mode === "live" ? content.options : shuffled(content.options)).map((o) => ({
          id: o.id,
          text: o.text,
        })),
        pointsMultiplier,
      });
    } else if (shape === "text") {
      const item = items[0];
      const content = item.content as { stem?: string };
      steps.push({ kind: "text", itemId: item.id, activityId, stem: content.stem ?? "" });
    } else if (shape === "poll" || shape === "wordcloud") {
      const item = items[0];
      const content = item.content as { stem?: string; options?: { id: string; text: string }[] };
      steps.push(
        shape === "poll"
          ? {
              kind: "poll",
              itemId: item.id,
              activityId,
              stem: content.stem ?? "",
              options: (content.options ?? []).map((o) => ({ id: o.id, text: o.text })),
            }
          : { kind: "wordcloud", itemId: item.id, activityId, stem: content.stem ?? "" },
      );
    } else if (shape === "pairs") {
      const left = items.map((item) => ({
        itemId: item.id,
        text: (item.content as { left: string }).left,
      }));
      const right = shuffled(
        items.map((item) => ({
          itemId: item.id,
          text: (item.content as { right: string }).right,
        }))
      );
      steps.push({ kind: "pairs", activityId, left, right, pointsMultiplier });
    }
  }

  const setConfig = set?.config as
    | { stageTheme?: string; stageFont?: string; stageStyle?: string }
    | undefined;
  const stageTheme = setConfig?.stageTheme;
  const stageFont = setConfig?.stageFont;
  return {
    sessionId: session.id,
    mode: session.mode,
    currentIndex: session.currentIndex,
    stageTheme,
    stageFont,
    stageStyle: setConfig?.stageStyle,
    steps,
  };
}

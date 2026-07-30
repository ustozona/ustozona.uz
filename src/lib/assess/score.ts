import type { ActivityShape, GradingKind } from "@/server/db/schema/assess";
import { isMathEquivalent, parseNumericAnswer } from "./math-equiv";

// Ballash — SOF funksiya. docs/ost-loyihalar-arxitektura.md, B boʻlim:
// "`elapsed_ms` ballash funksiyasining kirish tipiga UMUMAN kiritilmaydi."
// `ScoreInput` shu qoidani TIP DARAJASIDA ushlab turadi — poyga/arqon
// tortish qobiqlari tezlik ballini qaytarishga doimiy bosim qiladi,
// tip tizimi bu chiziqni ushlab turishning eng arzon joyi.

export type ScoreResult = {
  isCorrect: boolean | null;
  /** 0..1 — bitta javobli shakllarda 0 yoki 1 (R26). */
  score: number | null;
};

type McqOption = { id: string; isCorrect: boolean };
type McqContent = { options: McqOption[] };
type PairsContent = { left: string; right: string };
type CategoriesContent = { item: string; categoryId: string };
type SequenceContent = { item: string };
type ClozeContent = { answer: string };
type WordlistContent = { word: string };
type NumberContent = { answer: string; tolerance?: number };
type ImagezoneContent = {
  mode: "click" | "drag" | "label";
  zones: { id: string; label?: string }[];
};
type HottextContent = { tokens: { id: string; isCorrect: boolean }[] };

/** Ballash uchun zarur boʻlgan element maʼlumoti — `elapsed_ms` ATAYLAB yoʻq. */
export type ScoreInput = {
  shape: ActivityShape;
  grading: GradingKind;
  /** activity_items.content — shakl boʻyicha yuqoridagi turlardan biri. */
  content: Record<string, unknown>;
  /** activity_items.ordinal — sequence shaklida toʻgʻri pozitsiya. */
  ordinal: number;
  /** responses.answer — oʻquvchi javobi. */
  answer: Record<string, unknown>;
};

/** Ochiq javob (text/draw) yoki `none`/`manual`/`aiDraft`/`cj` — bu yerda hisoblanmaydi. */
const NOT_AUTO_SCORED: GradingKind[] = ["none", "manual", "aiDraft", "cj"];

export function scoreResponse(input: ScoreInput): ScoreResult {
  if (NOT_AUTO_SCORED.includes(input.grading)) {
    return { isCorrect: null, score: null };
  }

  switch (input.shape) {
    case "mcq":
      return scoreMcq(input.content as McqContent, input.answer);
    case "pairs":
      return scoreExactId(input.content as PairsContent, "left", input.answer, "matchedId");
    case "categories":
      return scoreExactId(
        input.content as CategoriesContent,
        "categoryId",
        input.answer,
        "categoryId"
      );
    case "sequence":
      return scoreSequence(input.ordinal, input.answer);
    case "cloze":
      return scoreText(input.content as ClozeContent, input.answer, input.grading);
    case "wordlist":
      return scoreWord(input.content as WordlistContent, input.answer);
    case "number":
      return scoreNumber(input.content as NumberContent, input.answer, input.grading);
    case "imagezone":
      return scoreImagezone(input.content as ImagezoneContent, input.answer);
    case "hottext":
      return scoreHottext(input.content as HottextContent, input.answer);
    case "text":
    case "draw":
      return { isCorrect: null, score: null };
  }
}

function toBinary(isCorrect: boolean): ScoreResult {
  return { isCorrect, score: isCorrect ? 1 : 0 };
}

function normalize(value: unknown): string {
  return String(value ?? "")
    .trim()
    .toLowerCase();
}

function scoreMcq(content: McqContent, answer: Record<string, unknown>): ScoreResult {
  const correctIds = new Set(content.options.filter((o) => o.isCorrect).map((o) => o.id));
  // Bir nechta `isCorrect` ruxsat etiladi (R63) — `optionId` yoki `optionIds`.
  const chosen = Array.isArray(answer.optionIds)
    ? (answer.optionIds as string[])
    : answer.optionId
      ? [answer.optionId as string]
      : [];
  if (chosen.length === 0) return { isCorrect: false, score: 0 };
  const isCorrect =
    chosen.length === correctIds.size && chosen.every((id) => correctIds.has(id));
  return toBinary(isCorrect);
}

function scoreExactId(
  content: Record<string, unknown>,
  contentKey: string,
  answer: Record<string, unknown>,
  answerKey: string
): ScoreResult {
  const expected = normalize(content[contentKey]);
  const actual = normalize(answer[answerKey]);
  return toBinary(expected.length > 0 && expected === actual);
}

function scoreSequence(ordinal: number, answer: Record<string, unknown>): ScoreResult {
  return toBinary(Number(answer.position) === ordinal);
}

function scoreText(
  content: ClozeContent,
  answer: Record<string, unknown>,
  grading: GradingKind
): ScoreResult {
  if (grading === "keyword") {
    const keywords = normalize(content.answer)
      .split(",")
      .map((k) => k.trim())
      .filter(Boolean);
    const value = normalize(answer.value);
    const isCorrect = keywords.length > 0 && keywords.every((k) => value.includes(k));
    return toBinary(isCorrect);
  }
  return toBinary(normalize(content.answer) === normalize(answer.value));
}

function scoreWord(content: WordlistContent, answer: Record<string, unknown>): ScoreResult {
  return toBinary(normalize(content.word) === normalize(answer.value));
}

function scoreNumber(
  content: NumberContent,
  answer: Record<string, unknown>,
  grading: GradingKind
): ScoreResult {
  const raw = String(answer.value ?? "");
  const tolerance = content.tolerance ?? 0;
  if (grading === "mathEquiv") {
    return toBinary(isMathEquivalent(raw, content.answer, tolerance));
  }
  const actual = parseNumericAnswer(raw);
  const expected = parseNumericAnswer(content.answer);
  if (actual === null || expected === null) return { isCorrect: false, score: 0 };
  return toBinary(Math.abs(actual - expected) <= tolerance);
}

/** QISMAN BAHOLASH (R26) — koʻp kichik javobli element, ulush yoziladi. */
function scoreImagezone(content: ImagezoneContent, answer: Record<string, unknown>): ScoreResult {
  if (content.mode === "click") {
    const isCorrect = content.zones.some((z) => z.id === answer.zoneId);
    return toBinary(isCorrect);
  }
  // drag | label — {placements: [{token, zoneId}]}
  const placements = Array.isArray(answer.placements)
    ? (answer.placements as { token: string; zoneId: string }[])
    : [];
  if (content.zones.length === 0) return { isCorrect: false, score: 0 };
  const correctCount = placements.filter((p) =>
    content.zones.some((z) => z.id === p.zoneId && z.id === p.token)
  ).length;
  const score = correctCount / content.zones.length;
  return { isCorrect: score === 1, score };
}

/** QISMAN BAHOLASH (R26) — hottext tokenlari boʻyicha ulush. */
function scoreHottext(content: HottextContent, answer: Record<string, unknown>): ScoreResult {
  const selected = new Set(
    Array.isArray(answer.selectedIds) ? (answer.selectedIds as string[]) : []
  );
  const correctIds = new Set(content.tokens.filter((t) => t.isCorrect).map((t) => t.id));
  if (correctIds.size === 0) return { isCorrect: false, score: 0 };
  let hits = 0;
  for (const token of content.tokens) {
    const wasSelected = selected.has(token.id);
    if (wasSelected === token.isCorrect) hits += 1;
  }
  const score = hits / content.tokens.length;
  return { isCorrect: score === 1, score };
}

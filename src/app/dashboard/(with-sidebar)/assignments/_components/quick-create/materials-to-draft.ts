import type { AiDeckItem, AiMcq } from "@/lib/ai-materials";
import { MCQ_OPTION_COUNT, newQuestion, type DraftQuestion } from "../test/builder/types";

/* ════════════════════════════════════════════════════════════════════
   AI NATIJASI / SHABLON → TOʻPLAM QORALAMASI.

   Toʻplam muharriri (`SetBuilderOverlay`) bilan AYNAN bir til: har
   savol `newQuestion()` dan boshlanadi (standart vaqt, ball, joylashuv),
   ustiga mazmun yoziladi. Shuning uchun AI yaratgan savol qoʻlda
   yozilganidan farq qilmaydi — tahrirlash, saqlash, oʻtkazish bir xil.

   Test savolida variantlar doim 4 ta joy (`MCQ_OPTION_COUNT`): ikki
   variantli savolda qolgan ikkitasi boʻsh turadi va saqlashda tushib
   qoladi — muharrirdagi qoida.
   ════════════════════════════════════════════════════════════════════ */

function padOptions(options: DraftQuestion["options"]): DraftQuestion["options"] {
  const out = [...options];
  while (out.length < MCQ_OPTION_COUNT) out.push({ id: crypto.randomUUID(), text: "", isCorrect: false });
  return out;
}

export function mcqDraft(m: AiMcq): DraftQuestion {
  const options = m.options.map((text, i) => ({ id: crypto.randomUUID(), text, isCorrect: i === m.answer }));
  return {
    ...newQuestion("mcq"),
    stem: m.q,
    options: padOptions(options),
    // Uzun savolni oʻqishga vaqt kerak; uzun variantlar esa roʻyxatda oʻqiladi.
    timeLimitSec: m.q.length > 120 ? 60 : 30,
    answerLayout: m.options.some((o) => o.length > 40) ? "list" : "grid",
  };
}

function pollDraft(q: string, options: string[]): DraftQuestion {
  return {
    ...newQuestion("poll"),
    stem: q,
    options: padOptions(options.map((text) => ({ id: crypto.randomUUID(), text, isCorrect: false }))),
  };
}

function itemDraft(item: AiDeckItem): DraftQuestion {
  switch (item.type) {
    case "slide":
      // Slaydda `title` — ekrandagi sarlavha, `stem` — matn (muharrir qoidasi).
      return { ...newQuestion("slide"), slideLayout: item.layout, title: item.heading, stem: item.body };
    case "mcq":
      return mcqDraft(item);
    case "poll":
      return pollDraft(item.q, item.options);
    case "wordcloud":
      return { ...newQuestion("wordcloud"), stem: item.q };
    case "open":
      return { ...newQuestion("text"), stem: item.q, ...(item.sample ? { sampleAnswer: item.sample } : {}) };
  }
}

export function deckDrafts(items: AiDeckItem[]): DraftQuestion[] {
  return items.map(itemDraft);
}

/** Rasm (aqliy xarita, infografika) — «Katta media» slaydi. */
export function imageSlideDraft(heading: string, imageUrl: string): DraftQuestion {
  return { ...newQuestion("slide"), slideLayout: "media", title: heading, imageUrl };
}

/* ── TAYYOR SHABLONLAR (AI'siz, darhol) ──────────────────────────────
   Dars boshida, oʻrtasida va oxirida eng koʻp kerak boʻladigan uchta
   faol usul. Matnlar mijoz tilida keladi (`QuickCreate.tpl.*`). */

export type TemplateId = "warmup" | "check" | "exit";

export type TemplateTexts = {
  warmupCloud: string;
  warmupPoll: string;
  warmupPollOptions: string[];
  checkPoll: string;
  checkPollOptions: string[];
  exitCloud: string;
  exitOpen: string;
};

export function templateDrafts(id: TemplateId, tx: TemplateTexts): DraftQuestion[] {
  switch (id) {
    case "warmup":
      return [
        { ...newQuestion("wordcloud"), stem: tx.warmupCloud },
        pollDraft(tx.warmupPoll, tx.warmupPollOptions),
      ];
    case "check":
      return [pollDraft(tx.checkPoll, tx.checkPollOptions)];
    case "exit":
      return [
        pollDraft(tx.checkPoll, tx.checkPollOptions),
        { ...newQuestion("wordcloud"), stem: tx.exitCloud },
        { ...newQuestion("text"), stem: tx.exitOpen },
      ];
  }
}

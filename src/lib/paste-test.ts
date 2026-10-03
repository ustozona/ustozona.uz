/* ════════════════════════════════════════════════════════════════════
   MATNDAN TEST — tayyor qogʻoz testni joylab, bir bosishda toʻplamga.

   Qishloq oʻqituvchisining testlari allaqachon bor: metodik qoʻllanma,
   oʻtgan yilgi Word fayl, Telegram guruhidagi test. Ularni savolma-
   savol qayta terish — eng koʻp vaqt oladigan ish. Bu modul oddiy
   matnni (nusxalab joylangan) savollarga ajratadi — AI SIZ, internetsiz,
   kredit sarflamasdan, oʻqituvchi koʻrib tahrirlaydi.

   Taniladigan shakllar (aralash ham boʻladi):
     1. Savol matni            1) Savol      1-savol. Savol
     A) variant                a. variant    *B) toʻgʻri    C) variant +
     A) 2   B) 3   C) 4   D) 5               (variantlar bir qatorda)
     Javoblar: 1-A, 2-C 3B …  (oxirida kalit)
   Harflar: lotin A–E, kirill oʻxshashlari (А В С) va rus tartibi
   (А Б В Г Д) — matnda Б yoki Г boʻlsa rus tartibi deb olinadi.

   Toʻgʻri javob topilmasa savol baribir olinadi (`answer: -1`) —
   oʻqituvchi muharrirda belgilaydi; qaysilar ekani qaytariladi.
   ════════════════════════════════════════════════════════════════════ */

export type PastedQuestion = { q: string; options: string[]; answer: number };

export type PastedTest = {
  questions: PastedQuestion[];
  /** Toʻgʻri javobi topilmagan savollar (1 dan). */
  missingAnswers: number[];
  /** Variantlari yetarli boʻlmagani uchun tashlangan boʻlaklar soni. */
  skipped: number;
};

export const PASTE_MAX_CHARS = 30_000;
const MAX_QUESTIONS = 100;
const MAX_OPTIONS = 6;

const LETTERS = "A-Ea-eАБВГДабвгдСсЕе";
const OPTION_RE = new RegExp(`^([*+]\\s*)?([${LETTERS}])\\s*[).]\\s*(.+)$`);
const INLINE_RE = new RegExp(`(?:^|\\s)([*+]?)([${LETTERS}])\\s*\\)\\s*`, "g");
const QUESTION_RE = /^(\d{1,3})\s*(?:-\s*savol|-\s*вопрос|-?\s*[.)])\s*(.*)$/i;
const KEY_RE = /^(javoblar|javob kaliti|kalit|toʻgʻri javoblar|to'g'ri javoblar|answers?|answer key|ответы|ключ|жавоблар|калит)\s*[:.\-–]?\s*(.*)$/i;
const CORRECT_TAIL = /\s*(\(\s*\+\s*\)|\(toʻgʻri\)|\(to'g'ri\)|\(верно\)|[*+✓✔])\s*$/i;

type Scheme = "latin" | "ru";

function letterIndex(ch: string, scheme: Scheme): number {
  const c = ch.toUpperCase();
  if (scheme === "ru") {
    const ru = "АБВГД".indexOf(c);
    if (ru >= 0) return ru;
  }
  // Lotin va kirill oʻxshash harflar (А=A, В=B, С=C, Е=E).
  const map: Record<string, number> = { A: 0, "А": 0, B: 1, "В": 1, C: 2, "С": 2, D: 3, E: 4, "Е": 4, "Д": 3 };
  return map[c] ?? -1;
}

function clean(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

type Draft = { q: string; options: { text: string; correct: boolean; letter: string }[]; no: number | null };

/** Bir qatordagi bir nechta variantni ajratadi: «A) 2  B) 3  C) 4». */
function splitInline(line: string): { letter: string; text: string; star: boolean }[] | null {
  const hits = [...line.matchAll(INLINE_RE)];
  if (hits.length < 2) return null;
  const out: { letter: string; text: string; star: boolean }[] = [];
  for (let i = 0; i < hits.length; i++) {
    const h = hits[i];
    const start = (h.index ?? 0) + h[0].length;
    const end = i + 1 < hits.length ? hits[i + 1].index ?? line.length : line.length;
    out.push({ letter: h[2], text: line.slice(start, end), star: Boolean(h[1]) });
  }
  // Birinchi variant qatorning boshida boʻlishi shart — aks holda bu savol
  // matni ichidagi «a) …» boʻlishi mumkin.
  return line.slice(0, hits[0].index ?? 0).trim() ? null : out;
}

export function parsePastedTest(raw: string): PastedTest {
  const text = raw.slice(0, PASTE_MAX_CHARS).replace(/\r\n?/g, "\n");
  const lines = text.split("\n").map((l) => l.replace(/ /g, " ").trim()).filter(Boolean);

  // Rus tartibi: variant belgisi sifatida Б yoki Г uchrasa.
  const scheme: Scheme = lines.some((l) => /^[*+]?\s*[БбГг]\s*[).]/.test(l) || /\s[БбГг]\s*\)/.test(l)) ? "ru" : "latin";

  const drafts: Draft[] = [];
  let cur: Draft | null = null;
  const key = new Map<number, number>();
  let inKey = false;

  const readKey = (s: string) => {
    for (const m of s.matchAll(new RegExp(`(\\d{1,3})\\s*[-.):]?\\s*([${LETTERS}])(?![\\p{L}])`, "gu"))) {
      const idx = letterIndex(m[2], scheme);
      if (idx >= 0) key.set(Number(m[1]), idx);
    }
  };

  const push = () => {
    if (cur) drafts.push(cur);
    cur = null;
  };

  for (const line of lines) {
    const keyLine = line.match(KEY_RE);
    if (keyLine) {
      push();
      inKey = true;
      readKey(keyLine[2]);
      continue;
    }
    if (inKey) {
      readKey(line);
      continue;
    }

    const inline = splitInline(line);
    if (inline && cur) {
      for (const o of inline) {
        const tail = o.text.match(CORRECT_TAIL);
        cur.options.push({ text: clean(o.text.replace(CORRECT_TAIL, "")), correct: o.star || Boolean(tail), letter: o.letter });
      }
      continue;
    }

    const opt = line.match(OPTION_RE);
    if (opt && cur) {
      const tail = opt[3].match(CORRECT_TAIL);
      cur.options.push({ text: clean(opt[3].replace(CORRECT_TAIL, "")), correct: Boolean(opt[1]) || Boolean(tail), letter: opt[2] });
      continue;
    }

    const q = line.match(QUESTION_RE);
    if (q) {
      push();
      // «3-savol.» — raqamdan keyingi tinish belgisi savol matniga oʻtmasin.
      cur = { q: clean(q[2].replace(/^[.):\-–\s]+/, "")), options: [], no: Number(q[1]) };
      continue;
    }

    if (cur && cur.options.length === 0) {
      // Savol matnining davomi (bir necha qatorli savol).
      cur.q = clean(`${cur.q} ${line}`);
    } else if (cur && cur.options.length > 0 && !opt) {
      // Variantlardan keyingi raqamsiz qator — yangi savol.
      push();
      cur = { q: clean(line), options: [], no: null };
    } else if (!cur) {
      cur = { q: clean(line), options: [], no: null };
    }
  }
  push();

  const questions: PastedQuestion[] = [];
  const missingAnswers: number[] = [];
  let skipped = 0;
  for (const d of drafts) {
    const options = d.options.filter((o) => o.text).slice(0, MAX_OPTIONS);
    if (!d.q || options.length < 2) {
      skipped++;
      continue;
    }
    if (questions.length >= MAX_QUESTIONS) break;
    let answer = options.findIndex((o) => o.correct);
    // Kalit savol raqami boʻyicha; raqamsiz savolda — tartib raqami.
    const keyNo = d.no ?? questions.length + 1;
    if (answer < 0 && key.has(keyNo)) {
      const k = key.get(keyNo)!;
      answer = k < options.length ? k : -1;
    }
    questions.push({ q: d.q.slice(0, 500), options: options.map((o) => o.text.slice(0, 200)), answer });
    if (answer < 0) missingAnswers.push(questions.length);
  }
  return { questions, missingAnswers, skipped };
}

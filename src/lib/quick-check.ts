/* ════════════════════════════════════════════════════════════════════
   TEZKOR TEKSHIRISH — qoʻlda yozilgan javob varagʻi (AI koʻrish).

   docs/ustoz-pulti-spec.md §7.1. Maxsus varaq chop etish shart emas:
   oʻqituvchi Doskada SHABLONNI koʻrsatadi, oʻquvchi oddiy qogʻozga
   ismini va «1) A 2) C …» qilib javoblarini yozadi. Oʻqituvchi telefonda
   suratga oladi (bitta suratda 4 tagacha varaq — `QUICK_MAX_SHEETS`) →
   AI oʻqiydi → ism sinf roʻyxatiga moslanadi → natija
   koʻrib chiqish roʻyxatiga tushadi (QR-karta va OMR bilan bir yoʻl).

   AI faqat MATNNI OʻQIYDI — baholamaydi: toʻgʻri javoblar unga
   berilmaydi, ball serverda `applyOmrScan` → `scoreResponse` da.
   Shubhali harf sariq belgilanadi, ism topilmasa oʻqituvchi tanlaydi.

   Neytral modul: route ham, mijoz ham (shablon matni) shu yerdan oladi.
   ════════════════════════════════════════════════════════════════════ */

export type QuickLetter = "A" | "B" | "C" | "D";

export type QuickCheckRead = {
  name: string;
  /** Savol raqami → harf (oʻqilmagan — `null`). */
  answers: Record<number, QuickLetter | null>;
  /** AI ishonchsiz boʻlgan savollar. */
  unsure: number[];
};

/** Bitta suratdagi eng koʻp varaq soni. Bitta surat — bitta AI krediti,
    shuning uchun 32 kishilik sinf 8 ta surat (8 kredit) bilan tekshiriladi.
    Koʻprogʻi kadrga sigʻmaydi: varaq kichrayib qoʻlyozma oʻqilmay qoladi. */
export const QUICK_MAX_SHEETS = 4;

export function quickCheckPrompt(questionCount: number): { system: string; prompt: string } {
  const system = `Sen — maktab javob varaqlarini oʻquvchi yordamchi. Rasmda 1 dan ${QUICK_MAX_SHEETS} tagacha oʻquvchi varagʻi boʻlishi mumkin (stol ustida yonma-yon terilgan). Har varaqda: tepada oʻquvchining ismi (va familiyasi), pastda javoblar «1) A», «2-B», «3. C» yoki jadval koʻrinishida.
Vazifa: FAQAT oʻqish. Baholama, toʻgʻri javobni taxmin qilma.
Javob — FAQAT bitta JSON obyekt, boshqa hech narsa yozma:
{"sheets":[{"name":"varaqdagi ism-familiya aynan yozilganidek","answers":{"1":"A","2":"C"},"unsure":[2]}]}
Qoidalar:
- Har varaq — "sheets" ichida ALOHIDA obyekt. Tartib: chapdan oʻngga, yuqoridan pastga.
- Bir varaqdagi javobni boshqa varaqqa ARALASHTIRMA: javob qaysi ism yozilgan qogʻozda turgan boʻlsa, oʻsha varaqqa tegishli.
- Varaqlar ${QUICK_MAX_SHEETS} tadan koʻp boʻlsa — faqat birinchi ${QUICK_MAX_SHEETS} tasini yoz.
- Savollar 1 dan ${questionCount} gacha. Boshqa raqamlarni tashla.
- Harf faqat A, B, C yoki D. Kirill «А, В, С, Д» — lotin A, B, C, D. Kichik harf — katta.
- Savol boʻsh, oʻchirilgan yoki ikki harf yozilgan boʻlsa — "answers" da yozma.
- Harfni aniq oʻqiy olmasang (masalan B yoki D) — eng ehtimolini yoz va raqamini "unsure" ga qoʻsh.
- Varaq qisman kadrdan chiqib ketgan boʻlsa — koʻringan qismini oʻqi.
- Ism oʻqilmasa — "name": "".`;
  return { system, prompt: `Rasmdagi har bir varaqdan ism va ${questionCount} ta savol javobini oʻqi.` };
}

const CYR_LETTER: Record<string, QuickLetter> = { А: "A", В: "B", С: "C", Д: "D", Б: "B" };

function letterOf(raw: unknown): QuickLetter | null {
  if (typeof raw !== "string") return null;
  const s = raw.trim().toUpperCase().replace(/[).:\s]/g, "");
  if (s.length !== 1) return null;
  if (s === "A" || s === "B" || s === "C" || s === "D") return s;
  return CYR_LETTER[s] ?? null;
}

/** Bitta varaq obyekti → ism va harflar (buzilgan qism tashlanadi). */
function readSheet(raw: unknown, questionCount: number): QuickCheckRead | null {
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) return null;
  const obj = raw as Record<string, unknown>;
  const answers: Record<number, QuickLetter | null> = {};
  const rawAnswers = obj.answers;
  const entries: [string, unknown][] = Array.isArray(rawAnswers)
    ? rawAnswers.map((v, i) => [String(i + 1), v])
    : typeof rawAnswers === "object" && rawAnswers !== null
      ? Object.entries(rawAnswers as Record<string, unknown>)
      : [];
  for (const [k, v] of entries) {
    const no = Number.parseInt(k, 10);
    if (!Number.isInteger(no) || no < 1 || no > questionCount) continue;
    answers[no] = letterOf(v);
  }
  const unsure = (Array.isArray(obj.unsure) ? obj.unsure : [])
    .map((x) => Number(x))
    .filter((n) => Number.isInteger(n) && n >= 1 && n <= questionCount);
  const name = typeof obj.name === "string" ? obj.name.replace(/\s+/g, " ").trim().slice(0, 120) : "";
  if (!name && Object.values(answers).every((a) => a === null)) return null;
  return { name, answers, unsure: [...new Set(unsure)] };
}

/** Model javobidan varaqlar roʻyxati — yumshoq.

    Kutilgan shakl `{"sheets":[…]}`, lekin model baʼzan bitta varaqni
    oʻrovsiz (`{"name":…}`) yoki yalangʻoch massiv qaytaradi — uchalasi
    ham qabul qilinadi. Hech narsa oʻqilmasa — boʻsh roʻyxat. */
export function parseQuickCheck(raw: string, questionCount: number): QuickCheckRead[] {
  let s = raw.trim();
  const fence = s.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) s = fence[1].trim();
  const objStart = s.indexOf("{");
  const arrStart = s.indexOf("[");
  const isArray = arrStart >= 0 && (objStart < 0 || arrStart < objStart);
  const start = isArray ? arrStart : objStart;
  const end = s.lastIndexOf(isArray ? "]" : "}");
  if (start < 0 || end <= start) return [];
  let json: unknown;
  try {
    json = JSON.parse(s.slice(start, end + 1).replace(/,\s*([}\]])/g, "$1"));
  } catch {
    return [];
  }
  const list: unknown[] = Array.isArray(json)
    ? json
    : typeof json === "object" && json !== null && Array.isArray((json as { sheets?: unknown }).sheets)
      ? ((json as { sheets: unknown[] }).sheets)
      : [json];
  return list
    .slice(0, QUICK_MAX_SHEETS)
    .map((x) => readSheet(x, questionCount))
    .filter((x): x is QuickCheckRead => x !== null);
}

/* ── Ismni roʻyxatga moslash ─────────────────────────────────────────
   Qoʻlyozmada ism turlicha yoziladi: «Aliyev Jasur», «Jasur A.»,
   kirillcha «Жасур». Shuning uchun: kichik harf, apostroflar bitta
   shaklga, kirill → lotin, soʻzlar boʻyicha solishtirish (bosh harf
   bilan qisqartma ham hisoblanadi). Eng yaxshi moslik YAGONA va
   yetarlicha kuchli boʻlsagina tanlanadi — aks holda oʻqituvchi tanlaydi. */

const CYR: Record<string, string> = {
  а: "a", б: "b", в: "v", г: "g", ғ: "g'", д: "d", е: "e", ё: "yo", ж: "j", з: "z", и: "i", й: "y", к: "k",
  қ: "q", л: "l", м: "m", н: "n", о: "o", ў: "o'", п: "p", р: "r", с: "s", т: "t", у: "u", ф: "f", х: "x",
  ҳ: "h", ц: "ts", ч: "ch", ш: "sh", ъ: "", ь: "", э: "e", ю: "yu", я: "ya", ы: "i",
};

export function normalizeName(name: string): string[] {
  const latin = name
    .toLowerCase()
    .split("")
    .map((c) => CYR[c] ?? c)
    .join("")
    .replace(/[ʻʼ‘’`´]/g, "'");
  return latin
    .split(/[^a-z']+/)
    .map((w) => w.replace(/'/g, ""))
    .filter(Boolean);
}

function tokenScore(a: string, b: string): number {
  if (a === b) return 1;
  // Qisqartma: «J.» ↔ «jasur»
  if (a.length === 1 || b.length === 1) return a[0] === b[0] ? 0.5 : 0;
  // Bir harf farqi (qoʻlyozma xatosi) yoki boshlanishi bir xil
  if (a.startsWith(b) || b.startsWith(a)) return Math.min(a.length, b.length) >= 3 ? 0.8 : 0;
  return levenshtein(a, b) <= (Math.max(a.length, b.length) >= 6 ? 2 : 1) ? 0.7 : 0;
}

function levenshtein(a: string, b: string): number {
  const dp = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    let prev = dp[0];
    dp[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const tmp = dp[j];
      dp[j] = Math.min(dp[j] + 1, dp[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1));
      prev = tmp;
    }
  }
  return dp[b.length];
}

/** Ikki ism oʻxshashligi 0..1: har varaq soʻzi uchun roʻyxat ismidagi eng yaxshi soʻz. */
export function nameSimilarity(written: string, rosterName: string): number {
  const w = normalizeName(written);
  const r = normalizeName(rosterName);
  if (!w.length || !r.length) return 0;
  const used = new Set<number>();
  let sum = 0;
  for (const t of w) {
    let best = 0;
    let at = -1;
    r.forEach((u, i) => {
      if (used.has(i)) return;
      const s = tokenScore(t, u);
      if (s > best) {
        best = s;
        at = i;
      }
    });
    if (at >= 0) used.add(at);
    sum += best;
  }
  // Varaqda bitta soʻz (faqat ism) boʻlsa ham ishlasin, lekin ikki soʻz kuchliroq.
  return sum / Math.max(w.length, Math.min(r.length, 2));
}

export function matchStudent<T extends { id: string; name: string }>(
  written: string,
  roster: T[],
): { student: T | null; score: number } {
  if (!written.trim()) return { student: null, score: 0 };
  const scored = roster
    .map((s) => ({ s, score: nameSimilarity(written, s.name) }))
    .sort((a, b) => b.score - a.score);
  const [best, second] = scored;
  if (!best || best.score < 0.6) return { student: null, score: best?.score ?? 0 };
  // Ikki oʻquvchi deyarli teng mos kelsa — tanlamaymiz (adashib yozish xavfli).
  if (second && best.score - second.score < 0.15) return { student: null, score: best.score };
  return { student: best.s, score: best.score };
}

/** Doskaga chiqariladigan shablon — oʻquvchi shuni qogʻozga koʻchiradi. */
export function quickTemplateText(questionCount: number, nameLabel: string): string {
  const perLine = questionCount > 20 ? 5 : 4;
  const rows: string[] = [];
  for (let i = 1; i <= questionCount; i += perLine) {
    rows.push(
      Array.from({ length: Math.min(perLine, questionCount - i + 1) }, (_, k) => `${i + k}) ___`).join("    "),
    );
  }
  return `${nameLabel}: ______________________\n\n${rows.join("\n")}`;
}

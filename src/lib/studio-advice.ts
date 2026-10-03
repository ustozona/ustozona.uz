import type { ClassEnvironment } from "@/lib/lesson-models";
import {
  PRACTICE_GAME_FILES, type CheckMethod, type GradedShellId, type PracticeGameFile, type StudioEnvHint, type StudioGame,
} from "@/lib/lesson-studio";

/* ════════════════════════════════════════════════════════════════════
   DARS STUDIYASI — TAVSIYALAR (oʻng ustun).

   Qoida asosida, AI'siz: tez, bepul va har safar bir xil. AI mazmun
   yaratadi, qaysi USUL bu sinfda ishlashini esa sharoit hal qiladi —
   bu hisob, taxmin emas.

   Har tavsiya bilan SABAB qaytadi (`reasons`) — oʻqituvchi «nega
   aynan shu?» deb oʻylamasin, va mos kelmaganida nima yetishmayotganini
   bilsin (oʻchiq tugma emas, sabab — docs/topshiriq-boshlash-markazi.md
   §2). Matnni mijoz oʻz tilida chizadi (`StudioAdvice.reason.*`).

   Tartib: avval Ustozona ichida ishlaydigan va natijasi jurnalga
   tushadigan usul, keyin Ustozona-Games mashq oʻyinlari, oxirida
   tashqi saytlar.
   ════════════════════════════════════════════════════════════════════ */

export type AdviceFit = "best" | "ok" | "blocked";

export type AdviceReason =
  | "phonesAndScreen"
  | "phonesOnly"
  | "noPhones"
  | "noScreen"
  | "printerOk"
  | "needsPrinter"
  | "hasPult"
  | "noPult"
  | "alwaysWorks"
  | "notGraded"
  | "graded"
  | "needsMcq"
  | "needsTest"
  | "shellMismatch"
  | "wholeClassScreen"
  | "ownContent"
  | "noInternet"
  | "printOnce"
  | "anyPaper"
  | "scanLater";

export function envHint(env: ClassEnvironment): StudioEnvHint {
  return { phones: env.phones, screen: env.smartboard || env.projector, printer: env.printer, pult: env.pult };
}

export type MethodAdvice = { method: CheckMethod; fit: AdviceFit; reasons: AdviceReason[] };

/** Tekshirish usullari — sharoit va testdagi variantli savollar soniga qarab.
    `mcqCount` — `null`: test hali ulanmagan (moslik taxminiy). */
export function adviseMethods(env: ClassEnvironment, mcqCount: number | null): MethodAdvice[] {
  const h = envHint(env);
  const noMcq = mcqCount === 0;
  const list: MethodAdvice[] = [
    {
      method: "live",
      fit: !h.phones || !h.screen ? "blocked" : "best",
      reasons: !h.phones ? ["noPhones"] : !h.screen ? ["noScreen"] : ["phonesAndScreen", "graded"],
    },
    {
      /* Karta BIR MARTA chop etiladi va yil boʻyi ishlatiladi — maktabda
         printer boʻlmasa ham tuman markazida chop ettirish mumkin. Shu
         sabab printersiz sinfda toʻsilmaydi, faqat «bir marta» deyiladi. */
      method: "cards",
      fit: noMcq ? "blocked" : !h.printer ? "ok" : h.phones ? "ok" : "best",
      reasons: noMcq ? ["needsMcq"] : !h.printer ? ["printOnce", "graded"] : ["printerOk", "graded"],
    },
    {
      method: "pult",
      fit: !h.pult || noMcq ? "blocked" : "best",
      reasons: !h.pult ? ["noPult"] : noMcq ? ["needsMcq"] : ["hasPult", "graded"],
    },
    {
      method: "paper",
      fit: !h.printer || noMcq ? "blocked" : "ok",
      reasons: !h.printer ? ["needsPrinter"] : noMcq ? ["needsMcq"] : ["printerOk", "graded"],
    },
    {
      method: "selfpaced",
      fit: !h.phones ? "blocked" : "ok",
      reasons: !h.phones ? ["noPhones"] : ["phonesOnly", "graded"],
    },
    {
      /* Tezkor tekshirish — oddiy daftar varagʻi + ustoz telefoni. Telefon
         ham, printer ham boʻlmagan sinfda ENG MOS baholanadigan yoʻl.
         Internet darsda shart emas: suratlar keyin yuklanadi. */
      method: "quick",
      fit: noMcq ? "blocked" : !h.phones && !h.printer ? "best" : "ok",
      reasons: noMcq ? ["needsMcq"] : env.internet ? ["anyPaper", "graded"] : ["anyPaper", "scanLater"],
    },
    { method: "oral", fit: "ok", reasons: ["alwaysWorks", "notGraded"] },
  ];
  const rank: Record<AdviceFit, number> = { best: 0, ok: 1, blocked: 2 };
  return list
    .map((a, i) => ({ a, i }))
    .sort((x, y) => rank[x.a.fit] - rank[y.a.fit] || x.i - y.i)
    .map(({ a }) => a);
}

export type GameAdvice = { game: StudioGame; fit: AdviceFit; reasons: AdviceReason[] };

/** Baholanadigan qobiqning shu testga mosligi: `null` — test yoʻq,
    `true` — mos, satr — mos kelmaslik sababi (`shellAvailability`). */
export type ShellFit = Record<GradedShellId, true | string | null>;

/** Fan → mashq oʻyinlari tartibi (oʻz mazmuni bilan ishlaydi, shuning
    uchun fanga yaqinini oldinga qoʻyamiz). */
function practiceOrder(subject: string): PracticeGameFile[] {
  const s = subject.toLowerCase();
  if (/ingliz|english|nemis|rus|til|lang|adabiyot|literat/.test(s)) return ["so-z-topish", "krossvord", "xotira", "qaysi-katta"];
  if (/matem|math|algebra|geometr/.test(s)) return ["qaysi-katta", "xotira", "krossvord", "so-z-topish"];
  return [...PRACTICE_GAME_FILES];
}

export function adviseGames(
  env: ClassEnvironment,
  ctx: { subject?: string; shellFit: ShellFit },
): GameAdvice[] {
  const h = envHint(env);
  const out: GameAdvice[] = [];
  for (const id of ["arqon", "poyga"] as GradedShellId[]) {
    const fit = ctx.shellFit[id];
    out.push({
      game: { type: "shell", id },
      fit: !h.phones ? "blocked" : fit === true ? "best" : fit === null ? "ok" : "blocked",
      reasons: !h.phones
        ? ["noPhones"]
        : fit === true
          ? ["phonesOnly", "graded"]
          : fit === null
            ? ["needsTest", "graded"]
            : ["shellMismatch"],
    });
  }
  for (const file of practiceOrder(ctx.subject ?? "")) {
    out.push({
      game: { type: "practice", file },
      fit: !env.internet ? "blocked" : "ok",
      reasons: !env.internet ? ["noInternet"] : h.screen ? ["wholeClassScreen", "ownContent"] : ["ownContent"],
    });
  }
  const rank: Record<AdviceFit, number> = { best: 0, ok: 1, blocked: 2 };
  return out
    .map((a, i) => ({ a, i }))
    .sort((x, y) => rank[x.a.fit] - rank[y.a.fit] || x.i - y.i)
    .map(({ a }) => a);
}

/* ── Tashqi saytlar ─────────────────────────────────────────────────
   Roʻyxat KODDA YOʻQ (AGENTS.md: boshqa mahsulot nomlari kodda
   yozilmaydi) — super-admin uni `/admin/settings` da tahrirlaydi
   (`app_settings`, `dal/app-settings.ts`); bazada yozuv boʻlmasa —
   muhit sozlamasi `STUDIO_EXTERNAL_SITES`. Har sayt — nom va qidiruv
   qolipi (`{q}` — mavzu). */

export type ExternalSite = { name: string; search: string };

export const MAX_EXTERNAL_SITES = 8;

/** Bitta sayt yaroqlimi: nom bor, qolip https va `{q}` ni oʻz ichiga oladi. */
export function externalSiteProblem(name: string, search: string): "name" | "query" | "url" | null {
  if (!name.trim()) return "name";
  if (!search.includes("{q}")) return "query";
  try {
    const url = new URL(search.trim().replace("{q}", "x"));
    if (url.protocol !== "https:") return "url";
  } catch {
    return "url";
  }
  return null;
}

/** Roʻyxatni tozalaydi (bazadagi JSONB ham, muhit sozlamasi ham shu yoʻldan). */
export function normalizeExternalSites(list: unknown): ExternalSite[] {
  if (!Array.isArray(list)) return [];
  return list
    .map((x) => {
      if (typeof x !== "object" || x === null) return null;
      const { name, search } = x as Record<string, unknown>;
      if (typeof name !== "string" || typeof search !== "string") return null;
      if (externalSiteProblem(name, search)) return null;
      return { name: name.trim().slice(0, 40), search: search.trim() };
    })
    .filter((x): x is ExternalSite => !!x)
    .slice(0, MAX_EXTERNAL_SITES);
}

export function parseExternalSites(raw: string | undefined): ExternalSite[] {
  if (!raw?.trim()) return [];
  try {
    return normalizeExternalSites(JSON.parse(raw) as unknown);
  } catch {
    return [];
  }
}

export function externalSearchUrl(site: ExternalSite, topic: string): string {
  return site.search.replace("{q}", encodeURIComponent(topic.trim()));
}

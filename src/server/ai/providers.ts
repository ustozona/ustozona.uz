import "server-only";

/* ════════════════════════════════════════════════════════════════════
   AI PROVAYDER QATLAMI — bitta interfeys, bir nechta provayder.

   Zanjir: AI_PROVIDER_CHAIN (default "gemini,groq,openrouter") — kaliti
   bor provayderlar ketma-ket sinaladi. Provayder BIRINCHI DELTA kelgunga
   qadar yiqilsa keyingisiga oʻtiladi; delta kelgandan keyin yiqilsa
   xato yuqoriga otiladi (yarim javob ustiga boshqa model yozmasin).

   Hammasi tekin tarif (2026-09):
   - Gemini `gemini-flash-latest` — kunlik kvota eng saxovatlisi; tool-calling
     va hujjat (Files API) rejimi FAQAT shu yerda ishlaydi.
   - Groq — eng tez javob, kunlik kvotasi katta.
   - OpenRouter — `:free` modellar; kalit qoʻyilsa uchinchi zaxira boʻladi.

   ⚠️ Model nomlari provayder tomonidan olib tashlanishi mumkin: 2026-09 da
   Groq `llama-3.3-70b-versatile` ni oʻchirgan va zanjir jimgina yiqilgan
   (404 → keyingi provayder → hech biri qolmagan). Nomlar env orqali
   almashtiriladi, kod tahrirlanmaydi: GEMINI_MODEL / GROQ_MODEL /
   OPENROUTER_MODEL.
   ════════════════════════════════════════════════════════════════════ */

export type AiChatMessage = { role: "user" | "assistant"; content: string };

/** Chiqish tokeni chegarasi. 4096 dars rejasiga (jadval + rubrika + callout)
    yetmay, javob gap oʻrtasida uzilib qolardi. */
const MAX_OUTPUT_TOKENS = 16384;

export type StreamChatArgs = {
  system: string;
  messages: AiChatMessage[];
  signal: AbortSignal;
  /** Hujjat rejimi (darslik/PDF) — Gemini Files API'dagi fayl. Faqat Gemini qoʻllaydi. */
  doc?: { uri: string; mimeType: string };
  /** Tool-calling (hozircha faqat Gemini). Tool qoʻllamaydigan provayderlar
      uchun `fallbackContext` system promptga qoʻshiladi. */
  tools?: {
    declarations: Array<{
      name: string;
      description: string;
      parameters?: Record<string, unknown>; // JSON Schema (OpenAPI subset)
    }>;
    execute: (name: string, args: Record<string, unknown>) => Promise<string>;
  };
  /** Tool qoʻllamaydigan provayderlar uchun tayyor kontekst bloki. */
  fallbackContext?: string;
  /** Zanjir tartibini almashtirish. */
  chainOverride?: ProviderId[];
  /** Telemetriya: javob bergan provayder (birinchi delta kelganda chaqiriladi). */
  onProvider?: (id: ProviderId) => void;
};

export type ProviderId = "gemini" | "groq" | "openrouter";

const PROVIDER_KEYS: Record<ProviderId, string> = {
  gemini: "GEMINI_API_KEY",
  groq: "GROQ_API_KEY",
  openrouter: "OPENROUTER_API_KEY",
};

const ALL_PROVIDERS: ProviderId[] = ["gemini", "groq", "openrouter"];

const isProviderId = (s: string): s is ProviderId =>
  (ALL_PROVIDERS as string[]).includes(s);

/** Zanjirdagi, kaliti sozlangan provayderlar (tartib saqlanadi). */
export function configuredProviders(): ProviderId[] {
  const chain = (process.env.AI_PROVIDER_CHAIN || ALL_PROVIDERS.join(","))
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(isProviderId);
  return chain.filter((p) => !!process.env[PROVIDER_KEYS[p]]);
}

/* ── SSE yordamchi: fetch javobidan `data: ...` qatorlarini ajratadi ── */
async function* sseData(res: Response): AsyncGenerator<string> {
  const reader = res.body!.getReader();
  const dec = new TextDecoder();
  let buf = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    // CRLF ehtimoli uchun \r?\n
    const lines = buf.split(/\r?\n/);
    buf = lines.pop() ?? "";
    for (const line of lines) {
      if (line.startsWith("data:")) yield line.slice(5).trim();
    }
  }
}

/* ── Gemini (asosiy; tool-calling va hujjat rejimi shu yerda) ── */
type GeminiPart = Record<string, unknown>;
type GeminiFnCall = { name: string; args?: Record<string, unknown> };

async function* streamGemini(args: StreamChatArgs): AsyncGenerator<string> {
  const model = process.env.GEMINI_MODEL || "gemini-flash-latest";
  const contents: Array<{ role: "user" | "model"; parts: GeminiPart[] }> = args.messages.map(
    (m, i) => {
      const parts: GeminiPart[] = [{ text: m.content }];
      // Hujjat oxirgi user xabariga biriktiriladi (fayl bir marta yuklangan, uri arzon)
      if (args.doc && m.role === "user" && i === args.messages.length - 1) {
        parts.unshift({
          file_data: { file_uri: args.doc.uri, mime_type: args.doc.mimeType },
        });
      }
      return { role: m.role === "assistant" ? "model" : "user", parts };
    }
  );

  // Tool-calling sikli: model funksiya soʻrasa bajarib, natija bilan davom etamiz
  for (let round = 0; round < 4; round++) {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": process.env.GEMINI_API_KEY!,
        },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{ text: args.system + (args.tools ? "" : args.fallbackContext ?? "") }],
          },
          contents,
          ...(args.tools
            ? { tools: [{ functionDeclarations: args.tools.declarations }] }
            : {}),
          generationConfig: { maxOutputTokens: MAX_OUTPUT_TOKENS },
        }),
        signal: args.signal,
      }
    );
    if (!res.ok || !res.body) {
      throw new Error(`Gemini ${res.status}: ${(await res.text().catch(() => "")).slice(0, 300)}`);
    }

    const fnCalls: GeminiFnCall[] = [];
    for await (const data of sseData(res)) {
      if (!data || data === "[DONE]") continue;
      try {
        const json = JSON.parse(data) as {
          candidates?: {
            content?: { parts?: Array<{ text?: string; functionCall?: GeminiFnCall }> };
          }[];
        };
        for (const p of json.candidates?.[0]?.content?.parts ?? []) {
          if (p.text) yield p.text;
          if (p.functionCall?.name) fnCalls.push(p.functionCall);
        }
      } catch {
        /* yarim JSON boʻlagi — eʼtiborsiz */
      }
    }

    if (!fnCalls.length || !args.tools) return;

    // Funksiyalarni bajarib, suhbatga qoʻshamiz va yana soʻraymiz
    contents.push({ role: "model", parts: fnCalls.map((fc) => ({ functionCall: fc })) });
    const results = await Promise.all(
      fnCalls.map(async (fc) => {
        try {
          return await args.tools!.execute(fc.name, fc.args ?? {});
        } catch (err) {
          return `Xatolik: ${err instanceof Error ? err.message : "tool bajarilmadi"}`;
        }
      })
    );
    contents.push({
      role: "user",
      parts: fnCalls.map((fc, i) => ({
        functionResponse: { name: fc.name, response: { result: results[i] } },
      })),
    });
  }
}

/* ── OpenAI-mos chat endpoint — Groq va OpenRouter ikkalasi ham shu shaklda ── */
function openAiCompatible(opts: {
  label: string;
  url: string;
  apiKey: () => string;
  model: () => string;
  headers?: () => Record<string, string>;
}) {
  return async function* (args: StreamChatArgs): AsyncGenerator<string> {
    const res = await fetch(opts.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${opts.apiKey()}`,
        ...(opts.headers?.() ?? {}),
      },
      body: JSON.stringify({
        model: opts.model(),
        stream: true,
        max_tokens: MAX_OUTPUT_TOKENS,
        messages: [
          { role: "system", content: args.system + (args.fallbackContext ?? "") },
          ...args.messages.map((m) => ({ role: m.role, content: m.content })),
        ],
      }),
      signal: args.signal,
    });
    if (!res.ok || !res.body) {
      throw new Error(
        `${opts.label} ${res.status}: ${(await res.text().catch(() => "")).slice(0, 300)}`
      );
    }
    for await (const data of sseData(res)) {
      if (!data || data === "[DONE]") continue;
      try {
        const json = JSON.parse(data) as {
          choices?: { delta?: { content?: string } }[];
        };
        const text = json.choices?.[0]?.delta?.content;
        if (text) yield text;
      } catch {
        /* eʼtiborsiz */
      }
    }
  };
}

/* ── Groq (tez, tekin) ── */
const streamGroq = openAiCompatible({
  label: "Groq",
  url: "https://api.groq.com/openai/v1/chat/completions",
  apiKey: () => process.env.GROQ_API_KEY!,
  model: () => process.env.GROQ_MODEL || "openai/gpt-oss-120b",
});

/* ── OpenRouter (`:free` modellar; kalit qoʻyilsa zanjirga qoʻshiladi).
   `HTTP-Referer` va `X-Title` ixtiyoriy, lekin OpenRouter tekin tarif
   limitlarini shular boʻyicha hisoblaydi. ── */
const streamOpenRouter = openAiCompatible({
  label: "OpenRouter",
  url: "https://openrouter.ai/api/v1/chat/completions",
  apiKey: () => process.env.OPENROUTER_API_KEY!,
  model: () => process.env.OPENROUTER_MODEL || "deepseek/deepseek-chat-v3-0324:free",
  headers: () => ({
    "HTTP-Referer": process.env.NEXT_PUBLIC_SITE_URL || "https://ustozona.uz",
    "X-Title": "Ustozona",
  }),
});

const RUNNERS: Record<ProviderId, (a: StreamChatArgs) => AsyncGenerator<string>> = {
  gemini: streamGemini,
  groq: streamGroq,
  openrouter: streamOpenRouter,
};

/**
 * Zanjir boʻylab streaming: provayder birinchi deltadan OLDIN yiqilsa
 * keyingisi sinaladi; deltadan keyin yiqilsa xato otiladi.
 */
export async function* streamChat(args: StreamChatArgs): AsyncGenerator<string> {
  // Hujjat rejimi faqat Gemini bilan ishlaydi (fayl Gemini Files API'da)
  const base =
    args.chainOverride?.filter((p) => !!process.env[PROVIDER_KEYS[p]]) ??
    configuredProviders();
  const providers = args.doc ? base.filter((p) => p === "gemini") : base;
  if (!providers.length) {
    throw new Error(
      "Ustozona AI sozlanmagan: GEMINI_API_KEY, GROQ_API_KEY yoki OPENROUTER_API_KEY kerak."
    );
  }
  let lastError: unknown;
  for (const id of providers) {
    let started = false;
    try {
      for await (const delta of RUNNERS[id](args)) {
        if (!started) {
          started = true;
          args.onProvider?.(id);
        }
        yield delta;
      }
      return; // muvaffaqiyatli tugadi
    } catch (err) {
      if (args.signal.aborted) throw err; // foydalanuvchi toʻxtatdi — fallback shart emas
      if (started) throw err; // yarim javob — boshqa model bilan davom etmaymiz
      console.warn(`[ustozona-ai] ${id} yiqildi, keyingi provayder:`, err);
      lastError = err;
    }
  }
  throw lastError instanceof Error
    ? lastError
    : new Error("Barcha AI provayderlar vaqtincha ishlamayapti.");
}

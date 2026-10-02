import { requireTeacher } from "@/server/session";
import { consumeAiMessage, recordAiProvider } from "@/server/dal/ai-usage";
import { streamChat, configuredProviders, type ProviderId } from "@/server/ai/providers";
import {
  buildMaterialPrompt,
  normalizeMaterialRequest,
  parseAiMaterial,
  type AiMaterialError,
} from "@/lib/ai-materials";
import { buildStudioPrompt, normalizeStudioRequest, parseAiStudio } from "@/lib/ai-studio";

/**
 * Ustozona AI — tayyor material generatsiyasi («+ Yaratish» → Tezkor yaratish).
 *
 * Soʻrov: `AiMaterialRequest` (tur, mavzu, sinf, ish reja, istak).
 * Javob: `{ material, remaining }` — JSON, streaming EMAS: natija toʻplam
 * muharririga bir butun boʻlib tushadi, yarim test hech kimga kerak emas.
 * Xato: `{ error: AiMaterialError }` — matnni mijoz oʻz tilida koʻrsatadi.
 *
 * `kind: "studio"` — Dars studiyasi (Topshiriqlar): dars rejasi va
 * ssenariy (`lib/ai-studio.ts`). Javob: `{ studio, remaining }`. Kvota va
 * provayder yoʻli aynan shu — bitta reja ham bitta xabar krediti.
 *
 * Kvota va provayder zanjiri dars muharririning AI yordamchisi bilan
 * BIR XIL (`consumeAiMessage`, `streamChat`): bitta generatsiya — bitta
 * xabar krediti.
 */

export const runtime = "nodejs";
export const maxDuration = 60;

/** `maxDuration` dan oldin toʻxtaymiz — oʻqituvchi «uzildi» emas, aniq xato koʻrsin. */
const GENERATION_TIMEOUT_MS = 55_000;
/** Javob chegarasi — buzilgan model cheksiz yozib ketmasin. */
const MAX_RESPONSE_CHARS = 80_000;

function fail(error: AiMaterialError, status: number) {
  return Response.json({ error }, { status, headers: { "Cache-Control": "no-store" } });
}

export async function POST(req: Request) {
  let teacher;
  try {
    teacher = await requireTeacher();
  } catch {
    return fail("auth", 401);
  }
  if (!configuredProviders().length) return fail("not_configured", 503);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return fail("bad_request", 400);
  }
  const studioRequest = normalizeStudioRequest(body);
  const request = studioRequest ? null : normalizeMaterialRequest(body);
  if (!studioRequest && !request) return fail("bad_request", 400);

  const quota = await consumeAiMessage(teacher.id, teacher.plan);
  if (!quota.allowed) return fail("quota", 429);

  const { system, prompt } = studioRequest ? buildStudioPrompt(studioRequest) : buildMaterialPrompt(request!);
  const abort = new AbortController();
  const timer = setTimeout(() => abort.abort(), GENERATION_TIMEOUT_MS);
  // Oʻqituvchi «Bekor qilish» ni bossa — provayderni ham toʻxtatamiz.
  req.signal?.addEventListener("abort", () => abort.abort());

  let text = "";
  try {
    for await (const delta of streamChat({
      system,
      messages: [{ role: "user", content: prompt }],
      signal: abort.signal,
      json: true,
      onProvider: (id: ProviderId) => {
        recordAiProvider(teacher.id, quota.day, id).catch((err) =>
          console.warn("[ustozona-ai/generate] telemetriya xatosi:", err),
        );
      },
    })) {
      text += delta;
      if (text.length > MAX_RESPONSE_CHARS) break;
    }
  } catch (err) {
    if (!req.signal?.aborted) console.error("[ustozona-ai/generate] provayder xatosi:", err);
    return fail("failed", 502);
  } finally {
    clearTimeout(timer);
  }

  if (studioRequest) {
    const studio = parseAiStudio(studioRequest, text);
    if (!studio) {
      console.warn(`[ustozona-ai/generate] reja oʻqilmadi (${text.length} belgi):`, text.slice(0, 300));
      return fail("unreadable", 502);
    }
    return Response.json(
      { studio, remaining: Math.max(0, quota.credit - quota.used) },
      { headers: { "Cache-Control": "no-store" } },
    );
  }

  const material = parseAiMaterial(request!, text);
  if (!material) {
    console.warn(
      `[ustozona-ai/generate] javob oʻqilmadi (${request!.kind}, ${text.length} belgi):`,
      text.slice(0, 300),
    );
    return fail("unreadable", 502);
  }

  return Response.json(
    { material, remaining: Math.max(0, quota.credit - quota.used) },
    { headers: { "Cache-Control": "no-store" } },
  );
}

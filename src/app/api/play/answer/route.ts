import { z } from "zod";
import { submitResponse, type SubmitResponseInput } from "@/server/dal/play/responses";
import { corsJson, corsPreflight, resolveOrigin } from "@/server/play/cors";
import { errorBody, errorStatus } from "@/server/play/http-errors";

/* ════════════════════════════════════════════════════════════════════
   POST /api/play/answer

   Oʻyin qobigʻi javobni SHU YERGA yuboradi va natijani serverdan oladi.
   Ballash `submitResponse()` ichida — bir joyda, oʻyin qobigʻi qaysi
   domenda turishidan qatʼi nazar.

   Nega ballash mijozda emas: oʻyin qobigʻi — brauzerdagi HTML, uni
   istalgan oʻquvchi ochib oʻzgartira oladi. Baho jurnalga tushadigan
   raqam boʻlgani uchun u FAQAT serverda hisoblanadi.
   ════════════════════════════════════════════════════════════════════ */

export const dynamic = "force-dynamic";

const schema = z.object({
  token: z.string().min(1),
  itemId: z.string().min(1),
  answer: z.record(z.string(), z.unknown()),
  elapsedMs: z.number().int().nonnegative().optional(),
});

export function OPTIONS(request: Request) {
  return corsPreflight(request);
}

export async function POST(request: Request) {
  if (!resolveOrigin(request) && request.headers.get("origin")) {
    return new Response(null, { status: 403 });
  }

  let parsed: z.infer<typeof schema>;
  try {
    parsed = schema.parse(await request.json());
  } catch {
    return corsJson(request, { ok: false, error: "invalid_request" }, { status: 400 });
  }

  try {
    const row = await submitResponse(parsed as SubmitResponseInput);
    return corsJson(request, { ok: true, isCorrect: row?.isCorrect ?? null });
  } catch (err) {
    return corsJson(request, errorBody(err), { status: errorStatus(err) });
  }
}

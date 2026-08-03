import { getSessionContent } from "@/server/dal/play/content";
import { corsJson, corsPreflight, resolveOrigin } from "@/server/play/cors";
import { errorBody, errorStatus } from "@/server/play/http-errors";

/* ════════════════════════════════════════════════════════════════════
   GET /api/play/content?token=...

   «Ustozona Baholash» ijro sathi uchun savol kontenti. Server action
   (`getSessionContentAction`) faqat Ustozona sahifalaridan chaqiriladi;
   bu HTTP endpoint esa BOSHQA DOMENDAGI oʻyin qobigʻi uchun — mantiq
   bir xil DAL'dan keladi, takrorlanmaydi.

   TOʻGʻRI JAVOB BU YERDAN CHIQMAYDI. `getSessionContent()` allaqachon
   `isCorrect` ni olib tashlab beradi; oʻyin qobigʻi javobni bilmaydi,
   uni `/api/play/answer` ga yuboradi va serverdan natijani oladi.
   Shu sababli oʻyin qobigʻini oʻzgartirib baho oʻgʻirlab boʻlmaydi.
   ════════════════════════════════════════════════════════════════════ */

export const dynamic = "force-dynamic";

export function OPTIONS(request: Request) {
  return corsPreflight(request);
}

export async function GET(request: Request) {
  if (!resolveOrigin(request) && request.headers.get("origin")) {
    return new Response(null, { status: 403 });
  }

  const token = new URL(request.url).searchParams.get("token") ?? "";
  if (!token) {
    return corsJson(request, { ok: false, error: "token_required" }, { status: 400 });
  }

  try {
    const content = await getSessionContent(token);
    return corsJson(request, { ok: true, content });
  } catch (err) {
    return corsJson(request, errorBody(err), { status: errorStatus(err) });
  }
}

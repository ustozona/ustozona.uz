import { requireTeacher } from "@/server/session";
import { consumeAiMessage } from "@/server/dal/ai-usage";
import { configuredProviders, streamChat } from "@/server/ai/providers";
import { SOURCE_MAX, type AiMaterialError } from "@/lib/ai-materials";

/* ════════════════════════════════════════════════════════════════════
   POST /api/ustozona-ai/read-page   (multipart: image)

   DARSLIK SAHIFASI → MATN. Oʻqituvchi darslik sahifasini telefonda
   suratga oladi, AI undagi asosiy matnni AYNAN koʻchiradi; matn «Tezkor
   yaratish» dagi manba maydoniga tushadi va test shu matndan tuziladi
   (`AiMaterialRequest.source`) — davlat darsligidan chetga chiqmaydi.

   HECH NARSA SAQLANMAYDI: surat faqat oʻqish uchun provayderga ketadi.
   Bitta surat — bitta AI krediti (dars AI yordamchisi bilan umumiy).
   Rasm faqat Gemini'da oʻqiladi (`streamChat` — `image` boʻlsa).
   ════════════════════════════════════════════════════════════════════ */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const MAX_BYTES = 4 * 1024 * 1024;
const ALLOWED = ["image/jpeg", "image/png", "image/webp"];
const TIMEOUT_MS = 50_000;

const SYSTEM = `Sen darslik sahifasidagi matnni AYNAN koʻchirib yozasan.
Qoidalar:
- Faqat sahifadagi asosiy oʻquv matnini yoz: sarlavha, paragraflar, taʼriflar, qoidalar, misollar, topshiriqlar.
- Sahifa raqami, kolontitul, rasm ostidagi mayda yozuv va bezaklarni yozma.
- Formulani oddiy matnda yoz (masalan: x^2 + 3x = 10, a/b, √2).
- Til va yozuvni OʻZGARTIRMA (lotin, kirill yoki rus — qanday boʻlsa shunday). Tarjima qilma, qisqartirma, oʻzingdan qoʻshma, izoh berma.
- Xatboshilar orasida bitta boʻsh qator qoldir.
- Matn oʻqilmasa yoki sahifa darslik emas boʻlsa — hech narsa yozma.`;

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
  if (!configuredProviders().includes("gemini")) return fail("not_configured", 503);

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return fail("bad_request", 400);
  }
  const file = form.get("image");
  if (!(file instanceof File)) return fail("bad_request", 400);
  const mimeType = file.type || "image/jpeg";
  if (!ALLOWED.includes(mimeType) || file.size > MAX_BYTES) return fail("bad_request", 400);

  const quota = await consumeAiMessage(teacher.id, teacher.plan);
  if (!quota.allowed) return fail("quota", 429);

  const abort = new AbortController();
  const timer = setTimeout(() => abort.abort(), TIMEOUT_MS);
  req.signal?.addEventListener("abort", () => abort.abort());
  let text = "";
  try {
    const data = Buffer.from(await file.arrayBuffer()).toString("base64");
    for await (const delta of streamChat({
      system: SYSTEM,
      messages: [{ role: "user", content: "Shu darslik sahifasidagi matnni koʻchirib yoz." }],
      image: { data, mimeType },
      signal: abort.signal,
    })) {
      text += delta;
      if (text.length > SOURCE_MAX * 2) break;
    }
  } catch (err) {
    if (!req.signal?.aborted) console.error("[ustozona-ai/read-page] provayder xatosi:", err);
    return fail("failed", 502);
  } finally {
    clearTimeout(timer);
  }

  const clean = text.replace(/```[a-z]*\n?|```/gi, "").trim().slice(0, SOURCE_MAX);
  if (clean.length < 20) return fail("unreadable", 422);
  return Response.json(
    { text: clean, remaining: Math.max(0, quota.credit - quota.used) },
    { headers: { "Cache-Control": "no-store" } },
  );
}

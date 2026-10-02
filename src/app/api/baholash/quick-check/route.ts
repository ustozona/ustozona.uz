import { requireTeacher } from "@/server/session";
import { verifyScanTicket } from "@/server/baholash/scan-ticket";
import { buildSheetPlan } from "@/server/dal/baholash-sheets";
import { consumeAiMessage } from "@/server/dal/ai-usage";
import { teacherPlanById } from "@/server/dal/quick-check";
import { configuredProviders, streamChat } from "@/server/ai/providers";
import { matchStudent, parseQuickCheck, quickCheckPrompt } from "@/lib/quick-check";

/* ════════════════════════════════════════════════════════════════════
   POST /api/baholash/quick-check   (multipart: image + setId + classId [+ ticket])

   TEZKOR TEKSHIRISH — oʻquvchi oddiy qogʻozga qoʻlda yozgan ism va
   javoblar surati → oʻqilgan javoblar va roʻyxatdagi oʻquvchi.
   HECH NARSA YOZILMAYDI: natija koʻrib chiqish roʻyxatiga tushadi,
   yozish — mavjud `/api/baholash/scan/apply` (oʻqituvchi tasdiqlagach).

   Kimlik `/api/baholash/scan` bilan bir xil: cookie (noutbuk) yoki
   skaner chiptasi (telefon); chiptada test va sinf chiptadan olinadi.
   AI faqat oʻqiydi — toʻgʻri javob unga berilmaydi (`lib/quick-check.ts`).
   Bitta surat — bitta AI krediti (dars AI yordamchisi bilan umumiy).
   ════════════════════════════════════════════════════════════════════ */

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const MAX_BYTES = 4 * 1024 * 1024;
const ALLOWED = ["image/jpeg", "image/png", "image/webp"];
const TIMEOUT_MS = 45_000;

const fail = (error: string, message: string, status: number) =>
  Response.json({ ok: false, error, message }, { status, headers: { "Cache-Control": "no-store" } });

export async function POST(request: Request) {
  if (!configuredProviders().includes("gemini")) {
    return fail("not_configured", "Rasm oʻqiydigan AI sozlanmagan", 503);
  }
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return fail("invalid_form", "Soʻrov notoʻgʻri", 400);
  }

  const rawTicket = String(form.get("ticket") ?? "");
  const ticket = rawTicket ? verifyScanTicket(rawTicket) : null;
  if (rawTicket && !ticket) return fail("bad_ticket", "Havola eskirgan — QR ni qaytadan oching", 401);

  let teacherId = ticket?.teacherId ?? null;
  if (!teacherId) {
    // Noutbuk yoʻli: faqat oʻqituvchi (rol tekshiruvi `requireTeacher` da).
    teacherId = await requireTeacher().then((t) => t.id).catch(() => null);
  }
  if (!teacherId) return fail("unauthorized", "Kirish talab qilinadi", 401);

  const setId = ticket?.setId ?? String(form.get("setId") ?? "");
  const classId = ticket?.classId ?? String(form.get("classId") ?? "");
  const file = form.get("image");
  if (!setId || !classId) return fail("set_and_class_required", "Test va sinf kerak", 400);
  if (!(file instanceof File)) return fail("image_required", "Surat kerak", 400);
  const mimeType = file.type || "image/jpeg";
  if (!ALLOWED.includes(mimeType)) return fail("bad_type", "Faqat JPEG, PNG yoki WEBP surat", 415);
  if (file.size > MAX_BYTES) return fail("too_large", "Surat juda katta — qayta suratga oling", 413);

  // Egalik — test va sinf shu oʻqituvchiniki (chiptaga koʻr-koʻrona ishonilmaydi).
  let plan;
  try {
    plan = await buildSheetPlan(setId, classId, teacherId);
  } catch {
    return fail("not_found", "Test yoki sinf topilmadi", 404);
  }

  const quota = await consumeAiMessage(teacherId, await teacherPlanById(teacherId));
  if (!quota.allowed) return fail("quota", "Bu oyning AI krediti tugadi", 429);

  const { system, prompt } = quickCheckPrompt(plan.questionCount);
  const abort = new AbortController();
  const timer = setTimeout(() => abort.abort(), TIMEOUT_MS);
  request.signal?.addEventListener("abort", () => abort.abort());
  let text = "";
  try {
    const data = Buffer.from(await file.arrayBuffer()).toString("base64");
    for await (const delta of streamChat({
      system,
      messages: [{ role: "user", content: prompt }],
      image: { data, mimeType },
      json: true,
      signal: abort.signal,
    })) {
      text += delta;
      if (text.length > 20_000) break;
    }
  } catch (err) {
    if (!request.signal?.aborted) console.error("[quick-check] AI xatosi:", err);
    return fail("failed", "Surat oʻqilmadi — qayta urinib koʻring", 502);
  } finally {
    clearTimeout(timer);
  }

  const read = parseQuickCheck(text, plan.questionCount);
  if (!read) {
    return fail("unreadable", "Varaqdan javob oʻqilmadi. Varaq toʻliq kadrda, yorugʻ joyda boʻlsin", 422);
  }
  const { student } = matchStudent(read.name, plan.roster);
  return Response.json(
    {
      ok: true,
      read: {
        name: read.name,
        studentId: student?.id ?? null,
        answers: read.answers,
        unsure: read.unsure,
      },
      roster: plan.roster,
      questionCount: plan.questionCount,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}

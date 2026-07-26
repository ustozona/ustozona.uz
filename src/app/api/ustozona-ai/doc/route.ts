import { sql } from "drizzle-orm";
import { getSession } from "@/server/session";
import { db } from "@/server/db/client";
import { aiUsage, aiDocs } from "@/server/db/schema";

/**
 * Ustozona AI — darslik/fayl yuklash (NotebookLM-uslubidagi hujjat rejimi).
 * Fayl Gemini Files API'ga yuklanadi (48 soat saqlanadi, tekin) va
 * qaytgan `uri` keyingi chat soʻrovlarida ishlatiladi — har xabarda
 * fayl qayta yuborilmaydi. Hujjat rejimi faqat Gemini bilan ishlaydi.
 */

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_BYTES = 15 * 1024 * 1024; // 15 MB
const ALLOWED = new Set(["application/pdf", "text/plain", "text/markdown"]);

const BASE = "https://generativelanguage.googleapis.com";
const DOC_DAILY_LIMIT = Math.max(1, Number(process.env.AI_DOC_DAILY_LIMIT) || 5);

/** Asia/Tashkent (UTC+5) boʻyicha YYYY-MM-DD. */
function todayTashkent(): string {
  return new Date(Date.now() + 5 * 3600_000).toISOString().slice(0, 10);
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return new Response("Kirish talab qilinadi", { status: 401 });

  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    return new Response(
      "Hujjat rejimi uchun GEMINI_API_KEY kerak (hozircha faqat Gemini fayllarni oʻqiydi).",
      { status: 503 }
    );
  }

  // ── Kunlik hujjat kvotasi (atomik) ──
  const userId = session.user.id;
  const day = todayTashkent();
  const [usage] = await db
    .insert(aiUsage)
    .values({ id: `${userId}:${day}`, userId, day, count: 0, docCount: 1 })
    .onConflictDoUpdate({
      target: [aiUsage.userId, aiUsage.day],
      set: { docCount: sql`${aiUsage.docCount} + 1` },
    })
    .returning({ docCount: aiUsage.docCount });
  if (usage.docCount > DOC_DAILY_LIMIT) {
    return new Response(
      `Bugungi hujjat yuklash limiti (${DOC_DAILY_LIMIT} ta) tugadi. Ertaga yana urinib koʻring.`,
      { status: 429 }
    );
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return new Response("Notoʻgʻri soʻrov", { status: 400 });
  }
  const file = form.get("file");
  if (!(file instanceof File)) return new Response("Fayl topilmadi", { status: 400 });
  if (file.size > MAX_BYTES) {
    return new Response("Fayl juda katta (maksimum 15 MB). Bitta bob yoki boʻlimni yuklang.", {
      status: 413,
    });
  }
  const mime = file.type || "application/pdf";
  if (!ALLOWED.has(mime)) {
    return new Response("Faqat PDF yoki matn (.txt/.md) fayllar qabul qilinadi.", { status: 415 });
  }

  // ── Gemini Files API — multipart upload ──
  const boundary = `ustozona-${crypto.randomUUID()}`;
  const meta = JSON.stringify({ file: { display_name: file.name.slice(0, 120) } });
  const body = new Blob(
    [
      `--${boundary}\r\nContent-Type: application/json; charset=utf-8\r\n\r\n${meta}\r\n`,
      `--${boundary}\r\nContent-Type: ${mime}\r\n\r\n`,
      await file.arrayBuffer(),
      `\r\n--${boundary}--`,
    ],
    { type: `multipart/related; boundary=${boundary}` }
  );

  const uploadRes = await fetch(`${BASE}/upload/v1beta/files`, {
    method: "POST",
    headers: {
      "x-goog-api-key": key,
      "X-Goog-Upload-Protocol": "multipart",
      "Content-Type": `multipart/related; boundary=${boundary}`,
    },
    body,
  });
  if (!uploadRes.ok) {
    console.error("[ustozona-ai] fayl yuklash xatosi:", uploadRes.status, await uploadRes.text().catch(() => ""));
    return new Response("Faylni yuklab boʻlmadi. Qayta urinib koʻring.", { status: 502 });
  }
  type GeminiFile = { name?: string; uri?: string; mimeType?: string; state?: string };
  const uploaded = (await uploadRes.json()) as { file?: GeminiFile };
  let f = uploaded.file;
  if (!f?.uri || !f.name) {
    return new Response("Faylni yuklab boʻlmadi. Qayta urinib koʻring.", { status: 502 });
  }

  // PDF'lar qayta ishlanguncha kutish (PROCESSING → ACTIVE), maks ~20s
  for (let i = 0; f.state === "PROCESSING" && i < 10; i++) {
    await new Promise((r) => setTimeout(r, 2000));
    const check: Response = await fetch(`${BASE}/v1beta/${f.name}`, {
      headers: { "x-goog-api-key": key },
    });
    if (check.ok) {
      f = { ...f, ...((await check.json()) as GeminiFile) };
    }
  }
  if (!f.uri || f.state === "FAILED") {
    return new Response("Faylni qayta ishlab boʻlmadi (buzilgan PDF boʻlishi mumkin).", {
      status: 422,
    });
  }

  // Egalik yozuvi — chat endpointi faqat shu foydalanuvchining uri'sini qabul qiladi
  await db
    .insert(aiDocs)
    .values({
      id: crypto.randomUUID(),
      userId,
      uri: f.uri,
      mimeType: f.mimeType || mime,
      name: file.name.slice(0, 200),
    })
    .onConflictDoNothing();

  return Response.json({
    uri: f.uri,
    mimeType: f.mimeType || mime,
    name: file.name,
  });
}

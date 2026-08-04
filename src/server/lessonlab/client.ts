import "server-only";
import { createHash, createHmac, randomUUID } from "node:crypto";

/* ════════════════════════════════════════════════════════════════════
   LESSONLAB PARTNER API MIJOZI — «Ustozona Baholash» dvigateli

   Vazifalar boʻlinishi (docs/baholash-integratsiya.md):

     Ustozona EGALIK QILADI:  test maʼlumoti, sessiya, javoblar, jurnal
     LessonLab DVIGATEL BERADI: OMR skaner, javob varagʻi PDF,
                                oʻyin qobiqlari, AI generatsiya

   Yaʼni bu mijoz orqali BIZNING maʼlumot LessonLab'ga koʻchmaydi —
   faqat xizmat chaqiriladi (rasm → javoblar, savol soni → PDF).
   Baho har doim shu yerda, Ustozona bazasida hisoblanadi.

   IMZO — LessonLab `services/partner_api.py` bilan aynan bir xil:

       canonical = "{ts}.{nonce}.{METHOD}.{path?query}.{sha256(body)}"
       signature = HMAC-SHA256(partner_secret, canonical)

   Nozik joylar (LessonLab tomonida test bilan qotirilgan):
     • QUERY ham imzolanadi (`path_qs`) — aks holda hujumchi `?limit=`
       yoki filtrni almashtira olardi.
     • Har soʻrovga YANGI nonce kerak — server takrorlangan nonce'ni
       rad etadi (replay himoyasi).
     • Boʻsh tanada ham sha256("") imzoga kiradi.
   ════════════════════════════════════════════════════════════════════ */

export class LessonLabError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly details?: unknown
  ) {
    super(message);
    this.name = "LessonLabError";
  }
}

/** Sozlanmagan boʻlsa `null` — chaqiruvchi buni «xizmat oʻchiq» deb
    koʻrsatadi, sir qiymatlarni logga chiqarmaydi. */
function config(): { base: string; key: string; secret: string } | null {
  const base = (process.env.LESSONLAB_API_BASE ?? "").replace(/\/+$/, "");
  const key = process.env.LESSONLAB_PARTNER_KEY ?? "";
  const secret = process.env.LESSONLAB_PARTNER_SECRET ?? "";
  if (!base || !key || !secret) return null;
  return { base, key, secret };
}

export function isConfigured(): boolean {
  return config() !== null;
}

export type LessonLabRequest = {
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  /** `/api/v1/...` — query bilan birga, chunki query ham imzolanadi. */
  path: string;
  body?: unknown;
  /** Xom (matn boʻlmagan) tana — masalan OMR uchun JPEG baytlari.
      `body` bilan birga berilmaydi. Imzo baytlarning sha256'sidan
      olinadi, matnga aylantirilmasdan: UTF-8 ga oʻtkazish baytlarni
      buzadi va imzo mos kelmay qoladi. */
  binary?: { bytes: Uint8Array; contentType: string };
  /** Oʻqituvchi roziligi bilan olingan token (OAuth). Faqat oʻqituvchi
      maʼlumotiga tegadigan endpointlar uchun kerak. */
  accessToken?: string;
  /** Takroriy yaratishdan saqlaydi — POST uchun tavsiya etiladi. */
  idempotencyKey?: string;
  /** Rasm yuborish kabi ogʻir soʻrovlar uchun (ms). */
  timeoutMs?: number;
};

const DEFAULT_TIMEOUT_MS = 20_000;

/** Imzolangan soʻrov — xom `Response` qaytaradi.

    Nega alohida: dvigatel endpointlarining bir qismi JSON emas, PDF
    yoki rasm qaytaradi. Ularni `response.text()` bilan oʻqish baytlarni
    buzadi, shuning uchun javobni oʻqish chaqiruvchiga qoldiriladi.
    Imzolash mantigʻi esa BITTA joyda qoladi. */
export async function lessonlabRaw(req: LessonLabRequest): Promise<Response> {
  const cfg = config();
  if (!cfg) {
    throw new LessonLabError(
      503,
      "not_configured",
      "LessonLab integratsiyasi sozlanmagan (LESSONLAB_API_BASE / _PARTNER_KEY / _PARTNER_SECRET)"
    );
  }
  if (req.binary && req.body !== undefined) {
    throw new LessonLabError(500, "invalid_request", "`body` va `binary` birga berilmaydi");
  }

  const raw =
    req.body === undefined ? "" : typeof req.body === "string" ? req.body : JSON.stringify(req.body);
  const timestamp = String(Math.floor(Date.now() / 1000));
  const nonce = randomUUID().replace(/-/g, "");
  const bodyHash = createHash("sha256")
    .update(req.binary ? req.binary.bytes : raw)
    .digest("hex");

  const canonical = `${timestamp}.${nonce}.${req.method.toUpperCase()}.${req.path}.${bodyHash}`;
  const signature = createHmac("sha256", cfg.secret).update(canonical).digest("hex");

  const headers: Record<string, string> = {
    "X-LL-Key": cfg.key,
    "X-LL-Timestamp": timestamp,
    "X-LL-Nonce": nonce,
    "X-LL-Signature": signature,
  };
  if (req.binary) headers["Content-Type"] = req.binary.contentType;
  else if (raw) headers["Content-Type"] = "application/json";
  if (req.accessToken) headers.Authorization = `Bearer ${req.accessToken}`;
  if (req.idempotencyKey) headers["Idempotency-Key"] = req.idempotencyKey;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), req.timeoutMs ?? DEFAULT_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(cfg.base + req.path, {
      method: req.method,
      headers,
      body: req.binary ? (req.binary.bytes as BodyInit) : raw || undefined,
      signal: controller.signal,
      cache: "no-store",
    });
  } catch (err) {
    const aborted = err instanceof Error && err.name === "AbortError";
    throw new LessonLabError(
      504,
      aborted ? "timeout" : "network_error",
      aborted ? "LessonLab javob bermadi (vaqt tugadi)" : "LessonLab'ga ulanib boʻlmadi"
    );
  } finally {
    clearTimeout(timer);
  }

  return response;
}

/** Muvaffaqiyatsiz javobni LessonLab xato oʻramiga qarab tashlaydi.

    Tana bir marta oʻqiladi va matn sifatida talqin qilinadi — xato
    oʻrami har doim JSON, hatto endpoint PDF qaytaradigan boʻlsa ham. */
async function throwHttpError(response: Response): Promise<never> {
  let envelope: { error?: { code?: string; message?: string; details?: unknown } } | null = null;
  try {
    const text = await response.text();
    envelope = text ? JSON.parse(text) : null;
  } catch {
    // JSON emas — quyida umumiy xato sifatida qaytadi
  }
  throw new LessonLabError(
    response.status,
    envelope?.error?.code ?? "http_error",
    envelope?.error?.message ?? `LessonLab ${response.status}`,
    envelope?.error?.details
  );
}

export async function lessonlab<T = unknown>(req: LessonLabRequest): Promise<T> {
  const response = await lessonlabRaw(req);
  if (!response.ok) await throwHttpError(response);

  const text = await response.text();
  try {
    return (text ? JSON.parse(text) : null) as T;
  } catch {
    throw new LessonLabError(
      502,
      "invalid_response",
      "LessonLab JSON qaytarmadi"
    );
  }
}

/** Binar javob (PDF) — baytlar oʻzgartirilmasdan qaytadi. */
export async function lessonlabBinary(
  req: LessonLabRequest
): Promise<{ bytes: Uint8Array; contentType: string; filename: string | null }> {
  const response = await lessonlabRaw(req);
  if (!response.ok) await throwHttpError(response);

  const bytes = new Uint8Array(await response.arrayBuffer());
  // `attachment; filename="answer-sheets-12-class3.pdf"` → nomni ajratamiz.
  const cd = response.headers.get("Content-Disposition") ?? "";
  const match = /filename\*?=(?:UTF-8'')?"?([^";]+)"?/i.exec(cd);
  return {
    bytes,
    contentType: response.headers.get("Content-Type") ?? "application/pdf",
    filename: match ? decodeURIComponent(match[1]) : null,
  };
}

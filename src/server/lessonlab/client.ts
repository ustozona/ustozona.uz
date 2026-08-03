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
  /** Oʻqituvchi roziligi bilan olingan token (OAuth). Faqat oʻqituvchi
      maʼlumotiga tegadigan endpointlar uchun kerak. */
  accessToken?: string;
  /** Takroriy yaratishdan saqlaydi — POST uchun tavsiya etiladi. */
  idempotencyKey?: string;
  /** Rasm yuborish kabi ogʻir soʻrovlar uchun (ms). */
  timeoutMs?: number;
};

const DEFAULT_TIMEOUT_MS = 20_000;

export async function lessonlab<T = unknown>(req: LessonLabRequest): Promise<T> {
  const cfg = config();
  if (!cfg) {
    throw new LessonLabError(
      503,
      "not_configured",
      "LessonLab integratsiyasi sozlanmagan (LESSONLAB_API_BASE / _PARTNER_KEY / _PARTNER_SECRET)"
    );
  }

  const raw =
    req.body === undefined ? "" : typeof req.body === "string" ? req.body : JSON.stringify(req.body);
  const timestamp = String(Math.floor(Date.now() / 1000));
  const nonce = randomUUID().replace(/-/g, "");
  const bodyHash = createHash("sha256").update(raw).digest("hex");

  const canonical = `${timestamp}.${nonce}.${req.method.toUpperCase()}.${req.path}.${bodyHash}`;
  const signature = createHmac("sha256", cfg.secret).update(canonical).digest("hex");

  const headers: Record<string, string> = {
    "X-LL-Key": cfg.key,
    "X-LL-Timestamp": timestamp,
    "X-LL-Nonce": nonce,
    "X-LL-Signature": signature,
  };
  if (raw) headers["Content-Type"] = "application/json";
  if (req.accessToken) headers.Authorization = `Bearer ${req.accessToken}`;
  if (req.idempotencyKey) headers["Idempotency-Key"] = req.idempotencyKey;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), req.timeoutMs ?? DEFAULT_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(cfg.base + req.path, {
      method: req.method,
      headers,
      body: raw || undefined,
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

  const text = await response.text();
  let parsed: unknown = null;
  try {
    parsed = text ? JSON.parse(text) : null;
  } catch {
    // JSON emas — pastda umumiy xato sifatida qaytadi
  }

  if (!response.ok) {
    const envelope = parsed as { error?: { code?: string; message?: string; details?: unknown } } | null;
    throw new LessonLabError(
      response.status,
      envelope?.error?.code ?? "http_error",
      envelope?.error?.message ?? `LessonLab ${response.status}`,
      envelope?.error?.details
    );
  }

  return parsed as T;
}

import "server-only";
import { eq } from "drizzle-orm";
import { auth } from "@/server/auth";
import { db } from "@/server/db/client";
import { tgAuthRequests } from "@/server/db/schema";
import { botStartUrl, isTelegramBotEnabled } from "@/server/telegram/config";
import {
  REQUEST_TTL_MS,
  START_PREFIX,
  hashSecret,
  newBrowserSecret,
  newCode,
  newRequestId,
} from "@/server/telegram/auth-requests";
import { isPlaceholderEmail } from "@/lib/placeholder-email";
import type { MobileMe, MobileTgPoll, MobileTgStart } from "@/lib/mobile-auth-types";

/* ════════════════════════════════════════════════════════════════════
   MOBIL ILOVA — Telegram orqali kirish

   Saytdagi oqimning (`dal/tg-auth.ts`) aynan oʻzi, bitta farq bilan:
   brauzer siri httpOnly cookie'da emas, ilova qurilmasida saqlanadi va
   har soʻrovda tanada keladi. Bot tomoni oʻzgarmaydi — u `a_<id>` ni
   saytdagidek qabul qiladi (qurilma nomi «Ustozona ilovasi»).

   Tasdiqlangach sessiya Better Auth'ning oʻzi ochadi
   (`telegramMobileSignIn`), token ilovaga qaytadi.
   ════════════════════════════════════════════════════════════════════ */

const CLIENT_LABEL = "Ustozona ilovasi";

export async function startMobileTgAuth(platform: string): Promise<MobileTgStart> {
  if (!isTelegramBotEnabled()) return { ok: false, reason: "disabled" };

  const id = newRequestId();
  const secret = newBrowserSecret();
  const code = newCode();
  const label = platform === "android" || platform === "ios"
    ? `${CLIENT_LABEL} · ${platform === "ios" ? "iOS" : "Android"}`
    : CLIENT_LABEL;

  try {
    await db.insert(tgAuthRequests).values({
      id,
      kind: "login",
      browserSecretHash: hashSecret(secret),
      code,
      clientLabel: label,
      userId: null,
      expiresAt: new Date(Date.now() + REQUEST_TTL_MS),
    });
  } catch (err) {
    console.error("[mobile-auth] soʻrov yozilmadi:", err);
    return { ok: false, reason: "failed" };
  }

  const deepLink = botStartUrl(`${START_PREFIX.login}${id}`);
  if (!deepLink) return { ok: false, reason: "disabled" };
  return { ok: true, requestId: id, secret, code, deepLink, expiresInSeconds: REQUEST_TTL_MS / 1000 };
}

export async function pollMobileTgAuth(requestId: string, secret: string): Promise<MobileTgPoll> {
  const [req] = await db
    .select({
      kind: tgAuthRequests.kind,
      status: tgAuthRequests.status,
      expiresAt: tgAuthRequests.expiresAt,
      hash: tgAuthRequests.browserSecretHash,
    })
    .from(tgAuthRequests)
    .where(eq(tgAuthRequests.id, requestId));

  // Sir mos kelmasa — soʻrov «yoʻq» deb javob (mavjudligini oshkor qilmaymiz).
  if (!req || req.kind !== "login" || req.hash !== hashSecret(secret)) return { status: "invalid" };
  if (req.status === "consumed") return { status: "invalid" };
  if (req.expiresAt.getTime() < Date.now()) return { status: "expired" };

  switch (req.status) {
    case "pending":
      return { status: "waiting" };
    case "awaiting_phone":
    case "creating":
      return { status: "awaiting_phone" };
    case "rejected":
      return { status: "rejected" };
    case "has_account":
      return { status: "has_account" };
    case "approved":
      break;
    default:
      return { status: "waiting" };
  }

  try {
    const res = await auth.api.telegramMobileSignIn({ body: { requestId, secret } });
    return { status: "signed_in", ...res };
  } catch (err) {
    const code = String((err as { body?: { code?: string } })?.body?.code ?? "");
    if (code === "BANNED_USER") return { status: "banned" };
    // Parallel ikkinchi soʻrov allaqachon isteʼmol qilgan — token unda.
    console.error("[mobile-auth] sessiya ochilmadi:", err);
    return { status: "invalid" };
  }
}

/** `Authorization: Bearer` bilan kelgan soʻrov egasi yoki null. */
export async function getMobileMe(headers: Headers): Promise<MobileMe | null> {
  const session = await auth.api.getSession({ headers });
  if (!session) return null;
  const { user } = session;
  return {
    user: {
      id: user.id,
      name: user.name,
      email: isPlaceholderEmail(user.email) ? null : user.email,
      image: user.image ?? null,
    },
  };
}

/** Joriy mobil sessiyani bekor qiladi (qurilmadan chiqish). */
export async function signOutMobile(headers: Headers): Promise<void> {
  await auth.api.signOut({ headers });
}

/** Ilova ichidagi sayt oynasi uchun cookie: `{ name, value }` yoki null.
    Qiymat Better Auth'ning oʻzi imzolagan — aynan brauzerdagi kabi. */
export async function mobileWebCookie(
  headers: Headers,
): Promise<{ name: string; value: string } | null> {
  try {
    const res = await auth.api.mobileWebCookie({ headers, returnHeaders: true });
    const raw = res.headers.get("set-cookie") ?? "";
    const first = raw.split(";")[0] ?? "";
    const eq = first.indexOf("=");
    if (eq <= 0) return null;
    return { name: first.slice(0, eq), value: first.slice(eq + 1) };
  } catch {
    return null;
  }
}

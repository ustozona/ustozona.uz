import "server-only";
import { and, eq, inArray } from "drizzle-orm";
import { cookies, headers } from "next/headers";
import QRCode from "qrcode";
import { auth } from "@/server/auth";
import { db } from "@/server/db/client";
import { tgAuthRequests, tgChats, tgNotifyPrefs, userTelegram } from "@/server/db/schema";
import { getSession } from "@/server/session";
import { botStartUrl, botUrl, isTelegramBotEnabled } from "@/server/telegram/config";
import {
  REQUEST_TTL_MS,
  START_PREFIX,
  TG_AUTH_COOKIE,
  describeClient,
  hashSecret,
  newBrowserSecret,
  newCode,
  newRequestId,
} from "@/server/telegram/auth-requests";
import {
  NOTIFY_DEFAULTS,
  notifyTimeOptions,
  type TgAuthKind,
  type TgAuthPoll,
  type TgAuthStart,
  type TgConnection,
  type TgNotifyPrefs,
} from "@/lib/tg-auth-types";

/* ════════════════════════════════════════════════════════════════════
   TELEGRAM ORQALI KIRISH / BOGʻLASH — sayt tomoni

   Faqat Server Action'lardan chaqiriladi (`actions/tg-auth.ts`):
   cookie yozish shu kontekstda ishlaydi. Bot tomoni —
   `server/telegram/bot.ts`, sessiya ochish — `auth-telegram.ts`.
   ════════════════════════════════════════════════════════════════════ */

async function readCookie(): Promise<{ id: string; secret: string } | null> {
  const raw = (await cookies()).get(TG_AUTH_COOKIE)?.value ?? "";
  const dot = raw.indexOf(".");
  if (dot <= 0) return null;
  return { id: raw.slice(0, dot), secret: raw.slice(dot + 1) };
}

async function clearCookie() {
  (await cookies()).delete(TG_AUTH_COOKIE);
}

/** Yangi soʻrov. Oldingi (shu brauzerdagi) soʻrov cookie bilan birga almashadi. */
export async function startTgAuth(kind: TgAuthKind): Promise<TgAuthStart> {
  if (!isTelegramBotEnabled()) return { ok: false, reason: "disabled" };

  let userId: string | null = null;
  if (kind === "link") {
    const session = await getSession();
    if (!session) return { ok: false, reason: "unauthorized" };
    userId = session.user.id;
  }

  const id = newRequestId();
  const secret = newBrowserSecret();
  const code = newCode();
  const ua = (await headers()).get("user-agent");

  try {
    await db.insert(tgAuthRequests).values({
      id,
      kind,
      browserSecretHash: hashSecret(secret),
      code,
      clientLabel: describeClient(ua),
      userId,
      expiresAt: new Date(Date.now() + REQUEST_TTL_MS),
    });
  } catch (err) {
    console.error("[tg-auth] soʻrov yozilmadi:", err);
    return { ok: false, reason: "failed" };
  }

  (await cookies()).set(TG_AUTH_COOKIE, `${id}.${secret}`, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: REQUEST_TTL_MS / 1000,
  });

  const deepLink = botStartUrl(`${START_PREFIX[kind]}${id}`);
  if (!deepLink) return { ok: false, reason: "disabled" };
  // Ekrandan oʻqiladi — xato tuzatish eng past daraja (sabab: actions/baholash-scan.ts).
  const qrSvg = await QRCode.toString(deepLink, { type: "svg", margin: 1, errorCorrectionLevel: "L" });
  return { ok: true, deepLink, code, qrSvg, expiresInSeconds: REQUEST_TTL_MS / 1000 };
}

/** Sayt har 2 soniyada soʻraydi. Tasdiqlangan login shu yerda sessiyaga aylanadi. */
export async function pollTgAuth(): Promise<TgAuthPoll> {
  const c = await readCookie();
  if (!c) return "none";

  const [req] = await db
    .select({
      kind: tgAuthRequests.kind,
      status: tgAuthRequests.status,
      userId: tgAuthRequests.userId,
      expiresAt: tgAuthRequests.expiresAt,
      hash: tgAuthRequests.browserSecretHash,
    })
    .from(tgAuthRequests)
    .where(eq(tgAuthRequests.id, c.id));

  // Boshqa brauzerning soʻrovi yoki eskirgan cookie — «yoʻq» deb javob.
  if (!req || req.hash !== hashSecret(c.secret)) return "none";

  if (req.status === "consumed") {
    await clearCookie();
    return req.kind === "link" ? "linked" : "signed_in";
  }
  if (req.expiresAt.getTime() < Date.now()) {
    await clearCookie();
    return "expired";
  }

  switch (req.status) {
    case "pending":
      return "waiting";
    case "awaiting_phone":
    case "creating":
      return "awaiting_phone";
    case "approved":
      break;
    case "rejected":
    case "has_account":
    case "taken_tg":
    case "taken_uz":
      await clearCookie();
      return req.status;
    default:
      return "waiting";
  }

  // approved
  if (req.kind === "link") {
    // Bogʻlashni bot allaqachon yozgan — bu yerda faqat yakunlanadi.
    const session = await getSession();
    if (!session || session.user.id !== req.userId) return "none";
    await db
      .update(tgAuthRequests)
      .set({ status: "consumed", consumedAt: new Date() })
      .where(and(eq(tgAuthRequests.id, c.id), eq(tgAuthRequests.status, "approved")));
    await clearCookie();
    return "linked";
  }

  try {
    await auth.api.telegramSignIn({
      body: { requestId: c.id, secret: c.secret },
      headers: await headers(),
    });
  } catch (err) {
    const code = String((err as { body?: { code?: string } })?.body?.code ?? "");
    if (code === "BANNED_USER") {
      await clearCookie();
      return "banned";
    }
    // Parallel ikkinchi soʻrov: birinchisi allaqachon iste'mol qilgan.
    const [again] = await db
      .select({ status: tgAuthRequests.status })
      .from(tgAuthRequests)
      .where(eq(tgAuthRequests.id, c.id));
    if (again?.status === "consumed") return "signed_in";
    console.error("[tg-auth] sessiya ochilmadi:", err);
    return "waiting";
  }
  await clearCookie();
  return "signed_in";
}

/** Oynani yopganda — soʻrov ochiq qolmasin (havola boshqa joyda ochilsa ishlamasin). */
export async function cancelTgAuth(): Promise<void> {
  const c = await readCookie();
  if (!c) return;
  await db
    .update(tgAuthRequests)
    .set({ status: "rejected", decidedAt: new Date() })
    .where(
      and(
        eq(tgAuthRequests.id, c.id),
        eq(tgAuthRequests.browserSecretHash, hashSecret(c.secret)),
        inArray(tgAuthRequests.status, ["pending", "awaiting_phone"])
      )
    );
  await clearCookie();
}

/** Sozlamalar va bosh sahifadagi taklif uchun — joriy akkauntning Telegram holati. */
export async function getTgConnection(): Promise<TgConnection | null> {
  const session = await getSession();
  if (!session) return null;

  const [row] = await db
    .select({
      telegramId: userTelegram.telegramId,
      linkUsername: userTelegram.username,
      chatUsername: tgChats.username,
      phone: tgChats.phone,
      blockedAt: tgChats.blockedAt,
      chatExists: tgChats.telegramId,
      consentAt: tgChats.marketingConsentAt,
      optOutAt: tgChats.marketingOptOutAt,
    })
    .from(userTelegram)
    .leftJoin(tgChats, eq(tgChats.telegramId, userTelegram.telegramId))
    .where(eq(userTelegram.userId, session.user.id))
    .limit(1);

  return {
    enabled: isTelegramBotEnabled(),
    linked: !!row,
    botActive: !!row?.chatExists && !row.blockedAt,
    username: row?.chatUsername ?? row?.linkUsername ?? null,
    phone: row?.phone ?? null,
    marketing: row?.consentAt && !row.optOutAt ? "yes" : row?.optOutAt ? "no" : "unasked",
    botUrl: botUrl(),
  };
}

/** Sozlamalardan marketing roziligini oʻzgartirish. */
export async function setTgMarketing(consent: boolean): Promise<boolean> {
  const session = await getSession();
  if (!session) return false;
  const [link] = await db
    .select({ telegramId: userTelegram.telegramId })
    .from(userTelegram)
    .where(eq(userTelegram.userId, session.user.id));
  if (!link) return false;
  const now = new Date();
  const res = await db
    .update(tgChats)
    .set(
      consent
        ? { marketingConsentAt: now, marketingOptOutAt: null, updatedAt: now }
        : { marketingOptOutAt: now, updatedAt: now }
    )
    .where(eq(tgChats.telegramId, link.telegramId))
    .returning({ id: tgChats.telegramId });
  return res.length > 0;
}

/** Kunlik xabarlar sozlamasi — qator yoʻq boʻlsa standart. */
export async function getTgNotifyPrefs(): Promise<TgNotifyPrefs | null> {
  const session = await getSession();
  if (!session) return null;
  const [row] = await db
    .select()
    .from(tgNotifyPrefs)
    .where(eq(tgNotifyPrefs.userId, session.user.id));
  if (!row) return { ...NOTIFY_DEFAULTS };
  return {
    morningEnabled: row.morningEnabled,
    morningTime: row.morningTime,
    eveningEnabled: row.eveningEnabled,
    eveningTime: row.eveningTime,
  };
}

export async function setTgNotifyPrefs(input: TgNotifyPrefs): Promise<boolean> {
  const session = await getSession();
  if (!session) return false;
  // Vaqt faqat UI roʻyxatidagi qiymatlardan — cron shu shaklga tayanadi.
  if (!notifyTimeOptions("morning").includes(input.morningTime)) return false;
  if (!notifyTimeOptions("evening").includes(input.eveningTime)) return false;
  const values = {
    morningEnabled: input.morningEnabled === true,
    morningTime: input.morningTime,
    eveningEnabled: input.eveningEnabled === true,
    eveningTime: input.eveningTime,
    updatedAt: new Date(),
  };
  await db
    .insert(tgNotifyPrefs)
    .values({ userId: session.user.id, ...values })
    .onConflictDoUpdate({ target: tgNotifyPrefs.userId, set: values });
  return true;
}

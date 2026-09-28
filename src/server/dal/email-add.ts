import "server-only";
import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import { and, eq, ne, sql } from "drizzle-orm";
import { db } from "@/server/db/client";
import { teachers, user, verification } from "@/server/db/schema";
import { requireTeacher } from "@/server/session";
import { sendEmailAddConfirmation } from "@/server/email";
import { PLACEHOLDER_EMAIL_DOMAIN, isPlaceholderEmail, isUndeliverableEmail } from "@/lib/placeholder-email";
import type {
  EmailAddConfirmError,
  EmailAddPreview,
  EmailAddRequestResult,
  EmailAddState,
} from "@/lib/email-add-types";

/* ════════════════════════════════════════════════════════════════════
   EMAIL QOʻSHISH — Telegram orqali ochilgan hisobga haqiqiy manzil.

   Bunday hisobda `user.email` — oʻrinbosar (`lib/placeholder-email.ts`).
   Ustoz Sozlamalarda oʻz emailini yozadi, xatdagi havolani bosadi va
   shundan keyingina manzil hisobga yoziladi.

   🔴 NEGA TASDIQLASHDAN KEYIN, OLDIN EMAS: tasdiqlanmagan manzil darhol
   yozilsa, xato terilgan (yoki begona) email egasi «Parolni
   unutdingizmi?» orqali shu hisobni egallab olardi. Shu sabab Better
   Auth'ning `changeEmail` i ham ishlatilmadi: u tasdiqlanmagan hisobda
   manzilni darhol almashtiradi va barcha hisoblarga ochiq endpoint
   qoʻshadi — bizga faqat oʻrinbosarli hisoblar uchun kerak.

   Holat Better Auth'ning `verification` jadvalida, bitta qator:
   identifier = `email-add:<userId>`, value = JSON { email, n }.
   - yangi soʻrov qatorni ALMASHTIRADI → eski xatdagi havola oʻladi;
   - `updatedAt` — daqiqalik toʻxtam, `n` — sutkalik chegara.

   Havola tokeni imzolangan (HMAC, BETTER_AUTH_SECRET) va userId + email
   + muddatni oʻz ichida olib yuradi; tasdiqlashda qator bilan ham
   solishtiriladi.
   ════════════════════════════════════════════════════════════════════ */

const TTL_MS = 24 * 60 * 60 * 1000;
const COOLDOWN_MS = 60 * 1000;
const MAX_PER_DAY = 5;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const SITE = (process.env.BETTER_AUTH_URL || "https://www.ustozona.uz").replace(/\/$/, "");

type Pending = { email: string; n: number };

const identifierOf = (userId: string) => `email-add:${userId}`;

/* ── Token ─────────────────────────────────────────────────────────── */

function secret(): string {
  const s = process.env.BETTER_AUTH_SECRET;
  if (!s) throw new Error("BETTER_AUTH_SECRET yoʻq — email tokenini imzolab boʻlmaydi.");
  return s;
}

function sign(payload: string): string {
  return createHmac("sha256", secret()).update(`email-add:${payload}`).digest("base64url");
}

function makeToken(userId: string, email: string, exp: number): string {
  const payload = Buffer.from(JSON.stringify({ u: userId, e: email, x: exp })).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

function readToken(token: string | null | undefined): { userId: string; email: string; exp: number } | null {
  if (!token) return null;
  const dot = token.lastIndexOf(".");
  if (dot < 1) return null;
  const payload = token.slice(0, dot);
  const given = token.slice(dot + 1);
  const expected = sign(payload);
  if (given.length !== expected.length) return null;
  if (!timingSafeEqual(Buffer.from(given), Buffer.from(expected))) return null;
  try {
    const p = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    if (typeof p.u !== "string" || typeof p.e !== "string" || typeof p.x !== "number") return null;
    return { userId: p.u, email: p.e, exp: p.x };
  } catch {
    return null;
  }
}

/* ── Yordamchilar ──────────────────────────────────────────────────── */

async function loadPending(userId: string) {
  const [row] = await db
    .select()
    .from(verification)
    .where(eq(verification.identifier, identifierOf(userId)))
    .limit(1);
  if (!row) return null;
  try {
    const value = JSON.parse(row.value) as Pending;
    return { row, value };
  } catch {
    return null;
  }
}

/** Email boshqa hisobda bormi — `user` va `teachers` ikkalasi ham UNIQUE. */
async function isTaken(email: string, exceptUserId: string): Promise<boolean> {
  const [u] = await db
    .select({ id: user.id })
    .from(user)
    .where(and(sql`lower(${user.email}) = ${email}`, ne(user.id, exceptUserId)))
    .limit(1);
  if (u) return true;
  const [t] = await db
    .select({ id: teachers.id })
    .from(teachers)
    .where(and(sql`lower(${teachers.email}) = ${email}`, ne(teachers.id, exceptUserId)))
    .limit(1);
  return !!t;
}

class AlreadyDone extends Error {}

function isUniqueViolation(err: unknown): boolean {
  const e = err as { code?: string; cause?: { code?: string } };
  return e?.code === "23505" || e?.cause?.code === "23505";
}

/* ── Sozlamalar tomoni ─────────────────────────────────────────────── */

export async function getEmailAddState(): Promise<EmailAddState> {
  const teacher = await requireTeacher();
  const [u] = await db.select({ email: user.email }).from(user).where(eq(user.id, teacher.id));
  if (!u || !isPlaceholderEmail(u.email)) return null;

  const p = await loadPending(teacher.id);
  const alive = p && p.row.expiresAt.getTime() > Date.now();
  return {
    pending: alive ? { email: p.value.email, sentAt: p.row.updatedAt.toISOString() } : null,
  };
}

export async function requestEmailAdd(rawEmail: string): Promise<EmailAddRequestResult> {
  const teacher = await requireTeacher();
  const email = rawEmail.trim().toLowerCase();
  if (!EMAIL_RE.test(email) || email.length > 254 || isUndeliverableEmail(email)) {
    return { ok: false, reason: "invalid" };
  }

  const [u] = await db
    .select({ email: user.email, name: user.name })
    .from(user)
    .where(eq(user.id, teacher.id));
  if (!u || !isPlaceholderEmail(u.email)) return { ok: false, reason: "has_email" };

  // Band emailni ochiq aytamiz: roʻyxatdan oʻtish ham `email_taken` ni
  // ochiq qaytaradi, yashirishdan foyda yoʻq — ustozga esa «eski
  // hisobingizga kiring» deyish kerak (ikki hisob muammosi).
  if (await isTaken(email, teacher.id)) return { ok: false, reason: "taken" };

  const now = Date.now();
  const p = await loadPending(teacher.id);
  const live = p && p.row.expiresAt.getTime() > now;
  if (live && now - p.row.updatedAt.getTime() < COOLDOWN_MS) return { ok: false, reason: "too_soon" };
  const n = live ? p.value.n + 1 : 1;
  if (n > MAX_PER_DAY) return { ok: false, reason: "too_many" };

  const expiresAt = new Date(now + TTL_MS);
  const value = JSON.stringify({ email, n } satisfies Pending);
  if (p) {
    await db
      .update(verification)
      .set({ value, expiresAt, updatedAt: new Date(now) })
      .where(eq(verification.id, p.row.id));
  } else {
    await db.insert(verification).values({
      id: randomUUID(),
      identifier: identifierOf(teacher.id),
      value,
      expiresAt,
    });
  }

  const url = `${SITE}/email-tasdiqlash?t=${makeToken(teacher.id, email, expiresAt.getTime())}`;
  const sent = await sendEmailAddConfirmation(email, url, u.name);
  return sent ? { ok: true, email } : { ok: false, reason: "send_failed" };
}

/* ── Tasdiqlash sahifasi tomoni (login TALAB QILINMAYDI) ───────────── */

async function check(token: string | null | undefined): Promise<
  | { ok: true; userId: string; email: string; name: string }
  | { ok: false; reason: EmailAddConfirmError }
> {
  const t = readToken(token);
  if (!t) return { ok: false, reason: "invalid" };

  const [u] = await db
    .select({ email: user.email, name: user.name })
    .from(user)
    .where(eq(user.id, t.userId));
  if (!u) return { ok: false, reason: "invalid" };
  if (!isPlaceholderEmail(u.email)) return { ok: false, reason: "done" };

  const p = await loadPending(t.userId);
  if (t.exp < Date.now() || !p || p.value.email !== t.email || p.row.expiresAt.getTime() < Date.now()) {
    return { ok: false, reason: "expired" };
  }
  if (await isTaken(t.email, t.userId)) return { ok: false, reason: "taken" };
  return { ok: true, userId: t.userId, email: t.email, name: u.name };
}

export async function previewEmailAdd(token: string | null | undefined): Promise<EmailAddPreview> {
  const r = await check(token);
  return r.ok ? { ok: true, email: r.email, name: r.name } : r;
}

export async function confirmEmailAdd(
  token: string | null | undefined
): Promise<{ ok: true } | { ok: false; reason: EmailAddConfirmError }> {
  const r = await check(token);
  if (!r.ok) return r;

  try {
    await db.transaction(async (tx) => {
      // Shart ichida yana oʻrinbosar — parallel ikki bosishda ikkinchisi
      // hech narsani oʻzgartirmaydi.
      const updated = await tx
        .update(user)
        .set({ email: r.email, emailVerified: true, updatedAt: new Date() })
        .where(and(eq(user.id, r.userId), sql`lower(${user.email}) LIKE ${`%@${PLACEHOLDER_EMAIL_DOMAIN}`}`))
        .returning({ id: user.id });
      // Poyga: boshqa bosish ulgurgan — teachers'ga tegmay, bekor qilamiz.
      if (updated.length === 0) throw new AlreadyDone();
      await tx.update(teachers).set({ email: r.email }).where(eq(teachers.id, r.userId));
      await tx.delete(verification).where(eq(verification.identifier, identifierOf(r.userId)));
    });
  } catch (err) {
    if (err instanceof AlreadyDone) return { ok: false, reason: "done" };
    if (isUniqueViolation(err)) return { ok: false, reason: "taken" };
    throw err;
  }
  return { ok: true };
}

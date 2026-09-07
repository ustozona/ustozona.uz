import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/server/db/client";
import { emailActivation, user } from "@/server/db/schema";
import { requireTeacher } from "@/server/session";
import type { ActivationStage, ActivationSentEntry } from "@/server/db/schema/email-activation";

/* ════════════════════════════════════════════════════════════════════
   EMAIL AKTIVATSIYA DAL — `email_activation` jadvaliga YAGONA yozish
   nuqtasi (notify.ts naqshi).

   Spesifikatsiya: docs/email-aktivatsiya-spec.md

   Qatordan foydalanuvchining oʻzi ham (sozlamalar toggle'i), tizim
   ham (trigger'lar) foydalanadi. Shuning uchun ikki xil kirish bor:
     - `getMyPreference` / `setMyPreference` — joriy sessiya egasi
     - `readState` / `writeState` — tizim, userId boʻyicha, sessiyasiz
       (trigger signup hook'idan ham chaqiriladi, u yerda sessiya
       hali yoʻq)
   ════════════════════════════════════════════════════════════════════ */

export type ActivationState = {
  userId: string;
  optedOut: boolean;
  stage: ActivationStage;
  scheduledEmailId: string | null;
  scheduledFor: Date | null;
  sentLog: ActivationSentEntry[];
};

/** Yuborib boʻlmaydigan manzillar. Telegram orqali roʻyxatdan
 *  oʻtganlarga soxta `@telegram.invalid` manzil beriladi — ularga
 *  yuborilsa xat darhol qaytadi va domen obroʻsi tushadi. */
const YUBORILMAYDIGAN_DOMENLAR = ["telegram.invalid", "example.com", "test.invalid"];

export function yuborishMumkinmi(email: string | null | undefined): boolean {
  if (!email) return false;
  const at = email.lastIndexOf("@");
  if (at < 1 || at === email.length - 1) return false;
  const domen = email.slice(at + 1).toLowerCase();
  return !YUBORILMAYDIGAN_DOMENLAR.includes(domen);
}

/* ── Tizim kirishi (sessiyasiz) ─────────────────────────────────── */

/** Qatorni oʻqiydi. Yoʻq boʻlsa null — qator birinchi trigger'da
 *  yaratiladi, roʻyxatdan oʻtishda emas (eski foydalanuvchilar ham
 *  migratsiyasiz qamrab olinsin). */
export async function readState(userId: string): Promise<ActivationState | null> {
  const [row] = await db
    .select()
    .from(emailActivation)
    .where(eq(emailActivation.userId, userId))
    .limit(1);
  if (!row) return null;
  return {
    userId: row.userId,
    optedOut: row.optedOut,
    stage: row.stage,
    scheduledEmailId: row.scheduledEmailId,
    scheduledFor: row.scheduledFor,
    sentLog: row.sentLog,
  };
}

/** Qatorni yaratadi yoki yangilaydi (idempotent upsert). */
export async function writeState(
  userId: string,
  patch: Partial<Omit<ActivationState, "userId">>,
): Promise<void> {
  const qiymat = {
    optedOut: patch.optedOut,
    stage: patch.stage,
    scheduledEmailId: patch.scheduledEmailId,
    scheduledFor: patch.scheduledFor,
    sentLog: patch.sentLog,
    updatedAt: new Date(),
  };
  /* undefined maydonlar yuborilmasin — `set` ularni NULL qilib
     yozib yuboradi. */
  const set = Object.fromEntries(Object.entries(qiymat).filter(([, v]) => v !== undefined));

  await db
    .insert(emailActivation)
    .values({ userId, ...set })
    .onConflictDoUpdate({ target: emailActivation.userId, set });
}

/** Foydalanuvchining email manzili va yuborsa boʻladimi. */
export async function getRecipient(
  userId: string,
): Promise<{ email: string; name: string | null } | null> {
  const [row] = await db
    .select({ email: user.email, name: user.name })
    .from(user)
    .where(eq(user.id, userId))
    .limit(1);
  if (!row || !yuborishMumkinmi(row.email)) return null;
  return { email: row.email, name: row.name };
}

/* ── Foydalanuvchi kirishi (sessiya orqali) ─────────────────────── */

/** Sozlamalar uchun: aktivatsiya xatlari yoqilganmi. Qator hali
 *  yaratilmagan boʻlsa — yoqilgan (opt-out modeli). */
export async function getMyPreference(): Promise<{ enabled: boolean }> {
  const teacher = await requireTeacher();
  const state = await readState(teacher.id);
  return { enabled: !state?.optedOut };
}

export async function setMyPreference(enabled: boolean): Promise<void> {
  const teacher = await requireTeacher();
  await writeState(teacher.id, { optedOut: !enabled });
}

/** Obunani bekor qilish sahifasi uchun — sessiyasiz, imzolangan
 *  token bilan chaqiriladi (login talab qilinmaydi). */
export async function optOutByUserId(userId: string): Promise<void> {
  await writeState(userId, { optedOut: true, scheduledEmailId: null, scheduledFor: null });
}

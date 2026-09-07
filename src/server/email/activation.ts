import "server-only";
import { Resend } from "resend";
import { getRecipient, readState, writeState } from "@/server/dal/email-activation";
import type { ActivationStage } from "@/server/db/schema/email-activation";
import { unsubscribeToken } from "@/lib/unsubscribe-token";

/* ════════════════════════════════════════════════════════════════════
   AKTIVATSIYA DVIGATELI — cron YOʻQ.

   Spesifikatsiya: docs/email-aktivatsiya-spec.md

   Naqsh: trigger sodir boʻlganda xat KELAJAKKA rejalashtiriladi
   (Resend `scheduledAt`), qaytgan id bazaga yoziladi. Foydalanuvchi
   kutilgan ishni bajarsa — `emails.cancel()`. Suppression shundan
   bepul chiqadi.

   ⚠️ Bekor qilingan xatni QAYTA rejalashtirib boʻlmaydi. Vaqtni
   surish uchun `emails.update({ id, scheduledAt })`.

   ⚠️ TRIGGER HECH QACHON ASOSIY AMALNI YIQITMASIN. Barcha eksport
   qilingan funksiya xatoni ichida yutadi va faqat loglaydi — sinf
   yaratish email xatosi tufayli buzilmasin.
   ════════════════════════════════════════════════════════════════════ */

/* ── Darvoza ────────────────────────────────────────────────────────
   1-bosqichda xat YUBORILMAYDI: jadval, sozlama va obunani bekor
   qilish qurilyapti, xatning oʻzi 2-bosqichda yoqiladi.
   Yoqish uchun: ACTIVATION_EMAILS=on */
const YOQILGANMI = process.env.ACTIVATION_EMAILS === "on";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

function fromAddress(): string {
  return (
    process.env.RESEND_ACTIVATION_FROM ??
    process.env.RESEND_FROM_EMAIL ??
    "Ustozona <onboarding@resend.dev>"
  );
}

function siteUrl(): string {
  return process.env.BETTER_AUTH_URL ?? "https://www.ustozona.uz";
}

/** Zanjir tartibi va har bosqichning kechikishi (soatda). */
const ZANJIR: { stage: Exclude<ActivationStage, "done">; kechikishSoat: number }[] = [
  { stage: "a1", kechikishSoat: 24 },
  { stage: "a2", kechikishSoat: 24 },
  { stage: "a3", kechikishSoat: 48 },
  { stage: "a4", kechikishSoat: 24 * 7 },
];

function keyingiBosqich(stage: ActivationStage): ActivationStage {
  const i = ZANJIR.findIndex((z) => z.stage === stage);
  if (i < 0 || i === ZANJIR.length - 1) return "done";
  return ZANJIR[i + 1].stage;
}

function kechikish(stage: ActivationStage): number | null {
  return ZANJIR.find((z) => z.stage === stage)?.kechikishSoat ?? null;
}

/* ── Kutayotgan xatni bekor qilish ──────────────────────────────── */

/** Rejalashtirilgan xat boʻlsa bekor qiladi va qatorni tozalaydi.
 *  Foydalanuvchi kutilgan ishni bajarganda chaqiriladi. */
export async function cancelPending(userId: string): Promise<void> {
  try {
    const state = await readState(userId);
    if (!state?.scheduledEmailId) return;

    if (resend) await resend.emails.cancel(state.scheduledEmailId);
    await writeState(userId, { scheduledEmailId: null, scheduledFor: null });
  } catch (err) {
    console.error(`[activation] bekor qilib boʻlmadi (${userId}):`, err);
  }
}

/* ── Keyingi xatni rejalashtirish ───────────────────────────────── */

/**
 * Berilgan bosqich uchun xatni kelajakka rejalashtiradi.
 *
 * Chaqiruvchi «qaysi holat yuz berdi» ni aytadi, dvigatel esa
 * yuborish kerakmi-yoʻqmi oʻzi hal qiladi: obunadan chiqqan boʻlsa,
 * manzil yaroqsiz boʻlsa, yoki shu bosqich allaqachon yuborilgan
 * boʻlsa — jimgina qaytadi.
 */
export async function scheduleStage(userId: string, stage: ActivationStage): Promise<void> {
  try {
    if (stage === "done") return;

    const state = await readState(userId);
    if (state?.optedOut) return;
    /* Bir bosqich ikki marta yuborilmasin. */
    if (state?.sentLog.some((e) => e.stage === stage)) return;

    const soat = kechikish(stage);
    if (soat === null) return;

    const recipient = await getRecipient(userId);
    if (!recipient) return; // manzil yaroqsiz (masalan telegram.invalid)

    /* Avvalgi kutayotgan xat boʻlsa — u endi eskirgan. */
    if (state?.scheduledEmailId) await cancelPending(userId);

    const scheduledFor = new Date(Date.now() + soat * 60 * 60 * 1000);

    if (!YOQILGANMI || !resend) {
      /* Darvoza yopiq — holatni yozamiz, xat yubormaymiz. Oqim
         toʻliq sinaladi, faqat Resend'ga chiqmaydi. */
      console.log(
        `[activation] ${stage} rejalashtirilgan boʻlardi: ${recipient.email} → ${scheduledFor.toISOString()}`,
      );
      await writeState(userId, { stage, scheduledFor });
      return;
    }

    const { data, error } = await resend.emails.send({
      from: fromAddress(),
      to: recipient.email,
      subject: mavzu(stage),
      html: matn(stage, recipient.name, userId),
      scheduledAt: scheduledFor.toISOString(),
      headers: { "List-Unsubscribe": `<${unsubscribeUrl(userId)}>` },
    });

    if (error) {
      console.error(`[activation] Resend xatosi (${userId}, ${stage}):`, error);
      return;
    }

    await writeState(userId, {
      stage,
      scheduledEmailId: data?.id ?? null,
      scheduledFor,
      sentLog: [...(state?.sentLog ?? []), { stage, at: new Date().toISOString() }],
    });
  } catch (err) {
    console.error(`[activation] rejalashtirib boʻlmadi (${userId}, ${stage}):`, err);
  }
}

/**
 * Foydalanuvchi kutilgan ishni bajardi: joriy xatni bekor qiladi va
 * zanjirdagi KEYINGI bosqichni rejalashtiradi.
 */
export async function advance(userId: string, bajarilgan: ActivationStage): Promise<void> {
  await cancelPending(userId);
  const keyingi = keyingiBosqich(bajarilgan);
  if (keyingi === "done") {
    await writeState(userId, { stage: "done" });
    return;
  }
  await scheduleStage(userId, keyingi);
}

/* ── Matn (2-bosqichda toʻldiriladi) ────────────────────────────── */

function unsubscribeUrl(userId: string): string {
  return `${siteUrl()}/unsubscribe?t=${encodeURIComponent(unsubscribeToken(userId))}`;
}

const MAVZULAR: Record<Exclude<ActivationStage, "done">, string> = {
  a1: "Birinchi sinfingizni oching — Ustozona",
  a2: "Oʻquvchilar roʻyxatini kiriting — Ustozona",
  a3: "Bugungi darsga belgi qoʻying — Ustozona",
  a4: "Ustozona sizni kutyapti",
};

function mavzu(stage: ActivationStage): string {
  return stage === "done" ? "" : MAVZULAR[stage];
}

/* Shablonlar 2-bosqichda yoziladi (docs/email-aktivatsiya-spec.md §9).
   Hozircha minimal, lekin toʻliq ishlaydigan matn — darvoza yopiq
   boʻlgani uchun hech qayerga chiqmaydi. */
function matn(stage: ActivationStage, name: string | null, userId: string): string {
  const salom = name ? `Assalomu alaykum, ${name}!` : "Assalomu alaykum!";
  return `
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
      <p>${salom}</p>
      <p>${mavzu(stage)}</p>
      <p style="margin: 24px 0;">
        <a href="${siteUrl()}/dashboard"
           style="background:#111827;color:#fff;padding:10px 20px;border-radius:8px;text-decoration:none;display:inline-block;">
          Ustozonani ochish
        </a>
      </p>
      <p style="color:#6b7280;font-size:13px;">
        Bunday xatlarni olishni istamasangiz,
        <a href="${unsubscribeUrl(userId)}">bu yerdan bekor qiling</a>.
      </p>
    </div>
  `;
}


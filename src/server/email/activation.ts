import "server-only";
import { Resend } from "resend";
import { getRecipient, readState, writeState } from "@/server/dal/email-activation";
import type { ActivationStage } from "@/server/db/schema/email-activation";
import { unsubscribeToken } from "@/lib/unsubscribe-token";
import { A1_SUBJECT, a1Html } from "./templates/a1";

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
   Xat FAQAT ACTIVATION_EMAILS=on boʻlganda haqiqatan yuboriladi.
   Aks holda oqim toʻliq ishlaydi, lekin Resend'ga chiqmaydi —
   konsolga yoziladi. */
const YOQILGANMI = process.env.ACTIVATION_EMAILS === "on";

/* ── Auditoriya darvozasi ───────────────────────────────────────────
   FAQAT tasdiqlangan manzilga yuborish (default — YOQILGAN).

   Sabab yetkazuvchanlik: auditoriyaning 94% Gmail, Gmail esa ommaviy
   yuboruvchidan spam shikoyati 0.3% dan past boʻlishini talab qiladi.
   Tasdiqlanmagan manzil hech qachon tekshirilmagan — yuborilsa
   qaytishlar (bounce) domen obroʻsini tushiradi va undan keyin
   PAROLNI TIKLASH xatlari ham spamga tushadi.

   Tasdiqlanmaganlar 4-bosqichdagi V1 xati bilan tiklanadi
   (docs/email-aktivatsiya-spec.md §9). Faqat oʻshanda oʻchiriladi:
   ACTIVATION_ALLOW_UNVERIFIED=on */
const FAQAT_TASDIQLANGAN = process.env.ACTIVATION_ALLOW_UNVERIFIED !== "on";

/* Nima boʻlgani. `scheduleStage` xatoni yutadi (trigger asosiy amalni
   yiqitmasligi kerak), lekin JIM qolmaydi — chaqiruvchi natijani
   koʻrishi mumkin.

   Bu qoʻlda yuborish skripti uchun muhim: u avval har chaqiruvni
   «yuborildi» deb sanardi va nol xat ketganda ham muvaffaqiyat
   koʻrsatardi. */
export type ActivationResult =
  | "yuborildi"
  | "rejalashtirildi"
  | "darvoza-yopiq"
  | "obunadan-chiqqan"
  | "allaqachon-yuborilgan"
  | "manzil-topilmadi"
  | "tasdiqlanmagan"
  | "shablon-yoʻq"
  | "bosqich-yoʻq"
  | "xato";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

function fromAddress(): string {
  return (
    process.env.RESEND_ACTIVATION_FROM ??
    process.env.RESEND_FROM_EMAIL ??
    "Ustozona <onboarding@resend.dev>"
  );
}

/* Javoblar tushadigan manzil — `From` dan BOSHQA boʻlishi mumkin va
   odatda boshqa boʻladi.

   ⚠️ `From` majburiy ravishda ustozona.uz domenida qoladi: DKIM imzosi
   va SPF yozuvi shu domenga bogʻlangan. Uni gmail.com ga oʻzgartirsak
   xat Gmail nomidan kelgandek koʻrinadi, lekin Gmail buni tasdiqlamaydi
   — DMARC'dan oʻtmay spamga tushadi.

   Reply-To esa istalgan manzil boʻlishi mumkin. Shuning uchun domen
   pochtasini ochmasdan ham javoblarni oʻqish mumkin. */
function replyTo(): string | undefined {
  return process.env.RESEND_ACTIVATION_REPLY_TO || undefined;
}

const PUBLIC_SITE = "https://www.ustozona.uz";

/* Xatdagi havolalarning manzili.

   ⛔ `BETTER_AUTH_URL` ga TAYANMAYDI. Lokal ishlashda u
   `http://localhost:3000` boʻladi, xat esa HAQIQIY odamning
   pochtasiga boradi — 2026-09-07 dagi sinovda aynan shu chiqdi:
   «Sinf ochish» tugmasi localhost'ga olib bordi. Agar oʻsha holda
   33 kishiga yuborilganda hammasi ishlamaydigan havola olardi.

   Skript ishlab chiquvchining mashinasidan yurgizilishi mumkin,
   shuning uchun localhost bu yerda HAR DOIM xato. */
function siteUrl(): string {
  const berilgan = process.env.ACTIVATION_SITE_URL ?? process.env.BETTER_AUTH_URL;
  if (!berilgan) return PUBLIC_SITE;

  const mahalliy = /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(:|\/|$)/i.test(berilgan);
  if (mahalliy) {
    console.warn(
      `[activation] ${berilgan} — xat havolasi uchun mahalliy manzil, ${PUBLIC_SITE} ishlatildi.`,
    );
    return PUBLIC_SITE;
  }
  return berilgan.replace(/\/+$/, "");
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
export async function scheduleStage(
  userId: string,
  stage: ActivationStage,
  /* Zanjir kechikishini bekor qiladi (soatda). Mavjud kogortga
     qoʻlda yuborishda ishlatiladi — ular roʻyxatdan ancha oldin
     oʻtgan, 24 soat kutishning maʼnosi yoʻq. */
  kechikishOverride?: number,
): Promise<ActivationResult> {
  try {
    if (stage === "done") return "bosqich-yoʻq";

    const state = await readState(userId);
    if (state?.optedOut) return "obunadan-chiqqan";
    /* Bir bosqich ikki marta yuborilmasin. */
    if (state?.sentLog.some((e) => e.stage === stage)) return "allaqachon-yuborilgan";

    const soat = kechikishOverride ?? kechikish(stage);
    if (soat === null) return "bosqich-yoʻq";

    const recipient = await getRecipient(userId);
    if (!recipient) return "manzil-topilmadi"; // yoʻq foydalanuvchi yoki telegram.invalid
    if (FAQAT_TASDIQLANGAN && !recipient.verified) return "tasdiqlanmagan";

    /* Avvalgi kutayotgan xat boʻlsa — u endi eskirgan. */
    if (state?.scheduledEmailId) await cancelPending(userId);

    const xat = qurish(stage, recipient.name, userId);
    if (!xat) return "shablon-yoʻq"; // A2/A3/A4 — 3-bosqich

    /* soat <= 0 — darhol yuborish (sinov xati). Resend'ga oʻtmishdagi
       yoki hozirgi `scheduledAt` berilmasin, u xato qaytaradi. */
    const darhol = soat <= 0;
    const scheduledFor = new Date(Date.now() + soat * 60 * 60 * 1000);

    if (!YOQILGANMI || !resend) {
      /* Darvoza yopiq — holatni yozamiz, xat yubormaymiz. Oqim
         toʻliq sinaladi, faqat Resend'ga chiqmaydi. */
      console.log(
        `[activation] ${stage} ${darhol ? "yuborilardi" : "rejalashtirilardi"}: ${recipient.email} → ${darhol ? "darhol" : scheduledFor.toISOString()}`,
      );
      await writeState(userId, { stage, scheduledFor });
      return "darvoza-yopiq";
    }

    const { data, error } = await resend.emails.send({
      from: fromAddress(),
      replyTo: replyTo(),
      to: recipient.email,
      subject: xat.subject,
      html: xat.html,
      ...(darhol ? {} : { scheduledAt: scheduledFor.toISOString() }),
      headers: {
        "List-Unsubscribe": `<${unsubscribePostUrl(userId)}>`,
        "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
      },
    });

    if (error) {
      console.error(`[activation] Resend xatosi (${userId}, ${stage}):`, error);
      return "xato";
    }

    await writeState(userId, {
      stage,
      scheduledEmailId: data?.id ?? null,
      scheduledFor,
      sentLog: [...(state?.sentLog ?? []), { stage, at: new Date().toISOString() }],
    });
    return darhol ? "yuborildi" : "rejalashtirildi";
  } catch (err) {
    console.error(`[activation] rejalashtirib boʻlmadi (${userId}, ${stage}):`, err);
    return "xato";
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

/* ── Havolalar va shablonlar ────────────────────────────────────── */

/** Odam bosadigan havola — xat ichida. */
function unsubscribeUrl(userId: string): string {
  return `${siteUrl()}/unsubscribe?t=${encodeURIComponent(unsubscribeToken(userId))}`;
}

/** Pochta mijozi POST qiladigan manzil — `List-Unsubscribe` sarlavhasi
 *  uchun. Sahifa emas, API route (u faqat GET). */
function unsubscribePostUrl(userId: string): string {
  return `${siteUrl()}/api/unsubscribe?t=${encodeURIComponent(unsubscribeToken(userId))}`;
}

/* Shablon registri. A2/A3/A4 3-bosqichda qoʻshiladi — hozir ular
   uchun shablon yoʻq, shuning uchun `qurish` null qaytaradi va
   `scheduleStage` ularni jimgina tashlab ketadi. */
function qurish(
  stage: ActivationStage,
  name: string | null,
  userId: string,
): { subject: string; html: string } | null {
  if (stage !== "a1") return null;
  return {
    subject: A1_SUBJECT,
    html: a1Html({ name, siteUrl: siteUrl(), unsubscribeUrl: unsubscribeUrl(userId) }),
  };
}


/* ── Trigger: sinf mavjud ────────────────────────────────────────── */

/**
 * Oʻqituvchining sinfi bor — A1 zanjiri shu yerda tugaydi.
 *
 * A1 roʻyxatdan oʻtishda 24 soatga rejalashtiriladi. Odam oʻsha
 * oraliqda sinf ochsa, xat baribir kelardi va bajarilgan ishni
 * qilishni soʻrardi — obunadan chiqishning eng ishonchli yoʻli.
 *
 * ⚠️ Har jurnal batch'ida chaqiriladi (sinf tahriri ham shu yoʻlga
 * tushadi), shuning uchun ARZON boʻlishi shart: bosqich allaqachon
 * oʻtgan boʻlsa bitta SELECT bilan qaytadi.
 *
 * ⚠️ Xatoni yutadi. Bu yordamchi taʼsir — u jurnal saqlanishini hech
 * qachon buzmasligi kerak.
 */
export async function onClassPresent(userId: string): Promise<void> {
  try {
    const state = await readState(userId);
    if (!state || state.stage !== "a1") return;
    await advance(userId, "a1");
  } catch (err) {
    console.error(`[activation] sinf trigger ishlamadi (${userId}):`, err);
  }
}

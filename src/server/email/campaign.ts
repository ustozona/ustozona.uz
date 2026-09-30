import "server-only";
import { getRecipient, readState } from "@/server/dal/email-activation";
import { markCampaignSent, readCampaignLog, type CampaignId } from "@/server/dal/email-campaign";
import {
  FAQAT_TASDIQLANGAN,
  YOQILGANMI,
  fromAddress,
  replyTo,
  resend,
  siteUrl,
  unsubscribePostUrl,
  unsubscribeUrl,
} from "./activation";
import { OK1_SUBJECT, ok1Html, type Ok1Variant } from "./templates/ok1";
import { TG1_SUBJECT, tg1Html, type Tg1Variant } from "./templates/tg1";

/* ════════════════════════════════════════════════════════════════════
   BIR MARTALIK KAMPANIYA XATLARI — aktivatsiya zanjiridan ALOHIDA.

   Yuborish qoidalari aktivatsiya bilan BIR XIL (`activation.ts` dan
   olinadi): `ACTIVATION_EMAILS` darvozasi, faqat tasdiqlangan manzil,
   obunadan chiqqanga hech qachon, `List-Unsubscribe` sarlavhasi.

   ⚠️ `email_activation` ga YOZILMAYDI — faqat oʻqiladi. Kampaniya
   jurnali `teachers.prefs.campaigns` da (sabab: dal/email-campaign.ts).

   Kuniga bitta xat (docs/email-aktivatsiya-spec.md §8): oxirgi 24
   soatda aktivatsiya xati ketgan yoki rejalashtirilgan boʻlsa — bugun
   yuborilmaydi, skript ertaga qayta yurgizilsa oʻshanda ketadi.
   ════════════════════════════════════════════════════════════════════ */

export type CampaignResult =
  | "yuborildi"
  | "rejalashtirildi"
  | "darvoza-yopiq"
  | "obunadan-chiqqan"
  | "allaqachon-yuborilgan"
  | "bugun-xat-bor"
  | "manzil-topilmadi"
  | "tasdiqlanmagan"
  | "xato";

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * «Ertangi darslaringiz endi Telegramda» xati.
 *
 * `kechikishSoat` — 0 boʻlsa darhol (sinov xati), aks holda Resend
 * `scheduledAt`: roʻyxat notoʻgʻri chiqsa panelda bekor qilishga vaqt.
 *
 * Xatoni yutadi va sababini qaytaradi — skript har nomzod boʻyicha
 * sanaydi (activation.ts dagi `ActivationResult` izohi).
 */
export function sendTelegramInvite(
  userId: string,
  variant: Tg1Variant,
  kechikishSoat: number,
): Promise<CampaignResult> {
  return yuborKampaniya(userId, "tg1", variant, kechikishSoat, false, (recipient) => {
    const site = siteUrl();
    const ctaUrl = {
      link: `${site}/dashboard/settings?section=telegram&ulash=1`,
      start: `${site}/tg`,
      jadval: `${site}/dashboard/timetable`,
    }[variant];
    return {
      subject: TG1_SUBJECT[variant],
      html: tg1Html({
        variant,
        name: recipient.name,
        ctaUrl,
        unsubscribeUrl: unsubscribeUrl(userId),
      }),
    };
  });
}

/** Oʻqituvchilar kuni tabrigi (1-oktyabr) — ustoz holatiga qarab. */
export function sendTeachersDay(
  userId: string,
  variant: Ok1Variant,
  kechikishSoat: number,
  sinov = false,
): Promise<CampaignResult> {
  return yuborKampaniya(userId, "ok1", variant, kechikishSoat, sinov, (recipient) => {
    const site = siteUrl();
    const ctaUrl = {
      sinf: `${site}/dashboard/classes`,
      jadval: `${site}/dashboard/timetable`,
      faol: `${site}/dashboard/settings?section=telegram&ulash=1`,
      bot: `${site}/dashboard`,
    }[variant];
    return {
      subject: (sinov ? "[SINOV] " : "") + OK1_SUBJECT[variant],
      html: ok1Html({
        variant,
        name: recipient.name,
        ctaUrl,
        siteUrl: site,
        unsubscribeUrl: unsubscribeUrl(userId),
      }),
    };
  });
}

async function yuborKampaniya(
  userId: string,
  id: CampaignId,
  variant: string,
  kechikishSoat: number,
  /** Sinov: takror yuborish va kuniga bitta xat qoidasi oʻtkaziladi,
      jurnalga YOZILMAYDI — oʻzingizga istagancha sinash uchun. */
  sinov: boolean,
  yasash: (recipient: { name: string | null }) => { subject: string; html: string },
): Promise<CampaignResult> {
  try {
    const log = await readCampaignLog(userId);
    if (!log) return "manzil-topilmadi"; // oʻqituvchi emas
    if (log[id] && !sinov) return "allaqachon-yuborilgan";

    const state = await readState(userId);
    if (state?.optedOut) return "obunadan-chiqqan";
    const oxirgi = Math.max(
      0,
      ...(state?.sentLog ?? []).map((e) => Date.parse(e.at) || 0),
      state?.scheduledFor?.getTime() ?? 0,
    );
    if (!sinov && Math.abs(Date.now() - oxirgi) < DAY_MS) return "bugun-xat-bor";

    const recipient = await getRecipient(userId);
    if (!recipient) return "manzil-topilmadi";
    if (FAQAT_TASDIQLANGAN && !recipient.verified) return "tasdiqlanmagan";

    const { subject, html } = yasash(recipient);

    const darhol = kechikishSoat <= 0;
    const scheduledFor = new Date(Date.now() + kechikishSoat * 60 * 60 * 1000);

    if (!YOQILGANMI || !resend) {
      console.log(
        `[campaign] ${id}/${variant} ${darhol ? "yuborilardi" : "rejalashtirilardi"}: ${recipient.email}`,
      );
      return "darvoza-yopiq";
    }

    const { error } = await resend.emails.send({
      from: fromAddress(),
      replyTo: replyTo(),
      to: recipient.email,
      subject,
      html,
      ...(darhol ? {} : { scheduledAt: scheduledFor.toISOString() }),
      headers: {
        "List-Unsubscribe": `<${unsubscribePostUrl(userId)}>`,
        "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
      },
    });
    if (error) {
      console.error(`[campaign] Resend xatosi (${userId}, ${id}):`, error);
      return "xato";
    }

    if (!sinov) await markCampaignSent(userId, id);
    return darhol ? "yuborildi" : "rejalashtirildi";
  } catch (err) {
    console.error(`[campaign] yuborib boʻlmadi (${userId}, ${id}):`, err);
    return "xato";
  }
}

/* ════════════════════════════════════════════════════════════════════
   TG1 — «Ertangi darslaringiz endi Telegramda» (bir martalik kampaniya)

   Kimga (scripts/campaign-telegram.ts):
     link  — Telegram ulanmagan
     start — ulangan, lekin Ustozona botini hali ochmagan: bogʻlanish
             boshqa bot orqali qilingan, bizniki xabar yubora olmaydi
     jadval — jadvali boʻsh: bot unga hech narsa yubormaydi, shuning
              uchun avval JADVAL soʻraladi. «Darslaringiz keladi» deb
              yozilmaydi — bu yolgʻon vaʼda boʻlardi. Jadval toʻlgach
              bosh sahifada ulash taklifi oʻzi chiqadi (getTgPrompt)

   Uslub — A1 qoidalari (templates/a1.ts): bitta tugma, 100 soʻzdan
   kam, rasm yoʻq, salomlashuvda faqat ism, imzo jamoa nomidan.

   Faqat ISHLAYOTGAN imkoniyatlar yoziladi: kechki «Ertaga», ertalabki
   «Bugun», vaqtni tanlash, aytadigan narsa boʻlmasa jim turish.
   Haftalik hisobot, mini ilova va hokazo — hali yoʻq, vaʼda qilinmaydi.
   ════════════════════════════════════════════════════════════════════ */

import { YORDAM_TELEGRAM, YORDAM_TELEGRAM_URL, brendSarlavha, qalqon } from "./_brand";

export type Tg1Variant = "link" | "start" | "jadval";

export const TG1_SUBJECT: Record<Tg1Variant, string> = {
  link: "Ertangi darslaringiz endi Telegramda",
  start: "Botni ishga tushiring — ertangi darslar Telegramga keladi",
  jadval: "Dars jadvalingizni kiriting — Telegram har kech eslatib turadi",
};

const MATN: Record<Tg1Variant, { kirish: string; oxirgi: string; tugma: string }> = {
  link: {
    kirish: "Ustozonada yangi imkoniyat: dars jadvalingiz endi Telegramga ham keladi.",
    oxirgi: "Ulash bir daqiqa: saytda kod chiqadi, botda shu kodni tanlaysiz.",
    tugma: "Telegramni ulash",
  },
  start: {
    kirish:
      "Telegramingiz Ustozonaga ulangan, lekin Ustozona boti hali ishga tushirilmagan — shuning uchun xabarlar sizga yetib bormayapti.",
    oxirgi: "Botni oching va «Start» tugmasini bosing — boshqa hech narsa kerak emas.",
    tugma: "Botni ochish",
  },
  jadval: {
    kirish:
      "Ustozonada yangi imkoniyat: Telegram bot dars jadvalingiz asosida har kuni eslatma yuboradi. Buning uchun jadval kerak — hozir u boʻsh.",
    oxirgi:
      "Jadvalni bir marta kiritasiz, u butun chorak davomida ishlaydi. Tayyor boʻlgach, bosh sahifada Telegramni ulash taklifi chiqadi.",
    tugma: "Jadvalni kiritish",
  },
};

export function tg1Html({
  variant,
  name,
  ctaUrl,
  unsubscribeUrl,
}: {
  variant: Tg1Variant;
  name: string | null;
  /** link: sozlamalardagi ulash oynasi; start: `/tg` → bot; jadval: jadval sahifasi. */
  ctaUrl: string;
  unsubscribeUrl: string;
}): string {
  const ism = name?.trim().split(/\s+/)[0] ?? null;
  const salom = ism ? `Assalomu alaykum, ${qalqon(ism)}!` : "Assalomu alaykum!";

  const { kirish, oxirgi, tugma } = MATN[variant];

  return `<div style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;font-size:15px;line-height:1.6;color:#1f2937;max-width:480px;margin:0 auto;padding:8px">
  ${brendSarlavha()}

  <p style="margin:0 0 16px">${salom}</p>

  <p style="margin:0 0 12px">${kirish}</p>

  <ul style="margin:0 0 16px;padding-left:20px">
    <li style="margin:0 0 4px"><b>Kechqurun</b> — ertangi darslar va mavzusi yoʻq soatlar</li>
    <li style="margin:0 0 4px"><b>Ertalab</b> — bugungi jadval</li>
    <li style="margin:0">Vaqtini oʻzingiz tanlaysiz, taʼtil kunlari bot jim turadi</li>
  </ul>

  <p style="margin:0 0 24px">${oxirgi}</p>

  <p style="margin:0 0 28px">
    <a href="${qalqon(ctaUrl)}"
       style="background:#111827;color:#ffffff;padding:12px 22px;border-radius:8px;text-decoration:none;display:inline-block;font-weight:600">
      ${tugma}
    </a>
  </p>

  <p style="margin:0 0 24px">
    Savol boʻlsa — shu xatga javob yozing yoki Telegramda
    <a href="${qalqon(YORDAM_TELEGRAM_URL)}" style="color:#111827;font-weight:600;text-decoration:underline">${qalqon(YORDAM_TELEGRAM)}</a>
    ga yozing.
  </p>

  <p style="margin:0 0 28px">Ustozona jamoasi</p>

  <p style="margin:0;color:#6b7280;font-size:13px;border-top:1px solid #e5e7eb;padding-top:16px">
    Bu xat Ustozonadagi yangi imkoniyat haqida bir marta yuborildi.
    <a href="${qalqon(unsubscribeUrl)}" style="color:#6b7280">Bunday xatlarni oʻchirish</a>.
  </p>
</div>`;
}

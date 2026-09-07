/* ════════════════════════════════════════════════════════════════════
   A1 — «Birinchi sinfingizni oching»

   Kimga: roʻyxatdan oʻtgan, lekin 24 soat ichida sinf yaratmagan.
   Maqsad: BITTA ish — sinf ochish. Yordam kanali (javob + Telegram)
   matn ichida beriladi, tugma sifatida emas.

   Uslub qoidalari (barcha aktivatsiya xatlariga tegishli):
     - matn qisqa, 100 soʻzdan oshmasin
     - bitta TUGMA (yordam kanali matn ichida — tugmaga raqobat yoʻq)
     - rasm yoʻq (Gmail tashqi rasmni bloklaydi — logo ham HTML bilan
       chiziladi, _brand.ts ga qarang)
     - inline CSS; joylashuv kerak boʻlsa JADVAL (Gmail inline-block'ni
       tashlab yuboradi — _brand.ts izohiga qarang)
     - ranglar xatga qotirilgan: pochta mijozi CSS token bilmaydi,
       shuning uchun bu yerda dizayn tizimi tokenlari ISHLATILMAYDI
     - imzo JAMOA nomidan, feʼl KOʻPLIKDA («oʻqiymiz», «oʻqib
       chiqaman» emas). Sabab: javobni jamoadan istalgan kishi
       yozishi mumkin, birlik feʼl esa buni yolgʻonga aylantiradi.
       Toʻqima shaxs nomi («Malika, yordam boʻlimi») ISHLATILMAYDI
   ════════════════════════════════════════════════════════════════════ */

import { TELEGRAM_HANDLE, TELEGRAM_URL } from "@/lib/landing-nav";
import { brendSarlavha, qalqon } from "./_brand";

export const A1_SUBJECT = "Birinchi sinfingizni oching";

export function a1Html({
  name,
  siteUrl,
  unsubscribeUrl,
}: {
  name: string | null;
  siteUrl: string;
  unsubscribeUrl: string;
}): string {
  const salom = name ? `Assalomu alaykum, ${qalqon(name)}!` : "Assalomu alaykum!";
  const havola = `${qalqon(siteUrl)}/dashboard/classes`;

  return `<div style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;font-size:15px;line-height:1.6;color:#1f2937;max-width:480px;margin:0 auto;padding:8px">
  ${brendSarlavha()}

  <p style="margin:0 0 16px">${salom}</p>

  <p style="margin:0 0 16px">
    Ustozonaga xush kelibsiz. Ishni boshlash uchun birinchi qadam —
    sinf ochish. Bu bir daqiqalik ish: sinf nomi va fanni yozasiz,
    tamom.
  </p>

  <p style="margin:0 0 24px">
    Sinf ochilgach jurnal, davomat va dars jadvali oʻz-oʻzidan
    ishlay boshlaydi.
  </p>

  <p style="margin:0 0 28px">
    <a href="${havola}"
       style="background:#111827;color:#ffffff;padding:12px 22px;border-radius:8px;text-decoration:none;display:inline-block;font-weight:600">
      Sinf ochish
    </a>
  </p>

  <!-- Yordam kanali ATAYLAB matn ichida, tugma emas: asosiy tugmaga
       («Sinf ochish») raqobatchi qoʻyilmaydi. -->
  <p style="margin:0 0 24px">
    Biror joyda qiynalsangiz — shu xatga javob yozing yoki Telegramda
    <a href="${qalqon(TELEGRAM_URL)}" style="color:#1f2937">${qalqon(TELEGRAM_HANDLE)}</a>
    ga yozing. Oʻqiymiz.
  </p>

  <p style="margin:0 0 28px">Ustozona jamoasi</p>

  <p style="margin:0;color:#6b7280;font-size:13px;border-top:1px solid #e5e7eb;padding-top:16px">
    Bu xat ishni boshlashga yordam berish uchun yuborildi.
    <a href="${qalqon(unsubscribeUrl)}" style="color:#6b7280">Bunday xatlarni oʻchirish</a>.
  </p>
</div>`;
}

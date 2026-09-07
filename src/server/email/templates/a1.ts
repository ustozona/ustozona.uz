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
     - imzo JAMOA nomidan, feʼl KOʻPLIKDA. Sabab: javobni jamoadan
       istalgan kishi yozishi mumkin, birlik feʼl esa buni yolgʻonga
       aylantiradi. Toʻqima shaxs nomi ISHLATILMAYDI
     - OHANG ilovanikiga mos: undov belgisi kam (messages/uz.json
       dagi 3389 satrdan faqat 10 tasi «!» bilan tugaydi), «Hurmat
       bilan» kabi rasmiy xat konvensiyalari YOʻQ (ilovada 0 marta),
       xizmat-koʻrsatish klishesi yoʻq. Salomlashuvda faqat ISM
   ════════════════════════════════════════════════════════════════════ */

import { YORDAM_TELEGRAM, YORDAM_TELEGRAM_URL, brendSarlavha, qalqon } from "./_brand";

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
  /* FAQAT ISM. Profilda toʻliq ism saqlanadi («Otabek Abdusattorov»),
     lekin salomlashuvda familiya rasmiy va sovuq eshitiladi. */
  const ism = name?.trim().split(/\s+/)[0] ?? null;
  const salom = ism ? `Assalomu alaykum, ${qalqon(ism)}!` : "Assalomu alaykum!";
  const havola = `${qalqon(siteUrl)}/dashboard/classes`;

  return `<div style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;font-size:15px;line-height:1.6;color:#1f2937;max-width:480px;margin:0 auto;padding:8px">
  ${brendSarlavha()}

  <p style="margin:0 0 16px">${salom}</p>

  <p style="margin:0 0 16px">
    Ustozonaga xush kelibsiz. Ishni sinf ochishdan boshlang — bu bir
    daqiqalik ish: sinf nomi va fanni kiritsangiz kifoya.
  </p>

  <p style="margin:0 0 24px">
    Sinf yaratilgach jurnal, davomat va dars jadvali avtomatik ishga
    tushadi.
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
    Savol tugʻilsa yoki yordam kerak boʻlsa — shu xatga javob yozing yoki Telegramda
    <a href="${qalqon(YORDAM_TELEGRAM_URL)}" style="color:#1f2937">${qalqon(YORDAM_TELEGRAM)}</a>
    ga yozing. Aloqadamiz. 🫡
  </p>

  <p style="margin:0 0 28px">Ustozona jamoasi</p>

  <p style="margin:0;color:#6b7280;font-size:13px;border-top:1px solid #e5e7eb;padding-top:16px">
    Bu xat ishni boshlashga yordam berish uchun yuborildi.
    <a href="${qalqon(unsubscribeUrl)}" style="color:#6b7280">Bunday xatlarni oʻchirish</a>.
  </p>
</div>`;
}
